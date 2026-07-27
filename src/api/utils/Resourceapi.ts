import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "../axiosInstance";
import { API, ERP_BASE } from "../../config/api";

const api = createAxiosInstance(ERP_BASE);

export interface LookupOption {
  value: string;
  label: string;
}


export async function searchBatches(
  query: string,
  page: number,
  pageSize: number,
  itemCode?: string,
): Promise<{ data: LookupOption[] }> {
  const filters: any[] = [];
  if (itemCode) filters.push(["item", "=", itemCode]);
  if (query) filters.push(["name", "like", `%${query}%`]);

  const resp: AxiosResponse = await api.get(API.resource.batch, {
    params: {
      filters: JSON.stringify(filters),
      fields: JSON.stringify(["name"]),
      limit_page_length: pageSize,
      limit_start: (page - 1) * pageSize,
    },
  });

  const data: LookupOption[] = (resp.data?.data ?? []).map((b: any) => ({
    value: b.name,
    label: b.name,
  }));

  return { data };
}


export async function searchItemGroups(
  query: string,
  page: number,
  pageSize: number,
): Promise<{ data: LookupOption[] }> {
  const filters: any[] = [];
  if (query) filters.push(["name", "like", `%${query}%`]);

  const resp: AxiosResponse = await api.get(API.resource.itemGroup, {
    params: {
      filters: JSON.stringify(filters),
      fields: JSON.stringify(["name"]),
      limit_page_length: pageSize,
      limit_start: (page - 1) * pageSize,
    },
  });

  const data: LookupOption[] = (resp.data?.data ?? []).map((g: any) => ({
    value: g.name,
    label: g.name,
  }));

  return { data };
}
export async function searchBrands(
  query: string,
  page: number,
  pageSize: number,
): Promise<{ data: LookupOption[] }> {
  const filters: any[] = [];
  if (query) filters.push(["name", "like", `%${query}%`]);

  const resp: AxiosResponse = await api.get(API.resource.brand, {
    params: {
      filters: JSON.stringify(filters),
      fields: JSON.stringify(["name"]),
      limit_page_length: pageSize,
      limit_start: (page - 1) * pageSize,
    },
  });

  const data: LookupOption[] = (resp.data?.data ?? []).map((b: any) => ({
    value: b.name,
    label: b.name,
  }));

  return { data };
}