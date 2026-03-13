import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "../axiosInstance";
import { API, ERP_BASE } from "../../config/api";
import type { PLResponse } from "../../types/Accounting/ProfitLoss";
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