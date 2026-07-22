import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";

import { API, ERP_BASE } from "../config/api";

const api = createAxiosInstance(ERP_BASE);

export const SalesDashboardAPI = API.salesDashboard;

export type DashboardGranularity = "monthly" | "yearly";

export interface SummaryMetric {
  count: number;
  value: number;
}

export interface SalesSummary {
  proforma_invoices: SummaryMetric;
  quotations: SummaryMetric;
  sales_invoices: SummaryMetric;
  credit_notes: SummaryMetric;
  sales_orders: SummaryMetric;
  debit_notes: SummaryMetric;
}

export interface MonthlySalesPoint {
  month: string;
  received: number;
  receivable: number;
}

export interface QuotationConversion {
  total_quotations: number;
  converted_quotations: number;
  conversion_rate_percent: number;
}

export interface CustomerConcentration {
  top_customer_name: string;
  top_customer_revenue_percent: number;
  total_tracked_revenue: number;
}

export interface NeedsAttentionItem {
  customer_id?: string;
  customer_name: string;
  last_order_date?: string;
  days_since?: number;
}

export interface TopRecentSale {
  invoice_id: string;
  customer_id: string;
  customer_name: string;
  amount: number;
  posting_date: string;
  status: string;
  currency: string;
}

export interface ActionItem {
  type: string; 
  label: string;
  color: string;
  count: number;
  title: string;
}

export interface InvoiceStatusCount {
  status: string;
  count: number;
  color: string;
}

export interface InvoiceStatusSummary {
  total_invoices: number;
  statuses: InvoiceStatusCount[];
}

export interface AgingBucket {
  range: string;
  amount: number;
}

export interface OverdueInvoiceItem {
  customer_id: string;
  customer_name: string;
  invoice_id: string;
  amount: number;
  days_overdue: number;
}

export interface OverdueInvoiceAging {
  total_overdue: number;
  buckets: AgingBucket[];
  invoices: OverdueInvoiceItem[];
}

export interface RecentActivityItem {
  type: string; 
  title: string;
  customer_id: string;
  customer_name: string;
  reference_id: string;
  amount: number;
  timestamp: string;
}

export interface SalesDashboardData {
  currency: string;
  period: {
    year: number;
    granularity: DashboardGranularity;
  };
  summary: SalesSummary;
  monthly_sales_overview: MonthlySalesPoint[];
  quotation_conversion: QuotationConversion;
  customer_concentration: CustomerConcentration | null;
  needs_attention: NeedsAttentionItem[];
   action_items: ActionItem[];
  top_recent_sales: TopRecentSale[];
  invoice_status: InvoiceStatusSummary;
  overdue_invoice_aging: OverdueInvoiceAging;
  recent_sales_activity: RecentActivityItem[];
}

export interface SalesDashboardResponse {
  status_code: number;
  status: string;
  message: string;
  data: SalesDashboardData;
}

export interface GetSalesDashboardParams {
  year?: number;
  granularity?: DashboardGranularity;
}


export async function getSalesDashboard(
  params?: GetSalesDashboardParams,
): Promise<SalesDashboardResponse> {
  const resp: AxiosResponse<SalesDashboardResponse> = await api.get(
    SalesDashboardAPI.sales_dashboard,
    { params },
  );
  return resp.data;
}