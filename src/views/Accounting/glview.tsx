import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import {
  RefreshCw, BookOpen, TrendingUp, TrendingDown,
  Scale, Loader2, ChevronLeft, ChevronRight,
} from "lucide-react";
import { getLedgerDetails } from "../../api/Accounting/AccountApi";
import { useLocation, useNavigate } from "react-router-dom";

interface LedgerRow {
  gl_entry: string;
  posting_date: string;
  account: string;
  party_type?: string;
  party?: string;
  voucher_type?: string;
  voucher_no?: string;
  against?: string;
  debit: number;
  credit: number;
  balance: number;
  remarks?: string;
  [key: string]: any;
}

interface ApiColumn {
  label: string;
  fieldname: string;
  fieldtype?: string;
  hidden?: number;
  width?: number;
}

interface Summary {
  opening: { debit: number; credit: number; balance: number };
  total:   { debit: number; credit: number; balance: number };
  closing: { debit: number; credit: number; balance: number };
}

interface Pagination {
  page: number;
  page_size: number;
  total_entries: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

interface GLResponse {
  account: string;
  account_currency: string;
  presentation_currency: string;
  company: string;
  summary: Summary;
  columns: ApiColumn[];
  ledger: LedgerRow[];
  pagination: Pagination;
}

export interface GLViewProps {
  account?: string;
  onBack?: () => void;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

const today       = () => new Date().toISOString().split("T")[0];
const startOfYear = () => `${new Date().getFullYear()}-01-01`;

// ── Compact KPI strip ────────────────────────────────────────────────────────
const KpiStrip: React.FC<{ summary: Summary }> = ({ summary }) => {
  const kpis = [
    {
      label: "Opening — Debit",
      value: summary.opening.debit,
      color: "text-blue-500",
    },
    {
      label: "Opening — Credit",
      value: summary.opening.credit,
      color: "text-amber-500",
    },
    {
      label: "Opening Balance",
      value: summary.opening.balance,
      color: summary.opening.balance >= 0 ? "text-emerald-600" : "text-red-500",
      bold: true,
    },
    {
      label: "Period Debit",
      value: summary.total.debit,
      color: "text-blue-500",
    },
    {
      label: "Period Credit",
      value: summary.total.credit,
      color: "text-amber-500",
    },
    {
      label: "Period Balance",
      value: summary.total.balance,
      color: summary.total.balance >= 0 ? "text-emerald-600" : "text-red-500",
      bold: true,
    },
    {
      label: "Closing Debit",
      value: summary.closing.debit,
      color: "text-blue-500",
    },
    {
      label: "Closing Credit",
      value: summary.closing.credit,
      color: "text-amber-500",
    },
    {
      label: "Closing Balance",
      value: summary.closing.balance,
      color: summary.closing.balance >= 0 ? "text-emerald-600" : "text-red-500",
      bold: true,
    },
  ];

  // Group into 3 sections
  const sections = [
    { icon: <Scale size={11} className="text-blue-400" />, label: "Opening", items: kpis.slice(0, 3) },
    { icon: <TrendingUp size={11} className="text-emerald-400" />, label: "Period", items: kpis.slice(3, 6) },
    { icon: <TrendingDown size={11} className="text-amber-400" />, label: "Closing", items: kpis.slice(6, 9) },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
      {sections.map((sec) => (
        <div
          key={sec.label}
          className="bg-card border border-[var(--border)] rounded-lg px-3 py-2.5 flex flex-col gap-2"
        >
          {/* Section header */}
          <div className="flex items-center gap-1.5">
            {sec.icon}
            <span className="text-[10px] font-black uppercase tracking-widest text-muted">
              {sec.label}
            </span>
          </div>
          {/* 3 values in a row */}
          <div className="grid grid-cols-3 gap-1 divide-x divide-[var(--border)]">
            {sec.items.map((kpi) => (
              <div key={kpi.label} className="flex flex-col gap-0.5 px-1 first:pl-0 last:pr-0">
                <span className="text-[9px] leading-tight text-muted truncate">
                  {kpi.label.split(" — ")[1] ?? kpi.label.split(" ")[1]}
                </span>
                <span
                  className={`text-[11px] font-bold tabular-nums leading-tight ${kpi.color} ${
                    kpi.bold ? "font-extrabold" : ""
                  }`}
                >
                  {fmt(kpi.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const GLView: React.FC<GLViewProps> = ({ account: accountProp, onBack }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const initialAccount =
    accountProp ||
    (location.state as { account?: string })?.account ||
    "";

  const [account, setAccount]   = useState(initialAccount);
  const [fromDate, setFromDate] = useState(startOfYear());
  const [toDate, setToDate]     = useState(today());
  const [pageSize]              = useState(10);

  const [appliedFilters, setAppliedFilters] = useState({
    account: initialAccount,
    fromDate: startOfYear(),
    toDate: today(),
  });

  const [glData, setGlData]   = useState<GLResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [page, setPage]       = useState(1);

  const fetchGL = useCallback(async (filters: typeof appliedFilters, pg: number) => {
    if (!filters.account.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const resp = await getLedgerDetails({
        account:   filters.account,
        from_date: filters.fromDate,
        to_date:   filters.toDate,
        page:      pg,
        page_size: pageSize,
      });
      setGlData(resp?.message?.data ?? null);
    } catch (err: any) {
      setError(err?.message || "Failed to fetch GL data.");
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  useEffect(() => { fetchGL(appliedFilters, 1); }, []); // eslint-disable-line

  useEffect(() => {
    if (accountProp && accountProp !== appliedFilters.account) {
      const f = { account: accountProp, fromDate: startOfYear(), toDate: today() };
      setAccount(accountProp);
      setFromDate(startOfYear());
      setToDate(today());
      setAppliedFilters(f);
      setPage(1);
      fetchGL(f, 1);
    }
  }, [accountProp]); // eslint-disable-line

  const handleBack = () => { if (onBack) onBack(); else navigate(-1); };

  const handleApply = () => {
    const f = { account, fromDate, toDate };
    setAppliedFilters(f);
    setPage(1);
    fetchGL(f, 1);
  };

  const handlePageChange = (pg: number) => {
    setPage(pg);
    fetchGL(appliedFilters, pg);
  };

  const columns = useMemo<ColumnDef<LedgerRow>[]>(() => {
    if (!glData?.columns) return [];
    return glData.columns
      .filter((c) => !c.hidden)
      .map((col): ColumnDef<LedgerRow> => {
        const isAmount = ["debit", "credit", "balance"].includes(col.fieldname);
        return {
          id: col.fieldname,
          accessorKey: col.fieldname,
          header: col.label,
          size: col.width ?? (isAmount ? 120 : 150),
          meta: { align: isAmount ? "right" : "left" },
          cell: ({ getValue }) => {
            const val = getValue();
            if (isAmount) {
              const n = Number(val ?? 0);
              if (n === 0) return <span className="text-muted text-xs">—</span>;
              return (
                <span className={`text-xs font-medium tabular-nums ${
                  col.fieldname === "balance"
                    ? n >= 0 ? "text-emerald-600" : "text-red-500"
                    : col.fieldname === "debit" ? "text-blue-500" : "text-amber-500"
                }`}>
                  {fmt(n)}
                </span>
              );
            }
            if (col.fieldname === "posting_date" && val) {
              return (
                <span className="text-xs text-main tabular-nums">
                  {new Date(String(val)).toLocaleDateString("en-IN", {
                    day: "2-digit", month: "short", year: "numeric",
                  })}
                </span>
              );
            }
            if (col.fieldname === "voucher_no" && val)
              return <span className="text-xs font-semibold text-primary">{String(val)}</span>;
            if (col.fieldname === "party" && val)
              return <span className="text-xs font-medium text-main">{String(val)}</span>;
            if (!val && val !== 0)
              return <span className="text-muted text-xs">—</span>;
            return <span className="text-xs text-main">{String(val)}</span>;
          },
        };
      });
  }, [glData?.columns]);

  const table = useReactTable({
    data:             glData?.ledger ?? [],
    columns,
    getCoreRowModel:  getCoreRowModel(),
    manualPagination: true,
    pageCount:        glData?.pagination?.total_pages ?? -1,
  });

  const pagination = glData?.pagination;
  const summary    = glData?.summary;

  return (
    <div className="flex flex-col gap-3">

      {/* ── Filter Bar (with Back + title inline) ── */}
      <div className="bg-card rounded-lg border border-[var(--border)] px-3 py-2.5
                      flex flex-wrap items-end gap-2">

        {/* Back button + page title — sits before Account, aligned to input bottom */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 h-[13px]">
            <div
              className="flex h-4 w-4 shrink-0 items-center justify-center rounded text-primary"
              style={{ background: "color-mix(in srgb, var(--primary) 12%, transparent)" }}
            >
              <BookOpen size={10} />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest text-muted leading-none">
              General Ledger
            </span>
          </div>
          <button
            onClick={handleBack}
            className="h-8 flex items-center gap-1 text-xs px-2.5 border border-[var(--border)]
                       rounded-md hover:bg-row-hover text-muted transition-all whitespace-nowrap shrink-0"
          >
            <ChevronLeft size={12} /> Back
          </button>
        </div>

        {/* Subtle divider */}
        <div className="self-stretch w-px bg-[var(--border)] mx-0.5" />

        <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
          <label className="text-[9px] font-black uppercase tracking-widest text-muted">Account</label>
          <input
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            placeholder="e.g. Debtors INR - RI"
            className="h-8 px-2.5 text-xs border border-[var(--border)] rounded-md bg-card text-main
                       focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                       disabled
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-black uppercase tracking-widest text-muted">From</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="h-8 px-2.5 text-xs border border-[var(--border)] rounded-md bg-card text-main
                       focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-black uppercase tracking-widest text-muted">To</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="h-8 px-2.5 text-xs border border-[var(--border)] rounded-md bg-card text-main
                       focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        <button
          onClick={handleApply}
          disabled={loading || !account.trim()}
          className="h-8 flex items-center gap-1.5 px-4 bg-primary text-white text-xs font-bold
                     rounded-md hover:bg-primary/90 transition-all disabled:opacity-50
                     disabled:cursor-not-allowed whitespace-nowrap"
        >
          {loading
            ? <RefreshCw size={11} className="animate-spin" />
            : <BookOpen size={11} />}
          Apply
        </button>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-500">
          {error}
        </div>
      )}

      {/* ── Compact KPI Strip ── */}
      {summary && <KpiStrip summary={summary} />}

      {/* ── Table ── */}
      {columns.length > 0 && (
        <div className="bg-card border border-[var(--border)] rounded-xl overflow-hidden flex flex-col">
          <div className="overflow-x-auto overflow-y-auto flex-1 relative">
            <table className="w-full text-left border-collapse min-w-max">
              <thead className="sticky top-0 z-10 border-b border-[var(--border)]">
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id}>
                    {hg.headers.map((header) => {
                      const align = (header.column.columnDef.meta as any)?.align === "right"
                        ? "text-right" : "text-left";
                      return (
                        <th
                          key={header.id}
                          style={{ width: header.getSize() }}
                          className={`px-3 py-2 text-[9px] font-black uppercase tracking-widest
                                      text-muted whitespace-nowrap bg-row-hover
                                      border-b border-[var(--border)] ${align}`}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {loading && !(glData?.ledger?.length) ? (
                  <tr>
                    <td colSpan={columns.length} style={{ height: `${Math.min(pageSize, 10) * 38}px` }}>
                      <div className="flex justify-center items-center h-full">
                        <Loader2 size={20} className="animate-spin text-muted" />
                      </div>
                    </td>
                  </tr>
                ) : table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="py-14 text-center text-xs text-muted">
                      No ledger entries found for the selected filters.
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="hover:bg-row-hover transition-colors h-[36px]">
                      {row.getVisibleCells().map((cell) => {
                        const align = (cell.column.columnDef.meta as any)?.align === "right"
                          ? "text-right" : "text-left";
                        return (
                          <td key={cell.id} className={`px-3 py-1 whitespace-nowrap ${align}`}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Loading overlay when data already exists */}
            {loading && (glData?.ledger?.length ?? 0) > 0 && (
              <div className="absolute inset-0 bg-card/60 backdrop-blur-[1px] flex items-center justify-center z-20">
                <Loader2 size={20} className="animate-spin text-primary" />
              </div>
            )}
          </div>

          {/* ── Pagination ── */}
          {pagination && (
            <div className="border-t border-[var(--border)] bg-card px-3 py-2
                            flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
              <span className="text-[11px]">
                {pagination.total_entries > 0 ? (
                  <>
                    Showing{" "}
                    <span className="font-semibold text-main">
                      {(pagination.page - 1) * pagination.page_size + 1}–
                      {Math.min(pagination.page * pagination.page_size, pagination.total_entries)}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-main">{pagination.total_entries}</span>
                  </>
                ) : "No entries"}
              </span>
              {pagination.total_pages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={!pagination.has_prev || loading}
                    className="p-1 rounded-md border border-[var(--border)] bg-card text-main
                               hover:bg-row-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft size={13} />
                  </button>
                  {Array.from({ length: pagination.total_pages }, (_, i) => i + 1)
                    .filter((p) => Math.abs(p - page) <= 2)
                    .map((p) => (
                      <button
                        key={p}
                        onClick={() => handlePageChange(p)}
                        disabled={loading}
                        className={`px-2 py-0.5 text-[11px] rounded-md border transition-all ${
                          p === page
                            ? "bg-primary text-white border-primary font-bold"
                            : "border-[var(--border)] bg-card text-main hover:bg-row-hover"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={!pagination.has_next || loading}
                    className="p-1 rounded-md border border-[var(--border)] bg-card text-main
                               hover:bg-row-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight size={13} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GLView;