import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";
import { API , ERP_BASE } from "../config/api";

const api = createAxiosInstance(ERP_BASE);
export const getAllApi = API.Get.getAll; 
export type SearchOption = {
  label: string;
  value: string;
};

type RawResult = {
  value: string;
  description: string;
};

type SearchResponse = {
  message: RawResult[];
};

async function searchErpLink(
  doctype: "Tax Category" | "Cost Center",
  txt = "",
  pageLength = 10
): Promise<SearchOption[]> {
  const resp: AxiosResponse<SearchResponse> = await api.post(
    getAllApi,
    { page_length: pageLength, doctype, txt }
  );
  return (resp.data?.message ?? []).map((item) => ({
    value: item.value,
    label: item.value,
  }));
}

export const fetchTaxCategories = (txt = "") =>
  searchErpLink("Tax Category", txt);

export const fetchCostCenters = (txt = "") =>
  searchErpLink("Cost Center", txt);