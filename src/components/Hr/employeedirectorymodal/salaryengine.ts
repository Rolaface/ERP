export type ComponentType = "Earning" | "Deduction";

/**
 * Shape of a component as returned by the Salary Structure API.
 *
 * NOTE: The API returns `abbr` (not `salary_component_abbr`) on salary-detail
 * rows embedded inside a Salary Structure document.  Both field names are
 * accepted so the engine works regardless of which endpoint is called.
 */
export interface SalaryComponentDef {
  salary_component: string;
  amount: number;
  amount_based_on_formula?: 0 | 1 | undefined;
  formula?: string;
  type: ComponentType;

  /** Present on top-level Salary Component documents */
  salary_component_abbr?: string;
  /** Present on Salary Detail rows inside a Salary Structure document */
  abbr?: string;

  name?: string;
  depends_on_payment_days?: 0 | 1 | undefined;
  is_tax_applicable?: number;
  create_separate_payment_entry_against_benefit_claim?: 0 | 1 | undefined;
  [key: string]: any;
}

/** Calculation context — grows as each component is evaluated */
export type CalcContext = Record<string, number>;

/** Per-component result */
export interface ComponentResult {
  name: string;
  key: string;            // normalized component name  e.g. "basic_salary"
  abbrKey: string | null; // normalized abbreviation    e.g. "bs"
  amount: number;
  formula: string;
  isFormula: boolean;
  type: ComponentType;
}

/** Full result returned by calculateSalary() */
export interface SalaryResult {
  breakdown: Record<string, number>;
  components: ComponentResult[];
  gross: number;
  deductionsTotal: number;
  net: number;
}

// ─── Key helpers ──────────────────────────────────────────────────────────────

/** "Basic Salary" → "basic_salary" */
export const toKey = (name: string): string =>
  name.trim().toLowerCase().replace(/\s+/g, "_");

/**
 * "HRA_2" → "hra_2"  |  "BS" → "bs"  |  undefined → null
 * Returns null when absent/empty so callers can guard with a simple check.
 */
export const toAbbrKey = (abbr: string | undefined | null): string | null => {
  if (!abbr || abbr.trim() === "") return null;
  return abbr.trim().toLowerCase();
};

/**
 * Resolve the abbreviation from a component definition.
 * Accepts BOTH `abbr` (Salary Structure detail rows) and
 * `salary_component_abbr` (standalone Salary Component documents).
 */
function resolveAbbr(comp: SalaryComponentDef): string | null {
  return toAbbrKey(comp.abbr ?? comp.salary_component_abbr);
}

/**
 * Write a value into the context under EVERY alias for a component:
 *   1. normalized name key   ("basic_salary")
 *   2. normalized abbr key   ("bs")        — if present
 *
 * All writes go through here to guarantee the keys are always in sync.
 */
function setInContext(
  context: CalcContext,
  nameKey: string,
  abbrKey: string | null,
  value: number
): void {
  context[nameKey] = value;
if (abbrKey !== null) {
  context[abbrKey] = value;
  context[abbrKey.toUpperCase()] = value;
}
}

// ─── Formula evaluator ────────────────────────────────────────────────────────

/** Evaluate a formula string against the current context. Fails gracefully. */
export function evaluateFormula(formula: string, context: CalcContext): number {
  if (!formula || formula.trim() === "") return 0;
  try {
    // Expose every context key as a named local variable inside the function.
    // eslint-disable-next-line no-new-func
    const fn = new Function(
      ...Object.keys(context),
      `"use strict"; return (${formula});`
    );
    const result = fn(...Object.values(context));
    const n = typeof result === "number" ? result : parseFloat(result);
    return isFinite(n) ? parseFloat(n.toFixed(2)) : 0;
  } catch {
    return 0;
  }
}

// ─── Core calculator ──────────────────────────────────────────────────────────

export function calculateSalary(
  base: number,
  components: SalaryComponentDef[],
  overrides: Record<string, number> = {}
): SalaryResult {
  // Pre-compute stable key pairs once — indexed positionally alongside `components`.
  const keyPairs: Array<{ nameKey: string; abbrKey: string | null }> =
    components.map((comp) => ({
      nameKey: toKey(comp.salary_component),
      abbrKey: resolveAbbr(comp),
    }));

  // ── Pass 1: Seed context with `base` + all fixed (non-formula) components ──
  const context: CalcContext = { base };

  for (let i = 0; i < components.length; i++) {
    const comp = components[i];
    if (comp.amount_based_on_formula === 1) continue; // resolved in Pass 2

    const { nameKey, abbrKey } = keyPairs[i];

    // Accept an override keyed by either the name key or the abbreviation.
    const value =
      overrides[nameKey] ??
      (abbrKey !== null ? overrides[abbrKey] : undefined) ??
      comp.amount ??
      0;

    setInContext(context, nameKey, abbrKey, value);
   if (
  nameKey.toLowerCase() === "basic_salary" ||
  abbrKey?.toLowerCase() === "bs"
) {
  context.base = value;
}
  }

  // ── Pass 2: Iterative evaluation of formula-based components ──────────────
  //
  //  Multiple passes handle inter-component dependencies:
  //    e.g. HRA = basic * 0.40  →  PF = basic * 0.12  →  net = basic + hra - pf
  //  Formulas may reference a component by its name key OR its abbreviation key;
  //  both are present in `context` after each setInContext call.
  //
  const MAX_PASSES = 5;
  for (let pass = 0; pass < MAX_PASSES; pass++) {
    let changed = false;

    for (let i = 0; i < components.length; i++) {
      const comp = components[i];
      if (comp.amount_based_on_formula !== 1) continue;

      const { nameKey, abbrKey } = keyPairs[i];
      const prev = context[nameKey] ?? 0;
      const next = evaluateFormula(comp.formula ?? "", context);

      if (next !== prev) {
        changed = true;
        setInContext(context, nameKey, abbrKey, next);
      }
    }

    if (!changed) break; // converged — stop early
  }

  // ── Pass 3: Apply user overrides for fixed components only ────────────────
  //    Formula components are intentionally read-only from user overrides.
  for (const [overrideKey, amount] of Object.entries(overrides)) {
    const idx = keyPairs.findIndex(
      ({ nameKey, abbrKey }) =>
        nameKey === overrideKey || abbrKey === overrideKey
    );
    if (idx === -1) continue;

    const comp = components[idx];
    if (comp.amount_based_on_formula === 1) continue; // never override formula components

    const { nameKey, abbrKey } = keyPairs[idx];
    setInContext(context, nameKey, abbrKey, amount);
  }

  // ── Build result ──────────────────────────────────────────────────────────
  const resultComponents: ComponentResult[] = components.map((comp, i) => {
    const { nameKey, abbrKey } = keyPairs[i];
    return {
      name: comp.salary_component,
      key: nameKey,
      abbrKey,
      amount: context[nameKey] ?? 0,
      formula: comp.formula ?? "",
      isFormula: comp.amount_based_on_formula === 1,
      type: comp.type,
    };
  });

  const gross = resultComponents
    .filter((c) => c.type === "Earning")
    .reduce((sum, c) => sum + c.amount, 0);

  const deductionsTotal = resultComponents
    .filter((c) => c.type === "Deduction")
    .reduce((sum, c) => sum + c.amount, 0);

  // Expose BOTH keys in breakdown for downstream convenience
  const breakdown: Record<string, number> = {};
  for (const { key, abbrKey, amount } of resultComponents) {
    breakdown[key] = amount;
    if (abbrKey !== null) breakdown[abbrKey] = amount;
  }

  return {
    breakdown,
    components: resultComponents,
    gross,
    deductionsTotal,
    net: gross - deductionsTotal,
  };
}

// ─── API adapter ──────────────────────────────────────────────────────────────

/**
 * Convert a raw Salary Structure API response into the flat
 * SalaryComponentDef[] array that calculateSalary expects.
 *
 * Handles:
 *   • Both `earnings` and `deductions` child tables
 *   • The `abbr` field used on Salary Detail rows
 *   • Missing / zero amounts on formula-based rows
 */
export function structureToComponents(
  structureData: Record<string, any>
): SalaryComponentDef[] {
  const earnings: SalaryComponentDef[] = (structureData.earnings ?? []).map(
    (row: any) => ({
      ...row,
      type: "Earning" as ComponentType,
      // Normalise: ensure both abbr aliases are present
      abbr: row.abbr ?? row.salary_component_abbr ?? "",
      salary_component_abbr: row.abbr ?? row.salary_component_abbr ?? "",
    })
  );

  const deductions: SalaryComponentDef[] = (structureData.deductions ?? []).map(
    (row: any) => ({
      ...row,
      type: "Deduction" as ComponentType,
      abbr: row.abbr ?? row.salary_component_abbr ?? "",
      salary_component_abbr: row.abbr ?? row.salary_component_abbr ?? "",
    })
  );

  return [...earnings, ...deductions];
}

// ─── Payload builder ──────────────────────────────────────────────────────────

export interface CompensationPayload {
  salary_structure: string | null;
  base_salary: number;
  components: Array<{
    name: string;
    key: string;
    abbrKey: string | null;
    amount: number;
    type: ComponentType;
  }>;
  gross: number;
  deductions_total: number;
  net: number;
  salary_mode: string | null;
  salary_currency: string | null;
  bank_name: string | null;
  bank_ac_no: string | null;
  account_type: string | null;
  branch_code: string | null;
}

export function buildCompensationPayload(
  formData: Record<string, any>,
  result: SalaryResult
): CompensationPayload {
  const mapMode = (method: string): string | null => {
    const m = (method ?? "").toLowerCase();
    if (m.includes("bank")) return "Bank";
    if (m.includes("mobile")) return "Mobile";
    if (m.includes("cash")) return "Cash";
    return method || null;
  };

  return {
    salary_structure: formData.salaryStructure ?? null,
    base_salary: result.breakdown[toKey("Basic Salary")] ?? result.gross,
    components: result.components.map((c) => ({
      name: c.name,
      key: c.key,
      abbrKey: c.abbrKey,
      amount: c.amount,
      type: c.type,
    })),
    gross: result.gross,
    deductions_total: result.deductionsTotal,
    net: result.net,
    salary_mode: mapMode(formData.paymentMethod ?? ""),
    salary_currency: formData.currency ?? null,
    bank_name: formData.bankName ?? null,
    bank_ac_no: formData.accountNumber ?? null,
    account_type: formData.accountType ?? null,
    branch_code: formData.branchCode ?? null,
  };
}