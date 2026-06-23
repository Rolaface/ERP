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
  getTrialBalance,
  type TrialBalanceFilters,
} from "../../api/Accounting/AccountApi";
import { getCompanyCurrentFiscalYear } from "../../api/utils/frappeUtilsApi";
import { getCurrencySymbol } from "../../utils/currency";
import DatePickerInput from "../../components/calendar/DatePickerInput";
import {
  AlertCircle,
  Loader2,
  RefreshCw,
  Folder,
  FolderOpen,
  BookOpen,
  Layers,
  ChevronRight,
} from "lucide-react";

/* ───────────────── TYPES ───────────────── */

export type TBAccount = {
  account: string;
  account_name: string;
  currency?: string;
  indent: number;

  opening_debit: number;
  opening_credit: number;

  debit: number;
  credit: number;

  closing_debit: number;
  closing_credit: number;

  has_value: boolean;
  children: TBAccount[];
};

type TBResponse = {
  message: {
    status_code: number;
    status: string;
    message: string;
    data: {
      company: string;
      total_accounts: number;

      totals: {
        opening_debit: number;
        opening_credit: number;
        debit: number;
        credit: number;
        closing_debit: number;
        closing_credit: number;
      };

      accounts: TBAccount[];
    };
  };
};

/* ───────────────── HELPERS ───────────────── */

const nf = (value: number) => {
  if (!value) return "—";

  const formatted = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

  return `${getCurrencySymbol()} ${formatted}`.trim();
};

/* builds the {rowId: true} map needed to expand the tree to N levels by default */
const buildExpandedToDepth = (
  nodes: TBAccount[],
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

function FilterBar({
  filters,
  setFilters,
  onRefresh,
  loading,
  allExpanded,
  onToggleExpand,
}: {
  filters: TrialBalanceFilters;
  setFilters: React.Dispatch<React.SetStateAction<TrialBalanceFilters>>;
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
          From
        </span>
        <div className="w-[130px]">
          <DatePickerInput
            name="from_date"
            value={filters.from_date}
            onChange={(name, value) =>
              setFilters((f) => ({ ...f, from_date: value }))
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
            value={filters.to_date}
            onChange={(name, value) =>
              setFilters((f) => ({ ...f, to_date: value }))
            }
          />
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <span className="text-[9px] font-black uppercase tracking-widest text-muted">
          FY
        </span>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="Year"
          value={filters.fiscal_year}
          onChange={(e) => {
            const value = e.target.value;
            if (/^\d{0,4}$/.test(value)) {
              setFilters((f) => ({ ...f, fiscal_year: value }));
            }
          }}
          className={`${inputClass} w-20`}
        />
      </div>

      <div className="w-px self-stretch bg-[var(--border)]" />

      <label className="flex items-center gap-1.5 text-[11px] font-medium text-muted cursor-pointer select-none">
        <input
          type="checkbox"
          checked={filters.show_zero_values}
          onChange={(e) =>
            setFilters((f) => ({ ...f, show_zero_values: e.target.checked }))
          }
          className="rounded border-[var(--border)] text-primary focus:ring-primary/50 cursor-pointer"
        />
        Zero Values
      </label>

      <label className="flex items-center gap-1.5 text-[11px] font-medium text-muted cursor-pointer select-none">
        <input
          type="checkbox"
          checked={filters.with_period_closing_entry === 1}
          onChange={(e) =>
            setFilters((f) => ({
              ...f,
              with_period_closing_entry: e.target.checked ? 1 : 0,
            }))
          }
          className="rounded border-[var(--border)] text-primary focus:ring-primary/50 cursor-pointer"
        />
        Period Closing
      </label>

      <label className="flex items-center gap-1.5 text-[11px] font-medium text-muted cursor-pointer select-none">
        <input
          type="checkbox"
          checked={filters.show_closing_entries === 1}
          onChange={(e) =>
            setFilters((f) => ({
              ...f,
              show_closing_entries: e.target.checked ? 1 : 0,
            }))
          }
          className="rounded border-[var(--border)] text-primary focus:ring-primary/50 cursor-pointer"
        />
        Closing Entries
      </label>

      <div className="w-px self-stretch bg-[var(--border)]" />

      {/* <button onClick={onToggleExpand} className={btnClass}>
        {allExpanded ? <ChevronRight size={11} /> : <Layers size={11} />}
        {allExpanded ? "Collapse" : "Expand All"}
      </button> */}
      <button onClick={onRefresh} className={`${btnClass} `}>
        <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
        Refresh
      </button>
    </div>
  );
}

/* ───────────────── COMPONENT ───────────────── */

const TrialBalance: React.FC = () => {
  const [data, setData] = useState<TBResponse["message"]["data"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fiscalYear, setFiscalYear] = useState<string>("");
  const [fiscalYearStartDate, setFiscalYearStartDate] = useState<string>("");
  const [fiscalYearEndDate, setFiscalYearEndDate] = useState<string>("");
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [allExpanded, setAllExpanded] = useState(false);

  const tableData: TBAccount[] = useMemo(() => {
    if (!data) return [];
    return data.accounts;
  }, [data]);

  const handleToggleExpand = useCallback(() => {
    if (allExpanded) {
      setExpanded({});
      setAllExpanded(false);
    } else {
      setExpanded(true);
      setAllExpanded(true);
    }
  }, [allExpanded]);

  /* ── Fiscal year bootstrap ── */
  useEffect(() => {
    const loadFiscalYear = async () => {
      try {
        const res = await getCompanyCurrentFiscalYear();
        setFiscalYear(res.data?.fiscal_year || "");
        setFiscalYearStartDate(res.data?.start_date || "");
        setFiscalYearEndDate(res.data?.end_date || "");
      } catch (err) {
        console.error("Failed to fetch fiscal year", err);
      }
    };

    loadFiscalYear();
  }, []);

  const [filters, setFilters] = useState<TrialBalanceFilters>({
    from_date: "",
    to_date: "",
    fiscal_year: "",
    show_zero_values: false,
    with_period_closing_entry: 0,
    show_closing_entries: 0,
  });

  useEffect(() => {
    if (!fiscalYear || !fiscalYearStartDate || !fiscalYearEndDate) return;

    setFilters((f) => ({
      ...f,
      fiscal_year: fiscalYear,
      from_date: fiscalYearStartDate,
      to_date: fiscalYearEndDate,
    }));
  }, [fiscalYear, fiscalYearStartDate, fiscalYearEndDate]);

  /* ── Fetch API ── */

  const fetchTB = useCallback(async (currentFilters: TrialBalanceFilters) => {
    setLoading(true);
    setError(null);

    try {
      if (!currentFilters.fiscal_year) {
        setError("Fiscal year must be a 4 digit year.");
        setLoading(false);
        return;
      }

      const res: TBResponse = await getTrialBalance(currentFilters);

      if (res?.message?.status_code === 200) {
        setData(res.message.data);
      } else {
        setError("Failed to load trial balance.");
      }
    } catch (err: any) {
      setError(err?.message || "Error fetching trial balance.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!filters.fiscal_year) return;

    const timer = setTimeout(() => {
      fetchTB(filters);
    }, 300);

    return () => clearTimeout(timer);
  }, [filters, fetchTB]);

  /* default-expand stays at depth 0 (matches original behavior) */
  useEffect(() => {
    if (!tableData.length) return;
    setExpanded(buildExpandedToDepth(tableData, 0));
  }, [tableData]);

  /* ── Columns ── */

  const columns = useMemo<ColumnDef<TBAccount>[]>(
    () => [
      {
        id: "account_name",
        header: "Account",
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
                  className="shrink-0 text-muted hover:text-main flex items-center gap-0.5"
                >
                  <ChevronRight
                    size={11}
                    className={`transition-transform duration-150 shrink-0 ${row.getIsExpanded() ? "rotate-90" : ""
                      }`}
                  />
                  {row.getIsExpanded() ? (
                    <FolderOpen size={13} className="shrink-0" />
                  ) : (
                    <Folder size={13} className="shrink-0" />
                  )}
                </button>
              ) : (
                <span className="w-[23px] flex items-center justify-center">
                  <BookOpen
                    size={12}
                    className="text-muted opacity-50 shrink-0"
                  />
                </span>
              )}
              <span
                className={`text-xs truncate ${row.depth === 0 ? "font-semibold" : ""
                  }`}
              >
                {node.account_name}
              </span>
            </div>
          );
        },
      },
      {
        id: "opening_debit",
        header: "Opening Debit",
        size: 130,
        meta: { align: "right" },
        cell: ({ row }) => (
          <span className="text-xs tabular-nums text-main">
            {nf(row.original.opening_debit)}
          </span>
        ),
      },
      {
        id: "opening_credit",
        header: "Opening Credit",
        size: 130,
        meta: { align: "right" },
        cell: ({ row }) => (
          <span className="text-xs tabular-nums text-main">
            {nf(row.original.opening_credit)}
          </span>
        ),
      },
      {
        id: "debit",
        header: "Debit",
        size: 130,
        meta: { align: "right" },
        cell: ({ row }) => (
          <span className="text-xs tabular-nums text-blue-500 font-medium">
            {nf(row.original.debit)}
          </span>
        ),
      },
      {
        id: "credit",
        header: "Credit",
        size: 130,
        meta: { align: "right" },
        cell: ({ row }) => (
          <span className="text-xs tabular-nums text-orange-500 font-medium">
            {nf(row.original.credit)}
          </span>
        ),
      },
      {
        id: "closing_debit",
        header: "Closing Debit",
        size: 130,
        meta: { align: "right" },
        cell: ({ row }) => (
          <span className="text-xs tabular-nums text-main font-semibold">
            {nf(row.original.closing_debit)}
          </span>
        ),
      },
      {
        id: "closing_credit",
        header: "Closing Credit",
        size: 130,
        meta: { align: "right" },
        cell: ({ row }) => (
          <span className="text-xs tabular-nums text-main font-semibold">
            {nf(row.original.closing_credit)}
          </span>
        ),
      },
    ],
    [],
  );

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

  /* ── States ── */

  if (error && !data) {
    return (
      <div className="flex flex-col items-center py-20 gap-3">
        <AlertCircle size={26} className="text-danger" />
        <p className="text-danger text-sm">{error}</p>
        <button
          onClick={() => fetchTB(filters)}
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
      <FilterBar
        filters={filters}
        setFilters={setFilters}
        onRefresh={() => fetchTB(filters)}
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
                    No trial balance data.
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

            {/* TOTAL row - pinned to the bottom of the scroll container so it's always visible */}
            {data &&
              !(loading && !data) &&
              table.getRowModel().rows.length > 0 && (
                <tfoot className="sticky bottom-0 z-10">
                  <tr className="bg-card border-t-2 border-[var(--border)] font-semibold h-[34px] shadow-[0_-1px_0_0_var(--border)]">
                    <td className="px-3 py-1 whitespace-nowrap bg-card">
                      <span className="text-xs font-bold text-primary">
                        TOTAL
                      </span>
                    </td>
                    <td className="px-3 py-1 whitespace-nowrap text-right bg-card">
                      <span className="text-xs tabular-nums font-bold text-main">
                        {nf(data.totals.opening_debit)}
                      </span>
                    </td>
                    <td className="px-3 py-1 whitespace-nowrap text-right bg-card">
                      <span className="text-xs tabular-nums font-bold text-main">
                        {nf(data.totals.opening_credit)}
                      </span>
                    </td>
                    <td className="px-3 py-1 whitespace-nowrap text-right bg-card">
                      <span className="text-xs tabular-nums font-bold text-blue-500">
                        {nf(data.totals.debit)}
                      </span>
                    </td>
                    <td className="px-3 py-1 whitespace-nowrap text-right bg-card">
                      <span className="text-xs tabular-nums font-bold text-orange-500">
                        {nf(data.totals.credit)}
                      </span>
                    </td>
                    <td className="px-3 py-1 whitespace-nowrap text-right bg-card">
                      <span className="text-xs tabular-nums font-bold text-main">
                        {nf(data.totals.closing_debit)}
                      </span>
                    </td>
                    <td className="px-3 py-1 whitespace-nowrap text-right bg-card">
                      <span className="text-xs tabular-nums font-bold text-main">
                        {nf(data.totals.closing_credit)}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              )}
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

export default TrialBalance;
