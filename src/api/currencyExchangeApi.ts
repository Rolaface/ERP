// src/api/currencyExchangeApi.ts
import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";
import { API, ERP_BASE } from "../config/api";

const api = createAxiosInstance(ERP_BASE);
export const CurrencyExchangeAPI = API.CurrencyExchange; // add this to your API config

/* ───────── GET ALL ───────── */
export async function getAllCurrencyExchanges(
  page: number = 1,
  page_size: number = 10,
  search?: string,
  from_currency?: string,
  to_currency?: string,
  date?: string,
): Promise<any> {
  const params: Record<string, any> = { page, page_size };

  if (search)         params.search        = search;
  if (from_currency)  params.from_currency = from_currency;
  if (to_currency)    params.to_currency   = to_currency;
  if (date)           params.date          = date;

  const resp: AxiosResponse = await api.get(
    CurrencyExchangeAPI.getAll,
    { params },
  );
  return resp.data;
}


/* ───────── CREATE ───────── */
export async function createCurrencyExchange(payload: {
  date: string;
  from_currency: string;
  to_currency: string;
  exchange_rate: number;
  for_buying: 0 | 1;
  for_selling: 0 | 1;
}): Promise<any> {
  const resp: AxiosResponse = await api.post(
    CurrencyExchangeAPI.create,
    payload,
  );
  return resp.data;
}

/* ───────── UPDATE ───────── */
export async function updateCurrencyExchange(
  id: string,
  payload: {
    id: string;
    exchange_rate?: number;
    for_buying?: 0 | 1;
    for_selling?: 0 | 1;
  },
): Promise<any> {
  const url = `${CurrencyExchangeAPI.update}?id=${encodeURIComponent(id)}`;
  const resp: AxiosResponse = await api.put(url, payload);
  return resp.data;
}

/* ───────── DELETE ───────── */
export async function deleteCurrencyExchange(id: string): Promise<any> {
  const url = `${CurrencyExchangeAPI.delete}?id=${encodeURIComponent(id)}`;
  const resp: AxiosResponse = await api.delete(url);
  return resp.data;
}

/* ───────── GET EXCHANGE RATE ───────── */
export async function getExchangeRate(params: {
  from_currency: string;
  to_currency: string;
  transaction_date: string;
  args: "for_selling" | "for_buying";
}): Promise<any> {
  try {
    const resp: AxiosResponse = await api.post(
      "/api/method/erpnext.setup.utils.get_exchange_rate",
      {
        from_currency: params.from_currency,
        to_currency: params.to_currency,
        transaction_date: params.transaction_date,
        args: params.args,
      }
    );

    const rate = resp?.data?.message;

    if (!rate || Number(rate) <= 0) {
      throw new Error("Exchange rate not found");
    }

    return resp.data;
  } catch (err: any) {
    throw err; 
  }
}