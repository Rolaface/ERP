export type ComponentType = "Earning" | "Deduction";

export interface SalaryComponentDef {
  salary_component:                  string;
  amount:                            number;
  amount_based_on_formula?:          0 | 1;
  formula?:                          string;
  type:                              ComponentType;
  abbr?:                             string;
  salary_component_abbr?:            string;
  name?:                             string;
  depends_on_payment_days?:          0 | 1;
  is_tax_applicable?:                number;
  variable_based_on_taxable_salary?: 0 | 1;
  is_income_tax_component?:          0 | 1;
   statistical_component?: 0 | 1; 
  [key: string]: unknown;
}

export type CalcContext = Record<string, number>;

export interface ComponentResult {
  name:      string;
  key:       string;
  abbrKey:   string | null;
  amount:    number;
  formula:   string;
  isFormula: boolean;
  type:      ComponentType;
}

export interface SalaryResult {
  components:      ComponentResult[];
  breakdown:       Record<string, number>;
  gross:           number;
  deductionsTotal: number;
  net:             number;
  resolvedBase:    number;
  annualTax:       number;
  monthlyTax:      number;
}

export interface TaxSlabRow {
  from_amount?:       number;
  to_amount?:         number;
  percent_deduction?: number;
}

export interface TaxChargeRow {
  description:          string;
  percent?:             number;
  min_taxable_income?:  number;
  max_taxable_income?:  number;
}

export interface TaxConfig {
  name:                           string;
  standard_tax_exemption_amount?: number;
  allow_tax_exemption?:           0 | 1;
  tax_relief_limit?:              number;
  slabs:                          TaxSlabRow[];
  other_taxes_and_charges?:       TaxChargeRow[];
}

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const r2 = (n: number): number => Math.round(n * 100) / 100;

// Converts any component name into a valid JS identifier.
// Keeps only [a-z0-9], collapses everything else into a single underscore.
// "SSF Employee Contribution 5.5%" → "ssf_employee_contribution_5_5"
// "HRA/Transport (Monthly)"        → "hra_transport_monthly"
//
// Exported so every consumer (calculateSalary, CompensationTab's
// override-lookup, etc.) hashes component names the exact same way. Two
// independent copies of this regex previously existed and could silently
// drift apart — always import this instead of re-implementing it.
export const toNameKey = (name: string): string =>
  name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")  // any non-alphanumeric run → single underscore
    .replace(/^_+|_+$/g, "");     // trim leading/trailing underscores

// Exported for the same reason as toNameKey — single source of truth for
// how an abbreviation is normalised into a lookup key.
export const toAbbrKey = (abbr?: string | null): string | null =>
  abbr?.trim() ? abbr.trim().toLowerCase() : null;

const resolveAbbr = (comp: SalaryComponentDef): string | null =>
  toAbbrKey(comp.abbr ?? comp.salary_component_abbr);

const isTaxComponent = (comp: SalaryComponentDef): boolean =>
  comp.variable_based_on_taxable_salary === 1 ||
  comp.is_income_tax_component === 1;

const normaliseAmount = (v: unknown): number => r2(Number(v ?? 0));

// Keys with spaces or special characters break new Function() in strict mode.
const isValidIdentifier = (k: string): boolean =>
  /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k);

// Writes a value into ctx under all reasonable lookup keys for a component.
// All keys are stored lowercase — case-insensitive resolution happens at
// formula evaluation time via normalizeCaseInFormula(), not here.
//
// Keys written (examples for "Basic Salary", abbr "BS"):
//   nameKey:   "basic_salary"
//   firstWord: "basic"           ← useful for short formulas like `basic * 0.4`
//   abbrKey:   "bs"
//   origSnake: "basic_salary"    ← snake_case of original name (usually same as nameKey)
//   camelCase: "BasicSalary"     ← for structures that use PascalCase in formulas
//
// To add a new alias pattern, add a write() call here.
const writeCtx = (
  ctx:           CalcContext,
  nameKey:       string,
  abbrKey:       string | null,
  value:         number,
  originalName?: string,
): void => {
  const write = (k: string) => {
    if (isValidIdentifier(k)) ctx[k] = value;
  };

  write(nameKey);

  // First word of snake_case key — e.g. "basic" from "basic_salary"
  const firstWord = nameKey.split("_")[0];
  if (firstWord && firstWord !== nameKey) {
    write(firstWord);
  }

  if (originalName?.trim()) {
    const origLower = originalName.trim().toLowerCase();
    // Same sanitization as toNameKey — strips %, dots, parens, etc.
    const origSnake = origLower.replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
    const origTitle = origLower.replace(/\b\w/g, (c) => c.toUpperCase());

    write(origSnake);                          // "ssf_employee_contribution_5_5"
    write(origTitle.replace(/\s+/g, ""));      // "BasicSalary"
  }

  if (abbrKey) {
    write(abbrKey);
  }
};

// ─── Python → JS Transpiler ───────────────────────────────────────────────────

// Converts ERPNext-style Python formula syntax to valid JavaScript.
// Handles: ternary (`x if cond else y`), `and`, `or`, `not`.
// To support new Python syntax, add a replacement here.
function pythonToJS(formula: string): string {
  let result = formula;

  const ternaryRe = /(.+?)\s+if\s+(.+?)\s+else\s+(.+)/;
  for (let i = 0; i < 20; i++) {
    const next = result.replace(ternaryRe, "($2 ? $1 : $3)");
    if (next === result) break;
    result = next;
  }

  return result
    .replace(/\band\b/g,    "&&")
    .replace(/\bor\b/g,     "||")
    .replace(/\bnot\b/g,    "!")


    .replace(/\bmin\s*\(/g, "Math.min(")
    .replace(/\bmax\s*\(/g, "Math.max(")
    .replace(/\bint\s*\(/g,   "Math.trunc(")
    .replace(/\babs\s*\(/g, "Math.abs(")
    .replace(/\bTrue\b/g,   "true")
    .replace(/\bFalse\b/g,  "false");
}

// ─── Formula Helpers ──────────────────────────────────────────────────────────

// These are injected as named parameters into every formula evaluation.
// Add new helpers here if ERPNext formulas use additional built-in functions.
const FORMULA_HELPERS = {
  IF:  (cond: unknown, a: number, b: number): number => (cond ? a : b),
  AND: (...args: unknown[]): number => (args.every(Boolean) ? 1 : 0),
  OR:  (...args: unknown[]): number => (args.some(Boolean)  ? 1 : 0),
} as const;

// ─── Case-Insensitive Formula Normalizer ──────────────────────────────────────

// Rewrites every identifier in a formula to match the actual key stored in ctx,
// using a case-insensitive lookup. This means formula authors can freely write
// BASIC, Basic, basic, or bAsIc — all will resolve to the same ctx entry.
//
// Only identifiers that exist in ctx (case-insensitively) are rewritten.
// Literals, operators, and unknown tokens are left untouched.
function normalizeCaseInFormula(formula: string, ctx: CalcContext): string {
  const lowerMap: Record<string, string> = {};
  for (const key of Object.keys(ctx)) {
    lowerMap[key.toLowerCase()] = key;
  }

  return formula.replace(/\b[a-zA-Z_$][a-zA-Z0-9_$]*\b/g, (token) =>
    lowerMap[token.toLowerCase()] ?? token,
  );
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function evaluateFormula(formula: string, ctx: CalcContext): number {
  if (!formula?.trim()) return 0;
  try {
    // Step 1: convert Python syntax → JS syntax
    // Step 2: normalize all identifiers to match ctx keys (case-insensitive)
    const normalized = normalizeCaseInFormula(pythonToJS(formula), ctx);

    const merged: Record<string, unknown> = { ...FORMULA_HELPERS, ...ctx };

    const safeKeys:   string[]  = [];
    const safeValues: unknown[] = [];

    for (const [k, v] of Object.entries(merged)) {
      if (isValidIdentifier(k)) {
        safeKeys.push(k);
        safeValues.push(v);
      }
    }

    // eslint-disable-next-line no-new-func
    const fn = new Function(...safeKeys, `"use strict"; return +(${normalized});`);

    const n = Number(fn(...safeValues));
    return isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

export function calculateAnnualTax(
  annualGross: number,
  taxConfig:   TaxConfig,
): number {
  if (!taxConfig?.slabs?.length) return 0;

  const exemption     = normaliseAmount(taxConfig.standard_tax_exemption_amount);
  const taxableIncome = Math.max(0, r2(annualGross) - exemption);
  if (taxableIncome <= 0) return 0;

  const reliefThreshold = normaliseAmount(taxConfig.tax_relief_limit);
  if (reliefThreshold > 0 && taxableIncome <= reliefThreshold) return 0;

  let slabTax = 0;
  for (const slab of taxConfig.slabs) {
    const from = normaliseAmount(slab.from_amount);
    const to   = slab.to_amount && slab.to_amount > 0
      ? normaliseAmount(slab.to_amount)
      : Infinity;
    const rate = normaliseAmount(slab.percent_deduction) / 100;

    if (rate === 0 || taxableIncome <= from) continue;
    slabTax += (Math.min(taxableIncome, to) - from) * rate;
  }

  let totalTax = slabTax;
  for (const charge of taxConfig.other_taxes_and_charges ?? []) {
    const rate = normaliseAmount(charge.percent) / 100;
    if (rate === 0) continue;

    const min = normaliseAmount(charge.min_taxable_income);
    const max = charge.max_taxable_income && charge.max_taxable_income > 0
      ? normaliseAmount(charge.max_taxable_income)
      : Infinity;

    if (taxableIncome >= min && taxableIncome <= max) {
      totalTax += slabTax * rate;
    }
  }

  return r2(Math.max(0, totalTax));
}

// ─── calculateSalary — internal passes ────────────────────────────────────────
//
// calculateSalary() used to be one long function with six numbered comment
// blocks inline. It's now broken into small named passes, each one function,
// called in order from calculateSalary() itself. The logic/order is the same
// as before, with one addition: a "gross_pay" pass between resolving Earning
// formulas and resolving Deduction formulas (see runGrossPayPass below), so
// Deduction formulas can reference `gross_pay` — previously that identifier
// never existed in ctx and any formula using it silently evaluated to 0.
//
// Each pass takes (components, keys, ctx, overrides) and mutates ctx in place.
// "components" here is always the pre-normalised (amounts rounded) list, and
// "keys" is the parallel array of { nameKey, abbrKey } computed once up front.

interface CompKey {
  nameKey: string;
  abbrKey: string | null;
}

// Pass 1 — fixed-amount (non-formula) components, excluding tax components.
// Tax components are handled later, once monthlyTax is known (see
// runTaxVariablePass).
function runFixedAmountPass(
  components: SalaryComponentDef[],
  keys:       CompKey[],
  ctx:        CalcContext,
  overrides:  Record<string, number>,
): void {
  for (let i = 0; i < components.length; i++) {
    const comp = components[i];
    if (comp.amount_based_on_formula === 1 || isTaxComponent(comp)) continue;

    const { nameKey, abbrKey } = keys[i];
    const override = overrides[nameKey] ?? (abbrKey ? overrides[abbrKey] : undefined);
    writeCtx(ctx, nameKey, abbrKey, r2(override ?? comp.amount), comp.salary_component);
  }
}

// Resolves formula-based, non-tax components of a single ComponentType,
// re-evaluating up to 10 times so components can reference each other
// (e.g. "HRA = BS*0.3" needs "basic" resolved first). Used for both the
// Earnings pass and the Deductions pass below — same stabilising-loop logic,
// just filtered to one type at a time.
function runFormulaPassForType(
  components: SalaryComponentDef[],
  keys:       CompKey[],
  ctx:        CalcContext,
  overrides:  Record<string, number>,
  type:       ComponentType,
): void {
  for (let pass = 0; pass < 10; pass++) {
    let changed = false;
    for (let i = 0; i < components.length; i++) {
      const comp = components[i];
      if (
        comp.type !== type ||
        comp.amount_based_on_formula !== 1 ||
        isTaxComponent(comp)
      ) continue;

      const { nameKey, abbrKey } = keys[i];
      const override = overrides[nameKey] ?? (abbrKey ? overrides[abbrKey] : undefined);
      const next     = r2(
        override !== undefined
          ? override
          : evaluateFormula(comp.formula ?? "", ctx),
      );

      if (next !== (ctx[nameKey] ?? 0)) {
        changed = true;
        writeCtx(ctx, nameKey, abbrKey, next, comp.salary_component);
      }
    }
    if (!changed) break;
  }
}

// Sums the resolved amount of every Earning component out of ctx.
function sumEarnings(
  components: SalaryComponentDef[],
  keys:       CompKey[],
  ctx:        CalcContext,
): number {
  let total = 0;
  for (let i = 0; i < components.length; i++) {
    if (components[i].type === "Earning") {
      total += ctx[keys[i].nameKey] ?? 0;
    }
  }
  return r2(total);
}

// Injects "gross_pay" into ctx as a generic, always-available variable —
// same pattern as annual_tax / monthly_tax below. Not tied to any specific
// component; any Deduction formula (NAPSA, SSF, or anything the API sends)
// can reference it once this runs. Must run AFTER Earning formulas are
// resolved (runFormulaPassForType(..., "Earning")) and BEFORE Deduction
// formulas are resolved, since Deductions are the ones expected to read it.
function runGrossPayPass(
  components: SalaryComponentDef[],
  keys:       CompKey[],
  ctx:        CalcContext,
): number {
  const grossPay = sumEarnings(components, keys, ctx);
  writeCtx(ctx, "gross_pay", null, grossPay, "gross_pay");
  return grossPay;
}

// Pass 4 — income tax, from the resolved pre-tax gross.
function runTaxCalculation(
  preTaxGross: number,
  taxConfig:   TaxConfig | null | undefined,
): { annualTax: number; monthlyTax: number } {
  if (!taxConfig) return { annualTax: 0, monthlyTax: 0 };
  const annualTax  = calculateAnnualTax(preTaxGross * 12, taxConfig);
  const monthlyTax = r2(annualTax / 12);
  return { annualTax, monthlyTax };
}

// Pass 5 — tax-variable components (income tax lines etc.), resolved last
// since they depend on annual_tax / monthly_tax being in ctx already.
function runTaxVariablePass(
  components: SalaryComponentDef[],
  keys:       CompKey[],
  ctx:        CalcContext,
  monthlyTax: number,
): void {
  for (let i = 0; i < components.length; i++) {
    const comp = components[i];
    if (!isTaxComponent(comp)) continue;

    const { nameKey, abbrKey } = keys[i];
    const taxAmount = r2(
      comp.amount_based_on_formula === 1 && comp.formula?.trim()
        ? evaluateFormula(comp.formula, ctx)
        : monthlyTax,
    );
    writeCtx(ctx, nameKey, abbrKey, taxAmount, comp.salary_component);
  }
}

// Pass 6 — turns ctx into the final ComponentResult[] + breakdown map.
function assembleResults(
  components: SalaryComponentDef[],
  keys:       CompKey[],
  ctx:        CalcContext,
): { resultComponents: ComponentResult[]; breakdown: Record<string, number> } {
  const resultComponents: ComponentResult[] = components.map((comp, i) => ({
    name:      comp.salary_component,
    key:       keys[i].nameKey,
    abbrKey:   keys[i].abbrKey,
    amount:    r2(ctx[keys[i].nameKey] ?? 0),
    formula:   comp.formula ?? "",
    isFormula: comp.amount_based_on_formula === 1,
    type:      comp.type,
  }));

  const breakdown: Record<string, number> = {};
  for (const { key, abbrKey, amount, name } of resultComponents) {
    writeCtx(breakdown, key, abbrKey, amount, name);
  }

  return { resultComponents, breakdown };
}

// ─── calculateSalary — orchestration ──────────────────────────────────────────

export function calculateSalary(
  monthlyBase: number,
  components:  SalaryComponentDef[],
  overrides:   Record<string, number> = {},
  taxConfig?:  TaxConfig | null,
): SalaryResult {
  const empty: SalaryResult = {
    components: [], breakdown: {},
    gross: 0, deductionsTotal: 0, net: 0,
    resolvedBase: r2(monthlyBase), annualTax: 0, monthlyTax: 0,
  };
  if (!components.length) return empty;

  const normalisedComponents = components.map((c) => ({
    ...c,
    amount: normaliseAmount(c.amount),
  }));

  const keys: CompKey[] = normalisedComponents.map((c) => ({
    nameKey: toNameKey(c.salary_component),
    abbrKey: resolveAbbr(c),
  }));

  const ctx: CalcContext = {};
  writeCtx(ctx, "base", null, r2(monthlyBase), "base");

  // 1. Fixed-amount non-tax components (both Earnings and Deductions).
  runFixedAmountPass(normalisedComponents, keys, ctx, overrides);

  // 2. Formula-based Earning components — resolved first so their final
  //    values are available for gross_pay below.
  runFormulaPassForType(normalisedComponents, keys, ctx, overrides, "Earning");

  // 3. Compute gross_pay from resolved Earnings and inject it into ctx.
  const preTaxGross = runGrossPayPass(normalisedComponents, keys, ctx);

  // 4. Formula-based Deduction components — resolved after gross_pay exists,
  //    so formulas like `(gross_pay * 0.05) if (...) else 1861.80` work.
  runFormulaPassForType(normalisedComponents, keys, ctx, overrides, "Deduction");

  // 5. Income tax, from the resolved pre-tax gross.
  const { annualTax, monthlyTax } = runTaxCalculation(preTaxGross, taxConfig);
  writeCtx(ctx, "annual_tax",  null, annualTax,  "annual_tax");
  writeCtx(ctx, "monthly_tax", null, monthlyTax, "monthly_tax");

  // 6. Tax-variable components (depend on annual_tax / monthly_tax above).
  runTaxVariablePass(normalisedComponents, keys, ctx, monthlyTax);

  // 7. Assemble final result.
  const { resultComponents, breakdown } = assembleResults(normalisedComponents, keys, ctx);

  const gross = r2(
    resultComponents.filter((c) => c.type === "Earning").reduce((s, c) => s + c.amount, 0),
  );
  const deductionsTotal = r2(
    resultComponents.filter((c) => c.type === "Deduction").reduce((s, c) => s + c.amount, 0),
  );

  return {
    components: resultComponents,
    breakdown,
    gross,
    deductionsTotal,
    net:          r2(gross - deductionsTotal),
    resolvedBase: r2(monthlyBase),
    annualTax,
    monthlyTax,
  };
}

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

  const calcGross = (base: number): number =>
    calculateSalary(base, components, {}, taxConfig).gross;

  let lo = 0;
  let hi = targetGross * 3;
  for (let i = 0; i < 25 && calcGross(hi) < targetGross; i++) hi *= 2;

  for (let iter = 0; iter < maxIterations; iter++) {
    const mid   = (lo + hi) / 2;
    const gross = calcGross(mid);
    if (Math.abs(gross - targetGross) <= tolerance) return r2(mid);
    if (gross < targetGross) lo = mid;
    else                     hi = mid;
  }

  return r2((lo + hi) / 2);
}

export function structureToComponents(
  structureData: Record<string, unknown>,
): SalaryComponentDef[] {
  const normalize = (row: Record<string, unknown>, type: ComponentType): SalaryComponentDef => ({
    ...(row as SalaryComponentDef),
    type,
    amount:                normaliseAmount((row as SalaryComponentDef).amount),
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
    (c) =>
      c.type === "Earning" &&
      (c.abbrKey === "bs" || c.key === "basic_salary" || c.key === "basic"),
  );

  return {
    salary_structure:  (formData.salaryStructure as string) ?? null,
    base_salary:       r2(basicComp?.amount ?? result.gross),
    components:        result.components.map(({ name, key, abbrKey, amount, type }) => ({
      name, key, abbrKey, amount: r2(amount), type,
    })),
    gross:             r2(result.gross),
    deductions_total:  r2(result.deductionsTotal),
    net:               r2(result.net),
    salary_mode:       mapPaymentMode(formData.paymentMethod),
    salary_currency:   (formData.currency     as string) ?? null,
    bank_name:         (formData.bankName      as string) ?? null,
    bank_ac_no:        (formData.accountNumber as string) ?? null,
    account_type:      (formData.accountType   as string) ?? null,
    branch_code:       (formData.branchCode    as string) ?? null,
  };
}