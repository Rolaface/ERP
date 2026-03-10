import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";

import { API, ERP_BASE } from "../config/api";
const api = createAxiosInstance(ERP_BASE);
export const CustomerAPI = API.customer;
export const SupplierAPI = API.supplier;

export async function getCustomerStatement(
  customerId: string,
  page: number = 1,
  page_size: number = 10,
): Promise<any> {
  const resp: AxiosResponse = await api.get(CustomerAPI.getStatement, {
    params: {
      id: customerId,
      page,
      page_size,
    },
  });

  return resp.data;
}
export async function getSupplierStatement(
  supplierId: string,
  page: number = 1,
  page_size: number = 10
): Promise<any> {
  const resp: AxiosResponse = await api.get(SupplierAPI.getStatement, {
    params: {
      supplierId: supplierId,
      page,
      page_size,
    },
  });

  return resp.data;
}