import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";
import { API, ERP_BASE } from "../config/api";


const api = createAxiosInstance(ERP_BASE);
export const TaxCategoryAPI = API.tax;

export async function getAllTaxCategories(
  page: number = 1,
  page_size: number = 10
): Promise<any> {
  try {
    const resp: AxiosResponse = await api.get(
      TaxCategoryAPI.getAllTaxCategories,
      {
        params: {
          page,
          page_size,
        },
      }
    );

   
    return resp.data;

  } catch (error: any) {
    console.error("Something went wrong", error?.response || error);
    throw error;
  }
}
export async function createTaxCategory(payload: {
  title: string;
  disabled: number;
}): Promise<any> {
  try {
    const resp: AxiosResponse = await api.post(
      TaxCategoryAPI.createTaxCategory,
      payload
    );

    return resp.data;

  } catch (error: any) {
    console.error("Create Tax Category failed", error?.response || error);
    throw error;
  }
}