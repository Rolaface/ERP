import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "../axiosInstance";
import { API, ERP_BASE } from "../../config/api";

const api = createAxiosInstance(ERP_BASE);

export interface CreatePayrollEntryPayload {
  payroll_frequency: string;
  posting_date: string;
  start_date: string;
  end_date: string;
  exchange_rate: number;

  payroll_payable_account: string;
  payment_account: string;
  bank_account: string;

  employees: Array<{
    employee: string;
    is_salary_withheld: 0 | 1;
  }>;

  cost_center?: string;
  project?: string;
  currency?: string;

  deduct_tax_for_unsubmitted_tax_exemption_proof?: 0 | 1;
  salary_slip_based_on_timesheet?: 0 | 1;

  validate_attendance?: 0 | 1;
  validate_holidays?: 0 | 1;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PayrollEmployeeDetail {
  name: string;
  idx: number;
  employee: string;
  employee_name: string;
  department: string;
  designation: string;
  is_salary_withheld: 0 | 1;
  parent: string;
}

export interface PayrollEntryDetail {
  name: string;
  posting_date: string;

  company: string;

  currency: string;
  exchange_rate: number;

  payroll_payable_account: string;
  payment_account?: string;
  bank_account?: string;

  status: string;

  salary_slip_based_on_timesheet: 0 | 1;

  payroll_frequency: string;

  start_date: string;
  end_date: string;

  deduct_tax_for_unsubmitted_tax_exemption_proof: 0 | 1;

  validate_attendance?: 0 | 1;
  validate_holidays?: 0 | 1;

  number_of_employees: number;

  salary_slips_created: number;
  salary_slips_submitted: number;

  error_message?: string;

  cost_center?: string;
  project?: string;

  employees: PayrollEmployeeDetail[];
}

// ─── Verification / Preview types ─────────────────────────────────────────────

/** One earning or deduction line item inside a salary slip */
export interface VerificationSalaryComponent {
  salary_component: string;
  abbr: string;
  amount: number;
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
  [key: string]: unknown;
}

/** Salary slip details nested inside each employee entry */
export interface VerificationSalarySlipDetails {
  name?: string | null;
  employee: string;
  employee_name: string;
  /** "Preview" for normal employees, "Error" when calculation failed */
  status: "Preview" | "Error" | "Draft" | "Submitted" | string;
  error_message?: string | null;

  // Identity
  company?: string;
  department?: string;
  designation?: string;
  branch?: string | null;
  salary_structure?: string;
  payroll_entry?: string;

  // Payment
  mode_of_payment?: string;
  bank_name?: string | null;
  /** null → bank not configured; any string → verified */
  bank_account_no?: string | null;

  // Period
  posting_date?: string;
  start_date?: string;
  end_date?: string;
  payroll_frequency?: string;
  currency?: string;

  // Attendance
  total_working_days?: number;
  payment_days?: number;
  leave_without_pay?: number;
  absent_days?: number;
  unmarked_days?: number;

  // Financials
  gross_pay?: number;
  base_gross_pay?: number;
  total_deduction?: number;
  net_pay?: number;
  rounded_total?: number;
  net_payable?: number;
  ctc?: number;
  annual_taxable_amount?: number;
  current_month_income_tax?: number;
  total_income_tax?: number;
  total_in_words?: string;

  // Dynamic arrays — columns built from these at render time
  earnings?: VerificationSalaryComponent[];
  deductions?: VerificationSalaryComponent[];

  [key: string]: unknown;
}

/** One employee entry in the verification response */
export interface VerificationEmployeeEntry {
  employee: string;
  employee_name: string;
  department: string;
  designation: string;
  salary_slip_details: VerificationSalarySlipDetails;
}

/** financial_summary block */
export interface VerificationFinancialSummary {
  total_gross_payable: number;
  total_net_payable: number;
  total_deduction: number;
  employee_count: number;
  calculation_method?: string;
}

/** Top-level data object returned by the verification endpoint */
export interface PayrollVerificationData {
  name: string;
  docstatus: number;
  posting_date: string;
  company: string;
  currency: string;
  exchange_rate: number;
  payroll_payable_account: string;
  status: string;
  payroll_frequency: string;
  start_date: string;
  end_date: string;
  cost_center?: string | null;
  payment_account: string;
  bank_account: string;
  number_of_employees: number;
  validate_attendance: number;
  financial_summary: VerificationFinancialSummary;
  employees: VerificationEmployeeEntry[];
  last_error?: string | null;
  [key: string]: unknown;
}

// ─── Functions ────────────────────────────────────────────────────────────────

export async function createPayrollEntry(
  payload: CreatePayrollEntryPayload,
): Promise<any> {
  const resp: AxiosResponse = await api.post(
    API.payroll.payrollentry.createpayrollentry,
    payload,
  );

  return resp.data?.data || resp.data;
}

export async function getAllPayrollEntries(
  page = 1,
  pageSize = 20,
  search = "",
): Promise<any> {
  const queryParams = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });

  if (search.trim()) {
    queryParams.append("search", search);
  }

  const resp: AxiosResponse = await api.get(
    `${API.payroll.payrollentry.getPayrollEntryList}?${queryParams.toString()}`,
  );

  return {
    data: resp.data?.data || [],
    pagination: resp.data?.pagination || {},
  };
}

export async function runPayrollEntry(id: string): Promise<any> {
  const resp: AxiosResponse = await api.post(
    API.payroll.payrollentry.runpayroll,
    { id },
  );

  return resp.data;
}

export async function getPayrollEntryDetail(
  id: string,
): Promise<PayrollEntryDetail> {
  const resp: AxiosResponse = await api.get(
    `${API.payroll.payrollentry.createpayrollentry}/${id}`,
  );

  return resp.data?.data;
}

/**
 * Fetches the full payroll entry detail — including per-employee salary slip
 * previews with dynamic earnings/deductions arrays — used by the
 * PayrollVerificationModal.
 *
 * Endpoint: API.payroll.payrollentry.verificationDetail
 * (add this key to your API config, pointing at your verification endpoint)
 *
 * @param payrollId  e.g. "HR-PRUN-2026-00033"
 */
export async function getPayrollVerificationDetail(
  payrollId: string,
): Promise<PayrollVerificationData> {
  const resp: AxiosResponse = await api.get(
   `${API.payroll.payrollentry.getpayrollpreview}?id=${encodeURIComponent(payrollId)}`,
  );

  return resp.data?.message?.data;
}

// TODO: Uncomment once Salary Slip API is ready
// export async function getSalarySlipsForEntry(
//   payrollEntryId: string,
// ): Promise<SalarySlip[]> {
//   ...
// }

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

// ─── Salary Slip ──────────────────────────────────────────────────────────────

export interface SalarySlip {
  name: string;

  // ── Employee ──
  employee: string;
  employee_name: string;
  department: string;
  designation: string;

  // ── Company / meta ──
  company: string;
  posting_date: string;
  status: string;
  salary_structure: string;
  payroll_entry: string;
  current_payroll_period?: string;

  // ── Period ──
  start_date: string;
  end_date: string;
  payroll_frequency: string;
  mode_of_payment: string;

  // ── Currency ──
  currency: string;
  exchange_rate: number;

  // ── Attendance ──
  total_working_days: number;
  payment_days: number;
  leave_without_pay: number;
  absent_days: number;
  unmarked_days: number;

  // ── Gross / net ──
  gross_pay: number;
  base_gross_pay: number;
  net_pay: number;
  base_net_pay: number;
  rounded_total: number;
  base_rounded_total: number;

  // ── Deductions ──
  total_deduction: number;
  base_total_deduction: number;

  // ── Earnings totals ──
  total_earnings: number;

  // ── YTD / MTD ──
  gross_year_to_date: number;
  base_gross_year_to_date: number;
  year_to_date: number;
  base_year_to_date: number;
  month_to_date: number;
  base_month_to_date: number;

  // ── Amount in words ──
  total_in_words: string;
  base_total_in_words: string;

  // ── CTC ──
  ctc: number;

  // ── Tax ──
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

  // ── Timesheet ──
  salary_slip_based_on_timesheet: 0 | 1;
  deduct_tax_for_unsubmitted_tax_exemption_proof: 0 | 1;
  total_working_hours: number;
  hour_rate: number;
  base_hour_rate: number;

  // ── Line items ──
  earnings: SalaryDetail[];
  deductions: SalaryDetail[];
  timesheets: unknown[];
  accrued_benefits: unknown[];
  leave_details: unknown[];
}

export async function getSalarySlipsByEmployee(
  payrollEntryId: string,
  employeeId: string,
): Promise<
  Pick<
    SalarySlip,
    "name" | "employee" | "status" | "posting_date" | "payroll_entry"
  >[]
> {
  const filters = JSON.stringify([
    ["payroll_entry", "=", payrollEntryId],
    ["employee", "=", employeeId],
  ]);

  const fields = JSON.stringify([
    "name",
    "employee",
    "status",
    "posting_date",
    "payroll_entry",
  ]);

  const resp: AxiosResponse = await api.get(
    `${API.payroll.payrollentry.salaryslip}?filters=${filters}&fields=${fields}&order_by=posting_date desc`,
  );

  return resp.data?.data || [];
}

export async function updatePayrollEntry(
  id: string,
  payload: CreatePayrollEntryPayload,
): Promise<any> {
  const resp: AxiosResponse = await api.put(
    `${API.payroll.payrollentry.createpayrollentry}/${id}`,
    payload,
  );

  if (resp.data?.success === false) {
    throw new Error(resp.data?.message || "Failed to update payroll");
  }

  return resp.data?.data || resp.data;
}

export async function deletePayrollEntry(id: string): Promise<any> {
  const resp: AxiosResponse = await api.delete(
    `${API.payroll.payrollentry.createpayrollentry}/${id}`,
  );

  if (resp.data?.success === false) {
    throw new Error(resp.data?.message || "Failed to delete payroll");
  }

  return resp.data?.data || resp.data;
}

export async function getSalarySlipDetail(name: string): Promise<SalarySlip> {
  const resp: AxiosResponse = await api.get(
    `/api/resource/Salary Slip/${encodeURIComponent(name)}`,
  );

  return resp.data?.data;
}

export async function getSalarySlipPdf(
  name: string,
  doctype: string = "Salary Slip",
): Promise<Blob> {
  const resp: AxiosResponse = await api.get(
    `${API.payroll.payrollentry.salaryslip_pdf}`,
    {
      params: { name, doctype },
      responseType: "blob",
    },
  );

  return resp.data;
}

export function viewSalarySlipPdf(blob: Blob): void {
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export function downloadSalarySlipPdf(blob: Blob, filename?: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename ?? `salary-slip.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

const SLIP_FIELDS = [
  "name", "employee", "employee_name", "status",
  "posting_date", "start_date", "end_date",
  "gross_pay", "net_pay", "currency", "total_income_tax", "total_deduction",
];

export async function getSalarySlipsByEmployeeOnly(
  employeeId: string,
  params?: string,
  extraFilters?: [string, string, string][],
): Promise<{ data: SalarySlip[]; total: number }> {
  try {
    const filters = JSON.stringify([
      ["employee", "=", employeeId],
      ...(extraFilters ?? []),
    ]);

    const base = `${API.payroll.payrollentry.salaryslip}?filters=${filters}`;
    const url = params
      ? `${base}&${params}`
      : `${base}&fields=${JSON.stringify(SLIP_FIELDS)}&order_by=posting_date desc&limit_page_length=0`;

    const resp: AxiosResponse = await api.get(url);

    return {
      data: resp.data?.data ?? [],
      total:
        resp.data?.pagination?.total_count ??
        resp.data?.data?.length ??
        0,
    };
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
        error?.message ||
        "Failed to fetch salary slips",
    );
  }
}
