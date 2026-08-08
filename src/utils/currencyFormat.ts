export const DEFAULT_NUMBER_FORMAT_PATTERN = "#,###.##";

export interface ParsedNumberFormat {
  /** Thousands separator, e.g. "," | "." | " " | "" (none) */
  groupSeparator: string;
  /** Decimal separator, e.g. "." | "," */
  decimalSeparator: string;
  /** Number of digits to show after the decimal separator */
  decimalPlaces: number;
  /** Size of the rightmost digit group, e.g. 3 in "##0" */
  primaryGroupSize: number;
  /** Size of groups to the left of the primary group.
   *  Western "#,##0" -> same as primary (3).
   *  Indian "#,##,##0" -> 2 (lakh/crore style). */
  secondaryGroupSize: number;
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
    return {
      groupSeparator: ",",
      decimalSeparator: ".",
      decimalPlaces: 2,
      primaryGroupSize: 3,
      secondaryGroupSize: 3,
    };
  }

  const positions = SEPARATOR_CANDIDATES
    .map((sep) => ({ sep, index: pattern.lastIndexOf(sep) }))
    .filter((entry) => entry.index !== -1)
    .sort((a, b) => b.index - a.index); // rightmost first

  if (positions.length === 0) {
    // pattern like "####" — no separators, no decimals
    return {
      groupSeparator: "",
      decimalSeparator: ".",
      decimalPlaces: 0,
      primaryGroupSize: 0,
      secondaryGroupSize: 0,
    };
  }

  const [{ sep: decimalSeparator, index: decimalIndex }] = positions;
  const decimalPlaces = Math.max(0, pattern.length - decimalIndex - 1);

  const integerPart = pattern.slice(0, decimalIndex); // e.g. "#,##,##0"
  const groupEntry = positions.find((entry) => entry.sep !== decimalSeparator);
  const groupSeparator = groupEntry ? groupEntry.sep : "";

  if (!groupSeparator || !integerPart.includes(groupSeparator)) {
    // No grouping at all, e.g. "0.00"
    return {
      groupSeparator: "",
      decimalSeparator,
      decimalPlaces,
      primaryGroupSize: 0,
      secondaryGroupSize: 0,
    };
  }

  // "#,##,##0" -> ["#", "##", "##0"]
  const segments = integerPart.split(groupSeparator);
  const primaryGroupSize = segments[segments.length - 1].length;
  // If there's a distinct segment before the primary one, that's the
  // secondary (repeating) group size — this is what makes Indian-style
  // grouping ("3 then 2,2,2...") differ from Western ("3,3,3...").
  const secondaryGroupSize =
    segments.length >= 3 ? segments[segments.length - 2].length : primaryGroupSize;

  return {
    groupSeparator,
    decimalSeparator,
    decimalPlaces,
    primaryGroupSize,
    secondaryGroupSize,
  };
}

/**
 * Groups a plain digit string (no sign, no decimal) using a primary size
 * for the rightmost group and a secondary size repeating to the left.
 * Handles both Western (3,3,3,...) and Indian (3,2,2,2,...) styles.
 */
function groupDigits(
  digits: string,
  primaryGroupSize: number,
  secondaryGroupSize: number,
  separator: string,
): string {
  if (!separator || primaryGroupSize <= 0 || digits.length <= primaryGroupSize) {
    return digits;
  }

  let result = digits.slice(digits.length - primaryGroupSize);
  let remaining = digits.slice(0, digits.length - primaryGroupSize);

  const step = secondaryGroupSize > 0 ? secondaryGroupSize : primaryGroupSize;

  while (remaining.length > 0) {
    const takeFrom = Math.max(0, remaining.length - step);
    const chunk = remaining.slice(takeFrom);
    result = `${chunk}${separator}${result}`;
    remaining = remaining.slice(0, takeFrom);
  }

  return result;
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

  const { groupSeparator, decimalSeparator, decimalPlaces, primaryGroupSize, secondaryGroupSize } =
    parsed;
  const isNegative = value < 0;
  const fixed = Math.abs(value).toFixed(decimalPlaces);
  const [integerPart, decimalPart] = fixed.split(".");

  const groupedInteger = groupDigits(
    integerPart,
    primaryGroupSize,
    secondaryGroupSize,
    groupSeparator,
  );

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