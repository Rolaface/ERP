// ─── leaveConfigApi.ts ───────────────────────────────────────────────────────
import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";
import { API, ERP_BASE } from "../config/api";

const api = createAxiosInstance(ERP_BASE);

// Using the API.leave object you defined in your config
const LEAVE_RESOURCE = API.leaveType;

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface FrappeDetailResponse<T> {
  data: T;
}

interface FrappeListResponse<T> {
  data: T[];
}

export interface LeaveType {
  /** Frappe resource name — same as leave_type_name on creation */
  name?: string;
  leave_type_name: string;
  max_leaves_allowed: number;
  is_lwp?: 0 | 1;
  is_carry_forward?: 0 | 1;
  allow_negative?: 0 | 1;
  include_holiday?: 0 | 1;
  fraction_of_daily_salary_per_leave?: number;
  
  // Additional fields based on Frappe GET response
  applicable_after?: number;
  max_continuous_days_allowed?: number;
  is_ppl?: 0 | 1;
  is_optional_leave?: 0 | 1;
  allow_over_allocation?: 0 | 1;
  is_compensatory?: 0 | 1;
  maximum_carry_forwarded_leaves?: number;
  expire_carry_forwarded_leaves_after_days?: number;
  allow_encashment?: 0 | 1;
  max_encashable_leaves?: number;
  non_encashable_leaves?: number;
  is_earned_leave?: 0 | 1;
  earned_leave_frequency?: string;
  allocate_on_day?: string;
  rounding?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// API METHODS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/resource/Leave Type
 * Gets all leave types.
 */
export async function getAllLeaveTypes(): Promise<LeaveType[]> {
  try {
    // FIX 1: Use FrappeListResponse because it returns an array.
    // FIX 2: Added fields=["*"] so Frappe returns the full objects, not just names.
    const resp: AxiosResponse<FrappeListResponse<LeaveType>> = await api.get(
      LEAVE_RESOURCE.getAll,
      { params: { fields: '["*"]', limit_page_length: 0 } }
    );

    return resp.data?.data || [];
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
        error?.message ||
        "Failed to fetch leave types",
    );
  }
}

/**
 * GET /api/resource/Leave Type/{name}
 * Gets a single leave type by name.
 */
export async function getLeaveTypeById(name: string): Promise<LeaveType> {
  try {
    // FIX 3: Use LEAVE_RESOURCE.getById instead of the whole object
    const url = `${LEAVE_RESOURCE.getById}/${encodeURIComponent(name)}`;
    const resp: AxiosResponse<FrappeDetailResponse<LeaveType>> = await api.get(url);
    
    return resp.data?.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
        error?.message ||
        "Failed to fetch leave type details",
    );
  }
}

/**
 * POST /api/resource/Leave Type
 * Creates a new leave type.
 */
export async function createLeaveType(
  payload: Omit<LeaveType, "name">,
): Promise<LeaveType> {
  try {
    console.log("LEAVE_RESOURCE",LEAVE_RESOURCE.create);
    const resp: AxiosResponse<FrappeDetailResponse<LeaveType>> =
    await api.post(LEAVE_RESOURCE.create, payload);
    return resp.data?.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
        error?.message ||
        "Failed to create leave type",
    );
  }
}

/**
 * PUT /api/resource/Leave Type/{name}
 * Updates an existing leave type.
 */
export async function updateLeaveType(
  name: string,
  payload: Partial<Omit<LeaveType, "name">>,
): Promise<LeaveType> {
  try {
    const url = `${LEAVE_RESOURCE.update}/${encodeURIComponent(name)}`;
    const resp: AxiosResponse<FrappeDetailResponse<LeaveType>> =
      await api.put(url, payload);

    return resp.data?.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
        error?.message ||
        "Failed to update leave type",
    );
  }
}

/**
 * DELETE /api/resource/Leave Type/{name}
 * Deletes a leave type.
 */
export async function deleteLeaveType(name: string): Promise<void> {
  try {
    const url = `${LEAVE_RESOURCE.delete}/${encodeURIComponent(name)}`;
    await api.delete(url);
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
        error?.message ||
        "Failed to delete leave type",
    );
  }
}