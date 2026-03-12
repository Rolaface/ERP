import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "../axiosInstance";
import { API, ERP_BASE } from "../../config/api";

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
  from_fiscal_year: string;
  to_fiscal_year: string;
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