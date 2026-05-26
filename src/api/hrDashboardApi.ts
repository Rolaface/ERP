import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";

import { API, ERP_BASE } from "../config/api";

const api = createAxiosInstance(ERP_BASE);

export const HrDashboardAPI = API.hrDashboard;

// export type HrDashboardSummaryResponse = {
//   status_code: number;
//   status: string;
//   message: string;
//   data: {
//     total: number;
//     active: number;
//     inactive: number;
//     onLeave: number;
//     totalLeaveTypes: number;
//   };
// };

// export async function getHrDashboardSummary(): Promise<HrDashboardSummaryResponse> {
//   const resp: AxiosResponse<HrDashboardSummaryResponse> = await api.get(HrDashboardAPI.summary);
//   return resp.data;
// }

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
  };
};

export async function getEmployeeStatusCount(): Promise<HrDashboardSummaryResponse> {
  const resp: AxiosResponse<HrDashboardSummaryResponse> = await api.get(HrDashboardAPI.hrSummary);
  return resp.data;
}
 