import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getExpandedRowModel,
  flexRender,
  type ColumnDef,
  type ExpandedState,
} from "@tanstack/react-table";
import { getCurrencySymbol } from "../../utils/currency";
import {
  getBalanceSheet,
  type BalanceSheetFilters,
} from "../../api/Accounting/AccountApi";
import { getCompanyCurrentFiscalYear } from "../../api/utils/frappeUtilsApi";

import DatePickerInput from "../../components/calendar/DatePickerInput";
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

const nf = (value: number | undefined | null): string => {
  if (value === null || value === undefined) return "—";

  const currencySymbol = getCurrencySymbol();

  const formatted = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(value));

  return value < 0
    ? `${currencySymbol} -${formatted}`
    : `${currencySymbol} ${formatted}`;
};

const res = await getCompanyCurrentFiscalYear();
const fiscalYear = res.data?.fiscal_year;
const fiscalYearStartDate = res?.data?.start_date;
const fiscalYearEndDate = res?.data?.end_date;

const toInputDate = (apiDate: string): string => {
  if (!apiDate || !apiDate.includes("-")) return "";
  const parts = apiDate.split("-");
  if (parts[0].length === 4) return apiDate;
  const [d, m, y] = parts;
  return `${y}-${m}-${d}`;
};

const toApiDate = (inputDate: string): string => {
  if (!inputDate || !inputDate.includes("-")) return "";
  const [y, m, d] = inputDate.split("-");
  return `${d}-${m}-${y}`;
};

const currentMonthStart = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
};

const currentMonthEnd = (): string => {
  const d = new Date();
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(last).padStart(2, "0")}`;
};

/* builds {rowId: true} map to expand the tree to N levels by default */
const buildExpandedToDepth = (
  nodes: BSNode[],
  depth: number,
  path = "",
): Record<string, boolean> => {
  let state: Record<string, boolean> = {};
  nodes.forEach((node, i) => {
    const id = path ? `${path}.${i}` : `${i}`;
    if (depth > 0 && node.children?.length) {
      state[id] = true;
      Object.assign(state, buildExpandedToDepth(node.children, depth - 1, id));
    }
  });
  return state;
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

// ─── KPI Strip ────────────────────────────────────────────────────────────────

function KpiStrip({
  summary,
  loading,
}: {
  summary: BSSummaryItem[];
  loading: boolean;
}) {
  const items = summary.filter(Boolean);

  const colorFor = (item: BSSummaryItem): string => {
    const ind = item.indicator?.toLowerCase();
    if (ind === "green") return "text-emerald-600";
    if (ind === "red") return "text-red-500";
    const l = item.label?.toLowerCase() ?? "";
    if (l.includes("asset")) return "text-blue-500";
    if (l.includes("liabilit")) return "text-red-500";
    if (l.includes("equity")) return "text-violet-500";
    return "text-main";
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {(loading || items.length === 0 ? Array.from({ length: 4 }) : items).map(
        (item: any, i) => (
          <div
            key={item?.label ?? i}
            className="bg-card border border-[var(--border)] rounded-lg px-3 py-2.5 flex flex-col gap-1.5"
          >
            <span className="text-[9px] font-black uppercase tracking-widest text-muted truncate">
              {item?.label ?? "—"}
            </span>
            {loading || !item ? (
              <div className="h-4 w-20 bg-[var(--border)] rounded animate-pulse" />
            ) : (
              <span
                className={`text-sm font-extrabold tabular-nums ${colorFor(item)}`}
              >
                {nf(item.value)}
              </span>
            )}
          </div>
        ),
      )}
    </div>
  );
}

// ─── Filter Bar ───────────────────────────────────────────────────────────────

type FilterBarProps = {
  filters: BSFilters;
  setFilters: React.Dispatch<React.SetStateAction<BSFilters>>;
  onRefresh: () => void;
  loading: boolean;
  allExpanded: boolean;
  onToggleExpand: () => void;
};

function FilterBar({
  filters,
  setFilters,
  onRefresh,
  loading,
  allExpanded,
  onToggleExpand,
}: FilterBarProps) {
  const inputClass =
    "h-7 px-2 text-[11px] border border-[var(--border)] bg-app rounded-md text-main font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all no-spinner";

  const btnClass =
    "h-7 px-2.5 flex items-center gap-1.5 text-[11px] font-semibold border border-[var(--border)] bg-card text-muted hover:text-main hover:border-primary/40 rounded-md transition-all whitespace-nowrap";

  return (
    <div className="bg-card border border-[var(--border)] rounded-lg px-3 py-2 flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1.5">
        <span className="text-[9px] font-black uppercase tracking-widest text-muted">
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
                : { from_fiscal_year: fiscalYear, to_fiscal_year: fiscalYear }),
            }));
          }}
          className={inputClass}
        >
          <option value="Fiscal Year">Fiscal Year</option>
          <option value="Date Range">Date Range</option>
        </select>
      </div>

      <div className="flex items-center gap-1.5">
        <span className="text-[9px] font-black uppercase tracking-widest text-muted">
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

      {filters.mode !== "Date Range" && (
        <>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-black uppercase tracking-widest text-muted">
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
              className={`${inputClass} w-20`}
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-black uppercase tracking-widest text-muted">
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
              className={`${inputClass} w-20`}
            />
          </div>
        </>
      )}

      {filters.mode === "Date Range" && (
        <>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-black uppercase tracking-widest text-muted">
              From
            </span>
            <div className="w-[130px]">
              <DatePickerInput
                name="from_date"
                value={toInputDate(filters.from_date ?? "")}
                onChange={(name, value) =>
                  setFilters((f) => ({ ...f, from_date: toApiDate(value) }))
                }
              />
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-black uppercase tracking-widest text-muted">
              To
            </span>
            <div className="w-[130px]">
              <DatePickerInput
                name="to_date"
                value={toInputDate(filters.to_date ?? "")}
                onChange={(name, value) =>
                  setFilters((f) => ({ ...f, to_date: toApiDate(value) }))
                }
              />
            </div>
          </div>
        </>
      )}

      <div className="w-px self-stretch bg-[var(--border)]" />

      <button onClick={onToggleExpand} className={btnClass}>
        {allExpanded ? <ChevronRight size={11} /> : <Layers size={11} />}
        {allExpanded ? "Collapse" : "Expand All"}
      </button>
      <button onClick={onRefresh} className={`${btnClass}`}>
        <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
        Refresh
      </button>
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({
  label,
  accentClass,
}: {
  label: string;
  accentClass: string;
}) {
  return (
    <div className="flex items-center gap-2 px-1 py-0.5">
      <span className={`w-1 h-4 rounded-full inline-block ${accentClass}`} />
      <span className="text-xs font-bold text-main uppercase tracking-widest">
        {label}
      </span>
    </div>
  );
}

// ─── Reusable Tree Table (shared by Assets / Liabilities / Equity) ────────────

function BSTreeTable({
  data,
  columns,
  expanded,
  onExpandedChange,
  loading,
  emptyMessage,
}: {
  data: BSNode[];
  columns: ColumnDef<BSNode>[];
  expanded: ExpandedState;
  onExpandedChange: React.Dispatch<React.SetStateAction<ExpandedState>>;
  loading: boolean;
  emptyMessage: string;
}) {
  const table = useReactTable({
    data,
    columns,
    state: { expanded },
    onExpandedChange,
    getSubRows: (row) => row.children,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  });

  return (
    <div className="bg-card border border-[var(--border)] rounded-xl overflow-hidden flex flex-col">
      <div className="overflow-x-auto overflow-y-auto flex-1 relative">
        <table
          className="border-collapse"
          style={{
            tableLayout: "fixed",
            width: "max-content",
            minWidth: "100%",
          }}
        >
          <colgroup>
            {table.getAllLeafColumns().map((col) => (
              <col key={col.id} style={{ width: col.getSize() }} />
            ))}
          </colgroup>
          <thead className="sticky top-0 z-10 border-b border-[var(--border)]">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => {
                  const align =
                    (header.column.columnDef.meta as any)?.align === "right"
                      ? "text-right"
                      : "text-left";
                  return (
                    <th
                      key={header.id}
                      className={`px-3 py-2 text-[9px] font-black uppercase tracking-widest text-muted whitespace-nowrap bg-row-hover border-b border-[var(--border)] ${align}`}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} style={{ height: "160px" }}>
                  <div className="flex justify-center items-center h-full">
                    <Loader2 size={18} className="animate-spin text-muted" />
                  </div>
                </td>
              </tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-10 text-center text-xs text-muted"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-row-hover transition-colors h-[34px]"
                  style={{ borderBottom: "1px solid rgba(128,128,128,0.12)" }}
                >
                  {row.getVisibleCells().map((cell) => {
                    const align =
                      (cell.column.columnDef.meta as any)?.align === "right"
                        ? "text-right"
                        : "text-left";
                    return (
                      <td
                        key={cell.id}
                        className={`px-3 py-1 whitespace-nowrap ${align}`}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const BalanceSheet: React.FC = () => {
  const [filters, setFilters] = useState<BSFilters>({
    mode: "Fiscal Year",
    periodicity: "Monthly",
    from_fiscal_year: fiscalYear,
    to_fiscal_year: fiscalYear,
    from_date: currentMonthStart(),
    to_date: currentMonthEnd(),
  });

  const [data, setData] = useState<BSData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [expandedAssets, setExpandedAssets] = useState<ExpandedState>({});
  const [expandedLiabilities, setExpandedLiabilities] = useState<ExpandedState>(
    {},
  );
  const [expandedEquity, setExpandedEquity] = useState<ExpandedState>({});
  const [allExpanded, setAllExpanded] = useState(false);

  const handleToggleExpand = useCallback(() => {
    if (allExpanded) {
      setExpandedAssets({});
      setExpandedLiabilities({});
      setExpandedEquity({});
      setAllExpanded(false);
    } else {
      setExpandedAssets(true);
      setExpandedLiabilities(true);
      setExpandedEquity(true);
      setAllExpanded(true);
    }
  }, [allExpanded]);

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
        const assets = d.assets.map(mapBSNode);
        const liabilities = d.liabilities.map(mapBSNode);
        const equity = (d.equity ?? []).map(mapBSNode);

        setData({ ...d, assets, liabilities, equity });
        setExpandedAssets(buildExpandedToDepth(assets, 2));
        setExpandedLiabilities(buildExpandedToDepth(liabilities, 2));
        setExpandedEquity(buildExpandedToDepth(equity, 2));
      } else {
        setError(res?.message?.message ?? "Failed to load Balance Sheet.");
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Error fetching Balance Sheet.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

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

  // shared columns — same metadata for assets/liabilities/equity
  const columns = useMemo<ColumnDef<BSNode>[]>(() => {
    if (!data?.columns) return [];

    return data.columns
      .filter((col) => !col.hidden)
      .map((col): ColumnDef<BSNode> => {
        if (col.fieldname === "account") {
          return {
            id: "account_name",
            header: col.label,
            size: 260,
            cell: ({ row }) => {
              const node = row.original;
              const canExpand = row.getCanExpand();
              return (
                <div
                  className="flex items-center gap-1.5"
                  style={{ paddingLeft: `${row.depth * 18}px` }}
                >
                  {canExpand ? (
                    <button
                      type="button"
                      onClick={row.getToggleExpandedHandler()}
                      className="shrink-0 text-muted hover:text-main flex items-center gap-1"
                    >
                      <ChevronRight
                        size={12}
                        className={`transition-transform duration-150 ${row.getIsExpanded() ? "rotate-90" : ""
                          }`}
                      />
                      {row.getIsExpanded() ? (
                        <FolderOpen size={13} />
                      ) : (
                        <Folder size={13} />
                      )}
                    </button>
                  ) : (
                    <FileText
                      size={12}
                      className="text-muted opacity-50 shrink-0"
                    />
                  )}
                  <span
                    className={`text-xs truncate ${node.is_group ? "font-semibold" : ""}`}
                  >
                    {node.account_name}
                  </span>
                </div>
              );
            },
          };
        }

        return {
          id: col.fieldname,
          header: col.label,
          size: Math.min(col.width ?? 100, 130),
          meta: { align: "right" },
          cell: ({ row }) => (
            <span className="text-xs tabular-nums text-main">
              {nf(row.original.periods?.[col.fieldname] ?? 0)}
            </span>
          ),
        };
      });
  }, [data]);

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

  return (
    <div className="flex flex-col gap-3">
      <KpiStrip summary={data?.summary ?? []} loading={loading && !data} />

      <FilterBar
        filters={filters}
        setFilters={setFilters}
        onRefresh={() => fetchBS(filters)}
        loading={loading}
        allExpanded={allExpanded}
        onToggleExpand={handleToggleExpand}
      />

      {(loading && !data) || (data?.assets?.length ?? 0) > 0 ? (
        <div className="flex flex-col gap-2">
          <SectionHeader
            label="Application of Funds (Assets)"
            accentClass="bg-primary"
          />
          <BSTreeTable
            data={data?.assets ?? []}
            columns={columns}
            expanded={expandedAssets}
            onExpandedChange={(updater) => {
              setExpandedAssets(updater);
              setAllExpanded(false);
            }}
            loading={loading && !data}
            emptyMessage="No asset accounts found."
          />
        </div>
      ) : null}

      {(loading && !data) || (data?.liabilities?.length ?? 0) > 0 ? (
        <div className="flex flex-col gap-2">
          <SectionHeader
            label="Source of Funds (Liabilities)"
            accentClass="bg-danger"
          />
          <BSTreeTable
            data={data?.liabilities ?? []}
            columns={columns}
            expanded={expandedLiabilities}
            onExpandedChange={(updater) => {
              setExpandedLiabilities(updater);
              setAllExpanded(false);
            }}
            loading={loading && !data}
            emptyMessage="No liability accounts found."
          />
        </div>
      ) : null}

      {(data?.equity?.length ?? 0) > 0 && (
        <div className="flex flex-col gap-2">
          <SectionHeader label="Equity" accentClass="bg-violet-500" />
          <BSTreeTable
            data={data?.equity ?? []}
            columns={columns}
            expanded={expandedEquity}
            onExpandedChange={(updater) => {
              setExpandedEquity(updater);
              setAllExpanded(false);
            }}
            loading={loading && !data}
            emptyMessage="No equity accounts found."
          />
        </div>
      )}
    </div>
  );
};

export default BalanceSheet;
