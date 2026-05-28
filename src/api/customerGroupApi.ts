import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";
import { API, ERP_BASE } from "../config/api";

const api = createAxiosInstance(ERP_BASE);

export const CustomerGroupAPI = API.customerGroup;

export interface RestrictionItem {
  target_type: string;
  item?: string;
  item_group?: string;
}

export interface CustomerGroupRestrictions {
  restriction_mode?: string; // e.g., "Allow", "Deny"
  enabled?: boolean | number; // 0 or 1
  items?: RestrictionItem[];
}

export interface CustomerGroupPayload {
  customer_group_name: string;
  parent_customer_group?: string; // Falls back to "All Customer Groups" in backend if omitted
  is_group?: boolean | number;
  default_price_list?: string;
  payment_terms?: string;
  restrictions?: CustomerGroupRestrictions;
}

export interface GetCustomerGroupsParams {
  search?: string;
  parent_customer_group?: string;
  is_group?: boolean | number;
  as_tree?: boolean | number; // default is 1 in backend
  page?: number; // default is 1
  page_size?: number; // default is 100
}

export async function createCustomerGroup(payload: CustomerGroupPayload): Promise<any> {
  const resp: AxiosResponse = await api.post(CustomerGroupAPI.create, payload);
  return resp.data;
}

export async function getCustomerGroups(params?: GetCustomerGroupsParams): Promise<any> {
  const resp: AxiosResponse = await api.get(CustomerGroupAPI.getAll, { params });
  return resp.data;
}

export async function getCustomerGroupById(id: string): Promise<any> {
  const url = `${CustomerGroupAPI.getById}?id=${encodeURIComponent(id)}`;
  const resp: AxiosResponse = await api.get(url);
  return resp.data;
}

export async function updateCustomerGroup(
  id: string,
  payload: Partial<CustomerGroupPayload>
): Promise<any> {
  const url = `${CustomerGroupAPI.update}?id=${encodeURIComponent(id)}`;
  const resp: AxiosResponse = await api.put(url, payload);
  return resp.data;
}

export async function deleteCustomerGroupById(id: string): Promise<any> {
  const url = `${CustomerGroupAPI.delete}?id=${encodeURIComponent(id)}`;
  const resp: AxiosResponse = await api.delete(url);
  return resp.data;
}