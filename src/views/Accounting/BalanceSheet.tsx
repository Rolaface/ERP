import React, { useState, useEffect, useCallback, useMemo } from "react";
import ExpandableTreeTable from "../../components/ui/Table/ExpandableTreeTable";
import type { Column } from "../../components/ui/Table/type";
import {
  getBalanceSheet,
  type BalanceSheetFilters,
} from "../../api/Accounting/AccountApi";
import {
  AlertCircle,
  Loader2,
  RefreshCw,
  Folder,
  FolderOpen,
  FileText,
  ChevronRight,
  Layers,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type BSNode = {
  id: string;
  account: string;
  account_name: string;
  currency?: string;
  parent_account: string;
  indent: number;
  is_group: number;
  has_value?: boolean;
  opening_balance?: number;
  periods: Record<string, number>;
  children: BSNode[];
};

export type BSSummaryItem = {
  label: string;
  value: number;
  datatype?: string;
  currency?: string;
  indicator?: string;
};

export type BSColumn = {
  fieldname: string;
  label: string;
  fieldtype: string;
  width?: number;
  options?: string;
  hidden?: number;
};

export type BSData = {
  columns: BSColumn[];
  summary: BSSummaryItem[];
  assets: BSNode[];
  liabilities: BSNode[];
  equity: BSNode[];
};

export type BSResponse = {
  message: {
    status_code: number;
    status: string;
    message: string;
    data: BSData;
  };
};

// ─── Mapper ───────────────────────────────────────────────────────────────────

function mapBSNode(node: Partial<BSNode> & Record<string, any>): BSNode {
  return {
    id: node.account as string,
    account: node.account as string,
    account_name: node.account_name as string,
    currency: node.currency,
    parent_account: node.parent_account as string,
    indent: node.indent as number,
    is_group: node.is_group as number,
    has_value: node.has_value,
    opening_balance: node.opening_balance,
    periods: node.periods ?? {},
    children: node.children?.map(mapBSNode) ?? [],
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Format a number as Indian locale currency string.
 * Negative values are wrapped in parens, zero/null returns "—".
 */
const nf = (value: number | undefined | null, currency?: string): string => {
  if (value === null || value === undefined) return "—";
  const formatted = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(value));
  const prefix = currency ? `${currency} ` : "";
  return value < 0 ? `${prefix}-${formatted}` : `${prefix}${formatted}`;
};

const currentYear = new Date().getFullYear();

// ─── Date Utilities ───────────────────────────────────────────────────────────

/** "DD-MM-YYYY" → "YYYY-MM-DD" */
const toInputDate = (apiDate: string): string => {
  if (!apiDate || !apiDate.includes("-")) return "";
  const parts = apiDate.split("-");
  if (parts[0].length === 4) return apiDate;
  const [d, m, y] = parts;
  return `${y}-${m}-${d}`;
};

/** "YYYY-MM-DD" → "DD-MM-YYYY" */
const toApiDate = (inputDate: string): string => {
  if (!inputDate || !inputDate.includes("-")) return "";
  const [y, m, d] = inputDate.split("-");
  return `${d}-${m}-${y}`;
};

const currentMonthStart = (): string => {
  const d = new Date();
  return `01-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
};

const currentMonthEnd = (): string => {
  const d = new Date();
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  return `${String(last).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
};

// ─── Filter types ─────────────────────────────────────────────────────────────

type FilterMode = "Fiscal Year" | "Date Range";
type Periodicity = "Monthly" | "Quarterly" | "Yearly" | "Half-Yearly";

interface BSFilters {
  mode: FilterMode;
  periodicity: Periodicity;
  from_fiscal_year: number;
  to_fiscal_year: number;
  from_date?: string;
  to_date?: string;
}

// ─── Expand Icon ──────────────────────────────────────────────────────────────

function expandIcon(
  _node: BSNode,
  isExpanded: boolean,
  hasChildren: boolean
): React.ReactNode {
  if (!hasChildren)
    return <FileText size={12} className="text-muted opacity-50" />;
  return isExpanded ? (
    <FolderOpen size={13} className="text-muted" />
  ) : (
    <Folder size={13} className="text-muted" />
  );
}

// ─── Summary Strip ────────────────────────────────────────────────────────────

function SummaryStrip({ summary }: { summary: BSSummaryItem[] }) {
  const items = summary.filter(Boolean);

  const colorFor = (item: BSSummaryItem): string => {
    const ind = item.indicator?.toLowerCase();
    if (ind === "green") return "text-emerald-500";
    if (ind === "red") return "text-rose-500";
    // Fallback: color by label content
    if (item.label?.toLowerCase().includes("asset")) return "text-blue-500";
    if (item.label?.toLowerCase().includes("liabilit")) return "text-rose-500";
    if (item.label?.toLowerCase().includes("equity")) return "text-violet-500";
    if (item.label?.toLowerCase().includes("profit")) return "text-emerald-500";
    return "text-main";
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 w-full max-w-[900px]">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border p-3 flex flex-col gap-1 bg-card w-full"
        >
          <span className="text-[10px] font-black uppercase tracking-[0.14em] text-muted opacity-70">
            {item.label}
          </span>
          <div className={`text-sm font-black tracking-tight ${colorFor(item)}`}>
            {nf(item.value, item.currency)}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Filter Bar ───────────────────────────────────────────────────────────────

type FilterBarProps = {
  filters: BSFilters;
  setFilters: React.Dispatch<React.SetStateAction<BSFilters>>;
  onRefresh: () => void;
  loading: boolean;
  onExpandAll: () => void;
  onCollapseAll: () => void;
};

function FilterBar({
  filters,
  setFilters,
  onRefresh,
  loading,
  onExpandAll,
  onCollapseAll,
}: FilterBarProps) {
  const inputClass =
    "w-25 px-2 py-1.5 border border-[var(--border)] rounded-lg bg-card text-main text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all";

  const btnClass =
    "flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-main bg-card border border-[var(--border)] rounded-xl hover:bg-row-hover transition-all whitespace-nowrap";

  return (
    <div className="w-[905px] flex items-center gap-2 flex-nowrap overflow-x-auto p-3 rounded-xl border border-[var(--border)] bg-card shadow-sm scrollbar-thin">
      {/* MODE */}
      <div className="flex items-center gap-1">
        <span className="text-[10px] font-black uppercase tracking-widest text-muted opacity-50">
          Mode
        </span>
        <select
          value={filters.mode}
          onChange={(e) => {
            const mode = e.target.value as FilterMode;
            setFilters((f) => ({
              ...f,
              mode,
              ...(mode === "Date Range"
                ? { from_date: currentMonthStart(), to_date: currentMonthEnd() }
                : { from_fiscal_year: currentYear, to_fiscal_year: currentYear }),
            }));
          }}
          className={inputClass}
        >
          <option value="Fiscal Year">Fiscal Year</option>
          <option value="Date Range">Date Range</option>
        </select>
      </div>

      {/* PERIODICITY */}
      <div className="flex items-center gap-1">
        <span className="text-[10px] font-black uppercase tracking-widest text-muted opacity-50">
          Period
        </span>
        <select
          value={filters.periodicity}
          onChange={(e) =>
            setFilters((f) => ({
              ...f,
              periodicity: e.target.value as Periodicity,
            }))
          }
          className={inputClass}
        >
          <option value="Monthly">Monthly</option>
          <option value="Quarterly">Quarterly</option>
          <option value="Yearly">Yearly</option>
          <option value="Half-Yearly">Half-Yearly</option>
        </select>
      </div>

      {/* FISCAL YEAR RANGE */}
      {filters.mode !== "Date Range" && (
        <>
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted opacity-50">
              From FY
            </span>
            <input
              type="number"
              value={filters.from_fiscal_year}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  from_fiscal_year: Number(e.target.value),
                }))
              }
              className={inputClass}
            />
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted opacity-50">
              To FY
            </span>
            <input
              type="number"
              value={filters.to_fiscal_year}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  to_fiscal_year: Number(e.target.value),
                }))
              }
              className={inputClass}
            />
          </div>
        </>
      )}

      {/* DATE RANGE */}
      {filters.mode === "Date Range" && (
        <>
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted opacity-50">
              From
            </span>
            <input
              type="date"
              value={toInputDate(filters.from_date ?? "")}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  from_date: toApiDate(e.target.value),
                }))
              }
              className={inputClass}
            />
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted opacity-50">
              To
            </span>
            <input
              type="date"
              value={toInputDate(filters.to_date ?? "")}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  to_date: toApiDate(e.target.value),
                }))
              }
              className={inputClass}
            />
          </div>
        </>
      )}

      <div className="h-5 w-px bg-[var(--border)] mx-1" />

      {/* EXPAND ALL */}
      <button onClick={onExpandAll} className={btnClass}>
        <Layers size={11} />
        Expand All
      </button>

      {/* COLLAPSE */}
      <button onClick={onCollapseAll} className={btnClass}>
        <ChevronRight size={11} />
        Collapse
      </button>
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({
  label,
  total,
  currency,
  accentClass,
}: {
  label: string;
  total: number;
  currency?: string;
  accentClass: string;
}) {
  return (
    <div className="flex items-center gap-2 px-1 py-0.5">
      <span className={`w-1 h-4 rounded-full inline-block ${accentClass}`} />
      <span className="text-xs font-bold text-main uppercase tracking-widest">
        {label}
      </span>
      <span className={`ml-auto text-xs font-mono font-bold ${accentClass.replace("bg-", "text-")}`}>
        {nf(total, currency)}
      </span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const BalanceSheet: React.FC = () => {
  const [filters, setFilters] = useState<BSFilters>({
    mode: "Fiscal Year",
    periodicity: "Monthly",
    from_fiscal_year: currentYear,
    to_fiscal_year: currentYear,
    from_date: currentMonthStart(),
    to_date: currentMonthEnd(),
  });

  const [data, setData] = useState<BSData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Separate expand keys per section so they can be controlled independently
  const [expandKey, setExpandKey] = useState(0);
  const [expandDepth, setExpandDepth] = useState(2);

  // ── Expand / Collapse ──

  const handleExpandAll = useCallback(() => {
    setExpandDepth(Number.MAX_SAFE_INTEGER);
    setExpandKey((k) => k + 1);
  }, []);

  const handleCollapseAll = useCallback(() => {
    setExpandDepth(0);
    setExpandKey((k) => k + 1);
  }, []);

  // ── Fetch ──

  const fetchBS = useCallback(async (currentFilters: BSFilters) => {
    setLoading(true);
    setError(null);
    try {
      if (
        currentFilters.mode === "Date Range" &&
        (!currentFilters.from_date || !currentFilters.to_date)
      ) {
        setError("Please select a valid date range.");
        setLoading(false);
        return;
      }

      const params =
        currentFilters.mode === "Date Range"
          ? {
              periodicity: currentFilters.periodicity,
              from_date: currentFilters.from_date,
              to_date: currentFilters.to_date,
              filter_based_on: "Date Range" as const,
            }
          : {
              periodicity: currentFilters.periodicity,
              from_fiscal_year: String(currentFilters.from_fiscal_year),
              to_fiscal_year: String(currentFilters.to_fiscal_year),
              filter_based_on: "Fiscal Year" as const,
            };

      const res: BSResponse = await getBalanceSheet(params as any);

      if (res?.message?.status_code === 200) {
        const d = res.message.data;
        setData({
          ...d,
          assets: d.assets.map(mapBSNode),
          liabilities: d.liabilities.map(mapBSNode),
          equity: (d.equity ?? []).map(mapBSNode),
        });
        // Reset expand depth on fresh data so tree doesn't stay at MAX
        setExpandDepth(2);
      } else {
        setError(res?.message?.message ?? "Failed to load Balance Sheet.");
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Error fetching Balance Sheet."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Debounced auto-fetch on filter change ──

  useEffect(() => {
    if (
      filters.mode === "Date Range" &&
      (!filters.from_date || !filters.to_date)
    )
      return;

    if (
      filters.mode === "Fiscal Year" &&
      (!filters.from_fiscal_year || !filters.to_fiscal_year)
    )
      return;

    const timer = setTimeout(() => fetchBS(filters), 300);
    return () => clearTimeout(timer);
  }, [filters, fetchBS]);

  // ── Columns from API column metadata ──

  const buildColumns = useCallback(
    (nodes: BSNode[]): Column<BSNode>[] => {
      if (!data?.columns) return [];

      return data.columns
        .filter((col) => !col.hidden)
        .map((col) => {
          if (col.fieldname === "account") {
            return {
              key: "account_name",
              header: col.label,
              width: 240,
              align: "left" as const,
              render: (row: BSNode) => (
                <span className={row.is_group ? "font-semibold" : ""}>
                  {row.account_name}
                </span>
              ),
            };
          }

          return {
            key: col.fieldname,
            header: col.label,
            width: Math.min(col.width ?? 100, 130),
            align: "right" as const,
            render: (row: BSNode) =>
              nf(row.periods?.[col.fieldname] ?? 0, row.currency),
          };
        });
    },
    [data]
  );

  const assetColumns = useMemo(
    () => buildColumns(data?.assets ?? []),
    [buildColumns, data]
  );
  const liabilityColumns = useMemo(
    () => buildColumns(data?.liabilities ?? []),
    [buildColumns, data]
  );
  const equityColumns = useMemo(
    () => buildColumns(data?.equity ?? []),
    [buildColumns, data]
  );

  // ── Summary values ──

  const summary = data?.summary ?? [];
  const totalAssets =
    summary.find((s) => s.label === "Total Asset")?.value ?? 0;
  const totalLiabilities =
    summary.find((s) => s.label === "Total Liability")?.value ?? 0;
  const totalEquity =
    summary.find((s) => s.label === "Total Equity")?.value ?? 0;

  // ── Full-page states ──

  if (loading && !data) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 size={30} className="animate-spin text-primary" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex flex-col items-center py-20 gap-3">
        <AlertCircle size={26} className="text-danger" />
        <p className="text-danger text-sm">{error}</p>
        <button
          onClick={() => fetchBS(filters)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded"
        >
          <RefreshCw size={14} />
          Retry
        </button>
      </div>
    );
  }

  // ── Render ──

  return (
    <div className="flex flex-col gap-4 w-full overflow-x-hidden">
      {/* Summary strip */}
      {data && <SummaryStrip summary={data.summary} />}

      {/* Filter bar */}
      <FilterBar
        filters={filters}
        setFilters={setFilters}
        onRefresh={() => fetchBS(filters)}
        loading={loading}
        onExpandAll={handleExpandAll}
        onCollapseAll={handleCollapseAll}
      />

      {/* Inline table width fix */}
      <style>{`
        .bs-no-minw table {
          width: max-content;
          min-width: 100%;
        }
      `}</style>

      {/* ── Assets ── */}
      {(data?.assets?.length ?? 0) > 0 && (
        <div className="flex flex-col gap-2">
          <SectionHeader
            label="Application of Funds (Assets)"
            total={totalAssets}
            currency={data?.summary[0]?.currency}
            accentClass="bg-primary"
          />
          <div className="w-full max-w-full overflow-hidden rounded-xl border border-[var(--border)]">
            <div className="bs-no-minw w-full max-w-full overflow-x-auto">
              <ExpandableTreeTable<BSNode>
                key={`bs-assets-${expandKey}`}
                columns={assetColumns}
                data={data?.assets ?? []}
                childrenKey="children"
                nodeKey={(n) => n.id}
                showToolbar={false}
                defaultExpandDepth={expandDepth}
                expandIconRender={expandIcon}
                loading={loading}
                emptyMessage="No asset accounts found."
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Liabilities ── */}
      {(data?.liabilities?.length ?? 0) > 0 && (
        <div className="flex flex-col gap-2">
          <SectionHeader
            label="Source of Funds (Liabilities)"
            total={totalLiabilities}
            currency={data?.summary[0]?.currency}
            accentClass="bg-danger"
          />
          <div className="w-full max-w-full overflow-hidden rounded-xl border border-[var(--border)]">
            <div className="bs-no-minw w-full max-w-full overflow-x-auto">
              <ExpandableTreeTable<BSNode>
                key={`bs-liabilities-${expandKey}`}
                columns={liabilityColumns}
                data={data?.liabilities ?? []}
                childrenKey="children"
                nodeKey={(n) => n.id}
                showToolbar={false}
                defaultExpandDepth={expandDepth}
                expandIconRender={expandIcon}
                loading={loading}
                emptyMessage="No liability accounts found."
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Equity (rendered only if API returns data) ── */}
      {(data?.equity?.length ?? 0) > 0 && (
        <div className="flex flex-col gap-2">
          <SectionHeader
            label="Equity"
            total={totalEquity}
            currency={data?.summary[0]?.currency}
            accentClass="bg-violet-500"
          />
          <div className="w-full max-w-full overflow-hidden rounded-xl border border-[var(--border)]">
            <div className="bs-no-minw w-full max-w-full overflow-x-auto">
              <ExpandableTreeTable<BSNode>
                key={`bs-equity-${expandKey}`}
                columns={equityColumns}
                data={data?.equity ?? []}
                childrenKey="children"
                nodeKey={(n) => n.id}
                showToolbar={false}
                defaultExpandDepth={expandDepth}
                expandIconRender={expandIcon}
                loading={loading}
                emptyMessage="No equity accounts found."
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BalanceSheet;