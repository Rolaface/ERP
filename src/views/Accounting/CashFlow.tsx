import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getExpandedRowModel,
  flexRender,
  type ColumnDef,
  type ExpandedState,
} from "@tanstack/react-table";
import { getCashFlow } from "../../api/Accounting/AccountApi";
import {
  AlertCircle,
  Loader2,
  RefreshCw,
  Folder,
  FolderOpen,
  FileText,
  ChevronRight,
  Layers,
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowLeftRight,
} from "lucide-react";
import DatePickerInput from "../../components/calendar/DatePickerInput";
import type {
  CFResponse,
  CFRawRow,
  CFSummaryItem,
} from "../../types/Accounting/Cashflow";
import { getCompanyCurrentFiscalYear } from "../../api/utils/frappeUtilsApi";
import { getCurrencySymbol } from "../../utils/currency";
import { getCompanyById } from "../../api/companySetupApi";
import { useCompanyStore } from "../../store/companyStore";
import { useCurrencySymbols } from "../../hooks/Usecurrencysymbols";
import { extractCurrencyCodesTree } from "../../utils/Extractcurrencycodes";

const COMPANY_ID = import.meta.env.VITE_COMPANY_ID;

/* ───────────────── TYPES ───────────────── */

export type CFNode = {
  id: string;
  section: string;
  currency?: string;
  parent_section?: string | null;
  indent: number;
  periods: Record<string, number>;
  children: CFNode[];
};

type FilterMode = "Fiscal Year" | "Date Range";
type Periodicity = "Monthly" | "Quarterly" | "Yearly" | "Half-Yearly";

interface CFFilters {
  mode: FilterMode;
  periodicity: Periodicity;
  from_fiscal_year: number;
  to_fiscal_year: number;
  from_date?: string;
  to_date?: string;
}

const res = await getCompanyCurrentFiscalYear();

const fiscalYear = res.data?.fiscal_year;
const fiscalYearStartDate = res?.data?.start_date;
const fiscalYearEndDate = res?.data?.end_date;

/* ───────────────── DATE HELPERS ───────────────── */

const toInputDate = (date?: string) => date ?? "";

const toApiDate = (date: string) => date;

const currentMonthStart = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
};

const currentMonthEnd = (): string => {
  const d = new Date();
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(last).padStart(2, "0")}`;
};

/* ───────────────── FORMAT ───────────────── */

// Legacy fallback formatter — used only as a last resort if no currency code
// can be resolved through the currency store at all (see `displayAmount`
// inside the main component below, which is what's actually used in render).
const nf = (value?: number | null) => {
  if (value === undefined || value === null) return "—";

  const formatted = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(value));

  const prefix = `${getCurrencySymbol()} `;
  return value < 0 ? `${prefix}-${formatted}` : `${prefix}${formatted}`;
};

const isNetRow = (section: string, parentSection?: string | null) =>
  section.toLowerCase().startsWith("net") && !parentSection;

/* ───────────────── TREE MAPPER (NEW API STRUCTURE) ───────────────── */

function mapNode(row: CFRawRow): CFNode {
  return {
    id: row.section || row.section_name || Math.random().toString(),

    section: (row.section ?? row.section_name ?? "")
      .toString()
      .replace(/^'|'$/g, ""),

    currency: row.currency,
    indent: row.indent ?? 0,
    parent_section: row.parent_section ?? null,

    periods: row.periods ?? {},

    children: (row.children ?? []).map(mapNode),
  };
}

function buildTree(rows: CFRawRow[]): CFNode[] {
  return rows.filter((r) => r && Object.keys(r).length > 0).map(mapNode);
}

/* builds the {rowId: true} map needed to expand the tree to N levels by default */
const buildExpandedToDepth = (
  nodes: CFNode[],
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

/* ───────────────── SUMMARY COLOR / ICON ───────────────── */

const getSummaryColor = (item: CFSummaryItem) => {
  const label = item.label?.toLowerCase() || "";
  const value = item.value ?? 0;

  // Priority 1 → Label based (better UX)
  if (label.includes("operating")) return "text-blue-500";
  if (label.includes("investing")) return "text-purple-500";
  if (label.includes("financing")) return "text-orange-500";
  if (label.includes("net"))
    return value >= 0 ? "text-emerald-600" : "text-red-500";

  // Fallback → value based
  if (value > 0) return "text-emerald-600";
  if (value < 0) return "text-red-500";

  return "text-main";
};

const getSummaryIcon = (label: string) => {
  const l = label.toLowerCase();
  if (l.includes("operating"))
    return <Wallet size={11} className="text-blue-400" />;
  if (l.includes("investing"))
    return <TrendingUp size={11} className="text-purple-400" />;
  if (l.includes("financing"))
    return <ArrowLeftRight size={11} className="text-orange-400" />;
  return <TrendingDown size={11} className="text-emerald-400" />;
};

/* ───────────────── KPI STRIP (AccountsPayable-style) ───────────────── */

function KpiStrip({
  summary,
  loading,
  displayAmount,
}: {
  summary: CFSummaryItem[];
  loading: boolean;
  displayAmount: (amount: number, currency?: string) => string;
}) {
  const items = summary.length
    ? summary
    : Array.from({ length: 4 }, () => null);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
      {items.map((item, i) => (
        <div
          key={item?.label ?? i}
          className="bg-card border border-[var(--border)] rounded-lg px-3 py-2.5 flex flex-col gap-1.5"
        >
          <div className="flex items-center gap-1.5">
            {item && getSummaryIcon(item.label)}
            <span className="text-[9px] font-black uppercase tracking-widest text-muted truncate">
              {item?.label ?? "—"}
            </span>
          </div>
          {loading || !item ? (
            <div className="h-4 w-24 bg-[var(--border)] rounded animate-pulse" />
          ) : (
            <span
              className={`text-sm font-extrabold tabular-nums ${getSummaryColor(item)}`}
            >
              {displayAmount(item.value, (item as any).currency)}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

/* ───────────────── FILTER BAR (AccountsPayable-style) ───────────────── */

function FilterBar({
  filters,
  setFilters,
  onRefresh,
  loading,
  allExpanded,
  onToggleExpand,
}: {
  filters: CFFilters;
  setFilters: React.Dispatch<React.SetStateAction<CFFilters>>;
  onRefresh: () => void;
  loading: boolean;
  allExpanded: boolean;
  onToggleExpand: () => void;
}) {
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
                value={toInputDate(filters.from_date)}
                onChange={(name, value) =>
                  setFilters((f) => ({
                    ...f,
                    from_date: toApiDate(value),
                  }))
                }
                label=""
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
                value={toInputDate(filters.to_date)}
                onChange={(name, value) =>
                  setFilters((f) => ({
                    ...f,
                    to_date: toApiDate(value),
                  }))
                }
                label=""
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

/* ───────────────── MAIN COMPONENT ───────────────── */

const CashFlow: React.FC = () => {
  const [filters, setFilters] = useState<CFFilters>({
    mode: "Fiscal Year",
    periodicity: "Monthly",
    from_fiscal_year: fiscalYear,
    to_fiscal_year: fiscalYear,
    from_date: currentMonthStart(),
    to_date: currentMonthEnd(),
  });

  const [data, setData] = useState<CFResponse["message"]["data"] | null>(null);
  const [tree, setTree] = useState<CFNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [allExpanded, setAllExpanded] = useState(false);
  const [company, setCompany] = useState<any | null>(null);

  // ── Currency symbol resolution (same pattern as AccountsPayable/Receivable/
  // ProfitLoss/BalanceSheet). Each cash-flow node can carry its own
  // `currency`, so the fallback chain is: row's own currency → company's
  // base currency → store's `sym` value (which on some setups itself holds
  // a currency *code* like "GHS" rather than an actual symbol, so it's
  // resolved through the store too instead of being printed raw).
  const { currencySymbol } = useCompanyStore();
  const sym = currencySymbol || "–";
  const baseCurrency = company?.default_currency || company?.currency;

  const currencyCodes = useMemo(() => {
    const codes = new Set<string>(
      extractCurrencyCodesTree(tree, "currency" as any),
    );
    if (baseCurrency) codes.add(baseCurrency);
    if (sym && sym !== "–") codes.add(sym);
    return [...codes];
  }, [tree, baseCurrency, sym]);

  const { formatAmount } = useCurrencySymbols(currencyCodes);

  const displayAmount = useCallback(
    (amount: number, currency?: string) => {
      const candidates = [currency, baseCurrency, sym].filter(Boolean) as string[];
      for (const code of candidates) {
        const formatted = formatAmount(code, amount, { withSymbol: true });
        if (formatted) return formatted;
      }
      return nf(amount);
    },
    [formatAmount, baseCurrency, sym],
  );

  useEffect(() => {
    getCompanyById(COMPANY_ID).then((res) => {
      if (res?.status_code === 200) setCompany(res.data);
    });
  }, []);

  const handleToggleExpand = useCallback(() => {
    if (allExpanded) {
      setExpanded({});
      setAllExpanded(false);
    } else {
      setExpanded(true);
      setAllExpanded(true);
    }
  }, [allExpanded]);

  const fetchData = useCallback(async () => {
    setLoading(true);

    try {
      const params =
        filters.mode === "Date Range"
          ? {
            periodicity: filters.periodicity,
            from_date: filters.from_date,
            to_date: filters.to_date,
            filter_based_on: "Date Range",
          }
          : {
            periodicity: filters.periodicity,
            from_fiscal_year: String(filters.from_fiscal_year),
            to_fiscal_year: String(filters.to_fiscal_year),
            filter_based_on: "Fiscal Year",
          };

      const res: CFResponse = await getCashFlow(params as any);

      if (res.message.status_code === 200) {
        const d = res.message.data;

        setData(d);
        setTree(buildTree(d.data));
      } else {
        setError(res.message.message);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const timer = setTimeout(fetchData, 300);
    return () => clearTimeout(timer);
  }, [fetchData]);

  // default-expand the tree to depth 2 whenever fresh data arrives
  useEffect(() => {
    if (!tree.length) return;
    setExpanded(buildExpandedToDepth(tree, 2));
    setAllExpanded(false);
  }, [tree]);

  const columns = useMemo<ColumnDef<CFNode>[]>(() => {
    if (!data) return [];

    return data.columns
      .filter((c) => !c.hidden)
      .map((col): ColumnDef<CFNode> => {
        if (col.fieldname === "section") {
          return {
            id: "section",
            header: col.label,
            size: 260,
            cell: ({ row }) => {
              const node = row.original;
              const isNet = isNetRow(node.section, node.parent_section);
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
                    className={`text-xs truncate ${isNet
                      ? "font-bold text-primary"
                      : node.children.length
                        ? "font-semibold"
                        : ""
                      }`}
                  >
                    {node.section}
                  </span>
                </div>
              );
            },
          };
        }

        return {
          id: col.fieldname,
          header: col.label,
          size: col.fieldname === "total" ? 130 : 110,
          meta: { align: "right" },
          cell: ({ row }) => {
            const val =
              row.original.periods?.[
              col.fieldname as keyof typeof row.original.periods
              ] ?? 0;
            const colorClass =
              val > 0
                ? "text-emerald-600 dark:text-emerald-400"
                : val < 0
                  ? "text-red-500 dark:text-red-400"
                  : "text-muted";
            return (
              <span className={`text-xs tabular-nums ${colorClass}`}>
                {displayAmount(val, row.original.currency)}
              </span>
            );
          },
        };
      });
  }, [data, displayAmount]);

  const table = useReactTable({
    data: tree,
    columns,
    state: { expanded },
    onExpandedChange: (updater) => {
      setExpanded(updater);
      setAllExpanded(false);
    },
    getSubRows: (row) => row.children,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  });

  if (error && !data) {
    return (
      <div className="flex flex-col items-center py-20 gap-3">
        <AlertCircle size={26} className="text-danger" />
        <p className="text-danger text-sm">{error}</p>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded"
        >
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <KpiStrip
        summary={data?.summary ?? []}
        loading={loading && !data}
        displayAmount={displayAmount}
      />

      <FilterBar
        filters={filters}
        setFilters={setFilters}
        onRefresh={fetchData}
        loading={loading}
        allExpanded={allExpanded}
        onToggleExpand={handleToggleExpand}
      />

      <div className="bg-card border border-[var(--border)] rounded-xl overflow-hidden flex flex-col">
        <div className="overflow-x-auto overflow-y-auto relative max-h-[520px]">
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
            <thead className="sticky top-0 z-10 border-b border-[var(--border)] bg-card">
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
                        className={`px-3 py-2 text-[9px] font-black uppercase tracking-widest text-muted whitespace-nowrap bg-card border-b border-[var(--border)] ${align}`}
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
            <tbody className="divide-y divide-[var(--border)]">
              {loading && !data ? (
                <tr>
                  <td colSpan={columns.length} style={{ height: "300px" }}>
                    <div className="flex justify-center items-center h-full">
                      <Loader2 size={20} className="animate-spin text-muted" />
                    </div>
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="py-16 text-center text-xs text-muted"
                  >
                    No cash flow data found.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className={`hover:bg-row-hover transition-colors h-[34px] ${isNetRow(
                      row.original.section,
                      row.original.parent_section,
                    )
                      ? "bg-row-hover/50 border-t-2 border-[var(--border)]"
                      : ""
                      }`}
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
          {loading && data && (
            <div className="absolute inset-0 bg-card/60 backdrop-blur-[1px] flex items-center justify-center z-20">
              <Loader2 size={20} className="animate-spin text-primary" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CashFlow;