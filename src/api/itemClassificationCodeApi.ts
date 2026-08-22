import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";
import { API, ERP_BASE } from "../config/api";

const api = createAxiosInstance(ERP_BASE);
export const ItemClassificationAPI = API.itemClassification;

export interface ItemClassification {
  id: string;
  class_code: string;
  class_name: string;
  class_level: number;
  is_active: boolean;
}

interface ItemClassificationListResponse {
  status_code: number;
  status: "success" | "fail";
  message: string;
  data: ItemClassification[];
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

export async function getItemClassifications(
  page = 1,
  page_size = 3000,
  search = "",
): Promise<ItemClassificationListResponse> {
  const resp: AxiosResponse<ItemClassificationListResponse> = await api.get(
    ItemClassificationAPI.getAll,
    {
      params: {
        page,
        page_size,
        search,
      },
    },
  );

  return resp.data;
}
export async function getItemClassificationByCode(
  class_code: string,
): Promise<ItemClassification | null> {
  const resp: AxiosResponse<{ data: ItemClassification }> = await api.get(
    ItemClassificationAPI.getByCode,
    {
      params: { class_code },
    },
  );

  return resp.data?.data ?? null;
}