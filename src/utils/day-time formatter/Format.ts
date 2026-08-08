import { formatAmountByPattern, DEFAULT_NUMBER_FORMAT_PATTERN } from "../currencyFormat";

// Formats a number to 2 decimal places using the given number-format pattern
// (e.g. company's default currency pattern — Western "#,##0.00" or Indian
// "#,##,##0.00"). If no pattern is passed, falls back to the default
// Western pattern — so any existing call site without a pattern keeps
// working exactly as before.
export const formatAmount = (
  n: number,
  pattern: string | null | undefined = DEFAULT_NUMBER_FORMAT_PATTERN,
) => formatAmountByPattern(n, pattern);

// Parses a compact "YYYYMMDD" date string (used across tax authority / API responses)
// into a readable form, e.g. "20260708" -> "8 Jul 2026"
export function formatCompactDate(raw: string): string {
  if (!raw || raw.length !== 8) return "—";
  const year = raw.slice(0, 4);
  const month = Number(raw.slice(4, 6)) - 1;
  const day = raw.slice(6, 8);
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${Number(day)} ${months[month] ?? ""} ${year}`;
}

// Formats a "YYYY-MM-DD HH:mm:ss" datetime string into "8 Jul 2026, 20:03"
export function formatDateTime(raw: string | null | undefined): string {
  if (!raw) return "—";
  const d = new Date(raw.replace(" ", "T"));
  if (isNaN(d.getTime())) return raw;
  const datePart = d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const timePart = d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${datePart}, ${timePart}`;
}