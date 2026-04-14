import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "../axiosInstance";
import { API, ERP_BASE } from "../../config/api";





const api = createAxiosInstance(ERP_BASE);
export const ShippingAPI = API.ShippingAPI;


export interface ShippingRule {
  value: string;
  label: string;
  description?: string;
}


export async function getShippingRules(
  search?: string
): Promise<ShippingRule[]> {
  const resp: AxiosResponse = await api.get(
    ShippingAPI.getshipping,
    {
      params: {
        search,
      },
    }
  );

  return resp.data?.data ?? [];
}