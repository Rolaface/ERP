import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "../axiosInstance";

import { API, ERP_BASE } from "../../config/api";
const api = createAxiosInstance(ERP_BASE);
export const SalesOrderAPI = API.salesOrder;

export async function createSalesOrder(payload: any): Promise<any> {
  const resp: AxiosResponse = await api.post(SalesOrderAPI.create, payload);
  return resp.data;
}

export async function getSalesOrderById(id: string): Promise<any | null> {
  const url = `${SalesOrderAPI.getById}?id=${encodeURIComponent(id)}`;
  const resp: AxiosResponse = await api.get(url);
  return resp.data ?? null;
}

export async function updateSalesOrderStatus(
  salesOrderId: string,
  status: string,
) {
  const resp = await api.patch(SalesOrderAPI.updateStatus, {
    id: salesOrderId,
    action: status,
  });

  return resp.data;
}

export interface SalesOrderFilters {
  customer?: string;
  status?: string;
  from_date?: string;
  to_date?: string;
  company?: string;
  [key: string]: any;
}

export async function getAllSalesOrders(
  page: number = 1,
  page_size: number = 10,
  sortBy: string = "",
  sortOrder: "asc" | "desc" = "asc",
  search?: string,
  filters?: SalesOrderFilters
): Promise<any> {
  const resp: AxiosResponse = await api.get(SalesOrderAPI.getAll, {
    params: {
      page,
      page_size,
      sortBy,
      sortOrder,
      search,
      ...filters,
    },
  });
  return resp.data;
}

export async function deleteSalesOrderById(salesOrderId: string) {
  const resp = await api.delete(SalesOrderAPI.delete, {
    data: { id: salesOrderId },
  });

  return resp.data;
}

export async function editSalesOrder(
  id: string,
  payload: any
): Promise<any> {
  const resp: AxiosResponse = await api.put(
    `${SalesOrderAPI.edit}?id=${encodeURIComponent(id)}`,
    payload,
  );
  return resp.data;
}