import React, { useState, useCallback, useMemo } from "react";
import {
  FileText,
  Download,
  Search,
  Loader2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { SalarySlip } from "./salarytypes";
import { formatCurrency, formatDate, getSlipPeriodLabel } from "./salarysliphelper";
import {
  getSalarySlipPdf,
  viewSalarySlipPdf,
  downloadSalarySlipPdf,
} from "../../../../api/payroll/payrollEntryApi";

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTHS = [
  { label: "All Months", value: "" },
  { label: "January",   value: "0"  },
  { label: "February",  value: "1"  },
  { label: "March",     value: "2"  },
  { label: "April",     value: "3"  },
  { label: "May",       value: "4"  },
  { label: "June",      value: "5"  },
  { label: "July",      value: "6"  },
  { label: "August",    value: "7"  },
  { label: "September", value: "8"  },
  { label: "October",   value: "9"  },
  { label: "November",  value: "10" },
  { label: "December",  value: "11" },
];

const currentYear = new Date().getFullYear();
const YEARS = [
  { label: "All Years", value: "" },
  ...Array.from({ length: 6 }, (_, i) => ({
    label: String(currentYear - i),
    value: String(currentYear - i),
  })),
];

const STATUSES = [
  { label: "All Status", value: ""          },
  { label: "Submitted",  value: "Submitted" },
  { label: "Draft",      value: "Draft"     },
  { label: "Cancelled",  value: "Cancelled" },
];

const PAGE_SIZE = 10;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getSlipMonth(slip: SalarySlip): number | null {
  const d = slip.posting_date || slip.start_date;
  return d ? new Date(d).getMonth() : null;
}
function getSlipYear(slip: SalarySlip): number | null {
  const d = slip.posting_date || slip.start_date;
  return d ? new Date(d).getFullYear() : null;
}

// ─── Status Pill ──────────────────────────────────────────────────────────────

const StatusPill: React.FC<{ status: string }> = ({ status }) => {
  const styles: Record<string, string> = {
    Submitted: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800",
    Draft:     "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800",
    Cancelled: "bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
  };
  const cls = styles[status] ?? "bg-gray-50 text-gray-500 border-gray-200";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border ${cls}`}>
      {status || "—"}
    </span>
  );
};

// ─── Filter Select ────────────────────────────────────────────────────────────

const FilterSelect: React.FC<{
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (v: string) => void;
}> = ({ label, value, options, onChange }) => (
  <div className="flex flex-col gap-1">
    <label className="text-[9px] font-bold uppercase tracking-wider text-muted px-0.5">
      {label}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="text-[12px] bg-card border border-theme rounded-lg px-2.5 py-[7px] text-main focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/50 transition-all cursor-pointer"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  </div>
);

// ─── Empty State ──────────────────────────────────────────────────────────────

const EmptyState: React.FC<{ isFiltered: boolean }> = ({ isFiltered }) => (
  <tr>
    <td colSpan={5}>
      <div className="flex flex-col items-center justify-center py-14 px-4">
        <div className="w-14 h-14 rounded-2xl bg-primary/8 flex items-center justify-center mb-4">
          <FileText className="w-6 h-6 text-primary/40" />
        </div>
        <p className="text-[13px] font-semibold text-main mb-1.5">
          {isFiltered ? "No matching salary slips" : "No salary slips yet"}
        </p>
        <p className="text-[11px] text-muted text-center max-w-[260px] leading-relaxed">
          {isFiltered
            ? "Try adjusting your filters or search term to find what you're looking for."
            : "Salary slips will appear here once payroll has been processed for this employee."}
        </p>
      </div>
    </td>
  </tr>
);

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const SkeletonRow = () => (
  <tr className="animate-pulse border-b border-theme">
    <td className="px-4 py-3.5">
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-gray-200/80 flex-shrink-0" />
        <div className="space-y-1.5">
          <div className="h-3 w-28 bg-gray-200/80 rounded" />
          <div className="h-2.5 w-20 bg-gray-200/50 rounded" />
        </div>
      </div>
    </td>
    <td className="px-4 py-3.5 text-right hidden md:table-cell">
      <div className="h-3 w-20 bg-gray-200/70 rounded ml-auto" />
    </td>
    <td className="px-4 py-3.5 text-right hidden md:table-cell">
      <div className="h-3 w-20 bg-gray-200/70 rounded ml-auto" />
    </td>
    <td className="px-4 py-3.5 text-center">
      <div className="h-5 w-16 bg-gray-200/60 rounded-md mx-auto" />
    </td>
    <td className="px-4 py-3.5">
      <div className="flex gap-1.5 justify-end">
        <div className="h-7 w-14 bg-gray-200/80 rounded-lg" />
        <div className="h-7 w-7 bg-gray-200/60 rounded-lg" />
      </div>
    </td>
  </tr>
);

// ─── Main ─────────────────────────────────────────────────────────────────────

interface SalarySlipTableProps {
  slips: SalarySlip[];
  loading?: boolean;
}

export const SalarySlipTable: React.FC<SalarySlipTableProps> = ({
  slips,
  loading = false,
}) => {
  const [search,        setSearch]        = useState("");
  const [yearFilter,    setYearFilter]    = useState("");
  const [monthFilter,   setMonthFilter]   = useState("");
  const [statusFilter,  setStatusFilter]  = useState("");
  const [page,          setPage]          = useState(1);
  const [viewingId,     setViewingId]     = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const withReset = (setter: (v: string) => void) => (v: string) => {
    setter(v);
    setPage(1);
  };

  // ── Filtering ─────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    let list = [...slips];
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (s) =>
          s.name?.toLowerCase().includes(q) ||
          s.employee_name?.toLowerCase().includes(q) ||
          getSlipPeriodLabel(s)?.toLowerCase().includes(q),
      );
    }
    if (yearFilter)   list = list.filter((s) => String(getSlipYear(s))  === yearFilter);
    if (monthFilter)  list = list.filter((s) => String(getSlipMonth(s)) === monthFilter);
    if (statusFilter) list = list.filter((s) => s.status === statusFilter);
    return list;
  }, [slips, search, yearFilter, monthFilter, statusFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const isFiltered = !!(search || yearFilter || monthFilter || statusFilter);

  // ── Actions ───────────────────────────────────────────────────────────────

  const handleView = async (slip: SalarySlip) => {
    try {
      setViewingId(slip.name);
      const blob = await getSalarySlipPdf(slip.name);
      viewSalarySlipPdf(blob);
    } catch (err) {
      console.error("View failed", err);
    } finally {
      setViewingId(null);
    }
  };

  const handleDownload = async (slip: SalarySlip) => {
    try {
      setDownloadingId(slip.name);
      const blob = await getSalarySlipPdf(slip.name);
      downloadSalarySlipPdf(blob, `${getSlipPeriodLabel(slip) || slip.name}.pdf`);
    } catch (err) {
      console.error("Download failed", err);
    } finally {
      setDownloadingId(null);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4">

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by name or period…"
          className="w-full pl-9 pr-3 py-[9px] text-[12px] bg-app border border-theme rounded-lg text-main placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/50 transition-all"
        />
      </div>

      {/* Static Filter Row — always visible */}
      <div className="flex flex-wrap items-end gap-3 px-3.5 py-3 bg-app rounded-xl border border-theme">
        <FilterSelect label="Year"   value={yearFilter}   options={YEARS}    onChange={withReset(setYearFilter)}   />
        <FilterSelect label="Month"  value={monthFilter}  options={MONTHS}   onChange={withReset(setMonthFilter)}  />
        <FilterSelect label="Status" value={statusFilter} options={STATUSES} onChange={withReset(setStatusFilter)} />
        {isFiltered && (
          <button
            onClick={() => { setSearch(""); setYearFilter(""); setMonthFilter(""); setStatusFilter(""); setPage(1); }}
            className="ml-auto text-[11px] font-medium text-muted hover:text-danger transition-colors self-end pb-[7px]"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Count */}
      {!loading && (
        <p className="text-[11px] text-muted -mt-1 px-0.5">
          {filtered.length === slips.length
            ? `${slips.length} slip${slips.length !== 1 ? "s" : ""}`
            : `${filtered.length} of ${slips.length} slips`}
        </p>
      )}

      {/* Table */}
      <div className="rounded-xl border border-theme bg-card overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-theme bg-app">
              <th className="px-4 py-2.5 text-left   text-[9px] font-bold uppercase tracking-wider text-muted">Period</th>
              <th className="px-4 py-2.5 text-right  text-[9px] font-bold uppercase tracking-wider text-muted hidden md:table-cell">Gross Pay</th>
              <th className="px-4 py-2.5 text-right  text-[9px] font-bold uppercase tracking-wider text-muted hidden md:table-cell">Net Pay</th>
              <th className="px-4 py-2.5 text-center text-[9px] font-bold uppercase tracking-wider text-muted">Status</th>
              <th className="px-4 py-2.5 text-right  text-[9px] font-bold uppercase tracking-wider text-muted">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              : filtered.length === 0
              ? <EmptyState isFiltered={isFiltered} />
              : paginated.map((slip, idx) => {
                  const isViewing     = viewingId    === slip.name;
                  const isDownloading = downloadingId === slip.name;
                  const busy          = isViewing || isDownloading;

                  return (
                    <tr
                      key={slip.name}
                      className={`transition-colors hover:bg-app/60 ${
                        idx < paginated.length - 1 ? "border-b border-theme" : ""
                      }`}
                    >
                      {/* Period */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-primary/8 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-3.5 h-3.5 text-primary/60" />
                          </div>
                          <div>
                            <p className="text-[12px] font-semibold text-main leading-snug">
                              {getSlipPeriodLabel(slip)}
                            </p>
                            <p className="text-[10px] text-muted font-mono">{slip.name}</p>
                            {slip.posting_date && (
                              <p className="text-[10px] text-muted">{formatDate(slip.posting_date)}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Gross */}
                      <td className="px-4 py-3.5 text-right hidden md:table-cell">
                        <p className="text-[12px] font-semibold text-main">
                          {slip.gross_pay
                            ? formatCurrency(slip.gross_pay, slip.currency)
                            : <span className="text-muted font-normal">—</span>}
                        </p>
                      </td>

                      {/* Net */}
                      <td className="px-4 py-3.5 text-right hidden md:table-cell">
                        <p className="text-[12px] font-semibold text-emerald-600">
                          {slip.net_pay
                            ? formatCurrency(slip.net_pay, slip.currency)
                            : <span className="text-muted font-normal">—</span>}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 text-center">
                        <StatusPill status={slip.status} />
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 justify-end">
                          <button
                            onClick={() => handleView(slip)}
                            disabled={busy}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold rounded-lg bg-primary text-white hover:bg-primary/85 transition-colors disabled:opacity-60"
                          >
                            {isViewing
                              ? <Loader2 className="w-3 h-3 animate-spin" />
                              : <ExternalLink className="w-3 h-3" />}
                            View
                          </button>
                          <button
                            onClick={() => handleDownload(slip)}
                            disabled={busy}
                            title="Download PDF"
                            className="p-1.5 rounded-lg border border-theme hover:bg-primary/8 hover:border-primary/30 transition-colors disabled:opacity-50 group/dl"
                          >
                            {isDownloading
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                              : <Download className="w-3.5 h-3.5 text-muted group-hover/dl:text-primary transition-colors" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-0.5">
          <span className="text-[11px] text-muted">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="p-1.5 rounded-lg border border-theme hover:bg-app disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-muted" />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const pg = totalPages <= 5
                ? i + 1
                : Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
              return (
                <button
                  key={pg}
                  onClick={() => setPage(pg)}
                  className={`w-7 h-7 text-[11px] font-semibold rounded-lg transition-colors ${
                    pg === page
                      ? "bg-primary text-white"
                      : "border border-theme text-muted hover:bg-app hover:text-main"
                  }`}
                >
                  {pg}
                </button>
              );
            })}
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="p-1.5 rounded-lg border border-theme hover:bg-app disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5 text-muted" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};