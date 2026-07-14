import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";
import { API, ERP_BASE } from "../config/api";

const api = createAxiosInstance(ERP_BASE);
export const LeaveAPI = API.company;

interface FrappeSearchLinkItem {
  value: string;
  description?: string;
}

interface FrappeSearchLinkResponse {
  message: FrappeSearchLinkItem[];
}

export interface RoleOption {
  id: string;
  name: string;
}

export async function getAllCreditLimit(
  search?: string,
  pageLength: number = 20,
): Promise<RoleOption[]> {
  
   const endpoint = LeaveAPI.getCreditLimitRole.split('?')[0];

  const resp: AxiosResponse<FrappeSearchLinkResponse> = await api.get(
    endpoint,
    {
      params: {
        doctype: "Role",
        txt: search || "",
        page_length: pageLength,
      },
    },
  );

  const items = resp.data?.message ?? [];

  return items.map((item) => ({
    id: item.value,
    name: item.description ? `${item.value} (${item.description})` : item.value,
  }));
}