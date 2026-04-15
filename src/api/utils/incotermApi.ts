import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "../axiosInstance";
import { API, ERP_BASE } from "../../config/api";



const api = createAxiosInstance(ERP_BASE);
export const IncotermAPI = API.IncotermsApi

// ✅ Type
export interface Incoterm {
  value: string;
  label: string;
  description?: string;
}


export async function getIncoterms(
  search?: string
): Promise<Incoterm[]> {
  const resp: AxiosResponse = await api.get(
    IncotermAPI.getIncoterms,
    {
      params: {
        search, // backend search support
      },
    }
  );

  return resp.data?.data ?? [];
}