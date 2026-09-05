import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";
import { API, ERP_BASE } from "../config/api";
import { buildListParams } from "./utils/queryBuilder";
import { getSalesInvoiceById } from "./salesApi";

const api = createAxiosInstance(ERP_BASE);

export const SalesDebitNoteAPI = API.SalesDebitNote; 

export interface SalesDebitNotePayload {
  doc_type: "Debit Note"; 
  return_against: string;
  customer: string;
  company: string;
  
  update_stock: 1;
  
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
  const resp: AxiosResponse = await api.post(SalesDebitNoteAPI.create, payload);
  const body = resp.data?.message ?? resp.data ?? {};
  
  return {
    status_code: body.status_code || resp.status,          
    data: body.data ?? null,
    message: body.message || "Sales Debit Note created successfully",
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
  const resp: AxiosResponse = await api.get(SalesDebitNoteAPI.getAll, {
    params: {
      page,
      page_size,
      search,
      sort_by: sortBy || "creation",
      sort_order: sortOrder || "desc",
      doc_type: "Debit Note"
    }
  });

  const body = resp.data ?? resp.data ?? {};
  const data = body.data ?? [];
  const pagination = body?.pagination ?? {
    total: data.length,
    total_pages: 1,
    page,
    page_size
  };

  return {
    data,
    pagination,
  };
}

export async function updateSalesDebitNote(
  invoiceId: string,
  payload: SalesDebitNotePayload,
): Promise<SalesDebitNoteResponse> {
  try {
    const resp: AxiosResponse = await api.put(SalesDebitNoteAPI.update, {
      id: invoiceId,
      ...payload
    });
    const body = resp.data?.message ?? resp.data ?? {};
    return {
      status_code: body.status_code || resp.status,          
      data: body.data ?? null,
      message: body.message || "Sales Debit Note updated successfully",
      _server_messages: body._server_messages ?? undefined,
    };
  } catch (err: any) {
    const body = err?.response?.data ?? {};
    throw new Error(parseErpNextError(body));  
  }
}

export async function submitSalesDebitNote(noteNo: string): Promise<SalesDebitNoteResponse> {
  try {
    const resp: AxiosResponse = await api.put(SalesDebitNoteAPI.updateStatus, {
      id: noteNo,
      action: 'approved'
    });
    const body = resp.data?.message ?? resp.data ?? {};
    return {
      status_code: body.status_code || resp.status,
      data: body.data ?? null,
      message: body.message || `Sales Debit Note ${noteNo} submitted successfully`,
      _server_messages: body._server_messages ?? undefined,
    };
  } catch (err: any) {
    const body = err?.response?.data ?? {};
    throw new Error(parseErpNextError(body));
  }
}

export async function cancelSalesDebitNote(noteNo: string): Promise<SalesDebitNoteResponse> {
  try {
    const resp: AxiosResponse = await api.put(SalesDebitNoteAPI.updateStatus, {
      id: noteNo,
      action: 'cancelled'
    });
    const body = resp.data?.message ?? resp.data ?? {};
    return {
      status_code: body.status_code || resp.status,
      data: body.data ?? null,
      message: body.message || `Sales Debit Note ${noteNo} cancelled successfully`,
      _server_messages: body._server_messages ?? undefined,
    };
  } catch (err: any) {
    const body = err?.response?.data ?? {};
    throw new Error(parseErpNextError(body));
  }
}

export async function deleteSalesDebitNote(invoiceId: string): Promise<any> {
  const resp: AxiosResponse = await api.delete(SalesDebitNoteAPI.delete, {
    params: { id: invoiceId }
  });
  return resp.data;
}

export async function getSalesDebitNoteById(invoiceId: string): Promise<any> {
  const resp: AxiosResponse = await api.get(SalesDebitNoteAPI.getById, {
    params: { id: invoiceId }
  });
  return resp.data;
}

export const DEFAULT_SALES_DEBIT_NOTE_REASONS: SalesDebitNoteReasonOption[] = [
  { code: "01", reason: "Goods returned" },
  { code: "02", reason: "Wrong invoice amount" },
  { code: "03", reason: "Undercharge correction" },
  { code: "04", reason: "Price adjustment" },
  { code: "07", reason: "Other" },
];

export async function getSalesDebitNoteReasons(search: string = ""): Promise<SalesDebitNoteReasonOption[]> {
  try {
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

    if (list.length > 0) {
      return list.sort((a: SalesDebitNoteReasonOption, b: SalesDebitNoteReasonOption) => {
        const aIsOther = a.reason.startsWith("Other");
        const bIsOther = b.reason.startsWith("Other");
        if (aIsOther && !bIsOther) return 1;
        if (!aIsOther && bIsOther) return -1;
        return a.reason.localeCompare(b.reason);
      });
    }
  } catch (err) {
    console.warn("Failed to fetch sales debit note reasons from API, using default reasons", err);
  }

  return search
    ? DEFAULT_SALES_DEBIT_NOTE_REASONS.filter((r) =>
        r.reason.toLowerCase().includes(search.toLowerCase()) || r.code.includes(search),
      )
    : DEFAULT_SALES_DEBIT_NOTE_REASONS;
}