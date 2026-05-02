// ─── leaveConfigApi.ts ───────────────────────────────────────────────────────
import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";
import { API, ERP_BASE } from "../config/api";

const api = createAxiosInstance(ERP_BASE);

// Using the API.leave object you defined in your config
const LEAVE_RESOURCE = API.leaveType;
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
    const resp: AxiosResponse<FrappeListResponse<LeaveType>> = await api.get(
      LEAVE_RESOURCE.getAll,
      { params: { fields: '["*"]', limit_page_length: 0 } }
    );

    return resp.data?.data || [];
  }catch (error: any) {
    throw error;
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
  }catch (error: any) {
    throw error;
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
  // } catch (error: any) {
  //   throw new Error(
  //     error?.response?.data?.message ||
  //       error?.message ||
  //       "Failed to create leave type",
  //   );
  // }
  }catch (error: any) {
    throw error;
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
  }catch (error: any) {
    throw error;
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
  }catch (error: any) {
    throw error;
  }
}

// ─── Append to leaveConfigApi.ts ──────────────────────────────────────────────

// Define the resource path for Leave Period. (Add this near the top with LEAVE_RESOURCE)
const LEAVE_PERIOD_RESOURCE = {
  getAll: "/api/resource/Leave Period",
  getById: "/api/resource/Leave Period",
  create: "/api/resource/Leave Period",
  update: "/api/resource/Leave Period",
  delete: "/api/resource/Leave Period",
};

export interface LeavePeriod {
  name: string;
  from_date: string;
  to_date: string;
  is_active: 0 | 1;
}

/**
 * GET /api/resource/Leave Period
 * Gets all leave periods.
 */
export async function getAllLeavePeriods(): Promise<LeavePeriod[]> {
  try {
    const resp: AxiosResponse<FrappeListResponse<LeavePeriod>> = await api.get(
      LEAVE_PERIOD_RESOURCE.getAll,
      { params: { fields: '["*"]', limit_page_length: 0 } }
    );
    return resp.data?.data || [];
  }catch (error: any) {
    throw error;
  }
}

/**
 * GET /api/resource/Leave Period/{name}
 * Gets a single leave period by name.
 */
export async function getLeavePeriodById(name: string): Promise<LeavePeriod> {
  try {
    const url = `${LEAVE_PERIOD_RESOURCE.getById}/${encodeURIComponent(name)}`;
    const resp: AxiosResponse<FrappeDetailResponse<LeavePeriod>> = await api.get(url);
    return resp.data?.data;
  }catch (error: any) {
    throw error;
  }
}

/**
 * POST /api/resource/Leave Period
 * Creates a new leave period.
 */
export async function createLeavePeriod(payload: LeavePeriod): Promise<LeavePeriod> {
  try {
    const resp: AxiosResponse<FrappeDetailResponse<LeavePeriod>> = await api.post(
      LEAVE_PERIOD_RESOURCE.create,
      payload
    );
    return resp.data?.data;
  // } catch (error: any) {
  //   throw new Error(
  //     error?.response?.data?.message ||
  //       error?.message ||
  //       "Failed to create leave period",
  //   );
  // }
   }catch (error: any) {
    throw error;
  }
}

/**
 * PUT /api/resource/Leave Period/{name}
 * Updates an existing leave period.
 */
export async function updateLeavePeriod(
  name: string,
  payload: Partial<Omit<LeavePeriod, "name">>
): Promise<LeavePeriod> {
  try {
    const url = `${LEAVE_PERIOD_RESOURCE.update}/${encodeURIComponent(name)}`;
    const resp: AxiosResponse<FrappeDetailResponse<LeavePeriod>> = await api.put(
      url,
      payload
    );
    return resp.data?.data;
  // } catch (error: any) {
  //   throw new Error(
  //     error?.response?.data?.message ||
  //       error?.message ||
  //       "Failed to update leave period",
  //   );
  // }
   }catch (error: any) {
    throw error;
  }
}

/**
 * DELETE /api/resource/Leave Period/{name}
 * Deletes a leave period.
 */
export async function deleteLeavePeriod(name: string): Promise<void> {
  try {
    const url = `${LEAVE_PERIOD_RESOURCE.delete}/${encodeURIComponent(name)}`;
    await api.delete(url);
   }catch (error: any) {
    throw error;
  }
}

// ─── Append to leaveConfigApi.ts ──────────────────────────────────────────────

const LEAVE_POLICY_RESOURCE = {
  getAll: "/api/resource/Leave Policy",
  getById: "/api/resource/Leave Policy",
  create: "/api/resource/Leave Policy",
  update: "/api/resource/Leave Policy",
  delete: "/api/resource/Leave Policy",
};

export interface LeavePolicyDetail {
  name?: string; // Auto-generated by Frappe
  leave_type: string;
  annual_allocation: number;
}
export interface LeavePolicy {
  name?: string;
  title: string;
  leave_policy_details: LeavePolicyDetail[];
  docstatus?: 0 | 1 | 2; 
}

/**
 * GET /api/resource/Leave Policy
 */
export async function getAllLeavePolicies(): Promise<LeavePolicy[]> {
  try {
    const resp: AxiosResponse<FrappeListResponse<LeavePolicy>> = await api.get(
      LEAVE_POLICY_RESOURCE.getAll,
      { params: { fields: '["*"]', limit_page_length: 0 } }
    );
    return resp.data?.data || [];
  }catch (error: any) {
    throw error;
  }
}

/**
 * GET /api/resource/Leave Policy/{name}
 */
export async function getLeavePolicyById(name: string): Promise<LeavePolicy> {
  try {
    const url = `${LEAVE_POLICY_RESOURCE.getById}/${encodeURIComponent(name)}`;
    const resp: AxiosResponse<FrappeDetailResponse<LeavePolicy>> = await api.get(url);
    return resp.data?.data;
  }catch (error: any) {
    throw error;
  }
}

/**
 * POST /api/resource/Leave Policy
 */
export async function createLeavePolicy(payload: LeavePolicy): Promise<LeavePolicy> {
  try {
    const resp: AxiosResponse<FrappeDetailResponse<LeavePolicy>> = await api.post(
      LEAVE_POLICY_RESOURCE.create,
      payload
    );
    return resp.data?.data;
  }catch (error: any) {
    throw error;
  }
}

/**
 * PUT /api/resource/Leave Policy/{name}
 */
export async function updateLeavePolicy(
  name: string,
  payload: Partial<LeavePolicy>
): Promise<LeavePolicy> {
  try {
    const url = `${LEAVE_POLICY_RESOURCE.update}/${encodeURIComponent(name)}`;
    const resp: AxiosResponse<FrappeDetailResponse<LeavePolicy>> = await api.put(
      url,
      payload
    );
    return resp.data?.data;
  }catch (error: any) {
    throw error;
  }
}

/**
 * DELETE /api/resource/Leave Policy/{name}
 */
export async function deleteLeavePolicy(name: string): Promise<void> {
  try {
    const url = `${LEAVE_POLICY_RESOURCE.delete}/${encodeURIComponent(name)}`;
    await api.delete(url);
 }catch (error: any) {
    throw error;
  }
}

// ─── Append to leaveConfigApi.ts ──────────────────────────────────────────────

const LEAVE_POLICY_ASSIGNMENT_RESOURCE = {
  getAll: "/api/resource/Leave Policy Assignment",
  getById: "/api/resource/Leave Policy Assignment",
  create: "/api/resource/Leave Policy Assignment",
  update: "/api/resource/Leave Policy Assignment",
  delete: "/api/resource/Leave Policy Assignment",
};

export interface LeavePolicyAssignment {
  name?: string;
  employee: string;
  leave_policy: string;
  assignment_based_on: "Leave Period" | "Joining Date";
  leave_period?: string;
  carry_forward?: 0 | 1;
  docstatus?: 0 | 1 | 2; // 0 = Draft, 1 = Submitted, 2 = Cancelled
}

/**
 * GET /api/resource/Leave Policy Assignment
 */
export async function getAllLeavePolicyAssignments(): Promise<LeavePolicyAssignment[]> {
  try {
    const resp: AxiosResponse<FrappeListResponse<LeavePolicyAssignment>> = await api.get(
      LEAVE_POLICY_ASSIGNMENT_RESOURCE.getAll,
      { params: { fields: '["*"]', limit_page_length: 0 } }
    );
    return resp.data?.data || [];
  }catch (error: any) {
    throw error;
  }
}

/**
 * GET /api/resource/Leave Policy Assignment/{name}
 */
export async function getLeavePolicyAssignmentById(name: string): Promise<LeavePolicyAssignment> {
  try {
    const url = `${LEAVE_POLICY_ASSIGNMENT_RESOURCE.getById}/${encodeURIComponent(name)}`;
    const resp: AxiosResponse<FrappeDetailResponse<LeavePolicyAssignment>> = await api.get(url);
    return resp.data?.data;
  }catch (error: any) {
    throw error;
  }
}

/**
 * POST /api/resource/Leave Policy Assignment
 */
export async function createLeavePolicyAssignment(
  payload: LeavePolicyAssignment
): Promise<LeavePolicyAssignment> {
  try {
    const resp: AxiosResponse<FrappeDetailResponse<LeavePolicyAssignment>> = await api.post(
      LEAVE_POLICY_ASSIGNMENT_RESOURCE.create,
      payload
    );
    return resp.data?.data;
  }catch (error: any) {
    throw error;
  }
}

/**
 * PUT /api/resource/Leave Policy Assignment/{name}
 */
export async function updateLeavePolicyAssignment(
  name: string,
  payload: Partial<LeavePolicyAssignment>
): Promise<LeavePolicyAssignment> {
  try {
    const url = `${LEAVE_POLICY_ASSIGNMENT_RESOURCE.update}/${encodeURIComponent(name)}`;
    const resp: AxiosResponse<FrappeDetailResponse<LeavePolicyAssignment>> = await api.put(
      url,
      payload
    );
    return resp.data?.data;
  }catch (error: any) {
    throw error;
  }
}

/**
 * DELETE /api/resource/Leave Policy Assignment/{name}
 */
export async function deleteLeavePolicyAssignment(name: string): Promise<void> {
  try {
    const url = `${LEAVE_POLICY_ASSIGNMENT_RESOURCE.delete}/${encodeURIComponent(name)}`;
    await api.delete(url);
  }catch (error: any) {
    throw error;
  }
}