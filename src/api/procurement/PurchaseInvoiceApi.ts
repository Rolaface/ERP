import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "../axiosInstance";

import { API, ERP_BASE } from "../../config/api";
const api = createAxiosInstance(ERP_BASE);
export const purchaseinvoiceapi = API.purchaseIvoice;

export interface PurchaseInvoiceFilters {
  search?: string;
  status?: string;
  from_date?: string;
  to_date?: string;
  supplier?: string;
}

export async function getPurchaseInvoices(
  page = 1,
  pageSize = 10,
  filters?: PurchaseInvoiceFilters,
) {
  const resp = await api.get(purchaseinvoiceapi.getAll, {
    params: {
      page,
      page_size: pageSize,
      ...filters,
    },
  });

  return resp.data;
}

export async function createPurchaseInvoice(payload: any): Promise<any> {
  const resp: AxiosResponse = await api.post(
    purchaseinvoiceapi.create,
    payload,
  );
  return resp.data;
}

export async function getPurchaseInvoiceById(pId: string | number) {
  const resp = await api.get(`${purchaseinvoiceapi.getById}?id=${pId}`);

  return resp.data;
}

export async function deletePurchaseInvoice(id: string | number): Promise<any> {
  try {
    const resp = await api.delete(purchaseinvoiceapi.delete, {
      params: { id },
      validateStatus: () => true,
    });

    return (
      resp.data ?? {
        status: resp.status >= 200 && resp.status < 300 ? "success" : "error",
        status_code: resp.status,
        message: resp.statusText || "Operation failed",
      }
    );
  } catch (error: any) {
    return (
      error?.response?.data ?? {
        status: "error",
        status_code: error?.response?.status,
        message: error?.message || "Operation failed",
      }
    );
  }
}

// UPDATE STATUS
export async function updatePurchaseinvoiceStatus(
  id: string | number,
  status: string,
): Promise<any> {
  const payload = {
    id,
    status,
  };

  const resp: AxiosResponse = await api.patch(
    purchaseinvoiceapi.updateStatus,

    payload,
  );

  return resp.data;
}
