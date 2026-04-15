import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "../axiosInstance";
import { API, ERP_BASE } from "../../config/api";

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
  limitPageLength: number = 20
): Promise<any> {
  const params: any = {
    limit_start: limitStart,
    limit_page_length: limitPageLength,
  };

  if (fields) params.fields = JSON.stringify(fields);
  if (filters) params.filters = JSON.stringify(filters);

  const resp: AxiosResponse = await api.get(JournalEntryAPI.getAll, { params });
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

export async function submitJournalEntry(id: string): Promise<any> {
  const resp: AxiosResponse = await api.post("/api/method/frappe.client.submit", {
    doc: {
      doctype: "Journal Entry",
      name: id,
    },
  });
  return resp.data;
}

export async function cancelJournalEntry(id: string): Promise<any> {
  const resp: AxiosResponse = await api.post("/api/method/frappe.client.cancel", {
    doc: {
      doctype: "Journal Entry",
      name: id,
    },
  });
  return resp.data;
}