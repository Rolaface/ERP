
import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";
import { API, ERP_BASE } from "../config/api";

const api = createAxiosInstance(ERP_BASE);
export const TemplateAPI = API.salesTax;



export async function createTemplate(payload: any): Promise<any> {
  const resp: AxiosResponse = await api.post(TemplateAPI.createSalesTemplate, payload);
  return resp.data;
}

export async function getAllTemplates(
  page: number,
  pageSize: number,
  search?: string
): Promise<any> {
  const resp: AxiosResponse = await api.get(TemplateAPI.getsalesTemplates, {
    params: {
      page,
      page_size: pageSize,
      order_by: "title",
      ...(search ? { search } : {}), 
    },
  });
  return resp.data;
}

export async function deleteSalesTemplate(name: string): Promise<any> {
  const resp: AxiosResponse = await api.post(
    TemplateAPI.deleteSalesTemplate,
    {
      name,
      doctype: "Sales Tax Template",
    }
  );
  return resp.data;
}

