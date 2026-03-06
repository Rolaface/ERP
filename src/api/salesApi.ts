// src/api/salesApi.ts
import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";

import { API, ERP_BASE } from "../config/api";
const api = createAxiosInstance(ERP_BASE);
export const InvoiceAPI = API.invoice;

export async function createSalesInvoice(payload: any): Promise<any> {
  const resp: AxiosResponse = await api.post(InvoiceAPI.create, payload);
  return resp.data;
}

export async function getAllSalesInvoices(
  page: number = 1,
  page_size: number = 10,
  sortBy: string = "",
  sortOrder: "asc" | "desc" = "asc",
  search?: string,
): Promise<any> {
  const resp: AxiosResponse = await api.get(InvoiceAPI.getAll, {
    params: { page, page_size, sortBy, sortOrder, search },
  });
  return resp.data;
}

export async function getSalesInvoiceById(id: string): Promise<any | null> {
  const url = `${InvoiceAPI.getById}?id=${encodeURIComponent(id)}`;
  const resp: AxiosResponse = await api.get(url);
  return resp.data ?? null;
}

export async function deleteSalesInvoiceById(id: string): Promise<any> {
  const url = `${InvoiceAPI.delete}?id=${encodeURIComponent(id)}`;
  const resp: AxiosResponse = await api.delete(url);
  return resp.data;
}

export async function createCreditNoteFromInvoice(payload: {
  originalSalesInvoiceNumber: string;
  CreditNoteReasonCode: string;
  invcAdjustReason?: string;
  transactionProgress: string;
  items: {
    itemCode: string;
    quantity: number;
    price: number;
  }[];
}): Promise<any> {
  const resp: AxiosResponse = await api.post(
    InvoiceAPI.createCreditNote,
    payload,
  );
  return resp.data;
}

export async function createDebitNoteFromInvoice(payload: {
  originalSalesInvoiceNumber: string;
  DebitNoteReasonCode: string;
  invcAdjustReason: string;
  transactionProgress: string;
  items: {
    itemCode: string;
    quantity: number;
    price: number;
  }[];
}): Promise<any> {
  const resp = await api.post(InvoiceAPI.createDebitNote, payload);
  return resp.data;
}

export async function getAllDebitNotes(
  page: number = 1,
  page_size: number = 10,
  sortBy: string = "",
  sortOrder: "asc" | "desc" = "asc",
  search: string = "",
): Promise<any> {
  const resp: AxiosResponse = await api.get(InvoiceAPI.getDebitNotes, {
    params: { page, page_size, sortBy, sortOrder, search },
  });
  return resp.data;
}
export async function getAllCreditNotes(
  page: number = 1,
  page_size: number = 10,
  sortBy: string = "",
  sortOrder: "asc" | "desc" = "asc",
  search: string = "",
): Promise<any> {
  const resp: AxiosResponse = await api.get(InvoiceAPI.getCreditNotes, {
    params: { page, page_size, sortBy, sortOrder, search },
  });
  return resp.data;
}
