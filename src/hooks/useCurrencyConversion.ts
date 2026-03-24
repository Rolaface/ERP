import { useState, useEffect } from "react";
import {
  getAllCurrencyExchanges,
  createCurrencyExchange,
  deleteCurrencyExchange,
  updateCurrencyExchange,
} from "../api/currencyExchangeApi";

export interface CurrencyConversionPayload {
  id: string;
  date: string;
  fromCurrency: string;
  toCurrency: string;
  exchangeRate: number;
  isBuying: boolean;
  isSelling: boolean;
  createdAt: string;
  modifiedAt: string;
}

export const useCurrencyConversion = () => {
  const [data, setData] = useState<CurrencyConversionPayload[]>([]);
  const [loading, setLoading] = useState(false);


  /* ───────── FETCH ALL ───────── */
  const fetchConversions = async () => {
    setLoading(true);
    try {
      const resp = await getAllCurrencyExchanges();
      const items = resp?.message?.data?.data ?? [];
      const pg = resp?.message?.data?.pagination;

      const mapped: CurrencyConversionPayload[] = items.map((item: any) => ({
        id: item.id,
        date: item.date,
        fromCurrency: item.from_currency,
        toCurrency: item.to_currency,
        exchangeRate: item.exchange_rate,
        isBuying: item.purpose?.for_buying ?? false,
        isSelling: item.purpose?.for_selling ?? false,
        createdAt: item.timestamps?.created_at,
        modifiedAt: item.timestamps?.modified_at,
      }));

      setData(mapped);

    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversions();
  }, []);

  /* ───────── ADD ───────── */
  const addConversion = async (
    payload: Omit<CurrencyConversionPayload, "id">,
  ) => {
    try {
      const res = await createCurrencyExchange({
        date: payload.date,
        from_currency: payload.fromCurrency,
        to_currency: payload.toCurrency,
        exchange_rate: payload.exchangeRate,
        for_buying: payload.isBuying ? 1 : 0,
        for_selling: payload.isSelling ? 1 : 0,
      });

      await fetchConversions();

      return res;
    } catch (err) {
      throw err;
    }
  };
  const updateConversion = async (payload: CurrencyConversionPayload) => {
    try {
      const res = await updateCurrencyExchange(payload.id, {
        id: payload.id,
        exchange_rate: payload.exchangeRate,
        for_buying: payload.isBuying ? 1 : 0,
        for_selling: payload.isSelling ? 1 : 0,
      });

      await fetchConversions();

      return res;
    } catch (err) {
      throw err;
    }
  };

  /* ───────── DELETE ───────── */
  const deleteConversion = async (id: string) => {
    try {
      const res = await deleteCurrencyExchange(id);

      setData((prev) => prev.filter((item) => item.id !== id));

      return res;
    } catch (err) {
      throw err;
    }
  };

  return {
    data,
    loading,

    addConversion,
    deleteConversion,
    fetchConversions,
    updateConversion,
  };
};
