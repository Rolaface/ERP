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
): Promise<any> {
  const start = (page - 1) * pageSize;

  const resp: AxiosResponse = await api.get(
    `${API.payroll.payrollentry.createpayrollentry}?fields=["name","company","posting_date","status","branch","currency","payroll_frequency"]&with_pagination=1&limit_start=${start}&limit_page_length=${pageSize}&order_by=creation desc`,
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

// TODO: Uncomment once Salary Slip API is ready
// export async function getSalarySlipsForEntry(
//   payrollEntryId: string,
// ): Promise<SalarySlip[]> {
//   const filters = JSON.stringify([["payroll_entry", "=", payrollEntryId]]);
//   const fields = JSON.stringify([
//     "name",
//     "employee",
//     "employee_name",
//     "gross_pay",
//     "net_pay",
//     "status",
//     "start_date",
//     "end_date",
//   ]);
//   const resp: AxiosResponse = await api.get(
//     `/api/resource/Salary Slip?filters=${filters}&fields=${fields}`,
//   );
//   return resp.data?.data || [];
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
  employeeId: string,
): Promise<Pick<SalarySlip, "name" | "employee" | "status" | "posting_date">[]> {
  const filters = JSON.stringify([["employee", "=", employeeId]]);
  const fields = JSON.stringify(["name", "employee", "status", "posting_date"]);

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
  throw new Error(
    resp.data?.message || "Failed to update payroll",
  );
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
      params: {
        name,
        doctype,
      },
      responseType: "blob",
    },
  );

  return resp.data;
}

export function viewSalarySlipPdf(blob: Blob): void {
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");

  // Revoke after short delay to free memory
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