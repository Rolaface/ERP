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

export async function updateInvoiceStatus(
  id: string,
  action: string,
) {
  const resp: AxiosResponse = await api.patch(
    InvoiceAPI.updateStatus,
    { id, action }
  );

  return resp.data;
}

export async function getAllSalesInvoices(
  page: number = 1,
  page_size: number = 10,
  sortBy: string = "",
  sortOrder: "asc" | "desc" = "asc",
  search?: string,
  customer?: string,
  minOutstanding?: number,
  status?: string[],
  from_date?: string,
  to_date?: string,
): Promise<any> {

  // AFTER
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("page_size", String(page_size));
  if (sortBy) params.set("sortBy", sortBy);
  if (sortOrder) params.set("sortOrder", sortOrder);
  if (search) params.set("search", search);
  if (customer) params.set("customer", customer);
  if (minOutstanding != null) params.set("minOutstanding", String(minOutstanding));
  if (status) params.set("status", status);       
  if (from_date) params.set("from_date", from_date); 
  if (to_date) params.set("to_date", to_date);    

  const resp: AxiosResponse = await api.get(InvoiceAPI.getAll, { params });

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


export async function editSalesInvoice(
  invoiceNumber: string,
  payload: any
): Promise<any> {
  const resp: AxiosResponse = await api.put(
    `${InvoiceAPI.editInvoice}?id=${encodeURIComponent(invoiceNumber)}`,
    payload,
  );
  return resp.data;
}

export async function createCnFromSalesInvoice(siId: string): Promise<any> {
  const resp: AxiosResponse = await api.post(
    `${InvoiceAPI.createCnFromSi}?id=${encodeURIComponent(siId)}`,
  );
  return resp.data;
}