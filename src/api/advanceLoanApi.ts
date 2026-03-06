import { createAxiosInstance } from "./axiosInstance";
import { ERP_BASE } from "../config/api";

const api = createAxiosInstance(ERP_BASE);

interface ApiEnvelope<T> {
  status_code?: number;
  status?: string;
  message?: string;
  data?: T;
}

interface PaginatedRecords<T> {
  pagination?: {
    page?: number;
    page_size?: number;
    total?: number;
    total_pages?: number;
    has_next?: boolean;
    has_prev?: boolean;
  };
  records?: T[];
}

export type AdvancesPagination = NonNullable<
  PaginatedRecords<unknown>["pagination"]
>;

export type EmployeeAdvancesPage = {
  records: EmployeeAdvanceRecord[];
  pagination: AdvancesPagination;
};

export interface EmployeeAdvanceRecord {
  name?: string;
  employee: string;
  employee_name?: string;
  company?: string;
  department: string;
  posting_date?: string;
  advance_amount: number;
  paid_amount?: number;
  pending_amount?: number;
  status?: string;
}

export interface EmployeeAdvanceDetail {
  id?: string;
  name?: string;
  employee: string;
  employee_name?: string;
  company?: string;
  department: string;
  posting_date?: string;
  advance_amount: number;
  paid_amount?: number;
  pending_amount?: number;
  claimed_amount?: number;
  return_amount?: number;
  status?: string;
  purpose?: string;
  repay_unclaimed_amount_from_salary?: number;
}

export interface CreateEmployeeAdvancePayload {
  employee: string;
  department: string;
  advance_amount: number;
  purpose: string;
  repay_unclaimed_amount_from_salary: number;
}

/**
 * Fetches all employee advance records.
 */
export const getEmployeeAdvancesPaged = async (params?: {
  page?: number;
  page_size?: number;
}): Promise<EmployeeAdvancesPage> => {
  try {
    const res = await api.get<
      ApiEnvelope<PaginatedRecords<EmployeeAdvanceRecord>>
    >(
      "/api/method/payroll_rola_izyane.api.salary_advance.api.get_employee_advances",
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

    const rows = envelope?.data?.records;
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
    console.error("Error fetching employee advances:", error);
    throw error;
  }
};

/**
 * Backward-compatible list fetch.
 */
export const getEmployeeAdvances = async (): Promise<
  EmployeeAdvanceRecord[]
> => {
  const res = await getEmployeeAdvancesPaged({ page: 1, page_size: 1000 });
  return res.records;
};

export const getEmployeeAdvanceById = async (
  name: string,
): Promise<EmployeeAdvanceDetail | null> => {
  try {
    const res = await api.get<ApiEnvelope<EmployeeAdvanceDetail>>(
      "/api/method/payroll_rola_izyane.api.salary_advance.api.get_employee_advance_by_id",
      {
        params: { name },
      },
    );
    const envelope = res.data;
    if (String(envelope?.status ?? "").toLowerCase() !== "success") return null;
    return envelope?.data ?? null;
  } catch (error) {
    console.error("Error fetching employee advance by id:", error);
    throw error;
  }
};

/**
 * Creates a new employee advance request.
 *
 * @param payload - The data for the new advance request.
 */
export const createEmployeeAdvance = async (
  payload: CreateEmployeeAdvancePayload,
): Promise<EmployeeAdvanceDetail | null> => {
  try {
    const res = await api.post<ApiEnvelope<EmployeeAdvanceDetail>>(
      "/api/method/payroll_rola_izyane.api.salary_advance.api.create_employee_advance",
      payload,
    );
    const envelope = res.data;
    if (String(envelope?.status ?? "").toLowerCase() !== "success") return null;
    return envelope?.data ?? null;
  } catch (error) {
    console.error("Error creating employee advance:", error);
    throw error;
  }
};
