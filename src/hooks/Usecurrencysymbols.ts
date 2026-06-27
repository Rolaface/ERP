

import { useEffect, useRef, useState, useCallback } from "react";
import { getCurrencyList } from "../api/lookupApi";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CurrencyRecord {
  name: string;       // e.g. "GHS"
  symbol: string;     // e.g. "₵"
  currency_name?: string;
  number_format?: string;
}

interface UseCurrencySymbolsReturn {
  /** Resolve a currency code → symbol. Falls back to the code itself if unknown. */
  getSymbol: (code: string | null | undefined) => string;
  /** True while any fetch is in-flight */
  loading: boolean;
  /** Non-null if every parallel fetch failed */
  error: string | null;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCurrencySymbols(
  currencyCodes: string[],
): UseCurrencySymbolsReturn {
  const [symbolMap, setSymbolMap] = useState<Map<string, string>>(new Map());
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);

  // track which codes we have already fetched so we never re-fetch the same code
  const fetchedCodesRef = useRef<Set<string>>(new Set());
  // protect against setting state on an unmounted component
  const mountedRef      = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    // 1. deduplicate and filter out empty / already-fetched codes
    const unique = [
      ...new Set(
        currencyCodes.filter(
          (c) => c && typeof c === "string" && c.trim() !== "",
        ),
      ),
    ].filter((c) => !fetchedCodesRef.current.has(c));

    if (!unique.length) return; // nothing new to fetch

    let cancelled = false;
    setLoading(true);
    setError(null);

    // 2. fetch each unique code in parallel with search param
    const fetches = unique.map((code) =>
      getCurrencyList({ search: code, page_size: 10 })
        .then((list: CurrencyRecord[]) => ({ code, list, ok: true as const }))
        .catch(() => ({ code, list: [] as CurrencyRecord[], ok: false as const })),
    );

    Promise.allSettled(fetches).then((settled) => {
      if (cancelled || !mountedRef.current) return;

      let anySuccess = false;
      const newEntries: [string, string][] = [];

      settled.forEach((result) => {
        if (result.status !== "fulfilled") return;
        const { code, list, ok } = result.value;

        // mark as fetched regardless of success so we don't retry on every render
        fetchedCodesRef.current.add(code);

        if (!ok || !list.length) return;

        anySuccess = true;
        list.forEach((record) => {
          if (record.name && record.symbol) {
            newEntries.push([record.name, record.symbol]);
          }
        });
      });

      if (!anySuccess && settled.length > 0) {
        setError("Failed to fetch currency symbols.");
      }

      if (newEntries.length) {
        setSymbolMap((prev) => {
          const next = new Map(prev);
          newEntries.forEach(([k, v]) => next.set(k, v));
          return next;
        });
      }

      setLoading(false);
    });

    return () => { cancelled = true; };

    // only re-run when the sorted, joined string of codes changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currencyCodes.slice().sort().join(",")]);

  const getSymbol = useCallback(
    (code: string | null | undefined): string => {
      if (!code) return "";
      return symbolMap.get(code) ?? code; // fallback: show code if symbol unknown
    },
    [symbolMap],
  );

  return { getSymbol, loading, error };
}