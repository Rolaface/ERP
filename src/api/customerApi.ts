import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";
import { API, ERP_BASE } from "../config/api";


const api = createAxiosInstance(ERP_BASE);
export const CustomerAPI = API.customer;

export async function getAllCustomers(
  page: number = 1,
  page_size: number = 5,
  taxCategory?: string,
): Promise<any> {
  const resp: AxiosResponse = await api.get(CustomerAPI.getAll, {
    params: {
      page,
      page_size,
      ...(taxCategory && { taxCategory }),
    },
  });
  return resp.data;
}

export async function getCustomerByCustomerCode(id: string): Promise<any> {
  const url = `${CustomerAPI.getById}?id=${id}`;
  const resp: AxiosResponse = await api.get(url);
  return resp.data;
}


export async function createCustomer(payload: any): Promise<any> {
  const resp: AxiosResponse = await api.post(CustomerAPI.create, payload);
  return resp.data;
}


export async function updateCustomerByCustomerCode(
  id: string,
  payload: any,
): Promise<any> {
  const url = `${CustomerAPI.update}?id=${id}`;
  const resp: AxiosResponse = await api.patch(url, payload);
  return resp.data;
}

export async function deleteCustomerById(id: string): Promise<any> {
  const url = `${CustomerAPI.delete}?id=${id}`;
  const resp: AxiosResponse = await api.delete(url);
  return resp.data;
}

export async function getCustomerGroups(search?: string): Promise<any> {
  const resp: AxiosResponse = await api.get(CustomerAPI.group, {
    params: {
      ...(search && { search }),
    },
  });
  return resp.data;
}


export async function getCustomerGroupTree(): Promise<any[]> {
  const resp: AxiosResponse = await api.get(CustomerAPI.grouptree);

  const body = resp?.data?.message || resp?.data;

  if (body?.status_code === 200) {
    return body.data.customer_groups || [];
  }

  throw new Error(body?.message || "Failed to fetch customer group tree");
}
export async function updateCustomerStatus(
  id: string,
  status: "active" | "inactive"
): Promise<any> {
  const url = `${CustomerAPI.updateStatus}?id=${id}`;

  const resp: AxiosResponse = await api.patch(url, {
    status,
  });

  return resp.data;
}