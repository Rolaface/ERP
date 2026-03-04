import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";

import { API, ERP_BASE } from "../config/api";
const api = createAxiosInstance(ERP_BASE);
export const QuotationAPI = API.quotation;

export async function getAllQuotations(
  page = 1,
  page_size = 10,
  options?: {
    search?: string;
    status?: string;
    fromDate?: string;
    toDate?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  },
) {
  const params: Record<string, any> = {
    page,
    page_size,
  };

  if (options?.search) params.search = options.search;
  if (options?.status) params.status = options.status;
  if (options?.fromDate) params.fromDate = options.fromDate;
  if (options?.toDate) params.toDate = options.toDate;
  if (options?.sortBy) params.sortBy = options.sortBy;
  if (options?.sortOrder) params.sortOrder = options.sortOrder;

  const resp = await api.get(QuotationAPI.getAll, { params });

  return resp.data;
}

export async function getQuotationById(id: string): Promise<any> {
  const url = `${QuotationAPI.getById}?id=${encodeURIComponent(id)}`;
  const resp: AxiosResponse = await api.get(url);
  return resp.data ?? null;
}

export async function createQuotation(payload: any): Promise<any> {
  const resp: AxiosResponse = await api.post(QuotationAPI.create, payload);
  return resp.data;
}

export async function deleteQuotationById(id: string): Promise<any> {
  const resp: AxiosResponse = await api.delete(QuotationAPI.delete, {
    data: { quotation_id: id },
  });
  return resp.data;
}

export async function updateQuotationTermsById(payload: any): Promise<any> {
  const resp: AxiosResponse = await api.put(QuotationAPI.updateTerms, payload);
  return resp.data;
}

export async function updateQuotationAddressById(payload: any): Promise<any> {
  const resp: AxiosResponse = await api.put(
    QuotationAPI.updateAddress,
    payload,
  );
  return resp.data;
}

export async function updateQuotationById(payload: any): Promise<any> {
  const resp: AxiosResponse = await api.put(QuotationAPI.update, payload);
  return resp.data;
}
