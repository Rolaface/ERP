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
  variable_based_on_taxable_salary?: 0 | 1;
  is_income_tax_component?: 0 | 1;
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

// ─── Tax config types (mirrors payrollConfigApi) ──────────────────────────────

export interface TaxSlabRow {
  from_amount?: number;
  to_amount?: number;
  percent_deduction?: number;
}

export interface TaxChargeRow {
  description: string;
  percent?: number;
  min_taxable_income?: number;
  max_taxable_income?: number;
}

export interface TaxConfig {
  name: string;
  standard_tax_exemption_amount?: number;
  allow_tax_exemption?: 0 | 1;
  tax_relief_limit?: number;
  slabs: TaxSlabRow[];
  other_taxes_and_charges?: TaxChargeRow[];
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
    return isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

// ─── Tax slab calculator ──────────────────────────────────────────────────────

/**
 * Calculates annual income tax from a tax config and annual taxable income.
 *
 * Steps:
 * 1. Subtract standard exemption from annual gross → taxable income
 * 2. Apply progressive slab rates to taxable income
 * 3. Apply any other_taxes_and_charges (surcharges) if income is in their range
 * 4. Subtract tax_relief_limit
 */
export function calculateAnnualTax(
  annualGross: number,
  taxConfig: TaxConfig,
): number {
  if (!taxConfig || !taxConfig.slabs?.length) return 0;

  // Step 1: taxable income after standard exemption
  const exemption = taxConfig.standard_tax_exemption_amount ?? 0;
  const taxableIncome = Math.max(0, annualGross - exemption);

  if (taxableIncome <= 0) return 0;

  // Step 2: progressive slab tax
  // Slabs use from_amount/to_amount where to_amount=0 means no upper limit (Infinity).
  // Slab boundaries are stored as e.g. 0–250000, 250001–500000 (1-rupee gap).
  // We treat each slab as covering [from_amount, to_amount] inclusive,
  // and use the raw from/to as boundaries — the tiny gap is irrelevant at this scale.
  let tax = 0;
  for (const slab of taxConfig.slabs) {
    const from = slab.from_amount ?? 0;
    // to_amount = 0 means unlimited (last slab)
    const to = slab.to_amount && slab.to_amount > 0 ? slab.to_amount : Infinity;
    const rate = (slab.percent_deduction ?? 0) / 100;

    // Income doesn't reach this slab at all
    if (taxableIncome <= from) continue;

    // How much of taxable income falls in this slab
    const slabTop = Math.min(taxableIncome, to);
    const slabIncome = slabTop - from;
    tax += slabIncome * rate;
  }

  // Step 3: other taxes & charges (cess, surcharge, etc.)
  // These are a % on top of the BASE TAX already computed,
  // applied only when taxable income falls within their min/max range.
  if (taxConfig.other_taxes_and_charges?.length) {
    const baseTax = tax; // snapshot before surcharges
    for (const charge of taxConfig.other_taxes_and_charges) {
      const min = charge.min_taxable_income ?? 0;
      // max = 0 means no upper limit
      const max =
        charge.max_taxable_income && charge.max_taxable_income > 0
          ? charge.max_taxable_income
          : Infinity;
      const rate = (charge.percent ?? 0) / 100;

      if (taxableIncome >= min && taxableIncome <= max) {
        tax += baseTax * rate; // surcharge on base tax, not compounding
      }
    }
  }

  // Step 4: subtract relief limit
  const relief = taxConfig.tax_relief_limit ?? 0;
  tax = Math.max(0, tax - relief);

  return tax;
}

// ─── Core calculator ──────────────────────────────────────────────────────────

export function calculateSalary(
  monthlyBase: number,
  components: SalaryComponentDef[],
  overrides: Record<string, number> = {},
  taxConfig?: TaxConfig | null,
): SalaryResult {
  const pairs = components.map((c) => ({
    nameKey: toKey(c.salary_component),
    abbrKey: resolveAbbr(c),
  }));

  // Seed context
  const ctx: CalcContext = { base: monthlyBase };

  // Pass 1: fixed non-tax components
  for (let i = 0; i < components.length; i++) {
    const comp = components[i];
    // Skip formula-based and tax-variable components in first pass
    if (comp.amount_based_on_formula === 1) continue;
    if (comp.variable_based_on_taxable_salary === 1 || comp.is_income_tax_component === 1) continue;

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
      if (comp.variable_based_on_taxable_salary === 1 || comp.is_income_tax_component === 1) continue;

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

  // Pass 3: compute gross from earnings so far (needed for tax)
  const preTaxEarnings = components
    .map((comp, i) => ({
      comp,
      nameKey: pairs[i].nameKey,
      abbrKey: pairs[i].abbrKey,
    }))
    .filter(({ comp }) => comp.type === "Earning")
    .reduce((sum, { nameKey }) => sum + (ctx[nameKey] ?? 0), 0);

  // Pass 4: calculate income tax via slab if taxConfig provided
  let annualTax = 0;
  let monthlyTax = 0;

  if (taxConfig) {
    annualTax = calculateAnnualTax(preTaxEarnings * 12, taxConfig);
    monthlyTax = annualTax / 12;
  }

  // Pass 5: inject tax into tax-variable deduction components
  for (let i = 0; i < components.length; i++) {
    const comp = components[i];
    if (comp.variable_based_on_taxable_salary !== 1 && comp.is_income_tax_component !== 1) continue;

    const { nameKey, abbrKey } = pairs[i];
    // Use formula if present (e.g. some custom tax formula), otherwise use computed monthly tax
    let taxAmount: number;
    if (comp.amount_based_on_formula === 1 && comp.formula?.trim()) {
      // Inject annual_tax and monthly_tax into context for the formula
      ctx["annual_tax"] = annualTax;
      ctx["monthly_tax"] = monthlyTax;
      taxAmount = evaluateFormula(comp.formula, ctx);
    } else {
      taxAmount = monthlyTax;
    }

    writeContext(ctx, nameKey, abbrKey, taxAmount);
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
  };
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
    ...(structureData.deductions ?? []).map((r: any) => normalize(r, "Deduction")),
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
    components: result.components.map(({ name, key, abbrKey, amount, type }) => ({
      name,
      key,
      abbrKey,
      amount,
      type,
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
