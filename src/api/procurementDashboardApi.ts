import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";

import { API, ERP_BASE } from "../config/api";

const api = createAxiosInstance(ERP_BASE);

export const ProcurementDashboardAPI = API.procurementDashboard;

// export type ProcurementDashboardSummaryResponse = {
//   status_code: number;
//   status: string;
//   message: string;
//   data: {
//     totalSuppliers: number;
//     activeSuppliers: number;
//     inactiveSuppliers: number;
//     totalPurchaseInvoice: number;
//     totalPurchaseOrder: number;
//   };
// };

// export async function getProcurementDashboardSummary(): Promise<ProcurementDashboardSummaryResponse> {
//   const resp: AxiosResponse<ProcurementDashboardSummaryResponse> = await api.get(
//     ProcurementDashboardAPI.summary,
//   );
//   return resp.data;
// }


/* =========================================
 * Summary Types
 * ========================================= */

export type ProcurementDashboardSummaryResponse = {
  status_code: number;
  status: string;
  message: string;
  data: {
    totalSuppliers: number;
    activeSuppliers: number;
    inactiveSuppliers: number;
    totalPurchaseOrders: number;
    totalPurchaseInvoices: number;
  };
};

export async function getProcurementSummary(): Promise<ProcurementDashboardSummaryResponse> {
  const resp: AxiosResponse<ProcurementDashboardSummaryResponse> = await api.get(
    ProcurementDashboardAPI.procurementSummary,
  );

  return resp.data;
}

/* =========================================
 * Details Types
 * ========================================= */

export type MonthlyTrendItem = {
  month: string;
  amount: number;
};

export type StatusDistributionItem = {
  name: string;
  value: number;
};

export type SupplierAmountItem = {
  name: string;
  amount: number;
};

export type PaidVsUnpaidItem = {
  name: string;
  amount: number;
};

export type AgingItem = {
  name: string;
  amount: number;
};

export type ProcurementDashboardDetailsResponse = {
  status_code: number;
  status: string;
  message: string;
  data: {
    purchaseOrders: {
      monthlyTrend: MonthlyTrendItem[];
      statusDistribution: StatusDistributionItem[];
      topSuppliers: SupplierAmountItem[];
    };

    purchaseInvoices: {
      monthlyTrend: MonthlyTrendItem[];
      paidVsUnpaid: PaidVsUnpaidItem[];
      aging: AgingItem[];
    };
  };
};

/* =========================================
 * Details API Function
 * ========================================= */

export async function getProcurementDetails(): Promise<ProcurementDashboardDetailsResponse> {
  const resp: AxiosResponse<ProcurementDashboardDetailsResponse> = await api.get(
    ProcurementDashboardAPI.procurementDetails,
  );

  return resp.data;
}