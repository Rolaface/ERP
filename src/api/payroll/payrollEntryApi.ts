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
    `${API.payroll.payrollentry.createpayrollentry}?fields=["name","company","posting_date","status","branch","currency","payroll_frequency"]&limit_start=${start}&limit_page_length=${pageSize}`,
  );

  return {
    data: resp.data?.data || [],
  };
}
export async function runPayrollEntry(
  id: string,
): Promise<any> {
  const resp: AxiosResponse = await api.post(
    API.payroll.payrollentry.runpayroll,
    {
      id,
    },
  );

  return resp.data;
}