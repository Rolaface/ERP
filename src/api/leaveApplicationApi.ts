// ─── leaveApplicationApi.ts ──────────────────────────────────────────────────
import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";
import { API, ERP_BASE } from "../config/api";

const api = createAxiosInstance(ERP_BASE);

// Assuming API.leaveApplication is defined in your api config similarly to API.leaveType
// Endpoints usually map to "/api/resource/Leave Application"
const LEAVE_APP_RESOURCE = API.leaveApplication; 

interface FrappeDetailResponse<T> {
  data: T;
}

interface FrappeListResponse<T> {
  data: T[];
}

export interface LeaveApplication {
  name?: string;
  employee: string;
  leave_type: string;
  from_date: string; // Format: YYYY-MM-DD
  to_date: string; // Format: YYYY-MM-DD
  half_day?: 0 | 1;
  half_day_date?: string; // Required if half_day is 1
  total_leave_days?: number;
  description?: string;
  leave_approver?: string;
  leave_approver_name?: string;
  follow_via_email?: 0 | 1;
  posting_date?: string; // Format: YYYY-MM-DD
  status?: string; // e.g., Open, Approved, Rejected
}

export async function getAllLeaveApplications(
  filters?: any[][],
  limit_start: number = 0,
  limit_page_length: number = 10,
   search = ""
): Promise<LeaveApplication[]> {
  try {
    const resp: AxiosResponse<FrappeListResponse<LeaveApplication>> =
      await api.get(LEAVE_APP_RESOURCE.getAll, {
        params: {
          fields: '["*"]',
          // limit_page_length: 0,
          // filters: JSON.stringify(filters),
          limit_start: limit_start,
          limit_page_length: limit_page_length,
          filters: filters ? JSON.stringify(filters) : undefined,
          or_filters: search
            ? JSON.stringify([
                ["employee_name", "like", `%${search}%`],
                ["employee", "like", `%${search}%`],
                ["leave_type", "like", `%${search}%`],
                ["status", "like", `%${search}%`],
              ])
            : undefined,
        },
      });

    return resp.data?.data || [];
  } catch (error: any) {
    throw error;
  }
}
 
export async function getLeaveApplicationById(name: string, filters?: any[][]): Promise<LeaveApplication> {
  try {
    const url = `${LEAVE_APP_RESOURCE.getById}/${encodeURIComponent(name)}`;
    // const resp: AxiosResponse<FrappeDetailResponse<LeaveApplication>> = await api.get(url);
    const resp: AxiosResponse<FrappeDetailResponse<LeaveApplication>> =
      await api.get(url, {
        params: {
          filters: JSON.stringify(filters),
        },
      });
    
    return resp.data?.data;
  } catch (error: any) {
    throw error;
  }
}

/**
 * POST /api/resource/Leave Application
 * Creates a new leave application.
 */
export async function createLeaveApplication(
  payload: Omit<LeaveApplication, "name">,
): Promise<LeaveApplication> {
  try {
    console.log("LEAVE_APP_RESOURCE", LEAVE_APP_RESOURCE.create);
    const resp: AxiosResponse<FrappeDetailResponse<LeaveApplication>> =
      await api.post(LEAVE_APP_RESOURCE.create, payload);
      
    return resp.data?.data;
  } catch (error: any) {
    throw error;
  }
}

/**
 * PUT /api/resource/Leave Application/{name}
 * Updates an existing leave application.
 */
export async function updateLeaveApplication(
  name: string,
  payload: Partial<Omit<LeaveApplication, "name">>,
): Promise<LeaveApplication> {
  try {
    const url = `${LEAVE_APP_RESOURCE.update}/${encodeURIComponent(name)}`;
    const resp: AxiosResponse<FrappeDetailResponse<LeaveApplication>> =
      await api.put(url, payload);

    return resp.data?.data;
  } catch (error: any) {
    throw error;
  }
}

/**
 * DELETE /api/resource/Leave Application/{name}
 * Deletes a leave application.
 */
export async function deleteLeaveApplication(name: string): Promise<void> {
  try {
    const url = `${LEAVE_APP_RESOURCE.delete}/${encodeURIComponent(name)}`;
    await api.delete(url);
  } catch (error: any) {
    throw error;
  }
}


export async function getAllHolidayLists(year?: number): Promise<any[]> {
  try {
    const resp = await api.get(LEAVE_APP_RESOURCE.getAllHolidayList, {
      params: { year },
    });
    return resp.data?.data || [];
  } catch (error) {
    throw error;
  }
}