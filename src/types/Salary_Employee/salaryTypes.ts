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
  statistical_component?:            0 | 1;
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

// Internal shape used inside calculateSalary's passes — the pair of lookup
// keys each component is filed under in CalcContext.
export interface CompKey {
  nameKey: string;
  abbrKey: string | null;
}