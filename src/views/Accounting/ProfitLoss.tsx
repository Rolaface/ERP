import React, { useState, useEffect, useCallback, useMemo } from "react";
import ExpandableTreeTable from "../../components/ui/Table/ExpandableTreeTable";
import type { Column } from "../../components/ui/Table/type";
import {
  getProfitAndLoss,
  type ProfitLossFilters,
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
import { PLNode, PLData, PLResponse, mapNode, nf, formatPeriod } from "../../types/Accounting/ProfitLoss";
import DatePickerInput from "../../components/calendar/DatePickerInput";


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

const currentYear = new Date().getFullYear();

const currentMonthStart = () => {
  const d = new Date();
  return `01-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
};

const currentMonthEnd = () => {
  const d = new Date();
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  return `${String(last).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
};



const nodeKey = (n: PLNode) => n.id;
/*
  EXPAND ICON
*/

function expandIcon(
  _node: PLNode,
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

/*
  SUMMARY STRIP
*/

function SummaryStrip({ data }: { data: PLData }) {
  const items = data.summary.filter((i) => !i.type);

  return (
    <div className="grid grid-cols-3 gap-3 w-full max-w-[900px]">
      {items.map((item) => {
        const isProfit = item.indicator?.toLowerCase() === "green";

        return (
          <div
            key={item.label}
            className="rounded-xl border p-3 flex flex-col gap-1 bg-card w-full"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-[0.14em] text-muted opacity-70">
                {item.label}
              </span>
            </div>

            <div
              className={`text-sm font-black tracking-tight ${isProfit ? "text-emerald-500" : "text-rose-500"
                }`}
            >
              {nf(item.value, item.currency)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/*
  FILTER BAR
*/
type FilterBarProps = {
  filters: ProfitLossFilters;
  setFilters: React.Dispatch<React.SetStateAction<ProfitLossFilters>>;
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
    "w-25 px-2 py-1.5 border border-[var(--border)] rounded-lg bg-card text-main text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all no-spinner";

  const btnClass =
    "flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-main bg-card border border-[var(--border)] rounded-xl hover:bg-row-hover transition-all whitespace-nowrap";

  return (
    <div className="w-[900px] flex items-center gap-2 flex-nowrap overflow-x-auto p-3 rounded-xl border border-[var(--border)] bg-card shadow-sm scrollbar-thin">


      {/* MODE */}
      <div className="flex items-center gap-1">
        <span className="text-[10px] font-black uppercase tracking-widest text-muted opacity-50">
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
                ? {
                  from_date: currentMonthStart(),
                  to_date: currentMonthEnd(),
                }
                : {
                  from_fiscal_year: currentYear,
                  to_fiscal_year: currentYear,
                })
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
              periodicity: e.target.value as ProfitLossFilters["periodicity"]
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

      {/* FROM FY */}
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
                  from_fiscal_year: Number(e.target.value)
                }))
              }
              className={inputClass}
            />
          </div>

          {/* TO FY */}
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
                  to_fiscal_year: Number(e.target.value)
                }))
              }
              className={inputClass}
            />
          </div>
        </>)
      }
      {/* FROM DATE */}
      {filters.mode === "Date Range" && (
        <>
          {/* FROM DATE */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted opacity-50">
              From
            </span>

            <div className="w-[120px]">
              <DatePickerInput
                name="from_date"
                value={toInputDate(filters.from_date ?? "")}
                onChange={(name, value) =>
                  setFilters((f) => ({
                    ...f,
                    from_date: toApiDate(value),
                  }))
                }
              />
            </div>
          </div>

          {/* TO DATE */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted opacity-50">
              To
            </span>

            <div className="w-[120px]">
              <DatePickerInput
                name="to_date"
                value={toInputDate(filters.to_date ?? "")}
                onChange={(name, value) =>
                  setFilters((f) => ({
                    ...f,
                    to_date: toApiDate(value),
                  }))
                }
              />
            </div>
          </div>
        </>)}

      <div className="h-5 w-px bg-[var(--border)] mx-1" />

      {/* EXPAND */}
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

/*
  MAIN COMPONENT
*/

const ProfitLoss: React.FC = () => {


  const currentYear = new Date().getFullYear();

  const [filters, setFilters] = useState<ProfitLossFilters>({
    mode: "Fiscal Year",
    periodicity: "Monthly",
    from_fiscal_year: currentYear,
    to_fiscal_year: currentYear,
    from_date: currentMonthStart(),
    to_date: currentMonthEnd()
  });

  const [data, setData] = useState<PLData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandKey, setExpandKey] = useState(0);
  const [expandDepth, setExpandDepth] = useState(2);



  const handleExpandAll = useCallback(() => {
    setExpandDepth(Number.MAX_SAFE_INTEGER);
    setExpandKey((k) => k + 1);
  }, []);

  const handleCollapseAll = useCallback(() => {
    setExpandDepth(0);
    setExpandKey((k) => k + 1);
  }, []);

  const tableData = useMemo(() => {
    if (!data) return [];

    return [
      ...data.income,
      ...data.expense
    ];
  }, [data]);


  const fetchPL = useCallback(
    async (currentFilters: ProfitLossFilters) => {
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
              filter_based_on: "Date Range"
            }
            : {
              periodicity: currentFilters.periodicity,
              from_fiscal_year: currentFilters.from_fiscal_year,
              to_fiscal_year: currentFilters.to_fiscal_year,
              filter_based_on: "Fiscal Year"
            };
        const res: PLResponse = await getProfitAndLoss(params);
        console.log("API RESPONSE:", res);
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
    },
    []
  );


  /* Debounced fetch */
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



  const columns: Column<PLNode>[] = useMemo(() => {
    if (!data?.columns) return [];

    return data.columns
      .filter((col) => !col.hidden)
      .map((col) => {
        if (col.fieldname === "account") {
          return {
            key: "account_name",
            header: col.label,
            width: 220,
            align: "left" as const,
            render: (row: PLNode) => (
              <span className={row.is_group ? "font-semibold" : ""}>
                {row.account_name}
              </span>
            )
          }
        }

        return {
          key: col.fieldname,
          header: col.label,
          width: Math.min(col.width ?? 100, 90),
          align: "right" as const,
          render: (row: PLNode) =>
            nf(row.periods?.[col.fieldname] ?? 0, row.currency)
        }
      })
  }, [data]);

  /*  FULL-PAGE STATES  */
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
          onClick={() => fetchPL(filters)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded"
        >
          <RefreshCw size={14} />
          Retry
        </button>
      </div>
    );
  }

  /*  RENDER  */
  return (
    <div className="flex flex-col gap-4 w-full overflow-x-hidden">
      {/* Summary */}
      {data && <SummaryStrip data={data} />}

      {/* Filter bar — top, shared */}
      <FilterBar
        filters={filters}
        setFilters={setFilters}
        onRefresh={() => fetchPL(filters)}
        loading={loading}
        onExpandAll={handleExpandAll}
        onCollapseAll={handleCollapseAll}
      />

      <style>{`
 .pl-no-minw table {
  width: max-content;
  min-width: 100%;
}
`}</style>

      <div className="w-full max-w-full overflow-hidden rounded-xl border border-[var(--border)]">
        <div className="pl-no-minw w-full max-w-full overflow-x-auto">
          <ExpandableTreeTable<PLNode>
            key={`pl-${expandKey}`}
            columns={columns}
            data={tableData}
            childrenKey="children"
            nodeKey={nodeKey}
            showToolbar={false}
            defaultExpandDepth={expandDepth}
            expandIconRender={expandIcon}
            loading={loading}
            emptyMessage="No Profit & Loss data."
          />
        </div>


      </div>
    </div>
  );
};

export default ProfitLoss;