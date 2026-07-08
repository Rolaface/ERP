import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";
import { API, ERP_BASE } from "../config/api";
import { buildListParams } from "../api/utils/queryBuilder";

const api = createAxiosInstance(ERP_BASE);
export const CreditNoteAPI = API.CreditNote;

export interface CreditNotePayload {
  is_return: 1;
  return_against: string;
  customer: string;
  company: string;
  update_stock: 0 | 1;
  update_outstanding_for_self: 0 | 1;
  //   remarks?: {             
  //   name: string;
  //   reason: string;
  //   code:string;
  //   description: string;
  // };
remarks?:string
  items: {
    item_code: string;
    qty: number;          // negative number
    rate: number;
    batch_no?: string;    // omitted if empty
    warehouse: string;
  }[];
}
 
export interface CreditNoteReasonOption {
  code: string;
  reason: string;
}

export async function getCreditNoteReasons(search: string = ""): Promise<CreditNoteReasonOption[]> {
  const query = buildListParams({
    fields: ["*"],
    search,
    searchFields: ["reason", "name"],
  });

  const resp: AxiosResponse = await api.get(
    `/api/resource/Custom Sales Invoice Credit Note Reason?${query}`,
  );
  const json = resp.data ?? {};
  return (json.data || []).map((d: any) => ({
    code: d.name,
    reason: d.reason ?? d.credit_note_reason ?? d.name,
  }));
}
export interface CreditNoteResponse {
  status_code: number;
  data: Record<string, any> | null;
  message: string;
  _server_messages?: string;
}
 


export function parseErpNextError(errorBody: any): string {
  if (errorBody?.exception) {
    const raw: string = errorBody.exception;
    const lines = raw.split("\n").map((l: string) => l.trim()).filter(Boolean);
    if (lines.length > 0) return lines[lines.length - 1];
  }
  if (errorBody?.exc) {
    try {
      const parsed = JSON.parse(errorBody.exc);
      const trace: string = Array.isArray(parsed) ? parsed[0] : parsed;
      const lines = trace.split("\n").map((l: string) => l.trim()).filter(Boolean);
      if (lines.length > 0) return lines[lines.length - 1];
    } catch {}
  }
  return "Operation failed. Please try again.";
}

 
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

  const query = buildListParams({
    fields: ["name", "customer_name", "return_against", "grand_total", "status", "posting_date", "currency"],
    start: limit_start,
    pageSize: page_size,
    search,
    searchFields: ["name", "customer_name", "return_against","grand_total", "status", "posting_date", "currency"],
  });

  const resp: AxiosResponse = await api.get(
    `${CreditNoteAPI.Credit_note}?${query}&filters=${encodeURIComponent(
      JSON.stringify([["is_return", "=", 1]]),
    )}`,
  );

  const raw = resp.data;
  const items = Array.isArray(raw?.data) ? raw.data
              : Array.isArray(raw)        ? raw
              : [];

  const pagination = raw?.pagination ?? {};
  const total = pagination.total ?? items.length;

  return {
    data: items,   
    pagination: {
      total,
      total_pages: (pagination.total_pages ?? Math.ceil(total / page_size)) || 1,
      page,
      page_size,
    },
  };
}

export async function updateCreditNote(
  invoiceId: string,
  payload: CreditNotePayload,
): Promise<CreditNoteResponse> {
  try {
    const resp: AxiosResponse = await api.put(
      `${CreditNoteAPI.Credit_note}/${encodeURIComponent(invoiceId)}`,
      payload,
    );
    const body = resp.data ?? {};
    return {
      status_code: resp.status,          
      data: body.data ?? null,
      message: "Credit Note updated successfully",
      _server_messages: body._server_messages ?? undefined,
    };
  } catch (err: any) {
    const body = err?.response?.data ?? {};
    throw new Error(parseErpNextError(body));  
  }
}


export async function submitCreditNote(noteNo: string): Promise<CreditNoteResponse> {
  try {
    const resp: AxiosResponse = await api.put(
      `${CreditNoteAPI.Credit_note}/${encodeURIComponent(noteNo)}`,
      { docstatus: 1 },
    );
    const body = resp.data ?? {};
    return {
      status_code: resp.status,
      data: body.data ?? null,
      message: `Credit Note ${noteNo} submitted successfully`,
      _server_messages: body._server_messages ?? undefined,
    };
  } catch (err: any) {
    const body = err?.response?.data ?? {};
    throw new Error(parseErpNextError(body));
  }
}


export async function cancelCreditNote(noteNo: string): Promise<CreditNoteResponse> {
  try {
    const resp: AxiosResponse = await api.put(
      `${CreditNoteAPI.Credit_note}/${encodeURIComponent(noteNo)}`,
      { docstatus: 2 },
    );
    const body = resp.data ?? {};
    return {
      status_code: resp.status,
      data: body.data ?? null,
      message: `Credit Note ${noteNo} cancelled successfully`,
      _server_messages: body._server_messages ?? undefined,
    };
  } catch (err: any) {
    const body = err?.response?.data ?? {};
    throw new Error(parseErpNextError(body));
  }
}

export async function deleteCreditNote(invoiceId: string): Promise<any> {
  const resp: AxiosResponse = await api.delete(`${CreditNoteAPI.Credit_note}/${encodeURIComponent(invoiceId)}`);
  return resp.data;
}

export async function getCreditNoteById(invoiceId: string): Promise<any> {
  const resp: AxiosResponse = await api.get(
    `${CreditNoteAPI.Credit_note}/${encodeURIComponent(invoiceId)}`
  );
  return resp.data;
}