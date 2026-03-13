import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";

import { API, ERP_BASE } from "../config/api";

const api = createAxiosInstance(ERP_BASE);

export const WarehouseAPI = API.warehouse;


export async function getAllWarehouses(): Promise<string[]> {
  const resp: AxiosResponse = await api.get(WarehouseAPI.getAllWarehouses);

  const warehouses = resp?.data?.message?.data?.ware_house;

  if (!warehouses) return [];

  if (Array.isArray(warehouses)) {
    return warehouses;
  }

  return [warehouses];
}