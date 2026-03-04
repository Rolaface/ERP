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
    total: number;
    active: number;
    inactive: number;
    onLeave: number;
    totalLeaveTypes: number;
  };
};

export async function getHrDashboardSummary(): Promise<HrDashboardSummaryResponse> {
  const resp: AxiosResponse<HrDashboardSummaryResponse> = await api.get(
    HrDashboardAPI.summary,
  );
  return resp.data;
}
