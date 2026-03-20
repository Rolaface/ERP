import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "../axiosInstance";
import { API, ERP_BASE } from "../../config/api";
import type { PLResponse } from "../../types/Accounting/ProfitLoss";
import type {CFResponse} from "../../types/Accounting/Cashflow"
const api = createAxiosInstance(ERP_BASE);

export const AccountingAPI = API.accounting;

/**
 * Get Chart of Accounts
 */
export async function getChartOfAccounts(): Promise<any> {
  const resp: AxiosResponse = await api.get(AccountingAPI.getCOA);

  return resp.data;
}

export interface TrialBalanceFilters {
  from_date: string;
  to_date: string;
  fiscal_year: string;
  show_zero_values?: boolean;
  with_period_closing_entry?: number;
  show_closing_entries?: number;
}

export async function getTrialBalance(
  filters: TrialBalanceFilters,
): Promise<any> {
  const resp: AxiosResponse = await api.get(AccountingAPI.getTB, {
    params: filters,
  });

  return resp.data;
}

export interface BalanceSheetFilters {
  periodicity: string;
  from_fiscal_year?: string;
  to_fiscal_year?: string;
  from_date?: string;
  to_date?: string;
  filter_based_on?: "Fiscal Year" | "Date Range";
}
export async function getBalanceSheet(
  filters: BalanceSheetFilters,
): Promise<any> {
  const resp: AxiosResponse = await api.get(AccountingAPI.getBalanceSheet, {
    params: filters,
  });
  return resp.data;
}

export interface ProfitLossFilters {
  mode?: "Fiscal Year" | "Date Range";
  from_date?: string;
  to_date?: string;
  periodicity?: "Monthly" | "Quarterly" | "Yearly" | "Half-Yearly";
  from_fiscal_year?: number;
  to_fiscal_year?: number;
}

export async function getProfitAndLoss(
  filters: ProfitLossFilters,
): Promise<PLResponse> {
  const resp: AxiosResponse<PLResponse> = await api.get(AccountingAPI.getPL, {
    params: filters,
  });

  return resp.data;
}

export interface AccountsPayableFilters {
  company?: string;
  report_date?: string;

  cost_center?: string;
  payable_account?: string;

  party_type?: string;
  party?: string;
  supplier_group?: string;

  ageing_based_on?: "Due Date" | "Posting Date";
  calculate_ageing_with?: "Report Date" | "Today Date";
  range?: string;

  group_by?: "supplier" | "voucher" | "none";
  search?: any;

  voucher_type?: "Purchase Invoice" | "Payment Entry";
  // status?: "Paid" | "Pending" | "Overdue" | "Partially Paid";
  status?: any;

  page?: number;
  page_size?: number;
}

export async function getAllPayables(
  filters: AccountsPayableFilters,
): Promise<any> {
  const resp: AxiosResponse = await api.get(AccountingAPI.getAllPayables, {
    params: filters,
  });

  return resp.data;
}

export interface AccountsReceivableFilters {
  company?: string;
  report_date?: string;

  cost_center?: string;
  receivable_account?: string;

  party_type?: string;
  party?: string;
  customer_group?: string;

  ageing_based_on?: "Due Date" | "Posting Date";
  calculate_ageing_with?: "Report Date" | "Today Date";
  range?: string;

  group_by?: "customer" | "voucher" | "none";
  search?: any;
  voucher_type?: "Sales Invoice" | "Payment Entry";
  // status?: "Paid" | "Pending" | "Overdue" | "Partially Paid";
  status?: any;

  page?: number;
  page_size?: number;
}

export async function getAllReceivables(
  filters: AccountsReceivableFilters,
): Promise<any> {
  const resp: AxiosResponse = await api.get(AccountingAPI.getAllReceivable, {
    params: filters,
  });

  return resp.data;
}


export interface CashFlowFilters {
  periodicity?: "Monthly" | "Quarterly" | "Yearly" | "Half-Yearly";
  from_fiscal_year?: string;
  to_fiscal_year?: string;
  from_date?: string;
  to_date?: string;
  filter_based_on?: "Fiscal Year" | "Date Range";
}

 
export async function getCashFlow(filters: CashFlowFilters): Promise<CFResponse> {
  const resp: AxiosResponse<CFResponse> = await api.get(
    AccountingAPI.getCashFlow,
    { params: filters }
  );
  return resp.data;
}
