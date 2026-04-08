import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";
import { API, ERP_BASE } from "../config/api";

const api = createAxiosInstance(ERP_BASE);
export const TemplateAPI = API.tax;

// Create Template 
export async function createTemplate(payload: any): Promise<any> {
  const resp: AxiosResponse = await api.post(
    TemplateAPI.taxTemplate,
    payload
  );
  return resp.data;
}

// Update Template 
export async function updateTemplate(payload: any): Promise<any> {
  const resp: AxiosResponse = await api.post(
    TemplateAPI.taxTemplate,
    payload
  );
  return resp.data;
}

// Delete Template 
export async function deleteTemplate(name: string): Promise<any> {
  const resp: AxiosResponse = await api.post(
    TemplateAPI.delete,
    {
      name,
      doctype: "Item Tax Template", 
    }
  );
  return resp.data;
}