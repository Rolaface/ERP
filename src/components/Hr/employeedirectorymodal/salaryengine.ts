/**
 * salaryEngine.ts
 * ───────────────
 * Pure, side-effect-free salary calculation engine.
 *
 * Design principles:
 *  - Every number that leaves this module is rounded to 2 decimal places.
 *  - Tax relief (Section 87A) is an INCOME THRESHOLD, not a rupee deduction.
 *  - to_amount = 0 in a slab means "no upper bound" (last/highest slab).
 *  - Formula evaluation is sandboxed; any error returns 0 silently.
 *  - All functions are pure — no mutations, no side effects.
 *
 * Formula syntax — ERPNext stores formulas as Python expressions.
 *  This engine transparently converts Python → JavaScript before evaluation,
 *  so formulas work identically in the ERP and in the browser.
 *
 *  Conversions applied automatically:
 *   "x if cond else y"  →  "(cond ? x : y)"   (Python ternary)
 *   and                 →  &&
 *   or                  →  ||
 *   not                 →  !
 *
 *  JS-style helpers are also injected for any legacy JS-style formulas:
 *   IF(cond, a, b) / AND(...) / OR(...)
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type ComponentType = "Earning" | "Deduction";

export interface SalaryComponentDef {
  salary_component: string;
  amount: number;
  amount_based_on_formula?: 0 | 1;
  formula?: string;
  type: ComponentType;
  /** ERP field names for the abbreviation — any one may be present */
  abbr?: string;
  salary_component_abbr?: string;
  name?: string;
  depends_on_payment_days?: 0 | 1;
  is_tax_applicable?: number;
  /** 1 = this component's amount is the computed income tax */
  variable_based_on_taxable_salary?: 0 | 1;
  is_income_tax_component?: 0 | 1;
  [key: string]: unknown;
}

/** Flat key→value map used inside formula evaluation */
export type CalcContext = Record<string, number>;

export interface ComponentResult {
  name:      string;
  key:       string;        // snake_case of salary_component
  abbrKey:   string | null; // lowercase abbr, e.g. "bs", "hra"
  amount:    number;        // always rounded to 2dp
  formula:   string;
  isFormula: boolean;
  type:      ComponentType;
}

export interface SalaryResult {
  components:      ComponentResult[];
  breakdown:       Record<string, number>; // nameKey + abbrKey → amount
  gross:           number;  // sum of Earning components
  deductionsTotal: number;  // sum of Deduction components
  net:             number;  // gross - deductionsTotal
  resolvedBase:    number;  // the base passed in (rounded)
  annualTax:       number;  // full-year income tax
  monthlyTax:      number;  // annualTax / 12
}

// ─── Tax config (mirrors the ERP Income Tax Slab doctype) ─────────────────────

export interface TaxSlabRow {
  from_amount?:       number;
  to_amount?:         number; // 0 = no upper limit
  percent_deduction?: number;
}

export interface TaxChargeRow {
  description:          string;
  percent?:             number;
  min_taxable_income?:  number;
  max_taxable_income?:  number; // 0 = no upper limit
}

export interface TaxConfig {
  name:                           string;
  /** Flat rupee deduction from gross before applying slabs (e.g. ₹75,000) */
  standard_tax_exemption_amount?: number;
  allow_tax_exemption?:           0 | 1;
  /**
   * Section 87A rebate threshold.
   * If taxable income ≤ this value → full tax rebate (tax = 0).
   * This is NOT subtracted from tax; it is an income ceiling.
   */
  tax_relief_limit?:              number;
  slabs:                          TaxSlabRow[];
  other_taxes_and_charges?:       TaxChargeRow[];
}

// ─── Payload sent to the API after save ───────────────────────────────────────

export interface CompensationPayload {
  salary_structure:  string | null;
  base_salary:       number;
  components: Array<{
    name:    string;
    key:     string;
    abbrKey: string | null;
    amount:  number;
    type:    ComponentType;
  }>;
  gross:            number;
  deductions_total: number;
  net:              number;
  salary_mode:      string | null;
  salary_currency:  string | null;
  bank_name:        string | null;
  bank_ac_no:       string | null;
  account_type:     string | null;
  branch_code:      string | null;
}

// ─── Internal helpers (not exported) ─────────────────────────────────────────

/** Round to exactly 2 decimal places — kills all float drift */
const r2 = (n: number): number => Math.round(n * 100) / 100;

/** snake_case key from a component name */
const toNameKey = (name: string): string =>
  name.trim().toLowerCase().replace(/\s+/g, "_");

/** Lowercase abbr key, or null if blank */
const toAbbrKey = (abbr?: string | null): string | null =>
  abbr?.trim() ? abbr.trim().toLowerCase() : null;

/** Resolve the abbr from whichever field the ERP populated */
const resolveAbbr = (comp: SalaryComponentDef): string | null =>
  toAbbrKey(comp.abbr ?? comp.salary_component_abbr);

/**
 * Write a value into the context under both nameKey and abbrKey (lower + upper).
 * Does NOT mutate the original — the ctx object is always local to calculateSalary.
 */
const writeCtx = (
  ctx:     CalcContext,
  nameKey: string,
  abbrKey: string | null,
  value:   number,
): void => {
  ctx[nameKey] = value;
  if (abbrKey) {
    ctx[abbrKey]               = value;
    ctx[abbrKey.toUpperCase()] = value;
  }
};

/** Returns true if this component's amount is the computed income tax */
const isTaxComponent = (comp: SalaryComponentDef): boolean =>
  comp.variable_based_on_taxable_salary === 1 ||
  comp.is_income_tax_component           === 1;

// ─── Python → JavaScript transpiler ─────────────────────────────────────────
//
// ERPNext stores salary formulas as Python expressions. Before we can run
// them inside new Function() we need to convert Python syntax to JavaScript.
//
// Rules applied (in order, so nested expressions resolve correctly):
//  1. Python ternary:  "x if cond else y"  →  "(cond ? x : y)"
//     Handled iteratively until no more matches remain (handles nesting).
//  2. Logical keywords: and → &&,  or → ||,  not → !
//     Word-boundary matched so variable names like "standard" are untouched.

function pythonToJS(formula: string): string {
  let result = formula;

  // ── Step 1: Python ternary — iterate until fully unwound ──────────────────
  // Pattern: <trueExpr> if <condition> else <falseExpr>
  // We match lazily so the innermost ternary is resolved first on each pass.
  // Up to 20 passes handles deeply nested chains without infinite loops.
  const ternaryRe = /(.+?)\s+if\s+(.+?)\s+else\s+(.+)/;
  for (let i = 0; i < 20; i++) {
    const next = result.replace(ternaryRe, "($2 ? $1 : $3)");
    if (next === result) break;
    result = next;
  }

  // ── Step 2: logical keywords → JS operators ───────────────────────────────
  result = result
    .replace(/\band\b/g, "&&")
    .replace(/\bor\b/g,  "||")
    .replace(/\bnot\b/g, "!");

  return result;
}

// ─── Formula helpers injected into every evaluation context ──────────────────
//
// JS-style helpers kept for any legacy formulas that still use IF(...) syntax.
// AND / OR return 1 or 0 so they compose with IF:
//   IF(AND(base >= 50000, base <= 100000), base * 0.15, 0)

const FORMULA_HELPERS = {
  /** IF(condition, trueValue, falseValue) */
  IF: (cond: unknown, a: number, b: number): number => (cond ? a : b),

  /** AND(a, b, …) → 1 if every argument is truthy, else 0 */
  AND: (...args: unknown[]): number => (args.every(Boolean) ? 1 : 0),

  /** OR(a, b, …) → 1 if any argument is truthy, else 0 */
  OR: (...args: unknown[]): number => (args.some(Boolean) ? 1 : 0),
} as const;

// ─── Formula evaluator ────────────────────────────────────────────────────────

/**
 * Evaluates a formula string against a context of named variables.
 * Returns 0 on any error — never throws.
 *
 * Accepts both Python syntax (as stored in ERPNext) and plain JS expressions.
 * Python is transparently converted via pythonToJS() before evaluation.
 *
 * Security note: new Function() is intentional here (same approach as ERPNext).
 * The context keys are alphanumeric identifiers; the formula comes from your
 * own ERP configuration, not from end-user input.
 */
export function evaluateFormula(formula: string, ctx: CalcContext): number {
  if (!formula?.trim()) return 0;
  try {
    // Convert Python syntax → JS (no-op if formula is already JS)
    const jsFormula = pythonToJS(formula);

    // Merge helpers + context — helpers come first so context values
    // can shadow them if a component name collides with a helper name.
    const allKeys   = [...Object.keys(FORMULA_HELPERS),   ...Object.keys(ctx)];
    const allValues = [...Object.values(FORMULA_HELPERS), ...Object.values(ctx)];

    // eslint-disable-next-line no-new-func
    const fn = new Function(
      ...allKeys,
      `"use strict"; return +(${jsFormula});`,
    );
    const result = fn(...allValues);
    const n = Number(result);
    return isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

// ─── Tax calculator ───────────────────────────────────────────────────────────

/**
 * Computes annual income tax given the full-year gross and a TaxConfig.
 *
 * Algorithm (India new tax regime, FY 2026-27):
 *
 *  1. taxableIncome = max(0, annualGross − standard_tax_exemption_amount)
 *  2. If taxableIncome ≤ tax_relief_limit → tax = 0  (Section 87A full rebate)
 *  3. Otherwise, apply progressive slabs to taxableIncome
 *  4. Add surcharges / cess from other_taxes_and_charges (% of base tax)
 *
 * Key invariants:
 *  - to_amount = 0  →  slab has no upper bound (treat as Infinity)
 *  - tax_relief_limit is an INCOME THRESHOLD, not a rupee deduction from tax
 *  - All arithmetic is done in full precision; result is rounded at the end
 */
export function calculateAnnualTax(
  annualGross: number,
  taxConfig:   TaxConfig,
): number {
  if (!taxConfig?.slabs?.length) return 0;

  // Step 1: standard exemption
  const exemption     = taxConfig.standard_tax_exemption_amount ?? 0;
  const taxableIncome = Math.max(0, annualGross - exemption);

  if (taxableIncome <= 0) return 0;

  // Step 2: Section 87A rebate — full relief if income within threshold
  const reliefThreshold = taxConfig.tax_relief_limit ?? 0;
  if (reliefThreshold > 0 && taxableIncome <= reliefThreshold) {
    return 0;
  }

  // Step 3: progressive slab tax
  let tax = 0;
  for (const slab of taxConfig.slabs) {
    const from = slab.from_amount ?? 0;
    const to   = (slab.to_amount && slab.to_amount > 0) ? slab.to_amount : Infinity;
    const rate = (slab.percent_deduction ?? 0) / 100;

    if (rate === 0)            continue; // skip zero-rate slabs
    if (taxableIncome <= from) continue; // income hasn't reached this slab

    const slabIncome = Math.min(taxableIncome, to) - from;
    tax += slabIncome * rate;
  }

  // Step 4: surcharges / cess (% applied to the base tax already computed)
  if (taxConfig.other_taxes_and_charges?.length) {
    const baseTax = tax;
    for (const charge of taxConfig.other_taxes_and_charges) {
      const rate = (charge.percent ?? 0) / 100;
      if (rate === 0) continue;

      const min = charge.min_taxable_income ?? 0;
      const max = (charge.max_taxable_income && charge.max_taxable_income > 0)
        ? charge.max_taxable_income
        : Infinity;

      if (taxableIncome >= min && taxableIncome <= max) {
        tax += baseTax * rate;
      }
    }
  }

  return r2(Math.max(0, tax));
}

// ─── Core salary calculator ───────────────────────────────────────────────────

/**
 * Calculates a full salary breakdown for a given base and component list.
 *
 * Evaluation order:
 *  Pass 1 — fixed (non-formula) non-tax components → seed context
 *  Pass 2 — formula components, iterated until stable (max 10 rounds)
 *  Pass 3 — compute pre-tax gross from earnings
 *  Pass 4 — calculate annual + monthly tax via slab engine
 *  Pass 5 — inject tax into tax-variable components (formula or direct)
 *  Pass 6 — collect final results, round everything
 *
 * @param monthlyBase   The "base" variable available in all formulas
 * @param components    Full list of earnings + deductions from the structure
 * @param overrides     Optional map of nameKey/abbrKey → amount (for manual edits)
 * @param taxConfig     Tax slab config; if null/undefined, income tax = 0
 */
export function calculateSalary(
  monthlyBase: number,
  components:  SalaryComponentDef[],
  overrides:   Record<string, number> = {},
  taxConfig?:  TaxConfig | null,
): SalaryResult {
  if (!components.length) {
    return {
      components: [], breakdown: {},
      gross: 0, deductionsTotal: 0, net: 0,
      resolvedBase: r2(monthlyBase), annualTax: 0, monthlyTax: 0,
    };
  }

  // Pre-compute stable keys for every component
  const keys = components.map((c) => ({
    nameKey: toNameKey(c.salary_component),
    abbrKey: resolveAbbr(c),
  }));

  const ctx: CalcContext = { base: r2(monthlyBase) };

  // ── Pass 1: fixed non-tax components ──────────────────────────────────────
  for (let i = 0; i < components.length; i++) {
    const comp = components[i];
    if (comp.amount_based_on_formula === 1) continue;
    if (isTaxComponent(comp))              continue;

    const { nameKey, abbrKey } = keys[i];
    const value = r2(
      overrides[nameKey] ??
      (abbrKey ? overrides[abbrKey] : undefined) ??
      comp.amount ??
      0,
    );
    writeCtx(ctx, nameKey, abbrKey, value);
  }

  // ── Pass 2: formula components — iterate until fully stable ───────────────
  for (let pass = 0; pass < 10; pass++) {
    let changed = false;

    for (let i = 0; i < components.length; i++) {
      const comp = components[i];
      if (comp.amount_based_on_formula !== 1) continue;
      if (isTaxComponent(comp))              continue;

      const { nameKey, abbrKey } = keys[i];
      // Check for manual override first
      const overrideVal =
        overrides[nameKey] ?? (abbrKey ? overrides[abbrKey] : undefined);

      const next = r2(
        overrideVal !== undefined
          ? overrideVal
          : evaluateFormula(comp.formula ?? "", ctx),
      );

      if (next !== (ctx[nameKey] ?? 0)) {
        changed = true;
        writeCtx(ctx, nameKey, abbrKey, next);
      }
    }

    if (!changed) break;
  }

  // ── Pass 3: pre-tax gross (sum of all Earning components resolved so far) ──
  const preTaxGross = r2(
    components
      .filter((c) => c.type === "Earning")
      .reduce((sum, c, i) => {
        const idx = components.indexOf(c); // original index for keys lookup
        return sum + (ctx[keys[idx].nameKey] ?? 0);
      }, 0),
  );

  // ── Pass 4: income tax calculation ────────────────────────────────────────
  let annualTax  = 0;
  let monthlyTax = 0;

  if (taxConfig) {
    annualTax  = calculateAnnualTax(preTaxGross * 12, taxConfig);
    monthlyTax = r2(annualTax / 12);
  }

  // ── Pass 5: inject tax into tax-variable components ────────────────────────
  // Add tax values to context so formula-based tax components can reference them
  ctx["annual_tax"]  = annualTax;
  ctx["monthly_tax"] = monthlyTax;

  for (let i = 0; i < components.length; i++) {
    const comp = components[i];
    if (!isTaxComponent(comp)) continue;

    const { nameKey, abbrKey } = keys[i];

    const taxAmount = r2(
      comp.amount_based_on_formula === 1 && comp.formula?.trim()
        ? evaluateFormula(comp.formula, ctx)
        : monthlyTax,
    );

    writeCtx(ctx, nameKey, abbrKey, taxAmount);
  }

  // ── Pass 6: build final results ────────────────────────────────────────────
  const resultComponents: ComponentResult[] = components.map((comp, i) => ({
    name:      comp.salary_component,
    key:       keys[i].nameKey,
    abbrKey:   keys[i].abbrKey,
    amount:    r2(ctx[keys[i].nameKey] ?? 0),
    formula:   comp.formula ?? "",
    isFormula: comp.amount_based_on_formula === 1,
    type:      comp.type,
  }));

  const gross = r2(
    resultComponents.filter((c) => c.type === "Earning").reduce((s, c) => s + c.amount, 0),
  );
  const deductionsTotal = r2(
    resultComponents.filter((c) => c.type === "Deduction").reduce((s, c) => s + c.amount, 0),
  );

  // Build breakdown lookup — both nameKey and abbrKey point to the same amount
  const breakdown: Record<string, number> = {};
  for (const { key, abbrKey, amount } of resultComponents) {
    breakdown[key] = amount;
    if (abbrKey) breakdown[abbrKey] = amount;
  }

  return {
    components:      resultComponents,
    breakdown,
    gross,
    deductionsTotal,
    net:             r2(gross - deductionsTotal),
    resolvedBase:    r2(monthlyBase),
    annualTax,
    monthlyTax,
  };
}

// ─── Gross → Base back-solver (binary search) ─────────────────────────────────

/**
 * Given a desired gross monthly salary, finds the base that produces it.
 * Uses binary search — converges in ≤ 60 iterations to within ±0.01.
 *
 * Returns 0 if no formula-based earnings exist (base doesn't affect gross).
 */
export function solveBaseFromGross(
  targetGross:  number,
  components:   SalaryComponentDef[],
  tolerance     = 0.01,
  maxIterations = 60,
  taxConfig?:   TaxConfig | null,
): number {
  if (targetGross <= 0) return 0;

  const hasFormulaEarnings = components.some(
    (c) => c.type === "Earning" && c.amount_based_on_formula === 1,
  );
  if (!hasFormulaEarnings) return 0;

  const calcGross = (base: number) =>
    calculateSalary(base, components, {}, taxConfig).gross;

  // Expand upper bound until it overshoots the target
  let lo = 0;
  let hi = targetGross * 3;
  for (let i = 0; i < 25 && calcGross(hi) < targetGross; i++) hi *= 2;

  // Binary search
  for (let iter = 0; iter < maxIterations; iter++) {
    const mid   = (lo + hi) / 2;
    const gross = calcGross(mid);

    if (Math.abs(gross - targetGross) <= tolerance) return r2(mid);
    if (gross < targetGross) lo = mid;
    else                     hi = mid;
  }

  return r2((lo + hi) / 2);
}

// ─── API adapter — structure response → component defs ────────────────────────

/**
 * Converts a raw salary structure API response into the canonical
 * SalaryComponentDef[] format the engine consumes.
 */
export function structureToComponents(
  structureData: Record<string, unknown>,
): SalaryComponentDef[] {
  const normalize = (row: Record<string, unknown>, type: ComponentType): SalaryComponentDef => ({
    ...(row as SalaryComponentDef),
    type,
    abbr:                  (row.abbr ?? row.salary_component_abbr ?? "") as string,
    salary_component_abbr: (row.abbr ?? row.salary_component_abbr ?? "") as string,
  });

  const earnings   = Array.isArray(structureData.earnings)   ? structureData.earnings   : [];
  const deductions = Array.isArray(structureData.deductions) ? structureData.deductions : [];

  return [
    ...earnings.map(  (r: unknown) => normalize(r as Record<string, unknown>, "Earning")),
    ...deductions.map((r: unknown) => normalize(r as Record<string, unknown>, "Deduction")),
  ];
}

// ─── Payload builder ──────────────────────────────────────────────────────────

/**
 * Converts a SalaryResult + form values into the payload shape the API expects.
 */
export function buildCompensationPayload(
  formData: Record<string, unknown>,
  result:   SalaryResult,
): CompensationPayload {
  const mapPaymentMode = (method: unknown): string | null => {
    const m = String(method ?? "").toLowerCase();
    if (m.includes("bank"))   return "Bank";
    if (m.includes("mobile")) return "Mobile";
    if (m.includes("cash"))   return "Cash";
    return (method as string) || null;
  };

  const basicComp = result.components.find(
    (c) => c.type === "Earning" && (c.abbrKey === "bs" || c.key === "basic_salary"),
  );

  return {
    salary_structure:  (formData.salaryStructure as string) ?? null,
    base_salary:       basicComp?.amount ?? result.gross,
    components:        result.components.map(({ name, key, abbrKey, amount, type }) => ({
      name, key, abbrKey, amount, type,
    })),
    gross:             result.gross,
    deductions_total:  result.deductionsTotal,
    net:               result.net,
    salary_mode:       mapPaymentMode(formData.paymentMethod),
    salary_currency:   (formData.currency      as string) ??  null,
    bank_name:         (formData.bankName       as string) ?? null,
    bank_ac_no:        (formData.accountNumber  as string) ?? null,
    account_type:      (formData.accountType    as string) ?? null,
    branch_code:       (formData.branchCode     as string) ?? null,
  };
}