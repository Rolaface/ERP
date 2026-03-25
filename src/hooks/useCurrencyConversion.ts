import { useState, useEffect , useCallback} from "react";
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

interface PaginationState {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export const useCurrencyConversion = () => {
  const [data, setData]       = useState<CurrencyConversionPayload[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({
    page:       1,
    pageSize:   10,
    totalItems: 0,
    totalPages: 1,
  });



const fetchConversions = useCallback(async () => {
  setLoading(true);
  try {
    const resp = await getAllCurrencyExchanges(
      pagination.page,
      pagination.pageSize,
      search.trim()
    );

    const items = resp?.message?.data?.data ?? [];
    const pg    = resp?.message?.data?.pagination ?? {};

    const mapped: CurrencyConversionPayload[] = items.map((item: any) => ({
      id:           item.id,
      date:         item.date,
      fromCurrency: item.from_currency,
      toCurrency:   item.to_currency,
      exchangeRate: item.exchange_rate,
      isBuying:     item.purpose?.for_buying  ?? false,
      isSelling:    item.purpose?.for_selling ?? false,
      createdAt:    item.timestamps?.created_at  ?? "",
      modifiedAt:   item.timestamps?.modified_at ?? "",
    }));

    setData(mapped);

    setPagination((prev) => ({
      ...prev,
      page:       pg.page        ?? prev.page,
      pageSize:   pg.page_size   ?? prev.pageSize,
      totalItems: pg.total_items ?? mapped.length,
      totalPages: pg.total_pages ?? 1,
    }));
  } catch (err: any) {
    console.error("Currency fetch error:", err);
  } finally {
    setLoading(false);
  }
}, [pagination.page, pagination.pageSize, search]);


useEffect(() => {
  const delay = setTimeout(() => {
    fetchConversions();
  }, 400);

  return () => clearTimeout(delay);
}, [fetchConversions]);

  /* ───────── ADD ───────── */
  const addConversion = async (
    payload: Omit<CurrencyConversionPayload, "id" | "createdAt" | "modifiedAt">,
  ) => {
    const res = await createCurrencyExchange({
      date:          payload.date,
      from_currency: payload.fromCurrency,
      to_currency:   payload.toCurrency,
      exchange_rate: payload.exchangeRate,
      for_buying:    payload.isBuying  ? 1 : 0,
      for_selling:   payload.isSelling ? 1 : 0,
    });

   await fetchConversions();
    return res;
  };

  /* ───────── UPDATE ───────── */
  const updateConversion = async (payload: CurrencyConversionPayload) => {
    const res = await updateCurrencyExchange(payload.id, {
      id:            payload.id,
      exchange_rate: payload.exchangeRate,
      for_buying:    payload.isBuying  ? 1 : 0,
      for_selling:   payload.isSelling ? 1 : 0,
    });

    await fetchConversions();
    return res;
  };

  /* ───────── DELETE ───────── */
  const deleteConversion = async (id: string) => {
    const res = await deleteCurrencyExchange(id);
    await fetchConversions();
    return res;
  };

return {
  data,
  loading,
  pagination,
  setPagination,
  search,
  setSearch,
  fetchConversions,
  addConversion,
  updateConversion,
  deleteConversion,
};
};