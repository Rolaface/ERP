import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";
import { API, ERP_BASE } from "../config/api";

const api = createAxiosInstance(ERP_BASE);

export const CustomerDashboardAPI = API.customerDashboard;

// ── Raw response types (mirror backend exactly, snake_case as-is) ──────────
export interface CustomerDashboardSummaryRaw {
  total_customers: number;
  individual_customers: number;
  company_customers: number;
  overdue_payments: number;
  dormant_customers: number;
  total_revenue: number;
  avg_order_value: number;
  avg_payment_delay_days: number;
}

export interface CustomerGrowthPoint {
  month: string;
  count: number;
}

export interface TopPerformingCustomer {
  customer_id: string;
  customer_name: string;
  revenue: number;
}

export interface NewVsRepeat {
  new_revenue: number;
  repeat_revenue: number;
  new_percent: number;
  repeat_percent: number;
}

export interface CreditLimitUtilizationEntry {
  customer_id: string;
  customer_name: string;
  credit_limit: number;
  outstanding: number;
  utilization_percent: number;
}

export interface TopPerformersTrendPoint {
  month: string;
  [customerName: string]: string | number;
}

export interface TopPerformersTrend {
  customers: string[];
  series: TopPerformersTrendPoint[];
}

export interface RecoveryEntry {
  customer_id: string;
  customer_name: string;
  avg_delay_days: number;
}

export interface RecoveryTime {
  on_time: RecoveryEntry[];
  late: RecoveryEntry[];
}

export interface DormantCustomerEntry {
  customer_id: string;
  customer_name: string;
  last_order_days_ago: number | null;
}

export interface OutstandingCustomerEntry {
  customer_id: string;
  customer_name: string;
  outstanding: number;
}

export interface NeedsAttention {
  dormant_customers: DormantCustomerEntry[];
  top_outstanding_customers: OutstandingCustomerEntry[];
}

export interface CustomerDashboardDataRaw {
  currency: string;
  period: { year: number };
  summary: CustomerDashboardSummaryRaw;
  customer_growth: CustomerGrowthPoint[];
  top_performing_customers: TopPerformingCustomer[];
  new_vs_repeat: NewVsRepeat;
  credit_limit_utilization: CreditLimitUtilizationEntry[];
  top_performers_trend: TopPerformersTrend;
  recovery_time: RecoveryTime;
  needs_attention: NeedsAttention;
}

export interface CustomerDashboardResponse {
  status_code: number;
  status: string;
  message: string;
  data: CustomerDashboardDataRaw;
}

// ── Fetcher ──────────────────────────────────────────────────────────────
export async function getCustomerDashboardData(
  year: number,
  dormantDays: number = 90,
): Promise<CustomerDashboardDataRaw> {
  const resp: AxiosResponse<CustomerDashboardResponse> = await api.get(
    CustomerDashboardAPI.customer_dashboard,
    { params: { year, dormant_days: dormantDays } },
  );

  if (resp.data.status !== "success") {
    throw new Error(resp.data.message || "Failed to load customer dashboard data");
  }

  return resp.data.data;
}