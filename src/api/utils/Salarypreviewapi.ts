import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "../axiosInstance";
import { API, ERP_BASE } from "../../config/api";

const api = createAxiosInstance(ERP_BASE);
export const SalaryPreviewAPI = API.salaryPreviewAPI;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SalaryComponent {
  component: string;
  abbr: string;
  amount: number;
  default_amount: number;
  additional_amount: number;
  depends_on_payment_days: boolean;
  is_tax_applicable: boolean;
  do_not_include_in_total: boolean;
  exempted_from_income_tax: boolean;
}

export interface SalaryBreakdown {
  employee: string;
  employee_name: string;
  salary_structure: string;
  assignment: string;
  effective_date: string;
  slip_start_date: string;
  slip_end_date: string;
  base: number;
  variable: number;
  currency: string;
  payment_days: number;
  total_working_days: number;
  gross_pay: number;
  total_deduction: number;
  net_pay: number;
  rounded_total: number;
  earnings: SalaryComponent[];
  deductions: SalaryComponent[];
}

// ─── API Function ─────────────────────────────────────────────────────────────

export async function getSalaryBreakdown(
  employee: string,
  effectiveDate: string,
): Promise<SalaryBreakdown> {
  const params = new URLSearchParams();
  params.append("employee", employee);
  params.append("effective_date", effectiveDate);

  const resp: AxiosResponse = await api.get(
    `${SalaryPreviewAPI.getSalaryPreview}?${params.toString()}`,
  );

  const result = resp.data?.message;

  if (!result || result.status !== "success") {
    throw new Error(result?.message ?? "Failed to fetch salary breakdown.");
  }

  return result.data as SalaryBreakdown;
}