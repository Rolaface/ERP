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

/* =========================================
 * Top Items Types
 * ========================================= */

export type TopInventoryItem = {
  item_code: string;
  item_name: string;
  total_qty: number;
  total_value: number;
};

export type InventoryTopItemsResponse = {
  status_code: number;
  status: string;
  message: string;
  data: TopInventoryItem[];
};

export async function getInventoryTopItems(): Promise<InventoryTopItemsResponse> {
  const resp: AxiosResponse<InventoryTopItemsResponse> = await api.get(
    InventoryDashboardAPI.topItems,
  );

  return resp.data;
}

/* =========================================
 * Item Breakdown Types
 * ========================================= */

export type InventoryItemBreakdown = {
  name: string;
  total_qty: number;
  total_value: number;
};

export type InventoryItemBreakdownResponse = {
  status_code: number;
  status: string;
  message: string;
  data: InventoryItemBreakdown[];
};

export async function getInventoryItemBreakdown(): Promise<InventoryItemBreakdownResponse> {
  const resp: AxiosResponse<InventoryItemBreakdownResponse> = await api.get(
    InventoryDashboardAPI.itemBreakdown,
  );

  return resp.data;
}