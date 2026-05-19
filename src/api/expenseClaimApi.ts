  import type { AxiosResponse } from "axios";
  import { createAxiosInstance } from "./axiosInstance";

  import { API, ERP_BASE } from "../config/api";
  const api = createAxiosInstance(ERP_BASE);
  export const ExpenseClaimAPI = API.ExpenseClaim;
  export const AccountApi=API.Account;
  interface AccountOption {
    label: string;
    value: string;
  }
  export async function getExpenseCategories(search?: string): Promise<any> {
    const url = search
      ? `${ExpenseClaimAPI.Claim_Type}?search=${encodeURIComponent(search)}`
      : ExpenseClaimAPI.Claim_Type;
    const resp: AxiosResponse = await api.get(url);
    return resp.data || null;
  }
  export interface ExpenseItem {
    expense_date: string;
    expense_type: string;
    description: string;
    amount: number;
    sanctioned_amount: number;
  }
  export interface CreateExpenseClaimPayload {
    employee: string;
    expense_approver: string;
    posting_date: string;
    currency: string;
    exchange_rate: number;
    expenses: ExpenseItem[];
    remark: string;
  }
  export async function createExpenseClaim(
    payload: CreateExpenseClaimPayload
  ): Promise<any> {
    const resp: AxiosResponse = await api.post(ExpenseClaimAPI.Expense_Claim, payload);
    return resp.data || null;
  }
  export async function getExpenseGLAccounts(
    companyName: string,
    search?: string
  ): Promise<AccountOption[]> {
    try {
      const filters = encodeURIComponent(
        JSON.stringify({
          is_group: 0,
          root_type: "Expense",
          company: companyName,
        })
      );

      const params = new URLSearchParams();
      
      if (search) {
        params.append(
          "or_filters",
          JSON.stringify([["name", "like", `%${search}%`]])
        );
      }

      const resp: AxiosResponse = await api.get(
        `${AccountApi.getAccountsResource}?${params.toString()}&filters=${filters}`
      );

      const raw: any[] = resp?.data?.results ?? resp?.data?.data ?? [];
      return raw.map((item) => ({
        label: item.value ?? item.name,
        value: item.value ?? item.name,
      }));
    } catch {
      return [];
    }
  }
  export interface CreateExpenseTypePayload {
    expense_type: string;
    accounts: {
      default_account: string;
    }[];
  }

  export async function createExpenseClaimType(
    payload: CreateExpenseTypePayload
  ): Promise<any> {
    const resp: AxiosResponse = await api.post(
      ExpenseClaimAPI.Claim_Type,
      payload
    );
    return resp.data || null;
  }
  export interface ExpenseClaimRecord {
    employee_name: string;
    expense_date: string;
    expense_type: string;
    amount: number;
    approval_status: string;
    expense_approver: string;
  }

export async function getExpenseClaims(
  search?: string,
  page = 1,
  pageSize = 10
): Promise<{ data: ExpenseClaimRecord[]; pagination: { total_pages: number; total: number } }> {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  params.append("page", String(page));
  params.append("page_size", String(pageSize));
  const resp: AxiosResponse = await api.get(`${ExpenseClaimAPI.getExpenseClaims}?${params.toString()}`);
  return resp.data || null;
}
  export interface ExpenseClaimType {
    name: string;
    expense_type: string;
    account: string;
  }

export async function getExpenseClaimTypes(
  search?: string,
  page = 1,
  pageSize = 10
): Promise<{ data: ExpenseClaimType[]; pagination: { total_pages: number; total: number } }> {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  params.append("page", String(page));
  params.append("page_size", String(pageSize));
  const resp: AxiosResponse = await api.get(`${ExpenseClaimAPI.getExpenseType}?${params.toString()}`);
  return resp.data || null;
}

  export async function getExpenseClaimById(id: string): Promise<any> {
    const url = `${ExpenseClaimAPI.Expense_Claim}/${encodeURIComponent(id)}`;
    const resp: AxiosResponse = await api.get(url);
    return resp.data || null;
  }

  export async function updateExpenseClaim(
    id: string,
    payload: CreateExpenseClaimPayload
  ): Promise<any> {
    const url = `${ExpenseClaimAPI.Expense_Claim}/${encodeURIComponent(id)}`;
    const resp: AxiosResponse = await api.put(url, payload);
    return resp.data || null;
  }
  export async function deleteExpenseClaim(id: string): Promise<any> {
    const url = `${ExpenseClaimAPI.Expense_Claim}/${encodeURIComponent(id)}`;
    const resp: AxiosResponse = await api.delete(url);
    return resp.data || null;
  }
  export async function getExpenseClaimTypeById(name: string): Promise<any> {
  const url = `${ExpenseClaimAPI.Claim_Type}/${encodeURIComponent(name)}`;
  const resp: AxiosResponse = await api.get(url);
  return resp.data || null;
}
export async function updateExpenseClaimType(
  name: string,
  payload: CreateExpenseTypePayload
): Promise<any> {
  const url = `${ExpenseClaimAPI.Claim_Type}/${encodeURIComponent(name)}`;
  const resp: AxiosResponse = await api.put(url, payload);
  return resp.data || null;
}
export async function deleteExpenseClaimType(name: string): Promise<any> {
  const url = `${ExpenseClaimAPI.Claim_Type}/${encodeURIComponent(name)}`;
  const resp: AxiosResponse = await api.delete(url);
  return resp.data || null;
}