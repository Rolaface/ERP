import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";
import { API, ERP_BASE } from "../config/api";

const api = createAxiosInstance(ERP_BASE);
export const CreditNoteAPI = API.CreditNote;

export interface CreditNotePayload {
  is_return: 1;
  return_against: string;
  customer: string;
  company: string;
  update_stock: 0 | 1;
  update_outstanding_for_self: 0 | 1;
  items: {
    item_code: string;
    qty: number;          // negative number
    rate: number;
    batch_no?: string;    // omitted if empty
    warehouse: string;
  }[];
}
 
 
export interface CreditNoteResponse {
  status_code: number;
  data: Record<string, any> | null;
  message: string;
  _server_messages?: string;
}
 
// ─── API call ─────────────────────────────────────────────────────────────────
 
export async function createCreditNote(
  payload: CreditNotePayload,
): Promise<CreditNoteResponse> {
  const resp: AxiosResponse = await api.post(CreditNoteAPI.Credit_note, payload);
 
  const body = resp.data ?? {};
 
  const doc: Record<string, any> | null = body.data ?? null;

  const docName: string = doc?.name ?? "";
  const message = docName
    ? `Credit Note created: ${docName}`
    : "Credit Note created successfully";
 
  return {
    status_code: resp.status,          
    data: doc,
    message,
    _server_messages: body._server_messages ?? undefined,
  };
}


export async function getAllCreditNotes(
  page: number = 1,
  page_size: number = 10,
  search: string = "",
): Promise<any> {
  const limit_start = (page - 1) * page_size;

  const resp: AxiosResponse = await api.get(CreditNoteAPI.Credit_note, { 
    params: {
      filters: JSON.stringify([["is_return", "=", 1]]),
      fields: JSON.stringify(["name", "customer_name", "return_against", "grand_total", "status", "posting_date","currency"]),
      with_pagination: 1,
      limit_start,
      limit_page_length: page_size,
      ...(search && { search }),
    },
  });

  const raw = resp.data;
  const total = raw.total_count ?? 0;

  return {
    data: raw,
    pagination: {
      total,
      total_pages: Math.ceil(total / page_size),
      page,
      page_size,
    },
  };
}


export async function deleteCreditNote(invoiceId: string): Promise<any> {
  const resp: AxiosResponse = await api.delete(`${CreditNoteAPI.Credit_note}/${encodeURIComponent(invoiceId)}`);
  return resp.data;
}