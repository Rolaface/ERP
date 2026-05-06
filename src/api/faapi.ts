import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";
import { API, ERP_BASE } from "../config/api";
import {buildListParams} from "../api/utils/queryBuilder"


const api = createAxiosInstance(ERP_BASE);
export const Account = API.Account;

// ─── Types ────────────────────────────────────────────────────────────────────

export type AccountOption = { label: string; value: string };
export type FinanceBookOption = { label: string; value: string };




// ─── Core fetcher ─────────────────────────────────────────────────────────────



async function fetchAccounts(
  filters: [string, string, string][]
): Promise<AccountOption[]> {
  try {
    const params = new URLSearchParams();
    params.append("filters", JSON.stringify(filters));

    const resp: AxiosResponse = await api.get(
      `${Account.getAccountsResource}?${params.toString()}`
    );

    const raw: any[] = resp?.data?.data ?? [];
    return raw.map((item) => ({ label: item.name, value: item.name }));
  } catch {
    return [];
  }
}

// ─── Fixed Asset Account ──────────────────────────────────────────────────────
// ${Account.getAccountsResource}?filters=[["is_group","=","0"],["account_type","=","Fixed Asset"],["root_type","=","Asset"]]

export async function getFixedAssetAccounts(): Promise<AccountOption[]> {
  return fetchAccounts([
    ["is_group", "=", "0"],
    ["account_type", "=", "Fixed Asset"],
    ["root_type", "=", "Asset"],
  ]);
}

// ─── Accumulated Depreciation Account ────────────────────────────────────────
// ${Account.getAccountsResource}?filters=[["is_group","=","0"],["account_type","=","Accumulated Depreciation"],["root_type","=","Asset"]]

export async function getAccumulatedDepreciationAccounts(): Promise<AccountOption[]> {
  return fetchAccounts([
    ["is_group", "=", "0"],
    ["account_type", "=", "Accumulated Depreciation"],
    ["root_type", "=", "Asset"],
  ]);
}

// ─── Depreciation Expense Account ────────────────────────────────────────────
// ${Account.getAccountsResource}?filters=[["is_group","=","0"],["account_type","=","Depreciation"],["root_type","=","Expense"]]

export async function getDepreciationExpenseAccounts(): Promise<AccountOption[]> {
  return fetchAccounts([
    ["is_group", "=", "0"],
    ["account_type", "=", "Depreciation"],
    ["root_type", "=", "Expense"],
  ]);
}

// ─── Capital Work in Progress Account ────────────────────────────────────────
// ${Account.getAccountsResource}?filters=[["is_group","=","0"],["account_type","=","Capital Work in Progress"],["root_type","=","Asset"]]

export async function getCWIPAccounts(): Promise<AccountOption[]> {
  return fetchAccounts([
    ["is_group", "=", "0"],
    ["account_type", "=", "Capital Work in Progress"],
    ["root_type", "=", "Asset"],
  ]);
}

// ─── Finance Book ─────────────────────────────────────────────────────────────

export async function getFinanceBooks(): Promise<FinanceBookOption[]> {
  try {
    const resp: AxiosResponse = await api.get(`/api/resource/Finance Book`);
    const raw: any[] = resp?.data?.data ?? [];
    return raw.map((item) => ({ label: item.name, value: item.name }));
  } catch {
    return [];
  }
}

// ─── Create Asset Category ────────────────────────────────────────────────────

export interface CreateAssetCategoryPayload {
  asset_category_name: string;
  depreciation_method: string;
  total_number_of_depreciations: number;
  frequency_of_depreciation: number;
  is_intangible: 0 | 1;
  accounts: {
    company_name: string;
    fixed_asset_account: string;
    accumulated_depreciation_account: string;
    depreciation_expense_account: string;
    capital_work_in_progress_account: string;
  }[];
}

export async function createAssetCategory(
  payload: CreateAssetCategoryPayload
): Promise<any> {
  const resp: AxiosResponse = await api.post(
    `/api/resource/Asset Category`,
    payload
  );
  return resp.data;
}



export type GetAssetCategoryParams = {
  fields?: string[]; 
  filters?: any[];
  search?: string;
  page?: number;
  page_size?: number;
};

export async function getAssetCategories(
  paramsObj?: GetAssetCategoryParams
) {
  try {
    const params = new URLSearchParams();

    // fields
    if (paramsObj?.fields?.length) {
      params.append("fields", JSON.stringify(paramsObj.fields));
    }

    // filters
    if (paramsObj?.filters?.length) {
      params.append("filters", JSON.stringify(paramsObj.filters));
    }

    // search
    if (paramsObj?.search?.trim()) {
      params.append("search", paramsObj.search.trim());
    }

    // pagination (ERP format)
    if (paramsObj?.page && paramsObj?.page_size) {
      const start = (paramsObj.page - 1) * paramsObj.page_size;
      params.append("limit_start", String(start));
      params.append("limit_page_length", String(paramsObj.page_size));
    }

    const url = params.toString()
      ? `${API.AssetsTypes.getall}?${params.toString()}`
      : API.AssetsTypes.getall;

    const resp: AxiosResponse = await api.get(url);

    return resp?.data?.data ?? [];
  } catch (error) {
    console.error("GET ASSET CATEGORY ERROR:", error);
    return [];
  }
}
export async function getAssetCategoryOptions(search?: string) {
  try {
    const params = new URLSearchParams();
    params.append("fields", JSON.stringify(["name"]));

    if (search?.trim()) {
      params.append("search", search.trim());
    }

    const resp = await api.get(
      `${API.AssetsTypes.getall}?${params.toString()}`
    );

    const raw = resp?.data?.data ?? [];

    return raw.map((item: any) => ({
      label: item.name,
      value: item.name,
    }));
  } catch {
    return [];
  }
}

export async function getPayrollPayableAccounts(
  companyName: string,
  search?: string
): Promise<AccountOption[]> {
  try {
    const params = buildListParams({
      fields: ["name"],
      pageSize: 20,
      search,
      searchFields: ["name"],
    });

    const filters = encodeURIComponent(
      JSON.stringify([
        ["company", "=", companyName],
        ["root_type", "=", "Liability"],
        ["is_group", "=", "0"],
      ])
    );

    const resp: AxiosResponse = await api.get(
      `${Account.getAccountsResource}?${params}&filters=${filters}`
    );

    const raw: any[] = resp?.data?.data ?? [];

    return raw.map((item) => ({
      label: item.name,
      value: item.name,
    }));
  } catch {
    return [];
  }
}

export async function getPayrollPaymentAccounts(
  companyName: string,
  search?: string
): Promise<AccountOption[]> {
  try {
    const params = buildListParams({
      fields: ["name"],
      pageSize: 20,
      search,
      searchFields: ["name"],
    });

    const filters = encodeURIComponent(
      JSON.stringify([
        ["account_type", "in", ["Bank", "Cash"]],
        ["company", "=", companyName],
        ["is_group", "=", "0"],
      ])
    );

    const resp: AxiosResponse = await api.get(
      `${Account.getAccountsResource}?${params}&filters=${filters}`
    );

    const raw: any[] = resp?.data?.data ?? [];

    return raw.map((item) => ({
      label: item.name,
      value: item.name,
    }));
  } catch {
    return [];
  }
}