import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "../axiosInstance";
import { API, ERP_BASE } from "../../config/api";

const api = createAxiosInstance(ERP_BASE);
export const FrappeUtilsAPI = API.frappeUtilsAPI;

export async function getCompanyCurrentFiscalYear(
): Promise<any> {
  const resp: AxiosResponse = await api.get(
    FrappeUtilsAPI.getCompanyCurrentFiscalYear,
  );

  return resp.data?.message ?? [];
}