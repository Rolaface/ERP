import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";
import { API, ERP_BASE } from "../config/api";

const api = createAxiosInstance(ERP_BASE);
export const LeaveAPI = API.company;

interface FrappeSearchLinkItem {
  value: string;
  description?: string;
}

interface FrappeSearchLinkResponse {
  message: FrappeSearchLinkItem[];
}

export interface RoleOption {
  id: string;
  name: string;
}

export async function getAllCreditLimit(
  search?: string,
  pageLength: number = 20,
): Promise<RoleOption[]> {
  
   const endpoint = LeaveAPI.getCreditLimitRole.split('?')[0];

  const resp: AxiosResponse<FrappeSearchLinkResponse> = await api.get(
    endpoint,
    {
      params: {
        doctype: "Role",
        txt: search || "",
        page_length: pageLength,
      },
    },
  );

  const items = resp.data?.message ?? [];

  return items.map((item) => ({
    id: item.value,
    name: item.description ? `${item.value} (${item.description})` : item.value,
  }));
}

export interface AccountItem {
  name: string;
  account_type?: string;
}

export interface AccountOption {
  id: string;
  name: string;
  accountType?: string;
}

async function getAccountsByFilters(
  filters: (string | number | string[])[][],
): Promise<AccountOption[]> {
  const endpoint = LeaveAPI.getAllDefaultAccounts;

 const resp: AxiosResponse<{ data: AccountItem[] }> = await api.get(
    endpoint,
    {
      params: {
        filters: JSON.stringify(filters),
        fields: JSON.stringify(["name", "account_type"]),
      },
    },
  );

  const items = resp.data?.data ?? [];

  return items.map((item) => ({
    id: item.name,
    name: item.name,
    accountType: item.account_type,
  }));
}
export async function getBankAccounts(): Promise<AccountOption[]> {
  return getAccountsByFilters([
    ["is_group", "=", 0],
    ["account_type", "=", "Bank"],
  ]);
}

export async function getExpenseAccounts(): Promise<AccountOption[]> {
  return getAccountsByFilters([
    ["is_group", "=", 0],
    ["root_type", "=", "Expense"],
  ]);
}

export async function getCashAccounts(): Promise<AccountOption[]> {
  return getAccountsByFilters([
    ["is_group", "=", 0],
    ["account_type", "=", "Cash"],
  ]);
}

export async function getIncomeAccounts(): Promise<AccountOption[]> {
  return getAccountsByFilters([
    ["is_group", "=", 0],
    ["root_type", "=", "Income"],
  ]);
}

export async function getReceivableAccounts(): Promise<AccountOption[]> {
  return getAccountsByFilters([
    ["is_group", "=", 0],
    ["root_type", "=", "Asset"],
    ["account_type", "=", "Receivable"],
  ]);
}

export async function getAllAccounts(): Promise<AccountOption[]> {
  return getAccountsByFilters([["is_group", "=", 0]]);
}

export async function getPayableAccounts(): Promise<AccountOption[]> {
  return getAccountsByFilters([
    ["is_group", "=", 0],
    ["root_type", "=", "Liability"],
    ["account_type", "=", "Payable"],
  ]);
}

export async function getPayrollPayableAccounts(): Promise<AccountOption[]> {
  return getAccountsByFilters([
    ["is_group", "=", 0],
    ["root_type", "=", "Liability"],
  ]);
}

export async function getEmployeeAdvanceAccounts(): Promise<AccountOption[]> {
  return getAccountsByFilters([
    ["is_group", "=", 0],
    ["root_type", "=", "Asset"],
    ["account_type", "=", "Receivable"],
  ]);
}

export async function getExchangeGainLossAccounts(): Promise<AccountOption[]> {
  return getAccountsByFilters([
    ["is_group", "=", 0],
    ["root_type", "in", ["Expense", "Income"]],
  ]);
}

export async function getUnrealizedExchangeGainLossAccounts(): Promise<AccountOption[]> {
  return getAccountsByFilters([
    ["is_group", "=", 0],
    ["root_type", "in", ["Expense", "Income", "Equity", "Liability"]],
  ]);
}