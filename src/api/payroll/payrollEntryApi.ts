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

export interface SalarySlip {
  name: string;

  employee: string;
  employee_name: string;

  company: string;
  posting_date: string;

  status: string;
  salary_structure: string;

  gross_pay: number;
  total_deduction: number;
  net_pay: number;

  total_earnings: number;

  ctc: number;

  annual_taxable_amount: number;
  current_month_income_tax: number;
  total_income_tax: number;

  currency: string;
}

export async function getSalarySlipsByEmployee(
  employeeId: string,
): Promise<SalarySlip[]> {
  const filters = JSON.stringify([["employee", "=", employeeId]]);

  const fields = JSON.stringify([
    "name",

    "employee",
    "employee_name",

    "company",
    "posting_date",

    "status",
    "salary_structure",

    "gross_pay",
    "total_deduction",
    "net_pay",

    "total_earnings",

    "ctc",

    "annual_taxable_amount",
    "current_month_income_tax",
    "total_income_tax",

    "currency",
  ]);

  const resp: AxiosResponse = await api.get(
    `${API.payroll.payrollentry.salaryslip}?filters=${filters}&fields=${fields}`,
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
