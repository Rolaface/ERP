import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";
import { ERP_BASE } from "../config/api";

const api = createAxiosInstance(ERP_BASE);

export type AttendanceRecord = {
  name: string;
  employee: string;
  employee_name?: string;
  attendance_date: string;
  status: string;
  working_hours?: number;
  isWorking?: boolean;
};

export type Pagination = {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
};

export type AttendanceListResponse = {
  pagination: Pagination;
  records: AttendanceRecord[];
};

type ApiEnvelope<T> = {
  status_code?: number;
  status?: string;
  message?: string;
  data?: T;
};

export async function getAllAttendance(params: {
  page: number;
  page_size: number;
  employee?: string;
  from_date?: string;
  to_date?: string;
}): Promise<AttendanceListResponse> {
  const resp: AxiosResponse = await api.get(
    "/api/method/payroll_rola_izyane.api.attendance.api.get_all_attendance",
    {
      params: {
        page: params.page,
        page_size: params.page_size,
        employee: params.employee ?? "",
        from_date: params.from_date ?? "",
        to_date: params.to_date ?? "",
      },
    },
  );

  const raw = resp.data?.data ?? resp.data;
  const data = (raw?.data ?? raw) as AttendanceListResponse;

  return {
    pagination: data?.pagination || {
      page: params.page,
      page_size: params.page_size,
      total: Array.isArray(data?.records) ? data.records.length : 0,
      total_pages: 1,
      has_next: false,
      has_prev: false,
    },
    records: Array.isArray(data?.records) ? data.records : [],
  };
}

export async function getAttendanceById(
  attendanceId: string,
): Promise<AttendanceRecord | null> {
  const resp: AxiosResponse = await api.get(
    "/api/method/payroll_rola_izyane.api.attendance.api.get_attendance_by_id",
    { params: { attendanceId } },
  );

  const raw = resp.data?.data ?? resp.data;
  const data = raw?.data ?? raw;
  return (data?.record ?? data ?? null) as AttendanceRecord | null;
}

export async function checkinAndMarkAttendance(payload: {
  employee: string;
  log_type: "IN" | "OUT";
}): Promise<any> {
  const resp: AxiosResponse = await api.post(
    "/api/method/payroll_rola_izyane.api.attendance.api.checkin_and_mark_attendance",
    payload,
  );

  return resp.data?.data ?? resp.data;
}

export type AttendanceHistorySummary = {
  total_days: number;
  present_count: number;
  absent_count: number;
  total_working_hours: number;
  total_live_working_hours: number;
};

export type AttendanceHistoryResponse = {
  employee: string;
  filter: string;
  from_date: string;
  to_date: string;
  page: number;
  page_size: number;
  total_records: number;
  summary: AttendanceHistorySummary;
  records: AttendanceRecord[];
};

export async function getEmployeeAttendanceHistory(params: {
  employee: string;
  filter?: string;
  page?: number;
  page_size?: number;
}): Promise<AttendanceHistoryResponse> {
  const resp: AxiosResponse = await api.get(
    "/api/method/payroll_rola_izyane.api.attendance.api.get_employee_attendance_history",
    {
      params: {
        employee: params.employee,
        filter: params.filter ?? "year",
        page: params.page ?? 1,
        page_size: params.page_size ?? 20,
      },
    },
  );

  const raw = resp.data?.data ?? resp.data;
  const data = (raw?.data ?? raw) as AttendanceHistoryResponse;

  return {
    employee: String(data?.employee ?? params.employee),
    filter: String(data?.filter ?? params.filter ?? "year"),
    from_date: String(data?.from_date ?? ""),
    to_date: String(data?.to_date ?? ""),
    page: Number(data?.page ?? 1),
    page_size: Number(data?.page_size ?? 20),
    total_records: Number(data?.total_records ?? 0),
    summary: {
      total_days: Number(data?.summary?.total_days ?? 0),
      present_count: Number(data?.summary?.present_count ?? 0),
      absent_count: Number(data?.summary?.absent_count ?? 0),
      total_working_hours: Number(data?.summary?.total_working_hours ?? 0),
      total_live_working_hours: Number(
        data?.summary?.total_live_working_hours ?? 0,
      ),
    },
    records: Array.isArray(data?.records) ? data.records : [],
  };
}
