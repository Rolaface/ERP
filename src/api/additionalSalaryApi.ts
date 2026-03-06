import { createAxiosInstance } from "./axiosInstance";
import { ERP_BASE } from "../config/api";

const api = createAxiosInstance(ERP_BASE);

interface ApiEnvelope<T> {
  status_code?: number;
  status?: string;
  message?: string;
  data?: T;
}

interface PaginatedSalaries {
  salaries?: AdditionalSalaryRecord[];
  pagination?: {
    page?: number;
    page_size?: number;
    total?: number;
    total_pages?: number;
    has_next?: boolean;
    has_prev?: boolean;
  };
}

export type AdditionalSalaryPagination = NonNullable<
  PaginatedSalaries["pagination"]
>;

export type AdditionalSalaryPage = {
  records: AdditionalSalaryRecord[];
  pagination: AdditionalSalaryPagination;
};

export interface AdditionalSalaryRecord {
  name?: string;
  employee: string;
  employee_name?: string;
  department?: string;
  salary_component?: string;
  type?: string;
  amount: number;
  from_date?: string;
  to_date?: string;
  currency?: string;
  is_recurring?: number;
}

export interface AdditionalSalaryDetail {
  name?: string;
  employee: string;
  employee_name?: string;
  department?: string;
  salary_component?: string;
  type?: string;
  amount: number;
  from_date?: string;
  to_date?: string;
  currency?: string;
  is_recurring?: number;
}

export interface CreateAdditionalSalaryPayload {
  employee: string;
  from_date: string;
  to_date: string;
  salary_component: string;
  type: string;
  amount: number | string;
  is_recurring: number;
}

// Backward-compatible type aliases (old Advance/Loan names)
export type EmployeeAdvanceRecord = AdditionalSalaryRecord;
export type EmployeeAdvanceDetail = AdditionalSalaryDetail;
export type CreateEmployeeAdvancePayload = CreateAdditionalSalaryPayload;
export type EmployeeAdvancesPage = AdditionalSalaryPage;

/**
 * Fetches all additional salaries (paginated).
 */
export const getAdditionalSalariesPaged = async (params?: {
  page?: number;
  page_size?: number;
}): Promise<AdditionalSalaryPage> => {
  try {
    const res = await api.get<ApiEnvelope<PaginatedSalaries>>(
      "/api/method/payroll_rola_izyane.api.salary_advance.api.get_all_additional_salaries",
      { params },
    );
    const envelope = res.data;
    if (String(envelope?.status ?? "").toLowerCase() !== "success") {
      return {
        records: [],
        pagination: {
          page: Number(params?.page ?? 1) || 1,
          page_size: Number(params?.page_size ?? 10) || 10,
          total: 0,
          total_pages: 1,
          has_next: false,
          has_prev: false,
        },
      };
    }

    const rows = envelope?.data?.salaries;
    const pagination = envelope?.data?.pagination;
    const page = Number(pagination?.page ?? params?.page ?? 1) || 1;
    const page_size =
      Number(pagination?.page_size ?? params?.page_size ?? 10) || 10;
    const total = Number(pagination?.total ?? 0) || 0;
    const total_pages = Number(pagination?.total_pages ?? 1) || 1;

    return {
      records: Array.isArray(rows) ? rows : [],
      pagination: {
        page,
        page_size,
        total,
        total_pages,
        has_next: Boolean(pagination?.has_next ?? page < total_pages),
        has_prev: Boolean(pagination?.has_prev ?? page > 1),
      },
    };
  } catch (error) {
    console.error("Error fetching additional salaries:", error);
    throw error;
  }
};

/**
 * Backward-compatible list fetch.
 */
export const getAllAdditionalSalaries = async (): Promise<
  AdditionalSalaryRecord[]
> => {
  const res = await getAdditionalSalariesPaged({ page: 1, page_size: 1000 });
  return res.records;
};

/**
 * Fetches a single additional salary by its ID.
 */
export const getAdditionalSalaryById = async (
  id: string,
): Promise<AdditionalSalaryDetail | null> => {
  try {
    const res = await api.get<ApiEnvelope<AdditionalSalaryDetail>>(
      "/api/method/payroll_rola_izyane.api.salary_advance.api.get_additional_salary_by_id",
      { params: { id } },
    );
    const envelope = res.data;
    if (String(envelope?.status ?? "").toLowerCase() !== "success") return null;
    return envelope?.data ?? null;
  } catch (error) {
    console.error("Error fetching additional salary by id:", error);
    throw error;
  }
};

/**
 * Creates a new additional salary (Advance Payment / Loan).
 */
export const createAdditionalSalary = async (
  payload: CreateAdditionalSalaryPayload,
): Promise<AdditionalSalaryDetail | null> => {
  try {
    const res = await api.post<ApiEnvelope<AdditionalSalaryDetail>>(
      "/api/method/payroll_rola_izyane.api.salary_advance.api.create_employee_additional_salary",
      payload,
    );
    const envelope = res.data;
    if (String(envelope?.status ?? "").toLowerCase() !== "success") return null;
    return envelope?.data ?? null;
  } catch (error) {
    console.error("Error creating additional salary:", error);
    throw error;
  }
};

// Backward-compatible function exports (old Advance/Loan names)
export const getEmployeeAdvancesPaged = getAdditionalSalariesPaged;

export const getEmployeeAdvances = getAllAdditionalSalaries;

export const getEmployeeAdvanceById = getAdditionalSalaryById;

export const createEmployeeAdvance = createAdditionalSalary;
