import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "../axiosInstance";
import { ERP_BASE, API } from "../../config/api";

const api = createAxiosInstance(ERP_BASE);
export const EmployeeDashboardAPI = API.EmployeeDashboard;

// ── TYPES ──────────────────────────────────────────────────────────────────────

export interface LeaveType {
  leaveType: string;
  allocated: number;
  used: number;
  remaining: number;
}

export interface LeaveBalance {
  asOfDate: string;
  totalAllocated: number;
  totalUsed: number;
  totalRemaining: number;
  leaveTypes: LeaveType[];
}

export interface Checkins {
  asofDate: string;
  inTime: string | null;
  outTime: string | null;
}

export interface EmployeeDetails {
  employeeId: string;
  employeeNumber: string | null;
  firstName: string;
  middleName: string;
  lastName: string;
  employeeName: string;
  profilePhoto: string | null;
  dateOfJoining: string;
  leaveApproverId: string;
  leaveApproverName: string;
  holidayList: string | null;
}

export interface ExpenseClaim {
  name: string;
  grand_total: number;
  approval_status: string;
  description: string;
}

export interface EmployeeDashboardData {
  employeeDetails: EmployeeDetails;
  leaveBalance: LeaveBalance;
  checkins: Checkins;
  expenseClaim?: ExpenseClaim[];
}

interface EmployeeDashboardResponse {
  status_code: number;
  status: string;
  message: string;
  data: EmployeeDashboardData;
}

// ── API FUNCTION ───────────────────────────────────────────────────────────────

export async function getEmployeeDashboardSummary(
  employeeId: string,
): Promise<EmployeeDashboardData | null> {
  const resp: AxiosResponse<EmployeeDashboardResponse> = await api.get(
    EmployeeDashboardAPI.summary,
    { params: { employee_id: employeeId } },
  );
  return resp.data?.data ?? null;
}