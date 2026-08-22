/**
 * Money.tsx
 *
 * Optional convenience component for JSX call sites — cosmetic sugar over
 * formatMoney(). Re-renders automatically when the currency store updates
 * (e.g. a currency finishes loading and its real symbol replaces the raw
 * code placeholder).
 *
 *   <Money code={row.currency} amount={row.amount} />
 */

import React, { useEffect, useState } from "react";
import { subscribe } from "../../store/Currencystore";
import { formatMoney, formatNumber } from "../../utils/money";

interface MoneyProps {
  code: string | null | undefined;
  amount: number | string | null | undefined;
  hideSymbol?: boolean;
  className?: string;
  emptyFallback?: string;
}

export const Money: React.FC<MoneyProps> = ({
  code,
  amount,
  hideSymbol = false,
  className,
  emptyFallback = "—",
}) => {
  const [, forceRerender] = useState(0);
  useEffect(() => subscribe(() => forceRerender((n) => n + 1)), []);

  if (amount === null || amount === undefined || amount === "") {
    return <span className={className}>{emptyFallback}</span>;
  }

  const formatted = hideSymbol ? formatNumber(code, amount) : formatMoney(code, amount);
  return <span className={className}>{formatted}</span>;
};