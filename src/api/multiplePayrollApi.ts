import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";
import { ERP_BASE } from "../config/api";

const api = createAxiosInstance(ERP_BASE);

export interface MultiplePayrollRequest {
  salary_structure?: string;
  start_date: string;
  end_date: string;
}

export interface MultiplePayrollResponse {
  message: string;
  payroll_entries?: any[];
  status?: string;
}

export const createMultipleEmployeesPayroll = async (
  data: MultiplePayrollRequest,
): Promise<MultiplePayrollResponse> => {
  try {
    const url =
      "/api/method/payroll_rola_izyane.api.payroll_entry.api.create_multiple_employees_payroll";
    const response: AxiosResponse = await api.post(url, data);
    return response.data?.data ?? response.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to create multiple employees payroll",
    );
  }
};
