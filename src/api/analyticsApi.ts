import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";
import { API, ERP_BASE } from "../config/api";
const api = createAxiosInstance(ERP_BASE);

export const AnalyticsAPI = API.analytics;

export interface SalesAnalyticsFilters {
  tree_type?:
    | "Customer"
    | "Item"
    | "Customer Group"
    | "Territory"
    | "Order Type"
    | "Project";
  doc_type?: "Sales Invoice" | "Delivery Note" | "Sales Order";
  value_quantity?: "Value" | "Quantity";
  from_date?: string;
  to_date?: string;
  company?: string;
  range?: "Weekly" | "Monthly" | "Quarterly" | "Yearly";
  curves?: string; // e.g., "select"

  page?: number;
  page_size?: number;
}

export async function getSalesAnalytics(
  filters: SalesAnalyticsFilters,
): Promise<any> {
  const resp: AxiosResponse = await api.get(AnalyticsAPI.getSalesAnalytics, {
    params: filters,
  });

  return resp.data;
}

export interface PurchaseAnalyticsFilters {
  tree_type?: "Supplier" | "Item" | "Supplier Group" | "Project";
  doc_type?: "Purchase Invoice" | "Purchase Receipt" | "Purchase Order";
  value_quantity?: "Value" | "Quantity";
  from_date?: string;
  to_date?: string;
  company?: string;
  range?: "Weekly" | "Monthly" | "Quarterly" | "Yearly";

  page?: number;
  page_size?: number;
}

export async function getPurchaseAnalytics(
  filters: PurchaseAnalyticsFilters,
): Promise<any> {
  const resp: AxiosResponse = await api.get(AnalyticsAPI.getPurchaseAnalytics, {
    params: filters,
  });

  return resp.data;
}
