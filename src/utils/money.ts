/**
 * money.ts
 *
 * The single place every component imports from to display a monetary
 * amount, anywhere in the app. Thin, generic wrapper around the currency
 * store's synchronous formatAmount() — no hooks, no props, no drilling.
 *
 * Edge cases already handled (by currencyStore + currencyFormat):
 *  - code is null/undefined/""          -> symbol simply omitted
 *  - code not yet cached                -> falls back to the default
 *                                           "#,###.##" pattern and shows
 *                                           the raw code as a placeholder
 *                                           symbol until it loads
 *  - value is null/undefined/""/NaN     -> returns "" (never "NaN",
 *                                           never throws)
 *  - value is a numeric string          -> parsed automatically
 *
 * IMPORTANT: this does NOT fetch currencies. Something up the tree must
 * still call useCurrencySymbols([...codes]) (or ensureCurrencies directly)
 * at least once for a given code so its real symbol + number_format get
 * cached. Until then, these functions still return a safe, correctly
 * shaped string — just with the default pattern and raw code as symbol.
 */

import {
  formatAmount as formatAmountFromStore,
  getSymbol as getSymbolFromStore,
  isReady as isCurrencyStoreReady,
} from "../store/Currencystore";
import type { FormatAmountOptions } from "./currencyFormat";

/**
 * Formats a value WITH the currency's symbol attached.
 * e.g. formatMoney("USD", 1200) -> "$ 1,200.00"
 *      formatMoney("INR", 123456.78) -> "₹ 1,23,456.78"
 */
export function formatMoney(
  code: string | null | undefined,
  value: number | string | null | undefined,
): string {
  if (value === null || value === undefined || value === "") return "";
  return formatAmountFromStore(code, value, { withSymbol: true });
}

/**
 * Same as formatMoney, but WITHOUT the currency symbol — just the number,
 * grouped/decimal-formatted per that currency's own pattern.
 */
export function formatNumber(
  code: string | null | undefined,
  value: number | string | null | undefined,
): string {
  if (value === null || value === undefined || value === "") return "";
  return formatAmountFromStore(code, value, { withSymbol: false });
}

/**
 * Escape hatch for symbol position/spacer overrides. Most call sites
 * should just use formatMoney().
 */
export function formatMoneyWithOptions(
  code: string | null | undefined,
  value: number | string | null | undefined,
  options: FormatAmountOptions,
): string {
  if (value === null || value === undefined || value === "") return "";
  return formatAmountFromStore(code, value, options);
}

/** Raw symbol for a currency code, e.g. "$", "₹". Falls back to the code itself. */
export function currencySymbolFor(code: string | null | undefined): string {
  return getSymbolFromStore(code);
}

/** Whether the currency store has any data loaded yet. */
export function isMoneyReady(): boolean {
  return isCurrencyStoreReady();
}

/**
 * Picks the first non-empty currency code from a list of candidates —
 * handy for tables where a row may carry its own currency, falling back
 * to the document's currency, then the company's base currency.
 *
 *   const code = resolveCurrencyCode(row.currency, formData.currency, baseCurrency);
 *   formatMoney(code, row.amount);
 */
export function resolveCurrencyCode(
  ...candidates: Array<string | null | undefined>
): string {
  for (const c of candidates) {
    if (c) return c;
  }
  return "";
}