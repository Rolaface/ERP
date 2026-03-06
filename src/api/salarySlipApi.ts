import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";
import { API, ERP_BASE } from "../config/api";

const api = createAxiosInstance(ERP_BASE);

export type SalarySlipListItem = {
  name: string;
  employee: string;
  salary_structure: string;
  start_date: string;
  end_date: string;
  status: string;
  total_earnings: number;
  total_deduction: number;
  net_pay: number;
  referenceNumber?: string;
};

export type SalarySlipListResponse = {
  salary_slips: SalarySlipListItem[];
  pagination?: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
};

type ApiEnvelope<T> = {
  status_code?: number;
  status?: string;
  message?: string;
  data?: T;
};

type PaginatedRecords<T> = {
  records?: T[];
  salary_slips?: T[];
  pagination?: SalarySlipListResponse["pagination"];
};

export type SalarySlipDetail = SalarySlipListItem & {
  employee_name?: string;
  company?: string;
  department?: string;
  posting_date?: string;
  payroll_entry?: string;
  currency?: string;
  exchange_rate?: number;
  gross_pay?: number;
  rounded_total?: number;
  total_in_words?: string;
  bank_name?: string;
  bank_account_no?: string;
  custom_reference_number?: string | null;
  custom_slip_url?: string | null;
  earnings?: { component: string; amount: number }[];
  deductions?: { component: string; amount: number }[];
  paySlipUrl?: string;
};

export async function getSalarySlips(params?: {
  employee?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  page_size?: number;
}): Promise<SalarySlipListResponse> {
  const url = API.payrollSetup.salarySlip.getAll;
  const resp: AxiosResponse = await api.get(url, {
    params: {
      employee: params?.employee ?? "",
      status: params?.status ?? "",
      start_date: params?.start_date ?? "",
      end_date: params?.end_date ?? "",
      page: params?.page,
      page_size: params?.page_size,
    },
  });

  const raw = resp.data?.data ?? resp.data;

  // Case 1: already normalized
  if (raw && Array.isArray(raw.salary_slips)) {
    return {
      salary_slips: raw.salary_slips,
      pagination: raw.pagination,
    };
  }

  // Case 2: envelope -> data -> records
  const env = raw as ApiEnvelope<PaginatedRecords<SalarySlipListItem>>;
  const rowsFromEnv = env?.data?.salary_slips ?? env?.data?.records;
  if (Array.isArray(rowsFromEnv)) {
    return {
      salary_slips: rowsFromEnv,
      pagination: env?.data?.pagination,
    };
  }

  // Case 3: data directly contains records
  const pr = raw as PaginatedRecords<SalarySlipListItem>;
  const rows = pr?.salary_slips ?? pr?.records;
  if (Array.isArray(rows)) {
    return {
      salary_slips: rows,
      pagination: pr?.pagination,
    };
  }

  return { salary_slips: [], pagination: raw?.pagination };
}

export async function getSalarySlipById(
  salarySlipId: string,
): Promise<SalarySlipDetail | null> {
  const base = API.payrollSetup.salarySlip.getById;
  const url = `${base}?salarySlipId=${encodeURIComponent(salarySlipId)}`;
  const resp: AxiosResponse = await api.get(url);
  return (resp.data?.data ?? resp.data) || null;
}
