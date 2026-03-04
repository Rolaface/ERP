import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";

import { API, CODES_BASE } from "../config/api";

const api = createAxiosInstance(CODES_BASE);

export type ExchangeRateResponse = {
  status: string;
  base_currency: string;
  code: string;
  currency_name: string;
  exchange_rate: number;
};

export async function getExchangeRate(
  code: string,
): Promise<ExchangeRateResponse> {
  const c = String(code ?? "")
    .trim()
    .toUpperCase();
  const url = `${API.exchangeRate.get}${encodeURIComponent(c)}/`;
  const resp: AxiosResponse = await api.get(url);
  return resp.data;
}
