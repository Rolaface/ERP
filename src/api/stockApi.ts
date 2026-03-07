import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";

import { API, ERP_BASE } from "../config/api";
const api = createAxiosInstance(ERP_BASE);
export const StockAPI = API.stock;

export async function createItemStock(payload: any): Promise<any> {
  const resp: AxiosResponse = await api.post(StockAPI.create, payload);
  return resp.data;
}

export async function getAllStockEntries(
  page: number,
  pageSize: number,
  search?: string,
): Promise<any> {
  const resp: AxiosResponse = await api.get(StockAPI.getAll, {
    params: {
      page,
      pageSize,
      search,
    },
  });

  return resp.data; // 🔥 DO NOT strip .data
}

export async function getStockById(id: string): Promise<any> {
  const resp: AxiosResponse = await api.get(StockAPI.getbyId, {
    params: { id },
  });
  return resp.data;
}

export async function deleteStockEntry(payload: any): Promise<any> {
  const resp: AxiosResponse = await api.delete(StockAPI.delete, {
    data: payload,
  });
  return resp.data;
}

export async function correctStock(payload: any): Promise<any> {
  const resp: AxiosResponse = await api.post(StockAPI.correct, payload);
  return resp.data;
}
export async function getStockReport(
  page: number,
  pageSize: number,
  search?: string,
): Promise<any> {
  const resp: AxiosResponse = await api.get(StockAPI.stockReport, {
    params: {
      page,
      pageSize,
      search,
    },
  });

  return resp.data;
}