import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "../axiosInstance";



import { API, ERP_BASE } from "../../config/api";
const api = createAxiosInstance(ERP_BASE);
export const purchaseinvoiceapi = API.purchaseInvoice;


export interface PurchaseInvoiceFilters {
  search?: string;
  status?: string | string[];
  from_date?: string;
  to_date?: string;
  supplier?: string;
  sort_order?: "asc" | "desc";
}

export async function getPurchaseInvoices(
  page = 1,
  pageSize = 10,
  filters?: PurchaseInvoiceFilters
) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("page_size", String(pageSize));

  if (filters) {
    const { status, ...rest } = filters;
    Object.entries(rest).forEach(([k, v]) => {
      if (v != null) params.set(k, String(v));
    });
    if (status) {
      const statuses = Array.isArray(status) ? status : [status];
      statuses.forEach((s) => params.append("status", s));
    }
  }

  const resp = await api.get(purchaseinvoiceapi.getAll, { params });

  return resp.data;
}

export async function createPurchaseInvoice(payload: any): Promise<any> {
  const resp: AxiosResponse = await api.post(purchaseinvoiceapi.create, payload);
  return resp.data;
}


export async function getPurchaseInvoiceById(
  pId: string | number
) {
  const resp = await api.get(
    `${purchaseinvoiceapi.getById}?id=${pId}`
  );

  return resp.data;
}


export async function getItemDetailsByBarcodeId(
  barcode: string | number
) {
  const resp = await api.get(
    `${purchaseinvoiceapi.getItemByBarCode}?id=${barcode}`
  );

  return resp.data;
}

// UPDATE STATUS
export async function updatePurchaseinvoiceStatus(
  id: string | number,
  status: string
): Promise<any> {
  const payload = {
    id,
    status,
  };

  const resp: AxiosResponse = await api.patch(
    purchaseinvoiceapi.updateStatus,
    
    payload
  );

  return resp.data;
}

export async function deletePi(name: string): Promise<any> {
  const resp: AxiosResponse = await api.post(
    purchaseinvoiceapi.delete,
    {
      name,
      doctype: "Purchase Invoice",
    }
  );
  return resp;
}


export async function updatePurchaseInvoice(
  id: string | number,
  payload: any
): Promise<any> {
  const resp: AxiosResponse = await api.put(
    `${purchaseinvoiceapi.update}?id=${id}`,
    payload
  );
  return resp.data;
}