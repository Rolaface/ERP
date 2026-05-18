export interface SlipListItem {
  name: string;
  employee: string;
  status: string;
  posting_date: string;
}

export const CHART_PALETTE = [
  "#185FA5",
  "#1D9E75",
  "#BA7517",
  "#8B5CF6",
  "#EC4899",
  "#0891B2",
  "#059669",
];

export const MIN_SLICE_DEG = 4;

export const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  Draft: { bg: "rgba(234,179,8,0.08)", text: "#b45309", dot: "#d97706" },
  Submitted: { bg: "rgba(34,197,94,0.08)", text: "#15803d", dot: "#22c55e" },
  Cancelled: { bg: "rgba(239,68,68,0.08)", text: "#b91c1c", dot: "#ef4444" },
};

export function fmtINR(amount: number): string {
  return `₹${Number(amount).toLocaleString("en-IN")}`;
}

export function fmtCurrency(currency: string, amount: number): string {
  if (currency === "INR") return fmtINR(amount);
  return `${currency} ${Number(amount).toLocaleString("en-IN")}`;
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function fmtPct(amount: number, total: number): string {
  if (total <= 0 || amount <= 0) return "0%";
  const pct = (amount / total) * 100;
  if (pct < 1) return "<1%";
  return `${Math.round(pct)}%`;
}

export function exactPct(amount: number, total: number): string {
  if (total <= 0 || amount <= 0) return "0%";
  return `${((amount / total) * 100).toFixed(2)}%`;
}

export function parseMonthYear(dateStr: string): { month: string; year: string } {
  if (!dateStr) return { month: "–", year: "–" };
  const d = new Date(dateStr);
  return {
    month: d.toLocaleString("en-IN", { month: "short" }),
    year: d.getFullYear().toString(),
  };
}

export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return "–";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}