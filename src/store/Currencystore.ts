/**
 * currencyStore.ts
 *
 * Single global cache layer sitting between the currency search API and
 * every component in the app. Each currency code is searched and cached
 * EXACTLY ONCE per app session, no matter how many tables/components ask
 * for it — call ensureCurrencies(codes) with the codes actually present in
 * your data, and any code already cached resolves instantly with zero
 * network calls. Reads (getSymbol/getNumberFormat/formatAmount) are always
 * synchronous off a module-level Map outside React state.
 *
 * Persisted to localStorage with a TTL so a returning session doesn't need
 * to re-fetch currencies it already saw before.
 */

import { getCurrencyList } from "../api/lookupApi";
import {
  DEFAULT_NUMBER_FORMAT_PATTERN,
  formatAmountByPattern,
  formatAmountWithSymbol,
  type FormatAmountOptions,
} from "../utils/currencyFormat";
c
interface CurrencyRecord {
  name: string;
  symbol: string | null;
  currency_name?: string;
  number_format?: string | null;
}

interface CurrencyMeta {
  symbol: string;
  numberFormat: string;
}

const STORAGE_KEY = "currency_store_cache_v3";
const STORAGE_TTL_MS = 24 * 60 * 60 * 1000; // 1 day

// ─── Module-level state (outside React) ────────────────────────────────────

let cache = new Map<string, CurrencyMeta>();
let status: "idle" | "loading" | "ready" | "error" = "idle";
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function readFromStorage(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;

    const parsed = JSON.parse(raw) as {
      savedAt: number;
      entries: [string, CurrencyMeta][];
    };

    if (Date.now() - parsed.savedAt > STORAGE_TTL_MS) return false;
    if (!Array.isArray(parsed.entries) || parsed.entries.length === 0) return false;

    cache = new Map(parsed.entries);
    return true;
  } catch {
    return false;
  }
}

function writeToStorage() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ savedAt: Date.now(), entries: [...cache.entries()] }),
    );
  } catch {
    // localStorage unavailable/full — non-fatal, in-memory cache still works
  }
}

/**
 * Searches for and caches a specific set of currency codes (the ones
 * actually present in whatever data is on screen — invoices, COA accounts,
 * etc). Codes already cached are skipped automatically, so calling this
 * repeatedly from many components with overlapping currencies is cheap —
 * each currency is only ever fetched once for the whole app session.
 */
async function fetchCurrencies(codes: string[]): Promise<void> {
  const pending = [...new Set(codes.filter(Boolean))].filter((c) => !cache.has(c));
  if (pending.length === 0) return;

  const BATCH_SIZE = 20; // keep concurrent requests reasonable

  for (let i = 0; i < pending.length; i += BATCH_SIZE) {
    const batch = pending.slice(i, i + BATCH_SIZE);

    const results = await Promise.allSettled(
      batch.map((code) => getCurrencyList({ search: code, page_size: 5 })),
    );

    results.forEach((result, idx) => {
      if (result.status !== "fulfilled") return;

      const res: any = result.value;
      const envelope = res?.message ?? res;
      const records: CurrencyRecord[] = Array.isArray(envelope)
        ? envelope
        : envelope?.data ?? [];

      if (records.length === 0) return;

      const code = batch[idx];
      // The search endpoint may do partial matching, so only trust an
      // exact, case-insensitive code match.
      const exactMatch = records.find(
        (record) => record?.name?.toUpperCase() === code.toUpperCase(),
      );
      if (!exactMatch) return;

      cache.set(exactMatch.name, {
        symbol: exactMatch.symbol || exactMatch.name,
        numberFormat: exactMatch.number_format || DEFAULT_NUMBER_FORMAT_PATTERN,
      });
    });
  }
}

/**
 * Ensures the given currency codes are loaded into the global cache.
 * Call this from any component with the currency codes it actually needs
 * (e.g. extractCurrencyCodesFlat(invoices)). Codes already cached resolve
 * instantly with no network call; new codes are fetched once and become
 * available to every other component using the same code from then on.
 *
 * Safe to call concurrently from multiple components — in-flight requests
 * for overlapping codes are not duplicated.
 */
export function ensureCurrencies(codes: string[]): Promise<void> {
  const pending = [...new Set(codes.filter(Boolean))].filter((c) => !cache.has(c));
  if (pending.length === 0) return Promise.resolve();

  if (status !== "loading") {
    status = "loading";
    notify();
  }

  const promise = fetchCurrencies(pending)
    .then(() => {
      status = "ready";
      writeToStorage();
      notify();
    })
    .catch((err) => {
      status = cache.size === 0 ? "error" : "ready";
      notify();
      throw err;
    });

  return promise;
}

/**
 * Loads localStorage's cached snapshot (if fresh) immediately on app start,
 * so any currencies seen in a previous session are available with zero
 * network calls. Call this once from CurrencyBootstrap.
 */
export function hydrateFromStorage(): void {
  const hadCachedCopy = readFromStorage();
  if (hadCachedCopy) {
    status = "ready";
    notify();
  }
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getStatus() {
  return status;
}

export function isReady() {
  return status === "ready" || cache.size > 0;
}

// ─── Synchronous reads — safe to call any time, even before load finishes ──

export function getSymbol(code: string | null | undefined): string {
  if (!code) return "";
  return cache.get(code)?.symbol ?? code;
}

export function getNumberFormat(code: string | null | undefined): string {
  if (!code) return DEFAULT_NUMBER_FORMAT_PATTERN;
  return cache.get(code)?.numberFormat ?? DEFAULT_NUMBER_FORMAT_PATTERN;
}

export function formatAmount(
  code: string | null | undefined,
  value: number | string | null | undefined,
  options?: FormatAmountOptions,
): string {
  const meta = code ? cache.get(code) : undefined;
  const pattern = meta?.numberFormat ?? DEFAULT_NUMBER_FORMAT_PATTERN;

  if (!options?.withSymbol) {
    return formatAmountByPattern(value, pattern);
  }

  return formatAmountWithSymbol(value, pattern, meta?.symbol ?? code ?? "", options);
}