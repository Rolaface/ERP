import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";
import { API, ERP_BASE } from "../config/api";

const api = createAxiosInstance(ERP_BASE);
export const NamingSeriesAPI = API.NamingSeries;

export async function getNamingSeriesSettings(): Promise<any> {
  const resp: AxiosResponse = await api.get(NamingSeriesAPI.get_naming_series);
  return resp.data;
}

export async function updateNamingSeriesSettings(
  payload: Record<string, string>
): Promise<any> {
  const resp: AxiosResponse = await api.patch(
    NamingSeriesAPI.create_naming_series,
    payload
  );
  return resp.data;
}