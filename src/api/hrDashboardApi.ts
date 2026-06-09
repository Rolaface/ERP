import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";

import { API, ERP_BASE } from "../config/api";

const api = createAxiosInstance(ERP_BASE);

export const HrDashboardAPI = API.hrDashboard;

export type HrDashboardSummaryResponse = {
  status_code: number;
  status: string;
  message: string;
  data: {
    total_active: number;
    active_working: number;
    on_leave: number;
    inactive: number;
    total_leaves: number;
    total_leave_types: number;
    pending_leaves: number;
    approved_leaves: number;
    rejected_leaves: number;
    present_today: number;
    upcoming_birthdays?: Array<{employeeName: string, dateOfBirth: string, daysLeft: number}>;
  };
};

export async function getEmployeeStatusCount(): Promise<HrDashboardSummaryResponse> {
  const resp: AxiosResponse<HrDashboardSummaryResponse> = await api.get(HrDashboardAPI.hrSummary);
  return resp.data;
}

export type HrDashboardDataResponse = {
  status_code: number;
  status: string;
  message: string;
  data: {
    "Department Wise Payroll": {
      department: string;
      "base net pay": number;
    }[];
    "Attendance Pattern": {
      Present: number;
      Absent: number;
      Late: number;
    };
  };
};

export async function getHrDashboardData(year?: number): Promise<HrDashboardDataResponse> {
  const resp: AxiosResponse<HrDashboardDataResponse> = await api.get(
    HrDashboardAPI.dashboardData, 
    {
      params: { year } // Axios automatically handles mapping this to ?year=XXXX
    }
  );
  return resp.data;
}

export type EmployeeTrendResponse = {
  status_code: number;
  status: string;
  message: string;
  data: {
    filter: {
      view_type: string;
      year: number;
      visible_months: number;
    };
    summary: {
      hired: number;
      resigned: number;
      fired: number;
      net_growth: number;
    };
    trend: {
      month: string;
      hired: number;
      resigned: number;
      fired: number;
    }[];
  };
};

export async function getEmployeeTrend(
  year?: number, 
  visible_months?: number
): Promise<EmployeeTrendResponse> {
  const resp: AxiosResponse<EmployeeTrendResponse> = await api.get(
    HrDashboardAPI.employeeTrend,
    {
      params: { year, visible_months } 
    }
  );
  return resp.data;
}

