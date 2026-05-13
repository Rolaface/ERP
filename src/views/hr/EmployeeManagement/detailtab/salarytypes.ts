// ─── Salary Slip Core Types ───────────────────────────────────────────────────

export interface SalaryDetail {
  name: string;
  idx: number;
  salary_component: string;
  abbr: string;
  amount: number;
  year_to_date: number;
  default_amount: number;
  additional_amount: number;
  depends_on_payment_days: 0 | 1;
  exempted_from_income_tax: 0 | 1;
  is_tax_applicable: 0 | 1;
  is_flexible_benefit: 0 | 1;
  variable_based_on_taxable_salary: 0 | 1;
  statistical_component: 0 | 1;
  do_not_include_in_total: 0 | 1;
  tax_on_flexible_benefit: number;
  tax_on_additional_salary: number;
  parent: string;
  parentfield: string;
  parenttype: string;
  doctype: string;
}

export interface SalarySlip {
  name: string;
  employee: string;
  employee_name: string;
  department: string;
  designation: string;
  company: string;
  posting_date: string;
  status: string;
  salary_structure: string;
  payroll_entry: string;
  current_payroll_period?: string;
  start_date: string;
  end_date: string;
  payroll_frequency: string;
  mode_of_payment: string;
  currency: string;
  exchange_rate: number;
  total_working_days: number;
  payment_days: number;
  leave_without_pay: number;
  absent_days: number;
  unmarked_days: number;
  gross_pay: number;
  base_gross_pay: number;
  net_pay: number;
  base_net_pay: number;
  rounded_total: number;
  base_rounded_total: number;
  total_deduction: number;
  base_total_deduction: number;
  total_earnings: number;
  gross_year_to_date: number;
  base_gross_year_to_date: number;
  year_to_date: number;
  base_year_to_date: number;
  month_to_date: number;
  base_month_to_date: number;
  total_in_words: string;
  base_total_in_words: string;
  ctc: number;
  annual_taxable_amount: number;
  non_taxable_earnings: number;
  standard_tax_exemption_amount: number;
  tax_exemption_declaration: number;
  deductions_before_tax_calculation: number;
  income_tax_deducted_till_date: number;
  current_month_income_tax: number;
  future_income_tax_deductions: number;
  total_income_tax: number;
  income_from_other_sources: number;
  salary_slip_based_on_timesheet: 0 | 1;
  deduct_tax_for_unsubmitted_tax_exemption_proof: 0 | 1;
  total_working_hours: number;
  hour_rate: number;
  base_hour_rate: number;
  earnings: SalaryDetail[];
  deductions: SalaryDetail[];
  timesheets: unknown[];
  accrued_benefits: unknown[];
  leave_details: unknown[];
}

export type SalarySlipListItem = Pick<
  SalarySlip,
  "name" | "employee" | "status" | "posting_date"
>;

// ─── Filter Types ─────────────────────────────────────────────────────────────

export type QuickFilter =
  | "latest"
  | "this_year"
  | "last_6_months"
  | "paid"
  | "pending"
  | null;

export type SlipStatus = "Draft" | "Submitted" | "Paid" | "Cancelled";

export interface SlipFilters {
  month: string;
  year: string;
  startDate: string;
  endDate: string;
  slipId: string;
  status: SlipStatus | "";
}

// ─── Component Prop Types ─────────────────────────────────────────────────────

export interface EmployeeProp {
  employee: string;
  employee_name: string;
  designation?: string;
  department?: string;
}

export interface SummaryStats {
  totalPaidThisYear: number;
  averageMonthlySalary: number;
  latestSalaryCredited: number;
  pendingCount: number;
  currency: string;
}

// ─── Chart / Analytics Types ──────────────────────────────────────────────────

export interface MonthlyPayoutPoint {
  label: string;      // e.g. "Jan 2024"
  gross: number;
  net: number;
  deductions: number;
}

export interface EarningsVsDeductionsPoint {
  name: string;       // component name
  amount: number;
  type: "earning" | "deduction";
}

// ─── API Error ────────────────────────────────────────────────────────────────

export interface ApiError {
  message: string;
  status?: number;
}