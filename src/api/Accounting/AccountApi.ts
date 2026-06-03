import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "../axiosInstance";
import { API, ERP_BASE } from "../../config/api";
import type { PLResponse } from "../../types/Accounting/ProfitLoss";
import type { CFResponse } from "../../types/Accounting/Cashflow";
const api = createAxiosInstance(ERP_BASE);

export const AccountingAPI = API.accounting;

export interface CreateCOAPayload {
  account_name: string;
  company: string;
  is_group: 0 | 1;
  account_number?: string;
  account_currency?: string;
  account_type?: string;
  parent?: string;
  root_type?: string;
  doctype: "Account";
  is_root: "false";
}

export interface DeleteCOAPayload {
  doctype: "Account";
  name: string;
}

export async function createChartOfAccount(
  payload: CreateCOAPayload,
): Promise<any> {
  const resp: AxiosResponse = await api.post(AccountingAPI.createCOA, payload);
  return resp.data;
}

export async function deleteChartOfAccount(
  accountName: string,
): Promise<any> {
  const payload: DeleteCOAPayload = {
    doctype: "Account",
    name: accountName,
  };

  const formData = new FormData();

  formData.append("doctype", payload.doctype);
  formData.append("name", payload.name);

  const resp: AxiosResponse = await api.post(
    AccountingAPI.deleteCOA,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return resp.data;
}

export interface getChartOfAccountsPayload {
  balance_filter?: string;
}

export async function getChartOfAccounts(
  payload: getChartOfAccountsPayload
): Promise<any> {
  const resp: AxiosResponse = await api.get(AccountingAPI.getCOA, {
    params: payload
  });
  return resp.data;
}


export async function getCOAById(accountName: string): Promise<any> {
  const resp: AxiosResponse = await api.get(
    `${AccountingAPI.getCOAbyId}/${encodeURIComponent(accountName)}`,
  );
  return resp.data?.data ?? null;
}


export async function updateChartOfAccount(
  accountName: string,
  payload: CreateCOAPayload & { name: string },
): Promise<any> {
  const resp: AxiosResponse = await api.put(
    `${AccountingAPI.getCOAbyId}/${encodeURIComponent(accountName)}`,
    payload,
  );
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
  currency?: string;
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
  voucher_type?: "Purchase Invoice"
  | "Purchase Order"
  | "Purchase Receipt"
  | "Payment Entry"
  | "Journal Entry"
  | "Expense Claim";
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
  currency?: string;
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
  voucher_type?: "Sales Invoice"
  | "Sales Order"
  | "Delivery Note"
  | "Payment Entry"
  | "Journal Entry";
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

export async function getCashFlow(
  filters: CashFlowFilters,
): Promise<CFResponse> {
  const resp: AxiosResponse<CFResponse> = await api.get(
    AccountingAPI.getCashFlow,
    { params: filters },
  );
  return resp.data;
}

// ───────── Ledger (GL) Filters ─────────
export interface LedgerFilters {
  account: string;
  from_date: string;
  to_date: string;
  page?: number;
  page_size?: number;
}

// ───────── Ledger API ─────────
export async function getLedgerDetails(
  filters: LedgerFilters
): Promise<any> {
  const resp: AxiosResponse = await api.get(
    AccountingAPI.getLedger,
    {
      params: filters,
    }
  );

  return resp.data;
}
