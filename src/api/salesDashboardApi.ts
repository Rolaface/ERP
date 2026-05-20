import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";

import { API, ERP_BASE } from "../config/api";

const api = createAxiosInstance(ERP_BASE);

export const SalesDashboardAPI = API.salesDashboard;

export type SalesDashboardSummaryResponse = {
  status_code: number;
  status: string;
  message: string;
  data: {
    totalProformaInvoices: number;
    totalQuotations: number;
    totalSalesInvoices: number;
    totalSalesCreditNotes: number;
    totalSalesDebitNotes: number;
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

export async function getSalesDashboardSummary(): Promise<SalesDashboardSummaryResponse> {
  const resp: AxiosResponse<SalesDashboardSummaryResponse> = await api.get(
    SalesDashboardAPI.summary,
  );
  return resp.data;
}
