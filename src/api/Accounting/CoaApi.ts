import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "../axiosInstance";
import { API, ERP_BASE } from "../../config/api";

const api = createAxiosInstance(ERP_BASE);

export const AccountingAPI = API.accounting;

/**
 * Get Chart of Accounts
 */
export async function getChartOfAccounts(): Promise<any> {
  const resp: AxiosResponse = await api.get(AccountingAPI.getCOA);

  return resp.data;
}