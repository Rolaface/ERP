import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";
import { API, ERP_BASE } from "../config/api";
import { buildListParams } from "./utils/queryBuilder";

const api = createAxiosInstance(ERP_BASE);

export const SalesDebitNoteAPI = API.SalesDebitNote; 

export interface SalesDebitNotePayload {
  is_debit_note: 1; 
  return_against: string;
  customer: string;
  company: string;
  
  update_stock?: 0; 
  
  reason?: string;
  items: {
    item_code: string;
    qty: number; 
    rate: number;
    batch_no?: string;    
    warehouse?: string;
  }[];
}

export interface SalesDebitNoteReasonOption {
  code: string;
  reason: string;
}

export interface SalesDebitNoteResponse {
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

export async function createSalesDebitNote(
  payload: SalesDebitNotePayload,
): Promise<SalesDebitNoteResponse> {
  const resp: AxiosResponse = await api.post(SalesDebitNoteAPI.Sales_Debit_Note, payload);
 
  const body = resp.data ?? {};
  const doc: Record<string, any> | null = body.data ?? null;

  const docName: string = doc?.name ?? "";
  const message = docName
    ? `Sales Debit Note created: ${docName}`
    : "Sales Debit Note created successfully";
 
  return {
    status_code: resp.status,          
    data: doc,
    message,
    _server_messages: body._server_messages ?? undefined,
  };
}

export async function getAllSalesDebitNotes(
  page: number = 1,
  page_size: number = 10,
  search: string = "",
  sortBy: string = "",
  sortOrder: "asc" | "desc" = "asc",
): Promise<any> {
  const limit_start = (page - 1) * page_size;

  const query = buildListParams({
    fields: ["name", "customer_name", "return_against", "grand_total", "status", "posting_date", "currency"],
    start: limit_start,
    pageSize: page_size,
    search,
    searchFields: ["name", "customer_name", "return_against", "grand_total", "status", "posting_date", "currency"],
    sortBy,
    sortOrder,
  });

  const filters = encodeURIComponent(
    JSON.stringify([["is_debit_note", "=", 1]])
  );

  const resp: AxiosResponse = await api.get(
    `${SalesDebitNoteAPI.Sales_Debit_Note}?${query}&filters=${filters}`
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

export async function updateSalesDebitNote(
  invoiceId: string,
  payload: SalesDebitNotePayload,
): Promise<SalesDebitNoteResponse> {
  try {
    const resp: AxiosResponse = await api.put(
      `${SalesDebitNoteAPI.Sales_Debit_Note}/${encodeURIComponent(invoiceId)}`,
      payload,
    );
    const body = resp.data ?? {};
    return {
      status_code: resp.status,          
      data: body.data ?? null,
      message: "Sales Debit Note updated successfully",
      _server_messages: body._server_messages ?? undefined,
    };
  } catch (err: any) {
    const body = err?.response?.data ?? {};
    throw new Error(parseErpNextError(body));  
  }
}

export async function submitSalesDebitNote(noteNo: string): Promise<SalesDebitNoteResponse> {
  try {
    const resp: AxiosResponse = await api.put(
      `${SalesDebitNoteAPI.Sales_Debit_Note}/${encodeURIComponent(noteNo)}`,
      { docstatus: 1 },
    );
    const body = resp.data ?? {};
    return {
      status_code: resp.status,
      data: body.data ?? null,
      message: `Sales Debit Note ${noteNo} submitted successfully`,
      _server_messages: body._server_messages ?? undefined,
    };
  } catch (err: any) {
    const body = err?.response?.data ?? {};
    throw new Error(parseErpNextError(body));
  }
}

export async function cancelSalesDebitNote(noteNo: string): Promise<SalesDebitNoteResponse> {
  try {
    const resp: AxiosResponse = await api.put(
      `${SalesDebitNoteAPI.Sales_Debit_Note}/${encodeURIComponent(noteNo)}`,
      { docstatus: 2 },
    );
    const body = resp.data ?? {};
    return {
      status_code: resp.status,
      data: body.data ?? null,
      message: `Sales Debit Note ${noteNo} cancelled successfully`,
      _server_messages: body._server_messages ?? undefined,
    };
  } catch (err: any) {
    const body = err?.response?.data ?? {};
    throw new Error(parseErpNextError(body));
  }
}

export async function deleteSalesDebitNote(invoiceId: string): Promise<any> {
  const resp: AxiosResponse = await api.delete(`${SalesDebitNoteAPI.Sales_Debit_Note}/${encodeURIComponent(invoiceId)}`);
  return resp.data;
}

export async function getSalesDebitNoteById(invoiceId: string): Promise<any> {
  const resp: AxiosResponse = await api.get(
    `${SalesDebitNoteAPI.Sales_Debit_Note}/${encodeURIComponent(invoiceId)}`
  );
  return resp.data;
}

export async function getSalesDebitNoteReasons(search: string = ""): Promise<SalesDebitNoteReasonOption[]> {
  const query = buildListParams({
    fields: ["*"],
    search,
    searchFields: ["reason", "name"],
  });

  const resp: AxiosResponse = await api.get(
    `/api/resource/Custom Sales Invoice Debit Note Reason?${query}`,
  );
  
  const json = resp.data ?? {};
  const list = (json.data || []).map((d: any) => ({
    code: d.code ?? d.name,
    reason: d.reason ?? d.credit_note_reason ?? d.name,
  }));

  return list.sort((a: SalesDebitNoteReasonOption, b: SalesDebitNoteReasonOption) => {
    const aIsOther = a.reason.startsWith("Other");
    const bIsOther = b.reason.startsWith("Other");
    if (aIsOther && !bIsOther) return 1;
    if (!aIsOther && bIsOther) return -1;
    return a.reason.localeCompare(b.reason);
  });
}