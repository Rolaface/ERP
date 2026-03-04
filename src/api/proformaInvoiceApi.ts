import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";

import { API, ERP_BASE } from "../config/api";
const api = createAxiosInstance(ERP_BASE);
export const ProformaAPI = API.proforma;

export async function createProformaInvoice(payload: any): Promise<any> {
  const resp: AxiosResponse = await api.post(ProformaAPI.create, payload);
  return resp.data;
}

export async function getProformaInvoiceById(proformaId: string) {
  const url = `${ProformaAPI.getById}?id=${encodeURIComponent(proformaId)}`;
  const resp: AxiosResponse = await api.get(url);
  return resp.data ?? null;
}

export async function getAllProformaInvoices(
  page: number = 1,
  page_size: number = 10,
  sortBy: string = "",
  sortOrder: "asc" | "desc" = "asc",
  search?: string,
): Promise<any> {
  const resp: AxiosResponse = await api.get(ProformaAPI.getAll, {
    params: { page, page_size, sortBy, sortOrder, search },
  });
  return resp.data;
}

export async function deleteProformaInvoiceById(proformaId: string) {
  const resp = await api.delete(ProformaAPI.delete, {
    data: { proformaId },
  });

  return resp.data;
}
