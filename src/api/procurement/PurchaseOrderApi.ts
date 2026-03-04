import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "../axiosInstance";

import { API, ERP_BASE } from "../../config/api";
const api = createAxiosInstance(ERP_BASE);
export const purchaseorderapi = API.purchaseOrder;

export interface PurchaseOrderFilters {
  search?: string;
  status?: string;
  supplier?: string;
  from_date?: string;
  to_date?: string;
}

export async function getPurchaseOrders(
  page = 1,
  page_size = 10,
  filters?: PurchaseOrderFilters,
) {
  const cleanedFilters = Object.fromEntries(
    Object.entries(filters || {}).filter(
      ([_, v]) => v !== undefined && v !== "",
    ),
  );

  const resp = await api.get(purchaseorderapi.getAll, {
    params: {
      page,
      page_size,
      ...cleanedFilters,
    },
  });

  return resp.data;
}

export async function createPurchaseOrder(payload: any): Promise<any> {
  const resp: AxiosResponse = await api.post(purchaseorderapi.create, payload);
  return resp.data;
}

export async function getPurchaseOrderById(id: string | number): Promise<any> {
  const resp = await api.get(`${purchaseorderapi.getById}?id=${id}`);
  return resp.data;
}

export async function deletePurchaseOrder(id: string | number): Promise<any> {
  try {
    const resp = await api.delete(purchaseorderapi.delete, {
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

export async function getPurchaseOrdersBySupplier(
  supplierName: string,
  page = 1,
  pageSize = 5,
  status = "",
) {
  const resp = await api.get(purchaseorderapi.getAll, {
    params: {
      supplier: supplierName,
      page,
      page_size: pageSize,
      status,
    },
  });

  return {
    data: resp.data?.data || [],
    pagination: resp.data?.pagination || {
      total: 0,
      total_pages: 1,
    },
  };
}

export async function updatePurchaseOrderStatus(
  id: string,
  status: string,
): Promise<any> {
  const resp: AxiosResponse = await api.patch(purchaseorderapi.updateStatus, {
    id,
    status,
  });
  return resp.data;
}
