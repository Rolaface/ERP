import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";
import { API } from "../config/api";
import { ENV } from "../config/env";

const api = createAxiosInstance(ENV.apiBaseUrl);

export async function createItemStock(payload: any): Promise<any> {
  const resp: AxiosResponse = await api.post(API.stock.create, payload);
  return resp.data;
}

// Fetch all items for import table
export async function getAllItemsApi(params: {
  page?: number;
  page_size?: number;
  taxCategory?: string;
}): Promise<any> {
  const resp: AxiosResponse = await api.get(API.item.getAll, {
    params,
  });
  return resp.data?.data || [];
}

export async function getAllStockEntries(): Promise<any> {
  const resp: AxiosResponse = await api.get(API.stock.getAll);
  return resp.data?.data || [];
}

export async function deleteStockEntry(payload: any): Promise<any> {
  const resp: AxiosResponse = await api.delete(API.stock.delete, {
    data: payload,
  });
  return resp.data;
}

export async function correctStock(payload: any): Promise<any> {
  const resp: AxiosResponse = await api.post(API.stock.correct, payload);
  return resp.data;
}

// Fetch all import items
export async function getAllImportItems(): Promise<any> {
  const resp: AxiosResponse = await api.get(API.import.getAll);
  return resp.data?.data || [];
}

// Fetch import item by ID
export async function getImportItemById(id: string): Promise<any> {
  const url = `${API.import.getById}?id=${id}`;
  const resp: AxiosResponse = await api.get(url);
  return resp.data?.data || null;
}

// Update stock automatic (approve/reject import item)
export async function updateStockAutomatic(payload: {
  id: string;
  status: string;
  itemClassCd: string;
}): Promise<any> {
  const resp: AxiosResponse = await api.put(
    API.import.updateAutomatic,
    payload,
  );
  return resp.data;
}
