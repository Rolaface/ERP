import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";
import { API, ERP_BASE } from "../config/api";

const api = createAxiosInstance(ERP_BASE);
export const Account = API.Account;

export async function getBankAccounts(): Promise<any> {
  const resp: AxiosResponse = await api.get(Account.getBankAccounts);
  return resp.data; 
}