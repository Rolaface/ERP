import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";
import { API, ERP_BASE } from "../config/api";

const api = createAxiosInstance(ERP_BASE);
export const TaxCategoryAPI = API.tax;

//  GET All Tax Categories 
export async function getAllTaxCategories(
  page: number = 1,
  page_size: number = 10,
  search?: string,
  disables?: 0 | 1,
  order_by: string = "modified desc"
): Promise<any> {
  const resp: AxiosResponse = await api.get(
    TaxCategoryAPI.getAllTaxCategories,
    {
      params: {
        page,
        page_size,
        order_by,
        ...(search ? { search } : {}),
        ...(disables !== undefined ? { disables } : {}),
      },
    }
  );
  return resp.data;
}

//  Create Tax Category 
export async function createTaxCategory(payload: {
  title: string;
  disabled: 0 | 1;
}): Promise<any> {
  const resp: AxiosResponse = await api.post(
    TaxCategoryAPI.createTaxCategory,
    payload
  );
  return resp.data;
}

//  Update Tax Category Status (Enable / Disable) 
export async function updateTaxCategoryStatus(
  name: string,
  disabled: 0 | 1
): Promise<any> {
  const resp: AxiosResponse = await api.put(
    TaxCategoryAPI.updateTaxCategory,
    { name, disabled }
  );
  return resp.data;
}

//  Delete Tax Category 
export async function deleteTaxCategory(name: string): Promise<any> {
  const resp: AxiosResponse = await api.post(
    TaxCategoryAPI.deleteTaxCategory,
    {
      name,
      doctype: "Tax Category",
    }
  );
  return resp.data;
}