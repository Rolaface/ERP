

export type ComponentType = "Earning" | "Deduction";

/** Shape of a component as returned by the Salary Component API */
export interface SalaryComponentDef {
  salary_component: string;
  amount: number;
  amount_based_on_formula?: 0 | 1 | undefined;  
  formula?: string;                              
  type: ComponentType;
  
name?: string;
  salary_component_abbr?: string;
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
  key: string;                     
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

// ─── Utilities ────────────────────────────────────────────────────────────────


export const toKey = (name: string): string =>
  name.trim().toLowerCase().replace(/\s+/g, "_");


export function evaluateFormula(formula: string, context: CalcContext): number {
  if (!formula || formula.trim() === "") return 0;
  try {
    // Build a function that exposes each context key as a named variable.
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


export function calculateSalary(
  base: number,
  components: SalaryComponentDef[],
  overrides: Record<string, number> = {}
): SalaryResult {
  // ── Pass 1: Seed context ──────────────────────────────────────────────────
  const context: CalcContext = { base };

  // Pre-seed fixed components with their API default amounts
  for (const comp of components) {
    if (comp.amount_based_on_formula !== 1) {
      const key = toKey(comp.salary_component);
      context[key] = overrides[key] ?? comp.amount ?? 0;
    }
  }

  // ── Pass 2: Evaluate formula components (iterative for inter-deps) ────────
  const MAX_PASSES = 5;
  for (let pass = 0; pass < MAX_PASSES; pass++) {
    let changed = false;
    for (const comp of components) {
      if (comp.amount_based_on_formula !== 1) continue;
      const key = toKey(comp.salary_component);
      const prev = context[key] ?? 0;
     const next = evaluateFormula(comp.formula ?? "", context);
      context[key] = next;
      if (next !== prev) changed = true;
    }
    if (!changed) break; // converged
  }

  // ── Pass 3: Apply user overrides for fixed components ────────────────────
  for (const [key, amount] of Object.entries(overrides)) {
    // Never let the user override a formula-based component
    const def = components.find((c) => toKey(c.salary_component) === key);
    if (def && def.amount_based_on_formula !== 1) {
      context[key] = amount;
    }
  }

  // ── Build result ──────────────────────────────────────────────────────────
  const resultComponents: ComponentResult[] = components.map((comp) => {
    const key = toKey(comp.salary_component);
    return {
      name: comp.salary_component,
      key,
      amount: context[key] ?? 0,
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

  const breakdown: Record<string, number> = {};
  for (const c of resultComponents) breakdown[c.key] = c.amount;

  return {
    breakdown,
    components: resultComponents,
    gross,
    deductionsTotal,
    net: gross - deductionsTotal,
  };
}

// ─── Payload builder ──────────────────────────────────────────────────────────

export interface CompensationPayload {
  salary_structure: string | null;
  base_salary: number;
  components: Array<{ name: string; key: string; amount: number; type: ComponentType }>;
  gross: number;
  deductions_total: number;
  net: number;
  // Payroll config
  salary_mode: string | null;
  salary_currency: string | null;
  // Bank
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
    base_salary: result.breakdown[toKey("Basic Salary")] ?? result.gross, // first earning key or gross
    components: result.components.map((c) => ({
      name: c.name,
      key: c.key,
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