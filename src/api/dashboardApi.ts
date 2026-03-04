import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";

import { API, ERP_BASE } from "../config/api";

const api = createAxiosInstance(ERP_BASE);

export const DashboardAPI = API.dashboard;

export type DashboardSummaryResponse = {
  status_code: number;
  status: string;
  message: string;
  data: {
    totalCustomers: number;
    totalSuppliers: number;
    totalSalesInvoices: number;
    totalPurchaseInvoices: number;
    totalSalesAmount: number;
    recentSales: Array<{
      name: string;
      customer: string;
      posting_date: string;
      grand_total: number;
    }>;
    monthlySalesGraph: {
      labels: string[];
      data: number[];
    };
  };
};

export async function getDashboardSummary(): Promise<DashboardSummaryResponse> {
  const resp: AxiosResponse<DashboardSummaryResponse> = await api.get(
    DashboardAPI.summary,
  );
  return resp.data;
}
