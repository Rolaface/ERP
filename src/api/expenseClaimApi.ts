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
    advances?: ExpenseClaimAdvanceItem[];
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
  pageSize = 10,
  employeeId?: string,                                    
): Promise<{ data: ExpenseClaimRecord[]; pagination: { total_pages: number; total: number } }> {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (employeeId)  params.append("employee",  employeeId); 
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
    const url = `${ExpenseClaimAPI.getExpenseClaimbyId}?id=${encodeURIComponent(id)}`;
    const resp: AxiosResponse = await api.get(url);
      return resp.data?.message?.data || null;
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
export async function approveExpenseClaim(id: string, status: "Approved" | "Cancelled" | "Rejected"): Promise<any> {
  const resp: AxiosResponse = await api.put(ExpenseClaimAPI.approveClaim, {
    claim_id: id,
    status,
  });
  return resp.data || null;
}
export interface EmployeeAdvanceRaw {
  name: string;
  employee: string;
  employee_name: string;
  posting_date: string;
  advance_amount: number;
  paid_amount: number;
  claimed_amount: number;
  pending_amount: number;
  return_amount: number;
  advance_account: string;
  mode_of_payment: string;
  purpose: string;
  currency: string;
  status: string;
}
export interface MappedEmployeeAdvance {
  id: string;              
  employeeName: string;   
  employeeId: string;       
  advanceDate: string; 
  allocatedAmount: number;  
  unclaimedAmount: number; 
  claimedAmount: number;
  purpose: string; 
  status: "Pending" | "Partially Claimed" | "Fully Claimed";
}
function deriveStatus(raw: EmployeeAdvanceRaw): MappedEmployeeAdvance["status"] {
  if (raw.claimed_amount <= 0) return "Pending";
  if (raw.claimed_amount >= raw.advance_amount) return "Fully Claimed";
  return "Partially Claimed";
}
export async function getAdvancesByEmployee(
  employeeId: string
): Promise<MappedEmployeeAdvance[]> {
  const fields  = encodeURIComponent(JSON.stringify(["*"]));
  const filters = encodeURIComponent(
    JSON.stringify([
      ["status", "=", "Paid"],
      ["employee", "=", employeeId],
    ])
  );
 
  const url = `${ExpenseClaimAPI.getAdvanceById}?fields=${fields}&limit_page_length=0&filters=${filters}`;
 
  const resp: AxiosResponse = await api.get(url);
  const raw: EmployeeAdvanceRaw[] = resp?.data?.data ?? [];
 
  return raw.map((item): MappedEmployeeAdvance => ({
    id:              item.name,
    employeeName:    item.employee_name,
    employeeId:      item.employee,
    advanceDate:     item.posting_date,
    allocatedAmount: item.advance_amount,
    unclaimedAmount: Math.max(0, item.advance_amount - item.claimed_amount),
    claimedAmount:   item.claimed_amount,
    purpose:        item.purpose,
    status:          deriveStatus(item),
  }));
}

export interface AttachDocumentPayload {
  filename: string;
  filedata: string; 
  doctype: string;
  docname: string;
  is_private: number;
  folder: string;
}




export async function attachDocumentToExpenseClaim(
  claimId: string,
  file: File
): Promise<any> {
  const formData = new FormData();
  formData.append("file", file, file.name);
  formData.append("doctype", "Expense Claim");
  formData.append("docname", claimId);
  formData.append("is_private", "0");
  formData.append("folder", "Home/Attachments");

  const resp: AxiosResponse = await api.post(
    ExpenseClaimAPI.attachDocument,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return resp.data || null;
}

export interface ExpenseClaimAdvanceItem {
  employee_advance: string;
  allocated_amount: number;
  base_allocated_amount: number;
  unclaimed_amount: number; 
  parentfield: "advances";
  parenttype: "Expense Claim";
  exchange_rate: 1;
  advance_amount: number;   
  posting_date: string; 
  doctype: "Expense Claim Advance";
}