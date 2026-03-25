// useCurrencyConversion.ts
import { useState } from "react";

export interface CurrencyConversionPayload {
  id: number;
  date: string;
  fromCurrency: string;
  toCurrency: string;
  exchangeRate: number;
  isBuying: boolean;
  isSelling: boolean;
}

export const useCurrencyConversion = () => {
  const [data, setData] = useState<CurrencyConversionPayload[]>([]);
  const [loading, setLoading] = useState(false);

  /* ───────── ADD ───────── */
  const addConversion = (
    payload: Omit<CurrencyConversionPayload, "id">
  ) => {
    const newEntry: CurrencyConversionPayload = {
      id: Date.now(),
      ...payload,
    };

    setData((prev) => [newEntry, ...prev]);
  };

  /* ───────── DELETE ───────── */
  const deleteConversion = (id: number) => {
    setData((prev) => prev.filter((item) => item.id !== id));
  };

  return {
    data,
    loading,
    addConversion,
    deleteConversion,
  };
};