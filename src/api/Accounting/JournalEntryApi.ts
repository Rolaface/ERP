import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "../axiosInstance";
import { API, ERP_BASE } from "../../config/api";
import { buildListParams } from "../utils/queryBuilder";

const api = createAxiosInstance(ERP_BASE);
export const JournalEntryAPI = API.journalEntry;

export interface JournalEntryAccountPayload {
  name?: string;
  account: string;
  account_currency?: string;
  exchange_rate?: number;
  debit_in_account_currency?: number;
  credit_in_account_currency?: number;
  party_type?: string;
  party?: string;
  cost_center?: string;
  project?: string;
  user_remark?: string;
}

export interface JournalEntryPayload {
  company: string;
  posting_date: string;
  voucher_type: string;
  is_opening?: "Yes" | "No";
  user_remark?: string;
  cheque_no?: string;
  cheque_date?: string;
  multi_currency?: number;
  accounts: JournalEntryAccountPayload[];
}

export async function createJournalEntry(
  payload: JournalEntryPayload
): Promise<any> {
  const resp: AxiosResponse = await api.post(JournalEntryAPI.create, payload);
  return resp.data;
}


export async function getJournalEntries(
  fields?: string[],
  filters?: any[][],
  limitStart: number = 0,
  limitPageLength: number = 20,
  search?: string,
  orderBy?: string
): Promise<any> {
  const queryString = buildListParams({
    fields: fields ?? [],
    start: limitStart,
    pageSize: limitPageLength,
    search,
    searchFields: search ? ["name", "user_remark"] : undefined,
  });

  const searchParams = new URLSearchParams(queryString);

  if (filters && filters.length > 0) {
    searchParams.set("filters", JSON.stringify(filters));
  }
  
  if (orderBy) {
    searchParams.set("order_by", orderBy); // This forces ONLY one order_by
  }

  // Pass the unified string directly, avoiding Axios 'params' duplication
  const resp: AxiosResponse = await api.get(
    `${JournalEntryAPI.getAll}?${searchParams.toString()}`
  );
  return resp.data;
}

export async function getJournalEntryById(id: string): Promise<any> {
  const url = `${JournalEntryAPI.getById}/${encodeURIComponent(id)}`;
  const resp: AxiosResponse = await api.get(url);
  return resp.data;
}

export async function updateJournalEntryById(
  id: string,
  payload: Partial<JournalEntryPayload>
): Promise<any> {
  const url = `${JournalEntryAPI.update}/${encodeURIComponent(id)}`;
  const resp: AxiosResponse = await api.put(url, payload);
  return resp.data;
}

export async function deleteJournalEntryById(id: string): Promise<any> {
  const url = `${JournalEntryAPI.delete}/${encodeURIComponent(id)}`;
  const resp: AxiosResponse = await api.delete(url);
  return resp.data;
}

type JournalEntryAction = "approved" | "cancelled" | "amend";

export async function updateJournalEntryStatus(
  id: string,
  action: JournalEntryAction,
): Promise<any> {
  if (!id) throw new Error("Journal Entry ID is required");
  if (!action) throw new Error("Action is required");

  const resp: AxiosResponse = await api.patch(JournalEntryAPI.updateStatus, {
    id,
    action,
  });

  return resp.data;
}

// export async function getComponentById(id: string): Promise<any> {
//   const url = `${JournalEntryAPI.getByIdOnly}/${encodeURIComponent(id)}`;
//   const resp: AxiosResponse = await api.get(url);
//   return resp.data;
// }
// export async function getComponentById(id: string, fields?: string[]): Promise<any> {
//    const url = `${JournalEntryAPI.getByIdOnly}/${encodeURIComponent(id)}`;
   
//    const config = fields ? { params: { fields: JSON.stringify(fields) } } : {};
   
// const resp: AxiosResponse = await api.get(url, config);
//  return resp.data;
// }
export async function getComponentById(id: string, fields?: string[], filters?: any[][],orderBy?: string): Promise<any> {
  const url = `${JournalEntryAPI.getByIdOnly}/${encodeURIComponent(id)}`;
    const params: any = {
    limit_page_length: 0, 
  };

  if (fields) {
    params.fields = JSON.stringify(fields);
  }
  if (filters) {
    params.filters = JSON.stringify(filters);
  }
  if (orderBy) {
    params.order_by = orderBy;
  }

  const resp: AxiosResponse = await api.get(url, { params });
  return resp.data;
}

