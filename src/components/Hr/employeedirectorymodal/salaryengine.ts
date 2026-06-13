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

const r2 = (n: number): number => Math.round(n * 100) / 100;

const toNameKey = (name: string): string =>
  name.trim().toLowerCase().replace(/\s+/g, "_");

const toAbbrKey = (abbr?: string | null): string | null =>
  abbr?.trim() ? abbr.trim().toLowerCase() : null;

const resolveAbbr = (comp: SalaryComponentDef): string | null =>
  toAbbrKey(comp.abbr ?? comp.salary_component_abbr);

const isTaxComponent = (comp: SalaryComponentDef): boolean =>
  comp.variable_based_on_taxable_salary === 1 ||
  comp.is_income_tax_component === 1;

const normaliseAmount = (v: unknown): number => r2(Number(v ?? 0));

// Only write keys that are valid JS identifiers — keys with spaces break
// new Function() in strict mode and cause all formulas to silently return 0.
const isValidIdentifier = (k: string): boolean =>
  /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k);

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
  write(nameKey.toUpperCase());

  const firstWord = nameKey.split("_")[0];
  if (firstWord && firstWord !== nameKey) {
    write(firstWord);
    write(firstWord.toUpperCase());
    write(firstWord.charAt(0).toUpperCase() + firstWord.slice(1));
  }

  if (originalName?.trim()) {
    const orig      = originalName.trim();
    const origLower = orig.toLowerCase();
    const origUpper = orig.toUpperCase();
    const origSnake = origLower.replace(/\s+/g, "_");
    const origTitle = origLower.replace(/\b\w/g, (c) => c.toUpperCase());

    // Skip keys with spaces — not valid JS identifiers
    write(orig);       // works only if single word e.g. "BASIC"
    write(origLower);  // "basic"
    write(origUpper);  // "BASIC"
    write(origSnake);  // "basic_salary"
    write(origSnake.toUpperCase()); // "BASIC_SALARY"
    write(origTitle.replace(/\s+/g, "")); // "BasicSalary" — camelCase without spaces
  }

  if (abbrKey) {
    write(abbrKey);
    write(abbrKey.toUpperCase());
  }
};

// ─── Python → JS Transpiler ───────────────────────────────────────────────────

function pythonToJS(formula: string): string {
  let result = formula;

  const ternaryRe = /(.+?)\s+if\s+(.+?)\s+else\s+(.+)/;
  for (let i = 0; i < 20; i++) {
    const next = result.replace(ternaryRe, "($2 ? $1 : $3)");
    if (next === result) break;
    result = next;
  }

  return result
    .replace(/\band\b/g, "&&")
    .replace(/\bor\b/g,  "||")
    .replace(/\bnot\b/g, "!");
}

// ─── Formula Helpers ──────────────────────────────────────────────────────────

const FORMULA_HELPERS = {
  IF:  (cond: unknown, a: number, b: number): number => (cond ? a : b),
  AND: (...args: unknown[]): number => (args.every(Boolean) ? 1 : 0),
  OR:  (...args: unknown[]): number => (args.some(Boolean)  ? 1 : 0),
} as const;

// ─── Public API ───────────────────────────────────────────────────────────────

export function evaluateFormula(formula: string, ctx: CalcContext): number {
  if (!formula?.trim()) return 0;
  try {
    const jsFormula = pythonToJS(formula);

   
    const merged: Record<string, unknown> = {
      ...FORMULA_HELPERS,
      ...ctx,
    };

    // Filter to valid JS identifiers only — spaces and special chars
    // in keys cause new Function to throw and silently return 0.
    const safeKeys:   string[]   = [];
    const safeValues: unknown[]  = [];

    for (const [k, v] of Object.entries(merged)) {
      if (isValidIdentifier(k)) {
        safeKeys.push(k);
        safeValues.push(v);
      }
    }

    // eslint-disable-next-line no-new-func
    const fn = new Function(
      ...safeKeys,
      `"use strict"; return +(${jsFormula});`,
    );

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

  const keys = normalisedComponents.map((c) => ({
    nameKey: toNameKey(c.salary_component),
    abbrKey: resolveAbbr(c),
  }));

  const ctx: CalcContext = {};
  writeCtx(ctx, "base", null, r2(monthlyBase), "base");

  // Pass 1 — fixed non-tax components
  for (let i = 0; i < normalisedComponents.length; i++) {
    const comp = normalisedComponents[i];
    if (comp.amount_based_on_formula === 1 || isTaxComponent(comp)) continue;

    const { nameKey, abbrKey } = keys[i];
    const override = overrides[nameKey] ?? (abbrKey ? overrides[abbrKey] : undefined);
    writeCtx(ctx, nameKey, abbrKey, r2(override ?? comp.amount), comp.salary_component);
  }

  // Pass 2 — formula non-tax components (iterate until stable)
  for (let pass = 0; pass < 10; pass++) {
    let changed = false;
    for (let i = 0; i < normalisedComponents.length; i++) {
      const comp = normalisedComponents[i];
      if (comp.amount_based_on_formula !== 1 || isTaxComponent(comp)) continue;

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

  // Pass 3 — pre-tax gross
  const preTaxGross = r2(
    normalisedComponents
      .filter((c) => c.type === "Earning")
      .reduce((sum, c) => {
        const idx = normalisedComponents.indexOf(c);
        return sum + (ctx[keys[idx].nameKey] ?? 0);
      }, 0),
  );

  // Pass 4 — income tax
  let annualTax  = 0;
  let monthlyTax = 0;
  if (taxConfig) {
    annualTax  = calculateAnnualTax(preTaxGross * 12, taxConfig);
    monthlyTax = r2(annualTax / 12);
  }

  writeCtx(ctx, "annual_tax",  null, annualTax,  "annual_tax");
  writeCtx(ctx, "monthly_tax", null, monthlyTax, "monthly_tax");

  // Pass 5 — tax-variable components
  for (let i = 0; i < normalisedComponents.length; i++) {
    const comp = normalisedComponents[i];
    if (!isTaxComponent(comp)) continue;

    const { nameKey, abbrKey } = keys[i];
    const taxAmount = r2(
      comp.amount_based_on_formula === 1 && comp.formula?.trim()
        ? evaluateFormula(comp.formula, ctx)
        : monthlyTax,
    );
    writeCtx(ctx, nameKey, abbrKey, taxAmount, comp.salary_component);
  }

  // Pass 6 — final results
  const resultComponents: ComponentResult[] = normalisedComponents.map((comp, i) => ({
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

  const breakdown: Record<string, number> = {};
  for (const { key, abbrKey, amount, name } of resultComponents) {
    writeCtx(breakdown, key, abbrKey, amount, name);
  }

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