import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  RefreshCw,
  BookOpen,
  TrendingUp,
  TrendingDown,
  Scale,
} from "lucide-react";
import ExpandableTreeTable from "../../components/ui/Table/ExpandableTreeTable";
import type { Column } from "../../components/ui/Table/type";
import { createAxiosInstance } from "../../api/axiosInstance";
import { ERP_BASE } from "../../config/api";
import { getLedgerDetails } from "../../api/Accounting/AccountApi";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";

const api = createAxiosInstance(ERP_BASE);

// ── Types ─────────────────────────────────────────────────────────────────────

interface LedgerRow {
  gl_entry: string;
  posting_date: string;
  account: string;
  party_type?: string;
  party?: string;
  voucher_type?: string;
  voucher_subtype?: string;
  voucher_no?: string;
  cost_center?: string;
  project?: string;
  against_voucher_type?: string;
  against_voucher?: string;
  account_currency?: string;
  against?: string;
  debit: number;
  credit: number;
  balance: number;
  bill_no?: string;
  remarks?: string;
  presentation_currency?: string;
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
  total: { debit: number; credit: number; balance: number };
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

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (n: number, currency = "INR") =>
  new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);

const today = () => new Date().toISOString().split("T")[0];
const startOfYear = () => `${new Date().getFullYear()}-01-01`;

// ── Summary Card ──────────────────────────────────────────────────────────────

interface SummaryCardProps {
  label: string;
  data: { debit: number; credit: number; balance: number };
  currency: string;
  icon: React.ReactNode;
  accent: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  label,
  data,
  currency,
  icon,
  accent,
}) => (
  <div
    className={`bg-card rounded-xl border border-[var(--border)] p-4 flex flex-col gap-3`}
  >
    <div className="flex items-center justify-between">
      <span className="text-[11px] font-black uppercase tracking-widest text-muted">
        {label}
      </span>
      <span className={`p-1.5 rounded-lg ${accent}`}>{icon}</span>
    </div>
    <div className="grid grid-cols-3 gap-2">
      <div>
        <p className="text-[10px] text-muted mb-0.5">Debit</p>
        <p className="text-xs font-bold text-main">{fmt(data.debit)}</p>
      </div>
      <div>
        <p className="text-[10px] text-muted mb-0.5">Credit</p>
        <p className="text-xs font-bold text-main">{fmt(data.credit)}</p>
      </div>
      <div>
        <p className="text-[10px] text-muted mb-0.5">Balance</p>
        <p
          className={`text-xs font-bold ${data.balance >= 0 ? "text-emerald-600" : "text-red-500"}`}
        >
          {fmt(data.balance)}
        </p>
      </div>
    </div>
  </div>
);

// ── Main Component ────────────────────────────────────────────────────────────

const GLView: React.FC = () => {
  const location = useLocation();

  const initialAccount =
    (location.state as { account?: string })?.account || "Debtors INR - RI";
  // ── Filters ──
  const [account, setAccount] = useState(initialAccount);
  const [fromDate, setFromDate] = useState(startOfYear());
  const [toDate, setToDate] = useState(today());
  const [pageSize] = useState(50);
  const navigate = useNavigate();

  // ── Applied filters (only update on Run) ──
  const [appliedFilters, setAppliedFilters] = useState({
    account: initialAccount,
    fromDate: startOfYear(),
    toDate: today(),
  });

  // ── Data ──
  const [data, setData] = useState<GLResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchGL = useCallback(
    async (filters: typeof appliedFilters, pg: number) => {
      if (!filters.account.trim()) return;

      setLoading(true);
      setError(null);

      try {
        const resp = await getLedgerDetails({
          account: filters.account,
          from_date: filters.fromDate,
          to_date: filters.toDate,
          page: pg,
          page_size: pageSize,
        });

        const d: GLResponse = resp?.message?.data;
        setData(d);
      } catch (err: any) {
        setError(err?.message || "Failed to fetch GL data.");
      } finally {
        setLoading(false);
      }
    },
    [pageSize],
  );
  // Initial load
  useEffect(() => {
    fetchGL(appliedFilters, 1);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleApplyFilters = () => {
    const f = { account, fromDate, toDate };
    setAppliedFilters(f);
    setPage(1);
    fetchGL(f, 1);
  };

  const handleRefresh = () => fetchGL(appliedFilters, page);

  const handlePageChange = (pg: number) => {
    setPage(pg);
    fetchGL(appliedFilters, pg);
  };

  // ── Build columns dynamically from API response ───────────────────────────
  const columns = useMemo<Column<LedgerRow>[]>(() => {
    if (!data?.columns) return [];

    return data.columns
      .filter((c) => !c.hidden)
      .map((col) => ({
        key: col.fieldname,
        header: col.label,
        align: (["debit", "credit", "balance"].includes(col.fieldname)
          ? "right"
          : "left") as "left" | "right" | "center",
        render: (row: LedgerRow) => {
          const val = row[col.fieldname];

          // Currency fields
          if (["debit", "credit", "balance"].includes(col.fieldname)) {
            const n = Number(val ?? 0);
            if (n === 0) return <span className="text-muted text-xs">—</span>;
            return (
              <span
                className={`text-xs font-medium tabular-nums ${
                  col.fieldname === "balance"
                    ? n >= 0
                      ? "text-emerald-600"
                      : "text-red-500"
                    : col.fieldname === "debit"
                      ? "text-blue-500"
                      : "text-amber-500"
                }`}
              >
                {fmt(n)}
              </span>
            );
          }

          // Date
          if (col.fieldname === "posting_date" && val) {
            return (
              <span className="text-xs text-main tabular-nums">
                {new Date(val).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            );
          }

          // Voucher No — highlight
          if (col.fieldname === "voucher_no" && val) {
            return (
              <span className="text-xs font-semibold text-primary">{val}</span>
            );
          }

          // Party
          if (col.fieldname === "party" && val) {
            return <span className="text-xs font-medium text-main">{val}</span>;
          }

          if (!val && val !== 0)
            return <span className="text-muted text-xs">—</span>;

          return <span className="text-xs text-main">{String(val)}</span>;
        },
      }));
  }, [data?.columns]);

  const pagination = data?.pagination;
  const summary = data?.summary;
  const currency = data?.presentation_currency ?? "INR";

  return (
    <div className="flex flex-col gap-5 p-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="text-xs px-2 py-1 border rounded-md hover:bg-row-hover"
          >
            ← Back
          </button>

          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-primary" />
            <span className="text-sm font-semibold text-primary">
              {account}
            </span>
          </div>
        </div>
       
      </div>

      {/* ── Filters Bar ── */}
      <div className="bg-card rounded-xl border border-[var(--border)] px-5 py-4 flex flex-wrap items-end gap-4">
        {/* Account */}
        <div className="flex flex-col gap-1 min-w-[220px]">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted">
            Account
          </label>
          <input
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            placeholder="e.g. Debtors INR - RI"
            className="px-3 py-2 text-xs border border-[var(--border)] rounded-lg bg-card text-main focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        {/* From Date */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted">
            From Date
          </label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="px-3 py-2 text-xs border border-[var(--border)] rounded-lg bg-card text-main focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        {/* To Date */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted">
            To Date
          </label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="px-3 py-2 text-xs border border-[var(--border)] rounded-lg bg-card text-main focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        {/* Run Button */}
        <button
          onClick={handleApplyFilters}
          disabled={loading || !account.trim()}
          className="flex items-center gap-2 px-5 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <RefreshCw size={12} className="animate-spin" />
          ) : (
            <BookOpen size={12} />
          )}
          Apply
        </button>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
          {error}
        </div>
      )}

      {/* ── Summary Cards ── */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SummaryCard
            label="Opening Balance"
            data={summary.opening}
            currency={currency}
            icon={<Scale size={13} className="text-blue-500" />}
            accent="bg-blue-50"
          />
          <SummaryCard
            label="Period Total"
            data={summary.total}
            currency={currency}
            icon={<TrendingUp size={13} className="text-emerald-500" />}
            accent="bg-emerald-50"
          />
          <SummaryCard
            label="Closing Balance"
            data={summary.closing}
            currency={currency}
            icon={<TrendingDown size={13} className="text-amber-500" />}
            accent="bg-amber-50"
          />
        </div>
      )}

      {/* ── Table ── */}
      {columns.length > 0 && (
        <ExpandableTreeTable<LedgerRow>
          columns={columns}
          data={data?.ledger ?? []}
          nodeKey={(row) => row.gl_entry}
          childrenKey="children"
          loading={loading}
          emptyMessage="No ledger entries found for the selected filters."
          showToolbar
          showSearch
          searchValue={search}
          onSearch={setSearch}
          toolbarPlaceholder="Search entries..."
          onRefresh={handleRefresh}
          showExpandControls={false}
          matchNode={(row, term) => {
            const t = term.toLowerCase();
            return (
              row.party?.toLowerCase().includes(t) ||
              row.voucher_no?.toLowerCase().includes(t) ||
              row.against?.toLowerCase().includes(t) ||
              row.voucher_type?.toLowerCase().includes(t) ||
              row.posting_date?.includes(t) ||
              false
            );
          }}
        />
      )}

      {/* ── Pagination ── */}
      {pagination && pagination.total_pages > 1 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-[11px] text-muted">
            Showing{" "}
            <span className="font-semibold text-main">
              {(pagination.page - 1) * pagination.page_size + 1}–
              {Math.min(
                pagination.page * pagination.page_size,
                pagination.total_entries,
              )}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-main">
              {pagination.total_entries}
            </span>{" "}
            entries
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={!pagination.has_prev || loading}
              className="px-3 py-1.5 text-xs border border-[var(--border)] rounded-lg bg-card text-main hover:bg-row-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              ← Prev
            </button>

            {/* Page numbers */}
            {Array.from({ length: pagination.total_pages }, (_, i) => i + 1)
              .filter((p) => Math.abs(p - page) <= 2)
              .map((p) => (
                <button
                  key={p}
                  onClick={() => handlePageChange(p)}
                  disabled={loading}
                  className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
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
              className="px-3 py-1.5 text-xs border border-[var(--border)] rounded-lg bg-card text-main hover:bg-row-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GLView;
