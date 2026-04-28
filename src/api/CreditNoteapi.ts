import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";

import { API, ERP_BASE } from "../config/api";
const api = createAxiosInstance(ERP_BASE);
export const CreditNoteAPI = API.CreditNote;

export async function createCreditNote(payload: any): Promise<any> {
  const resp: AxiosResponse = await api.post(CreditNoteAPI.Create, payload);
  return resp.data;
}
