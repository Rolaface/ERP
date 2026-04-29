import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";

import { API, ERP_BASE } from "../config/api";
const api = createAxiosInstance(ERP_BASE);
export const CreditNoteAPI = API.CreditNote;

export interface CreditNotePayload {
  is_return: 1;
  return_against: string;
  customer: string;
  company: string;
  update_stock: 0 | 1;
  items: {
    item_code: string;
    qty: number;          // negative number
    rate: number;
    batch_no?: string;    // omitted if empty
    warehouse: string;
  }[];
}
 
// ─── API call ─────────────────────────────────────────────────────────────────
 
export async function createCreditNote(payload: CreditNotePayload): Promise<any> {
  const resp: AxiosResponse = await api.post(CreditNoteAPI.Create, payload);
  return resp.data;
}
