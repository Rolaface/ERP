import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getExpandedRowModel,
  flexRender,
  type ColumnDef,
  type ExpandedState,
} from "@tanstack/react-table";
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
import {
  PLNode,
  PLData,
  PLResponse,
  mapNode,
  nf,
  formatPeriod,
} from "../../types/Accounting/ProfitLoss";
import {
  getProfitAndLoss,
  type ProfitLossFilters,
} from "../../api/Accounting/AccountApi";
import DatePickerInput from "../../components/calendar/DatePickerInput";
import { getCompanyCurrentFiscalYear } from "../../api/utils/frappeUtilsApi";

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

const res = await getCompanyCurrentFiscalYear();
const fiscalYear = res.data?.fiscal_year;
const fiscalYearStartDate = res?.data?.start_date;
const fiscalYearEndDate = res?.data?.end_date;

const currentMonthStart = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
};

const currentMonthEnd = (): string => {
  const d = new Date();
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(last).padStart(2, "0")}`;
};

/* builds the {rowId: true} map needed to expand the tree to N levels by default */
const buildExpandedToDepth = (
  nodes: PLNode[],
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

/* ── KPI STRIP ── */
function KpiStrip({
  data,
  loading,
}: {
  data: PLData | null;
  loading: boolean;
}) {
  const items = data?.summary.filter((i) => !i.type) ?? [];

  const colorFor = (label: string, indicator?: string) => {
    if (label.toLowerCase().includes("income")) return "text-emerald-600";
    if (label.toLowerCase().includes("expense")) return "text-red-500";
    return indicator?.toLowerCase() === "green"
      ? "text-emerald-600"
      : "text-red-500";
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
      {(loading || !data ? Array.from({ length: 3 }) : items).map(
        (item: any, i) => (
          <div
            key={item?.label ?? i}
            className="bg-card border border-[var(--border)] rounded-lg px-3 py-2.5 flex flex-col gap-1.5"
          >
            <span className="text-[9px] font-black uppercase tracking-widest text-muted">
              {item?.label ?? "—"}
            </span>
            {loading || !data ? (
              <div className="h-4 w-24 bg-[var(--border)] rounded animate-pulse" />
            ) : (
              <span
                className={`text-sm font-extrabold tabular-nums ${colorFor(item.label, item.indicator)}`}
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

/* ── FILTER BAR ── */
type FilterBarProps = {
  filters: ProfitLossFilters;
  setFilters: React.Dispatch<React.SetStateAction<ProfitLossFilters>>;
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
            const mode = e.target.value as "Fiscal Year" | "Date Range";
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
              periodicity: e.target.value as ProfitLossFilters["periodicity"],
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

/* ── MAIN COMPONENT ── */
const ProfitLoss: React.FC = () => {
  const [filters, setFilters] = useState<ProfitLossFilters>({
    mode: "Fiscal Year",
    periodicity: "Monthly",
    from_fiscal_year: fiscalYear,
    to_fiscal_year: fiscalYear,
    from_date: currentMonthStart(),
    to_date: currentMonthEnd(),
  });
  const [data, setData] = useState<PLData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [allExpanded, setAllExpanded] = useState(false);

  const tableData = useMemo<PLNode[]>(() => {
    if (!data) return [];
    return [...data.income, ...data.expense];
  }, [data]);

useEffect(() => {
  if (!data) return;
  setExpanded(buildExpandedToDepth(tableData, 2));
  setAllExpanded(false); 
}, [data, tableData]);

  const handleToggleExpand = useCallback(() => {
    if (allExpanded) {
      setExpanded({});
      setAllExpanded(false);
    } else {
      setExpanded(true);
      setAllExpanded(true);
    }
  }, [allExpanded]);

  const fetchPL = useCallback(async (currentFilters: ProfitLossFilters) => {
    setLoading(true);
    setError(null);
    try {
      if (
        currentFilters.mode === "Date Range" &&
        (!currentFilters.from_date || !currentFilters.to_date)
      ) {
        setError("Please select a valid date range.");
        return;
      }
      const params =
        currentFilters.mode === "Date Range"
          ? {
            periodicity: currentFilters.periodicity,
            from_date: currentFilters.from_date,
            to_date: currentFilters.to_date,
            filter_based_on: "Date Range",
          }
          : {
            periodicity: currentFilters.periodicity,
            from_fiscal_year: currentFilters.from_fiscal_year,
            to_fiscal_year: currentFilters.to_fiscal_year,
            filter_based_on: "Fiscal Year",
          };
      const res: PLResponse = await getProfitAndLoss(params);
      if (res?.message?.status_code === 200) {
        const d = res.message.data;
        setData({
          ...d,
          income: d.income.map(mapNode),
          expense: d.expense.map(mapNode),
        });
      } else {
        setError(res?.message?.message ?? "Failed to load Profit & Loss.");
      }
    } catch (err: any) {
      setError(err?.message ?? "Error fetching Profit & Loss.");
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

    const timer = setTimeout(() => fetchPL(filters), 300);
    return () => clearTimeout(timer);
  }, [filters, fetchPL]);

  const columns = useMemo<ColumnDef<PLNode>[]>(() => {
    if (!data?.columns) return [];

    return data.columns
      .filter((col) => !col.hidden)
      .map((col): ColumnDef<PLNode> => {
        if (col.fieldname === "account") {
          return {
            id: "account_name",
            header: col.label,
            size: 240,
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
          size: col.fieldname === "total" ? 130 : 110,
          meta: { align: "right" },
          cell: ({ row }) => (
            <span className="text-xs tabular-nums text-main">
              {nf(row.original.periods?.[col.fieldname] ?? 0)}
            </span>
          ),
        };
      });
  }, [data]);

  const table = useReactTable({
    data: tableData,
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
          onClick={() => fetchPL(filters)}
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
      <KpiStrip data={data} loading={loading && !data} />

      <FilterBar
        filters={filters}
        setFilters={setFilters}
        onRefresh={() => fetchPL(filters)}
        loading={loading}
        allExpanded={allExpanded}
        onToggleExpand={handleToggleExpand}
      />

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
                    No Profit &amp; Loss data.
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
    </div>
  );
};

export default ProfitLoss;
