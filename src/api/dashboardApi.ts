import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";

import { API, ERP_BASE } from "../config/api";

const api = createAxiosInstance(ERP_BASE);

export const DashboardAPI = API.dashboard;

// export type DashboardSummaryResponse = {
//   status_code: number;
//   status: string;
//   message: string;
//   data: {
//     totalCustomers: number;
//     totalSuppliers: number;
//     totalSalesInvoices: number;
//     totalPurchaseInvoices: number;
//     totalSalesAmount: number;
//     recentSales: Array<{
//       name: string;
//       customer: string;
//       posting_date: string;
//       grand_total: number;
//     }>;
//     monthlySalesGraph: {
//       labels: string[];
//       data: number[];
//     };
//   };
// };

// export async function getDashboardSummary(): Promise<DashboardSummaryResponse> {
//   const resp: AxiosResponse<DashboardSummaryResponse> = await api.get(DashboardAPI.summary);
//   return resp.data;
// }


// ==========================================
// 1. Dashboard Summary
// ==========================================

export type DashboardSummaryResponse = {
  status_code: number;
  status: string;
  message: string;
  data: {
    sales: {
      totalSales: number;
      salesCount: number;
      totalOutstanding: number;
      outstandingCount: number;
      totalOverdue: number;
      overdueCount: number;
    };
    purchase: {
      totalPurchase: number;
      purchaseCount: number;
      totalOutstanding: number;
      outstandingCount: number;
      totalOverdue: number;
      overdueCount: number;
    };
    customer: {
      totalCustomers: number;
      activeCustomers: number;
      inactiveCustomers: number;
    };
    supplier: {
      totalSuppliers: number;
      activeSuppliers: number;
      inactiveSuppliers: number;
    };
  };
};

export async function getDashboardSummary(): Promise<DashboardSummaryResponse> {
  // Using dashboardSummary as defined in your API config
  const resp: AxiosResponse<DashboardSummaryResponse> = await api.get(DashboardAPI.dashboardSummary);
  return resp.data;
}

export type DashboardNotesResponse = {
  status_code: number;
  status: string;
  message: string;
  data: {
    topCustomer: {
      name: string;
      value: number;
    };
    topSupplier: {
      name: string;
      value: number;
    };
    topSellingItemQty: {
      itemCode: string;
      itemName: string;
      quantity: number;
    };
    topSellingItemValue: {
      itemCode: string;
      itemName: string;
      value: number;
    };
  };
};

export async function getDashboardNotes(): Promise<DashboardNotesResponse> {
  const resp: AxiosResponse<DashboardNotesResponse> = await api.get(DashboardAPI.notes);
  return resp.data;
}


// ==========================================
// 3. Chart Query Parameters (Shared)
// ==========================================

export interface ChartQueryParams {
  from_date?: string; // Format: YYYY-MM-DD
  to_date?: string;   // Format: YYYY-MM-DD
  year?: number | string;
}


// ==========================================
// 4. Sales Chart
// ==========================================

export type SalesChartResponse = {
  status_code: number;
  status: string;
  message: string;
  data: {
    totals: {
      totalReceivable: number;
      totalReceived: number;
    };
    trend: Record<string, {
      receivable: number;
      received: number;
    }>;
  };
};

export async function getSalesChart(params?: ChartQueryParams): Promise<SalesChartResponse> {
  const resp: AxiosResponse<SalesChartResponse> = await api.get(DashboardAPI.salesChart, { 
    params 
  });
  return resp.data;
}


// ==========================================
// 5. Purchase Chart
// ==========================================

export type PurchaseChartResponse = {
  status_code: number;
  status: string;
  message: string;
  data: {
    totals: {
      totalPayable: number;
      totalPaid: number;
    };
    trend: Record<string, {
      payable: number;
      paid: number;
    }>;
  };
};

export async function getPurchaseChart(params?: ChartQueryParams): Promise<PurchaseChartResponse> {
  const resp: AxiosResponse<PurchaseChartResponse> = await api.get(DashboardAPI.purchaseChart, { 
    params 
  });
  return resp.data;
}