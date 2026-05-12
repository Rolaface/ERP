import type { SalarySlip, SlipFilters, MonthlyPayoutPoint, SummaryStats, QuickFilter } from "./salarytypes";

// ─── Currency Formatting ──────────────────────────────────────────────────────

export const formatCurrency = (
  amount: number,
  currency: string = "USD",
): string => {
  if (!Number.isFinite(amount)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// ─── Date Formatting ──────────────────────────────────────────────────────────

export const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "—";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const formatMonthYear = (dateString: string): string => {
  if (!dateString) return "—";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
};

export const getMonthShort = (dateString: string): string => {
  if (!dateString) return "";
  const d = new Date(dateString);
  return d.toLocaleDateString("en-US", { month: "short" });
};

export const getYear = (dateString: string): number => {
  if (!dateString) return 0;
  return new Date(dateString).getFullYear();
};

export const getMonth = (dateString: string): number => {
  if (!dateString) return 0;
  return new Date(dateString).getMonth(); // 0-indexed
};

// ─── Slip Label ────────────────────────────────────────────────────────────────

export const getSlipPeriodLabel = (slip: SalarySlip | Pick<SalarySlip, "start_date" | "end_date" | "posting_date">): string => {
  if ("start_date" in slip && slip.start_date) {
    return formatMonthYear(slip.start_date);
  }
  if ("posting_date" in slip && slip.posting_date) {
    return formatMonthYear(slip.posting_date);
  }
  return "—";
};

// ─── Summary Computation ──────────────────────────────────────────────────────

export const computeSummaryStats = (
  slips: SalarySlip[],
): SummaryStats => {
  const currentYear = new Date().getFullYear();

  const paidSlips = slips.filter((s) => s.status === "Paid");
  const yearPaid = paidSlips.filter(
    (s) => getYear(s.posting_date || s.start_date) === currentYear,
  );

  const totalPaidThisYear = yearPaid.reduce((acc, s) => acc + (s.net_pay ?? 0), 0);
  const averageMonthlySalary =
    paidSlips.length > 0
      ? paidSlips.reduce((acc, s) => acc + (s.net_pay ?? 0), 0) / paidSlips.length
      : 0;

  const latestPaid = paidSlips[0]?.net_pay ?? 0;
  const pendingCount = slips.filter(
    (s) => s.status === "Draft" || s.status === "Submitted",
  ).length;

  const currency = slips[0]?.currency ?? "USD";

  return {
    totalPaidThisYear,
    averageMonthlySalary,
    latestSalaryCredited: latestPaid,
    pendingCount,
    currency,
  };
};

// ─── Chart Data ───────────────────────────────────────────────────────────────

export const buildMonthlyPayoutData = (slips: SalarySlip[]): MonthlyPayoutPoint[] => {
  // Take last 12 months, sorted ascending
  const sorted = [...slips]
    .filter((s) => s.status === "Paid")
    .sort((a, b) => {
      const da = new Date(a.posting_date || a.start_date).getTime();
      const db = new Date(b.posting_date || b.start_date).getTime();
      return da - db;
    })
    .slice(-12);

  return sorted.map((s) => ({
    label: getMonthShort(s.posting_date || s.start_date) + " " + getYear(s.posting_date || s.start_date),
    gross: s.gross_pay ?? 0,
    net: s.net_pay ?? 0,
    deductions: s.total_deduction ?? 0,
  }));
};

// ─── Filtering ────────────────────────────────────────────────────────────────

export const applyFilters = (
  slips: SalarySlip[],
  filters: SlipFilters,
  quickFilter: QuickFilter,
): SalarySlip[] => {
  let result = [...slips];
  const now = new Date();

  // Quick filter takes precedence
  if (quickFilter === "latest") {
    return result.slice(0, 1);
  }
  if (quickFilter === "this_year") {
    result = result.filter((s) => getYear(s.posting_date || s.start_date) === now.getFullYear());
  }
  if (quickFilter === "last_6_months") {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    result = result.filter(
      (s) => new Date(s.posting_date || s.start_date) >= sixMonthsAgo,
    );
  }
  if (quickFilter === "paid") {
    result = result.filter((s) => s.status === "Paid");
  }
  if (quickFilter === "pending") {
    result = result.filter(
      (s) => s.status === "Draft" || s.status === "Submitted",
    );
  }

  // Advanced filters
  if (filters.month) {
    const monthIndex = parseInt(filters.month, 10);
    result = result.filter((s) => getMonth(s.posting_date || s.start_date) === monthIndex);
  }
  if (filters.year) {
    result = result.filter(
      (s) => getYear(s.posting_date || s.start_date) === parseInt(filters.year, 10),
    );
  }
  if (filters.startDate) {
    result = result.filter(
      (s) => (s.posting_date || s.start_date) >= filters.startDate,
    );
  }
  if (filters.endDate) {
    result = result.filter(
      (s) => (s.posting_date || s.start_date) <= filters.endDate,
    );
  }
  if (filters.slipId) {
    const q = filters.slipId.toLowerCase();
    result = result.filter((s) => s.name.toLowerCase().includes(q));
  }
  if (filters.status) {
    result = result.filter((s) => s.status === filters.status);
  }

  return result;
};

// ─── Available filter options derived from data ───────────────────────────────

export const getAvailableYears = (slips: SalarySlip[]): number[] => {
  const years = new Set(
    slips.map((s) => getYear(s.posting_date || s.start_date)).filter(Boolean),
  );
  return Array.from(years).sort((a, b) => b - a);
};

export const MONTHS = [
  { label: "January", value: "0" },
  { label: "February", value: "1" },
  { label: "March", value: "2" },
  { label: "April", value: "3" },
  { label: "May", value: "4" },
  { label: "June", value: "5" },
  { label: "July", value: "6" },
  { label: "August", value: "7" },
  { label: "September", value: "8" },
  { label: "October", value: "9" },
  { label: "November", value: "10" },
  { label: "December", value: "11" },
];

export const STATUSES: Array<{ label: string; value: string }> = [
  { label: "Paid", value: "Paid" },
  { label: "Submitted", value: "Submitted" },
  { label: "Draft", value: "Draft" },
  { label: "Cancelled", value: "Cancelled" },
];