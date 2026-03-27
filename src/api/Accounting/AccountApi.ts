import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "../axiosInstance";
import { API, ERP_BASE } from "../../config/api";
import type { PLResponse } from "../../types/Accounting/ProfitLoss";
import type {CFResponse} from "../../types/Accounting/Cashflow"
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
  // hardcoded fields sent from frontend
  doctype: "Account";
  is_root: "false";
}

export async function createChartOfAccount(payload: CreateCOAPayload): Promise<any> {
  const resp: AxiosResponse = await api.post(AccountingAPI.createCOA, payload);
  return resp.data;
}

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
  filters: TrialBalanceFilters
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
  filters: BalanceSheetFilters
): Promise<any> {
  const resp: AxiosResponse = await api.get(
    AccountingAPI.getBalanceSheet,
    {
      params: filters,
    }
  );
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
  filters: ProfitLossFilters
): Promise<PLResponse> {
  const resp: AxiosResponse<PLResponse> = await api.get(
    AccountingAPI.getPL,
    { params: filters }
  );

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