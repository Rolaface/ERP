import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "../axiosInstance";


import { API, ERP_BASE } from "../../config/api";
const api = createAxiosInstance(ERP_BASE);

export const SupplierAPI = API.supplier;

export interface SupplierFilters {
  search?: string;
  status?: string;
  currency?: string;
}



export async function getSuppliers(
  page: number = 1,
  page_size: number = 10,
  filters?: SupplierFilters
): Promise<any> {
  const resp: AxiosResponse = await api.get(SupplierAPI.getAll, {
    params: {
      page,
      page_size,
      ...filters,
    },
  });

  return resp.data;
}

export async function createSupplier(payload: any): Promise<any> {
  const resp: AxiosResponse = await api.post(SupplierAPI.create, payload);
  return resp.data;
}

export async function getSupplierById(id: string | number): Promise<any> {
  const resp = await api.get(
    `${SupplierAPI.getById}?supplierId=${id}`
  );
  return resp.data;
}


export async function updateSupplier(payload: any): Promise<any> {
  const resp: AxiosResponse = await api.patch(SupplierAPI.update, payload);
  return resp.data;
}

export async function deleteSupplier(id: string | number): Promise<any> {
  const resp: AxiosResponse = await api.delete(SupplierAPI.delete, {
    data: { supplierId: id },   
  });
  return resp.data;
}
export const createSupplierPayment = async (payload: any) => {
  try {
    const res = await fetch(API.supplier.CreatePayment, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    return await res.json();
  } catch (error) {
    throw error;
  }
};