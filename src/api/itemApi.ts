import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";

import { API, ERP_BASE } from "../config/api";
const api = createAxiosInstance(ERP_BASE);
export const ItemAPI = API.item;

export interface ItemFilters {
  search?: string;
  taxCategory?: string;
}

export async function getAllItems(
  page = 1,
  page_size = 10,
  filters?: ItemFilters,
): Promise<any> {
  const cleanedFilters = Object.fromEntries(
    Object.entries(filters || {}).filter(
      ([_, v]) => v !== undefined && v !== "",
    ),
  );

  const resp: AxiosResponse = await api.get(ItemAPI.getAll, {
    params: {
      page,
      page_size,
      ...cleanedFilters,
    },
  });

  return resp.data;
}

export async function getItemByItemCode(itemCode: string): Promise<any> {
  const url = `${ItemAPI.getById}?id=${itemCode}`;
  const resp: AxiosResponse = await api.get(url);
  return resp.data || null;
}

export async function deleteItemByItemCode(id: string): Promise<any> {
  const url = `${ItemAPI.delete}?id=${id}`;
  const resp: AxiosResponse = await api.delete(url);
  return resp.data;
}

export async function createItem(payload: any): Promise<any> {
  const resp: AxiosResponse = await api.post(ItemAPI.create, payload);
  return resp.data;
}

export async function updateItemByItemCode(
  item_code: string,
  payload: any,
): Promise<any> {
  const url = `${ItemAPI.update}?item_code=${item_code}`;
  const resp: AxiosResponse = await api.put(url, payload);
  return resp.data;
}
