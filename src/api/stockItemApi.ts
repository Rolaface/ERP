import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";

import { API, ERP_BASE } from "../config/api";
const api = createAxiosInstance(ERP_BASE);
export const ItemAPI = API.item;

export async function getStockById(id: string) {
  const resp = await api.get(
    `/api/method/erpnext.zra_client.stock.stock.get_stock_by_id`,
    {
      params: { id },
    },
  );
  return resp.data?.data || {};
}

export async function getAllStockItems() {
  const url = `${ERP_BASE}/api/method/erpnext.zra_client.stock.stock.get_all_stock_entries`;
  const resp = await api.get(url);
  return resp.data?.data || [];
}
export async function deleteItemByItemCode(id: string): Promise<any> {
  const url = `${ItemAPI.delete}?id=${id}`;
  const resp: AxiosResponse = await api.delete(url);
  return resp.data;
}
