import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";
import { API, ERP_BASE } from "../config/api";

const api = createAxiosInstance(ERP_BASE);
export const WarehouseAPI = API.warehouse;

export async function getAllWarehouses(): Promise<string[]> {
  const resp: AxiosResponse = await api.get(WarehouseAPI.getAllWarehouses);
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