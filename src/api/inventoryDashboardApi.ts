import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";

import { API, ERP_BASE } from "../config/api";

const api = createAxiosInstance(ERP_BASE);

export const InventoryDashboardAPI = API.inventoryDashboard;

export type InventoryDashboardSummaryResponse = {
  status_code: number;
  status: string;
  message: string;
  data: {
    totalItems: number;
    serviceItems: number;
    rawMaterialItems: number;
    finishedProductsItems: number;
    totalImportedItems: number;
  };
};

export async function getInventoryDashboardSummary(): Promise<InventoryDashboardSummaryResponse> {
  const resp: AxiosResponse<InventoryDashboardSummaryResponse> = await api.get(
    InventoryDashboardAPI.summary,
  );
  return resp.data;
}
