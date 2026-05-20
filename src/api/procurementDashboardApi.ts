import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";

import { API, ERP_BASE } from "../config/api";

const api = createAxiosInstance(ERP_BASE);

export const ProcurementDashboardAPI = API.procurementDashboard;

export type ProcurementDashboardSummaryResponse = {
  status_code: number;
  status: string;
  message: string;
  data: {
    totalSuppliers: number;
    activeSuppliers: number;
    inactiveSuppliers: number;
    totalPurchaseInvoice: number;
    totalPurchaseOrder: number;
  };
};

export async function getProcurementDashboardSummary(): Promise<ProcurementDashboardSummaryResponse> {
  const resp: AxiosResponse<ProcurementDashboardSummaryResponse> = await api.get(
    ProcurementDashboardAPI.summary,
  );
  return resp.data;
}
