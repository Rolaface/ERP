
export const DEFAULT_NUMBER_FORMAT_PATTERN = "#,###.##";

export interface ParsedNumberFormat {
  /** Thousands separator, e.g. "," | "." | " " | "" (none) */
  groupSeparator: string;
  /** Decimal separator, e.g. "." | "," */
  decimalSeparator: string;
  /** Number of digits to show after the decimal separator */
  decimalPlaces: number;
}

export interface FormatAmountOptions {
  /** Prefix/suffix the result with the currency symbol. Default: false */
  withSymbol?: boolean;
  /** Where to place the symbol relative to the number. Default: "prefix" */
  symbolPosition?: "prefix" | "suffix";
  /** Custom separator placed between symbol and amount. Default: " " */
  symbolSpacer?: string;
}

const SEPARATOR_CANDIDATES = [".", ",", " "] as const;


export function parseNumberFormat(
  pattern: string | null | undefined,
): ParsedNumberFormat {
  if (!pattern || typeof pattern !== "string" || !pattern.includes("#")) {
    return { groupSeparator: ",", decimalSeparator: ".", decimalPlaces: 2 };
  }

  const positions = SEPARATOR_CANDIDATES
    .map((sep) => ({ sep, index: pattern.lastIndexOf(sep) }))
    .filter((entry) => entry.index !== -1)
    .sort((a, b) => b.index - a.index); // rightmost first

  if (positions.length === 0) {
    // pattern like "####" — no separators, no decimals
    return { groupSeparator: "", decimalSeparator: ".", decimalPlaces: 0 };
  }

  const [{ sep: decimalSeparator, index: decimalIndex }] = positions;
  const groupEntry = positions.find((entry) => entry.sep !== decimalSeparator);
  const groupSeparator = groupEntry ? groupEntry.sep : "";

  const decimalPlaces = Math.max(0, pattern.length - decimalIndex - 1);

  return { groupSeparator, decimalSeparator, decimalPlaces };
}

/**
 * Formats a numeric value against an already-parsed pattern.
 * Returns "" for non-finite input (NaN, Infinity, -Infinity).
 */
export function formatWithParsedPattern(
  value: number,
  parsed: ParsedNumberFormat,
): string {
  if (!Number.isFinite(value)) return "";

  const { groupSeparator, decimalSeparator, decimalPlaces } = parsed;
  const isNegative = value < 0;
  const fixed = Math.abs(value).toFixed(decimalPlaces);
  const [integerPart, decimalPart] = fixed.split(".");

  const groupedInteger = groupSeparator
    ? integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, groupSeparator)
    : integerPart;

  const result =
    decimalPlaces > 0 ? `${groupedInteger}${decimalSeparator}${decimalPart}` : groupedInteger;

  return isNegative ? `-${result}` : result;
}

/**
 * Convenience wrapper: parses the pattern and formats the value in one call.
 * Accepts numbers or numeric strings; returns "" for null/undefined/invalid input.
 */
export function formatAmountByPattern(
  value: number | string | null | undefined,
  pattern: string | null | undefined = DEFAULT_NUMBER_FORMAT_PATTERN,
): string {
  if (value === null || value === undefined || value === "") return "";

  const numericValue = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(numericValue)) return "";

  return formatWithParsedPattern(numericValue, parseNumberFormat(pattern));
}

/**
 * Formats a value with an optional currency symbol attached.
 */
export function formatAmountWithSymbol(
  value: number | string | null | undefined,
  pattern: string | null | undefined,
  symbol: string,
  options: Pick<FormatAmountOptions, "symbolPosition" | "symbolSpacer"> = {},
): string {
  const formatted = formatAmountByPattern(value, pattern);
  if (!formatted) return "";

  const { symbolPosition = "prefix", symbolSpacer = " " } = options;
  if (!symbol) return formatted;

  return symbolPosition === "prefix"
    ? `${symbol}${symbolSpacer}${formatted}`
    : `${formatted}${symbolSpacer}${symbol}`;
}