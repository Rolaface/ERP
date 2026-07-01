/**
 * useCurrencySymbols.ts
 *
 * Simple, predictable pattern: pass the currency codes actually present in
 * your data (e.g. extractCurrencyCodesFlat(invoices)), and this hook makes
 * sure they're loaded into the shared global currencyStore. A code is only
 * ever fetched once for the whole app session — if another table already
 * triggered a fetch for "USD", this hook just reads it from cache instantly,
 * no network call, no flicker.
 */

import { useCallback, useEffect, useState } from "react";
import * as currencyStore from "../store/Currencystore";
import type { FormatAmountOptions } from "../utils/currencyFormat";

export interface UseCurrencySymbolsReturn {
  getSymbol: (code: string | null | undefined) => string;
  getNumberFormat: (code: string | null | undefined) => string;
  formatAmount: (
    code: string | null | undefined,
    value: number | string | null | undefined,
    options?: FormatAmountOptions,
  ) => string;
  /** True while the codes passed to this hook are being fetched for the first time. */
  loading: boolean;
  error: string | null;
}

export function useCurrencySymbols(currencyCodes: string[]): UseCurrencySymbolsReturn {
  const [, forceRerender] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Re-render whenever the shared store updates (e.g. another table's
  // fetch resolves and adds a currency this component also needs).
  useEffect(() => {
    const unsubscribe = currencyStore.subscribe(() => forceRerender((n) => n + 1));
    return unsubscribe;
  }, []);

  const codesKey = [...new Set(currencyCodes.filter(Boolean))].sort().join(",");

  useEffect(() => {
    const codes = codesKey.split(",").filter(Boolean);
    if (codes.length === 0) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    currencyStore
      .ensureCurrencies(codes)
      .catch(() => {
        if (!cancelled) setError("Failed to load currency data.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [codesKey]);

  const getSymbol = useCallback(
    (code: string | null | undefined) => currencyStore.getSymbol(code),
    [],
  );

  const getNumberFormat = useCallback(
    (code: string | null | undefined) => currencyStore.getNumberFormat(code),
    [],
  );

  const formatAmount = useCallback(
    (
      code: string | null | undefined,
      value: number | string | null | undefined,
      options?: FormatAmountOptions,
    ) => currencyStore.formatAmount(code, value, options),
    [],
  );

  return { getSymbol, getNumberFormat, formatAmount, loading, error };
}