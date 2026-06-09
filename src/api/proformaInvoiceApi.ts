import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";

import { API, ERP_BASE } from "../config/api";
const api = createAxiosInstance(ERP_BASE);
export const ProformaAPI = API.proforma;

export async function createProformaInvoice(payload: any): Promise<any> {
  const resp: AxiosResponse = await api.post(ProformaAPI.create, payload);
  return resp.data;
}

export async function getProformaInvoiceById(id: string): Promise<any | null> {
  const url = `${ProformaAPI.getById}?id=${encodeURIComponent(id)}`;
  const resp: AxiosResponse = await api.get(url);
  return resp.data ?? null;
}

export async function updateProformaInvoiceStatus(
  proformaId: string,
  status: string,
) {
  const resp = await api.patch(ProformaAPI.updateStatus, {
    id: proformaId,
    action: status, 
  });

  return resp.data;
}

export async function getAllProformaInvoices(
  page: number = 1,
  page_size: number = 10,
  sortBy: string = "",
  sortOrder: "asc" | "desc" = "asc",
  search?: string,
): Promise<any> {
  const resp: AxiosResponse = await api.get(ProformaAPI.getAll, {
    params: { page, page_size, sortBy, sortOrder, search, documentType: "Proforma Invoice"},
  });
  return resp.data;
}

export async function getAllQuotation(
  page: number = 1,
  page_size: number = 10,
  sortBy: string = "",
  sortOrder: "asc" | "desc" = "asc",
  search?: string,
): Promise<any> {
  const resp: AxiosResponse = await api.get(ProformaAPI.getAll, {
    params: { page, page_size, sortBy, sortOrder, search, documentType: "Quotation"},
  });
  return resp.data;
}

export async function deleteProformaInvoiceById(proformaId: string) {
  const resp = await api.delete(ProformaAPI.delete, {
    data: { id: proformaId },   
  });

  return resp.data;
}

export async function editProformaInvoice(
  id: string,
  payload: any
): Promise<any> {
  const resp: AxiosResponse = await api.put(
    `${ProformaAPI.edit}?id=${encodeURIComponent(id)}`,
    payload,
  );
  return resp.data;
}