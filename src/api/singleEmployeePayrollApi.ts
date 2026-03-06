import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";
import { API, ERP_BASE } from "../config/api";

const api = createAxiosInstance(ERP_BASE);

export type SingleEmployeePayrollPayload = {
  employee: string;
  company: string;
  payroll_name?: string;
  posting_date?: string;
  start_date: string;
  end_date: string;
  payroll_type: string;
  currency: string;
  exchange_rate: number;
  payroll_payable_account: string;
};

export async function runSingleEmployeePayroll(
  payload: SingleEmployeePayrollPayload,
): Promise<any> {
  const url = API.payrolls.singleEmployeePayroll;
  const resp: AxiosResponse = await api.post(url, payload);
  return resp.data?.data ?? resp.data;
}
