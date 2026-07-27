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

  return resp.data; 
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
  page_size: number,
  search?: string,
  taxCategory?: string,
  get_service_item?: number,
): Promise<any> {
  const resp = await api.get(StockAPI.stockReport, {
    params: {
      page,
      page_size,
      search,
      taxCategory: taxCategory ?? "", 
      get_service_item,
    },
  });

  return resp.data;
}

// ── Stock Ledger (Frappe query report) ──────────────────────────────────

export interface StockLedgerFilters {
  company?: string;
  from_date: string;
  to_date: string;
  warehouse?: string[];
  item_code?: string[];
  item_group?: string; 
  
  batch_no?: string;
  brand?: string; 
  valuation_field_type?: "Currency" | "Float";
  include_serial_batch_bundle?: 0 | 1;
}

export async function getStockLedger(filters: StockLedgerFilters): Promise<any> {
  const reportFilters = {
     company: filters.company,
    from_date: filters.from_date,
    to_date: filters.to_date,
    warehouse: filters.warehouse ?? [],
    item_code: filters.item_code ?? [],
    ...(filters.batch_no ? { batch_no: filters.batch_no } : {}),
    ...(filters.item_group ? { item_group: filters.item_group } : {}),  
    ...(filters.brand ? { brand: filters.brand } : {}),
    valuation_field_type: filters.valuation_field_type ?? "Currency",
    include_serial_batch_bundle: filters.include_serial_batch_bundle ?? 1,
  };

  const resp: AxiosResponse = await api.get(StockAPI.stockLedger, {
    params: {
      report_name: "Stock Ledger",
      filters: JSON.stringify(reportFilters),
    },
  });

  return resp.data;
}