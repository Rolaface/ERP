import { createAxiosInstance } from "../axiosInstance";
import { API, ERP_BASE } from "../../config/api";

const api = createAxiosInstance(ERP_BASE);


export interface FrappeDeleteParams {
  name: string;
  doctype: string;
}

export async function frappeDelete(params: FrappeDeleteParams): Promise<void> {
  await api.post(API.Delete.delete, {
    name: params.name,
    doctype: params.doctype,
  });
}