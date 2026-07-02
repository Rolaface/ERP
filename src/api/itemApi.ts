import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";

import { API, ERP_BASE } from "../config/api";
import { buildListParams } from "./utils/queryBuilder";
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
  search = "",
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
      search,
      ...cleanedFilters,
    },
  });

  return resp.data;
}

export async function getItemByItemCode(
  itemCode: string,
  taxCategory?: string,
): Promise<any> {
  const resp: AxiosResponse = await api.get(ItemAPI.getById, {
    params: {
      id: itemCode,
      taxCategory: taxCategory ?? "",
    },
  });

  return resp.data || null;
}

export async function deleteItemByItemCode(name: string): Promise<any> {
  const url = ItemAPI.delete;

  const resp: AxiosResponse = await api.post(url, {
    name: name,
    doctype: "Item",
  });

  return resp;
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

interface LinkResult {
  value: string;
  description?: string;
  label?: string;
}

interface LinkResponse {
  message: LinkResult[];
}

export async function getBrands(
  txt = "",
): Promise<Array<{ label: string; value: string }>> {
  try {
    const resp: AxiosResponse<LinkResponse> = await api.get(ItemAPI.brand, {
      params: {
        doctype: "Brand",
        txt,
        ignore_user_permissions: 0,
        reference_doctype: "Item",
        page_length: 20,
      },
    });

    const results = resp.data?.message ?? [];

    return results.map((r) => ({
      label: r.label || r.value,
      value: r.value,
    }));
  } catch {
    return [];
  }
}


export interface ItemGroupSearchOption {
  value: string;
  label: string;
  description?: string;
}

interface ItemGroupSearchResponse {
  status_code: number;
  status: "success" | "fail";
  message: string;
  data: ItemGroupSearchOption[];
  pagination?: {
    page: number;
    page_size: number;
    items_in_page: number;
    total_items: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
  };
}

export async function getItemGroups(
  search?: string,
): Promise<ItemGroupSearchOption[]> {
  const resp: AxiosResponse<ItemGroupSearchResponse> = await api.get(
    API.item.getAllItemGroup,
    { params: search ? { search } : {} },
  );
  return resp.data?.data ?? [];
}


interface PackagingUOMItem {
  name: string;
}

interface PackagingUOMApiResponse {
  data?: PackagingUOMItem[];
}

export async function getPackagingUOM(
  search = "",
): Promise<Array<{ label: string; value: string }>> {
  try {
    const queryString = buildListParams({
      fields: ["name"],
      pageSize: 20,
      search,
      searchFields: ["name"],
    });

    const resp: AxiosResponse<PackagingUOMApiResponse> = await api.get(
      `${ItemAPI.packaging_uom}?${queryString}`,
    );

    const results = resp.data?.data ?? [];

    return results.map((r) => ({
      label: r.name,
      value: r.name,
    }));
  } catch {
    return [];
  }
}