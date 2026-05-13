// ─── Shared helpers ───────────────────────────────────────────────────────────

export const getFileUrl = (file?: string | null, base = "") =>
  file ? `${base}${file}` : null;

export const fmt = (val: any): string | null =>
  val !== null && val !== undefined && val !== "" ? String(val) : null;

export const fmtDate = (val: any): string | null => {
  if (!val) return null;
  try {
    return new Date(val).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return val;
  }
};

export const fmtMoney = (val: any, currency = "ZMW"): string | null => {
  const n = Number(val);
  if (!n) return null;
  return `${currency} ${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
};

export const initials = (emp: any): string => {
  const f = (emp?.first_name?.[0] || "").toUpperCase();
  const l = (emp?.last_name?.[0] || "").toUpperCase();
  return f + l || "?";
};

// ─── Status badge classes ─────────────────────────────────────────────────────

const statusClasses: Record<string, string> = {
  active:
    "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
  inactive:
    "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700",
  suspended:
    "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
  left: "bg-red-100 text-red-600 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
};

export const getStatusClass = (status?: string): string =>
  statusClasses[(status || "").toLowerCase()] ||
  "bg-gray-100 text-gray-600 border-gray-200";