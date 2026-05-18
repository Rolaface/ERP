export type ComponentType = "Earning" | "Deduction";

export interface SalaryComponentDef {
  salary_component: string;
  amount: number;
  amount_based_on_formula?: 0 | 1;
  formula?: string;
  type: ComponentType;
  salary_component_abbr?: string;
  abbr?: string;
  name?: string;
  depends_on_payment_days?: 0 | 1;
  is_tax_applicable?: number;
  create_separate_payment_entry_against_benefit_claim?: 0 | 1;
  [key: string]: any;
}

export type CalcContext = Record<string, number>;

export interface ComponentResult {
  name: string;
  key: string;
  abbrKey: string | null;
  amount: number;
  formula: string;
  isFormula: boolean;
  type: ComponentType;
}

export interface SalaryResult {
  breakdown: Record<string, number>;
  components: ComponentResult[];
  gross: number;
  deductionsTotal: number;
  net: number;
  /** The resolved monthly base used in this calculation */
  resolvedBase: number;
}

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const toKey = (name: string) =>
  name.trim().toLowerCase().replace(/\s+/g, "_");

const toAbbrKey = (abbr?: string | null): string | null =>
  abbr?.trim() ? abbr.trim().toLowerCase() : null;

const resolveAbbr = (comp: SalaryComponentDef) =>
  toAbbrKey(comp.abbr ?? comp.salary_component_abbr);

const writeContext = (
  ctx: CalcContext,
  nameKey: string,
  abbrKey: string | null,
  value: number,
) => {
  ctx[nameKey] = value;
  if (abbrKey) {
    ctx[abbrKey] = value;
    ctx[abbrKey.toUpperCase()] = value;
  }
};

// ─── Formula evaluator ────────────────────────────────────────────────────────

export function evaluateFormula(formula: string, context: CalcContext): number {
  if (!formula?.trim()) return 0;
  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function(
      ...Object.keys(context),
      `"use strict"; return (${formula});`,
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
  monthlyBase: number,
  components: SalaryComponentDef[],
  overrides: Record<string, number> = {},
): SalaryResult {
  const pairs = components.map((c) => ({
    nameKey: toKey(c.salary_component),
    abbrKey: resolveAbbr(c),
  }));

  // Seed context — base is always the monthly base passed in, never overwritten
  const ctx: CalcContext = { base: monthlyBase };

  // Pass 1: fixed components
  for (let i = 0; i < components.length; i++) {
    const comp = components[i];
    if (comp.amount_based_on_formula === 1) continue;

    const { nameKey, abbrKey } = pairs[i];
    const value =
      overrides[nameKey] ??
      (abbrKey ? overrides[abbrKey] : undefined) ??
      comp.amount ??
      0;
    writeContext(ctx, nameKey, abbrKey, value);
  }

  // Pass 2: formula components — iterate until stable (max 5 passes)
  for (let pass = 0; pass < 5; pass++) {
    let changed = false;
    for (let i = 0; i < components.length; i++) {
      const comp = components[i];
      if (comp.amount_based_on_formula !== 1) continue;

      const { nameKey, abbrKey } = pairs[i];
      const prev = ctx[nameKey] ?? 0;
      const next = evaluateFormula(comp.formula ?? "", ctx);
      if (next !== prev) {
        changed = true;
        writeContext(ctx, nameKey, abbrKey, next);
      }
    }
    if (!changed) break;
  }

  // Build results
  const resultComponents: ComponentResult[] = components.map((comp, i) => ({
    name: comp.salary_component,
    key: pairs[i].nameKey,
    abbrKey: pairs[i].abbrKey,
    amount: ctx[pairs[i].nameKey] ?? 0,
    formula: comp.formula ?? "",
    isFormula: comp.amount_based_on_formula === 1,
    type: comp.type,
  }));

  const gross = resultComponents
    .filter((c) => c.type === "Earning")
    .reduce((s, c) => s + c.amount, 0);
  const deductionsTotal = resultComponents
    .filter((c) => c.type === "Deduction")
    .reduce((s, c) => s + c.amount, 0);

  const breakdown: Record<string, number> = {};
  for (const { key, abbrKey, amount } of resultComponents) {
    breakdown[key] = amount;
    if (abbrKey) breakdown[abbrKey] = amount;
  }

  return {
    breakdown,
    components: resultComponents,
    gross,
    deductionsTotal,
    net: gross - deductionsTotal,
    resolvedBase: monthlyBase,
  };
}

// ─── Gross → Base back-solver ─────────────────────────────────────────────────

/**
 * Given a target gross salary, binary-searches for the base salary value
 * that produces exactly that gross via the salary engine.
 *
 * Works even when earnings contain a mix of fixed and formula-based components,
 * because `base` is the only free variable the engine exposes to formulas.
 *
 * @param targetGross   The desired monthly gross
 * @param components    The salary structure component definitions
 * @param tolerance     How close the result needs to be (default: 0.01)
 * @param maxIterations Max binary-search iterations (default: 60)
 * @returns The base salary that yields the target gross (or the closest found)
 */
export function solveBaseFromGross(
  targetGross: number,
  components: SalaryComponentDef[],
  tolerance = 0.01,
  maxIterations = 60,
): number {
  if (targetGross <= 0) return 0;

  // Quick check: if there are no formula earnings, gross = sum of fixed earnings
  // and base doesn't affect it — just return targetGross as best guess
  const earningDefs = components.filter((c) => c.type === "Earning");
  const hasFormulaEarnings = earningDefs.some(
    (c) => c.amount_based_on_formula === 1,
  );

  if (!hasFormulaEarnings) {
    // Gross is purely fixed; base cannot change it — return 0 (no back-solve possible)
    return 0;
  }

  // Binary search: find base in [0, targetGross * 3]
  // Upper bound is generous — if ALL earnings were base*1.0 it would equal base,
  // but with multipliers > 1 or fixed additions the upper bound needs headroom.
  let lo = 0;
  let hi = targetGross * 3;

  // Ensure hi actually overshoots
  for (let safety = 0; safety < 20; safety++) {
    if (calculateSalary(hi, components).gross >= targetGross) break;
    hi *= 2;
  }

  for (let iter = 0; iter < maxIterations; iter++) {
    const mid = (lo + hi) / 2;
    const gross = calculateSalary(mid, components).gross;

    if (Math.abs(gross - targetGross) <= tolerance) return parseFloat(mid.toFixed(2));

    if (gross < targetGross) {
      lo = mid;
    } else {
      hi = mid;
    }
  }

  return parseFloat(((lo + hi) / 2).toFixed(2));
}

// ─── API adapter ──────────────────────────────────────────────────────────────

export function structureToComponents(
  structureData: Record<string, any>,
): SalaryComponentDef[] {
  const normalize = (row: any, type: ComponentType): SalaryComponentDef => ({
    ...row,
    type,
    abbr: row.abbr ?? row.salary_component_abbr ?? "",
    salary_component_abbr: row.abbr ?? row.salary_component_abbr ?? "",
  });

  return [
    ...(structureData.earnings ?? []).map((r: any) => normalize(r, "Earning")),
    ...(structureData.deductions ?? []).map((r: any) =>
      normalize(r, "Deduction"),
    ),
  ];
}

// ─── Payload builder ──────────────────────────────────────────────────────────

export function buildCompensationPayload(
  formData: Record<string, any>,
  result: SalaryResult,
): CompensationPayload {
  const mapMode = (method: string): string | null => {
    const m = method?.toLowerCase() ?? "";
    if (m.includes("bank")) return "Bank";
    if (m.includes("mobile")) return "Mobile";
    if (m.includes("cash")) return "Cash";
    return method || null;
  };

  const basicComp = result.components.find(
    (c) =>
      c.type === "Earning" && (c.abbrKey === "bs" || c.key === "basic_salary"),
  );

  return {
    salary_structure: formData.salaryStructure ?? null,
    base_salary: basicComp?.amount ?? result.gross,
    components: result.components.map(
      ({ name, key, abbrKey, amount, type }) => ({
        name,
        key,
        abbrKey,
        amount,
        type,
      }),
    ),
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