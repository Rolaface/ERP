// src/api/pdcApi.ts
import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";

import { API, ERP_BASE } from "../config/api";
const api = createAxiosInstance(ERP_BASE);
export const PdcAPI = API.pdc;

export type PdcStatus = "Unused" | "Used" | "Expired" | "Discard";

export interface CreatePdcPayload {
  document_type: string; // e.g. "Sales Invoice"
  document_name: string; // e.g. "RCN/2627/0199"
  cheque_reference_number: string;
  cheque_date: string; // yyyy-mm-dd
  amount: string;
  status: PdcStatus;
  attachment?: File | null;
}

export async function createPdcInvoice(payload: CreatePdcPayload): Promise<any> {
  const formData = new FormData();
  formData.append("document_type", payload.document_type);
  formData.append("document_name", payload.document_name);
  formData.append(
    "cheque_reference_number",
    payload.cheque_reference_number,
  );
  formData.append("cheque_date", payload.cheque_date);
  formData.append("amount", payload.amount);
  formData.append("status", payload.status);
  if (payload.attachment) {
    formData.append("attachment", payload.attachment);
  }

  const resp: AxiosResponse = await api.post(PdcAPI.create, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return resp.data;
}

export async function updatePdcInvoice(
  name: string,
  payload: CreatePdcPayload,
): Promise<any> {
  const formData = new FormData();
  formData.append("document_type", payload.document_type);
  formData.append("document_name", payload.document_name);
  formData.append(
    "cheque_reference_number",
    payload.cheque_reference_number,
  );
  formData.append("cheque_date", payload.cheque_date);
  formData.append("amount", payload.amount);
  formData.append("status", payload.status);
  if (payload.attachment) {
    formData.append("attachment", payload.attachment);
  }

  const resp: AxiosResponse = await api.put(
    `${PdcAPI.update}?name=${encodeURIComponent(name)}`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );

  return resp.data;
}

export async function deletePdcInvoiceById(name: string): Promise<any> {
  const url = `${PdcAPI.delete}?name=${encodeURIComponent(name)}`;
  const resp: AxiosResponse = await api.delete(url);
  return resp.data;
}

export async function getAllPdcInvoices(
  page: number = 1,
  page_size: number = 10,
  sortBy: string = "",
  sortOrder: "asc" | "desc" = "asc",
  search?: string,
  status?: string,
  from_date?: string,
  to_date?: string,
): Promise<any> {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("page_size", String(page_size));
  if (sortBy) params.set("order_by", `${sortBy} ${sortOrder}`);
  if (search) params.set("search", search);
  if (status) params.set("status", status);
  if (from_date) params.set("from_date", from_date);
  if (to_date) params.set("to_date", to_date);

  const resp: AxiosResponse = await api.get(PdcAPI.getAll, { params });

  return resp.data;
}
export async function downloadPdcAttachment(fileUrl: string): Promise<void> {
  const resp: AxiosResponse<Blob> = await api.get(fileUrl, {
    responseType: "blob",
  });

  const blobUrl = URL.createObjectURL(resp.data);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = fileUrl.split("/").pop() || "attachment";
  document.body.appendChild(a);
 a.click();
 document.body.removeChild(a);
  URL.revokeObjectURL(blobUrl);
}