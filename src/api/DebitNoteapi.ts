import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";
import { DebitNoteResponse } from "../types/sales/Debitnotes";
import { API, ERP_BASE } from "../config/api";
const api = createAxiosInstance(ERP_BASE);
export const DebitNoteAPI = API.DebitNote;

export interface DebitNotePayload {
  is_return: 1;
  return_against: string;
  supplier: string;
  company: string;
  update_stock:1;
  conversion_rate: number;
  items: {
    item_code: string;
    qty: number;          
    rate: number;
    batch_no?: string;    
    warehouse: string;
  }[];
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
    } catch {
    }
  }

  return "Operation failed. Please try again.";
}
// ─── API call ─────────────────────────────────────────────────────────────────
 
export async function createDebitNote(
  payload: DebitNotePayload,
): Promise<DebitNoteResponse> {
  try {
    const resp: AxiosResponse = await api.post(DebitNoteAPI.Debit_note, payload);
    const body = resp.data ?? {};
    const doc: Record<string, any> | null = body.data ?? null;
    const docName: string = doc?.name ?? "";
    const message = docName
      ? `Debit Note created: ${docName}`
      : "Debit Note created successfully";
    return {
      status_code: resp.status,
      data: doc,
      message,
      _server_messages: body._server_messages ?? undefined,
    };
  } catch (err: any) {
    const body = err?.response?.data ?? {};
    throw new Error(parseErpNextError(body));
  }
}

 
export async function getAllDebitNotes(
  page = 1,
  page_size = 10,
  search: string = "",
): Promise<any> {
  const limit_start = (page - 1) * page_size;

  const resp: AxiosResponse = await api.get(DebitNoteAPI.Debit_note, { 
    params: {
      filters: JSON.stringify([["is_return", "=", 1]]),
      fields: JSON.stringify(["name","supplier_name","currency","grand_total","status","posting_date","return_against"]),
      with_pagination: 1,
      order_by: "posting_date desc",
      limit_start,
      limit_page_length: page_size,
      ...(search && { search }),
    },
  });

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

export async function deleteDebitNote(invoiceId: string): Promise<any> {
  const resp: AxiosResponse = await api.delete(`${DebitNoteAPI.Debit_note}/${encodeURIComponent(invoiceId)}`);
  return resp.data;
}


export async function getDebitNotebyId(invoiceId: string): Promise<any> {
  const resp: AxiosResponse = await api.get(
    `${DebitNoteAPI.Debit_note}/${encodeURIComponent(invoiceId)}`
  );
  const body = resp.data ?? {};
  return {
    data: body.data ?? body,         
    _server_messages: body._server_messages,
  };
}



export async function updateDebitNote(
  invoiceId: string,
  payload: DebitNotePayload,
): Promise<DebitNoteResponse> {
  try {
    const resp: AxiosResponse = await api.put(
      `${DebitNoteAPI.Debit_note}/${encodeURIComponent(invoiceId)}`,
      payload
    );
    const body = resp.data ?? {};
    return {
      status_code: resp.status,
      data: body.data ?? null,
      message: "Debit Note updated successfully",
      _server_messages: body._server_messages,
    };
  } catch (err: any) {
    const body = err?.response?.data ?? {};
    throw new Error(parseErpNextError(body));
  }
}


export async function submitDebitNote(noteNo: string): Promise<any> {
  try {
    const resp: AxiosResponse = await api.put(
      `${DebitNoteAPI.Debit_note}/${encodeURIComponent(noteNo)}`,
      { docstatus: 1 }
    );
    return resp.data;
  } catch (err: any) {
    const body = err?.response?.data ?? {};
    throw new Error(parseErpNextError(body));
  }
}

export async function cancelDebitNote(noteNo: string): Promise<any> {
  try {
    const resp: AxiosResponse = await api.put(
      `${DebitNoteAPI.Debit_note}/${encodeURIComponent(noteNo)}`,
      { docstatus: 2 }
    );
    return resp.data;
  } catch (err: any) {
    const body = err?.response?.data ?? {};
    throw new Error(parseErpNextError(body));
  }
}