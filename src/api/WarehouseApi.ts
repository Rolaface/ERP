import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";
import { API, ERP_BASE } from "../config/api";

const api = createAxiosInstance(ERP_BASE);
export const WarehouseAPI = API.warehouse;

export interface GetWrehousePayload {
  is_disabled:0|1;
}

export async function getAllWarehouses(
  payload :GetWrehousePayload 
): Promise<string[]> {
  const resp: AxiosResponse = await api.get(WarehouseAPI.getAllWarehouses,{
    params:payload
  });
  const warehouses = resp?.data?.message?.data?.ware_house;
  if (!warehouses) return [];
  if (Array.isArray(warehouses)) return warehouses;
  return [warehouses];
}

export async function getWarehouseTree(): Promise<any> {
  const resp: AxiosResponse = await api.get(WarehouseAPI.getAll);
  return resp.data;
}
export interface CreateWarehousePayload {
  warehouse_name: string;
  is_group: 0 | 1;
  company: string;
  parent: string;
  doctype: "Warehouse";
  is_root: "false" | "true";
  custom_warehouse_code?: string;
}

export async function createWarehouseNode(
  payload: CreateWarehousePayload,
): Promise<any> {
  const resp: AxiosResponse = await api.post(
    WarehouseAPI.create,
    payload
  );
  return resp;
}
export async function deleteWarehouseById(id: string): Promise<any> {
  const url = `${WarehouseAPI.delete}/${id}`;
  const resp: AxiosResponse = await api.delete(url);
  return resp;
}

export async function updateWarehouseById(id: string, payload: any): Promise<any> {
  const url = `${WarehouseAPI.update}/${id}`;
  
  const data: Record<string, any> = {
    is_group: payload.is_group,
    parent_warehouse: payload.parent 
  };
  if (payload.custom_warehouse_code !== undefined) {
    data.custom_warehouse_code = payload.custom_warehouse_code;
  }

  const resp: AxiosResponse = await api.put(url, data);
  return resp;
}
