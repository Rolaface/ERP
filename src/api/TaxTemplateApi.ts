import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";
import { API, ERP_BASE } from "../config/api";

const api = createAxiosInstance(ERP_BASE);
export const TemplateAPI = API.tax;

//  GET All Templates 
export async function getAllTemplates(
  page: number,
  pageSize: number,
  search?: string
): Promise<any> {
  const resp: AxiosResponse = await api.get(TemplateAPI.getTemplates, {
    params: {
      page,
      page_size: pageSize,
      order_by: "title",
      ...(search ? { search } : {}), // ← search param for DB filter
    },
  });
  return resp.data;
}

//  GET GL Accounts with optional search 
export async function getGlAccounts(search?: string): Promise<any> {
  const resp: AxiosResponse = await api.get(TemplateAPI.getTemplateGl, {
    params: search ? { search } : {},
  });
  return resp.data;
}

//  Create Template 
export async function createTemplate(payload: any): Promise<any> {
  const resp: AxiosResponse = await api.post(TemplateAPI.taxTemplate, payload);
  return resp.data;
}

//  Update Template 
export async function updateTemplate(payload: any): Promise<any> {
  const resp: AxiosResponse = await api.post(TemplateAPI.taxTemplate, payload);
  return resp.data;
}

//  Update Status (Enable/Disable) 
export async function updateTemplateStatus(
  name: string,
  disabled: 0 | 1
): Promise<any> {
  const resp: AxiosResponse = await api.put(TemplateAPI.updatestatus, {
    name,
    disabled,
  });
  return resp.data;
}

//  Delete Template 
export async function deleteTemplate(name: string): Promise<any> {
  const resp: AxiosResponse = await api.post(TemplateAPI.delete, {
    name,
    doctype: "Item Tax Template",
  });
  return resp.data;
}