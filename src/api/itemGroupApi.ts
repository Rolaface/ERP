import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";

import { API, ERP_BASE } from "../config/api";
const api = createAxiosInstance(ERP_BASE);
export const ItemGroupAPI = API.itemGroup;

export async function getItemGroupTree(): Promise<any> {
  const resp: AxiosResponse = await api.get(ItemGroupAPI.getAll);
  return resp.data;
}


export interface CreateItemGroupPayload {
  item_group_name: string;
  is_group: 0 | 1;
  parent: string;
  doctype: "Item Group";
  is_root: "false" | "true";
}

export async function createItemGroupNode(
  payload: CreateItemGroupPayload,
): Promise<any> {
  const resp: AxiosResponse = await api.post(ItemGroupAPI.create, payload);
  return resp;
}

export async function deleteItemGroupById(id: string): Promise<any> {
  const url = `${ItemGroupAPI.delete}/${id}`;
  const resp: AxiosResponse = await api.delete(url);
  return resp;
}