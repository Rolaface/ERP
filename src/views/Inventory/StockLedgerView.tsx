import React from "react";
import { Scale } from "lucide-react";
import { useStockLedger, fmt } from "../../hooks/stock/useStockLedger";
import StockLedgerFilters from "./Filters/Stockledgerfilters";
import StockLedgerTable from "./Stockledgertable";

export interface StockLedgerViewProps {
  itemCode?: string;
  itemName?: string;
  batchNo?: string;
  onBack: () => void;
}

interface KpiValues {
  totalIn: number;
  totalOut: number;
  closingQty: number;
  closingValue: number;
  netValueChange: number;
}

// ── Top-level summary strip, same card pattern as Accounts Receivable/Payables ──
const StockKpiStrip: React.FC<{ kpi: KpiValues; loading: boolean }> = ({
  kpi,
  loading,
}) => {
  const items = [
    { label: "In", value: fmt(kpi.totalIn), color: "text-emerald-600" },
    { label: "Out", value: fmt(kpi.totalOut), color: "text-red-500" },
    {
      label: "Closing Qty",
      value: fmt(kpi.closingQty),
      color: "text-blue-500",
    },
    {
      label: "Closing Value",
      value: fmt(kpi.closingValue),
      color: "text-primary",
    },
    {
      label: "Net Change",
      value: fmt(kpi.netValueChange),
      color: kpi.netValueChange >= 0 ? "text-emerald-600" : "text-red-500",
    },
  ];

  return (
    <div className="bg-card border border-[var(--border)] rounded-lg px-3 py-2.5 flex flex-col gap-2">
      <div className="flex items-center gap-1.5">
        <Scale size={11} className="text-blue-400" />
        <span className="text-[9px] font-black uppercase tracking-widest text-muted">
          Stock Summary
        </span>
      </div>
      <div className="grid grid-cols-5 gap-1 divide-x divide-[var(--border)]">
        {items.map((item) => (
          <div key={item.label} className="flex flex-col gap-0.5 px-1 first:pl-0 last:pr-0">
            <span className="text-[10px] leading-tight text-muted truncate">
              {item.label}
            </span>
            {loading ? (
              <div className="h-3.5 w-12 bg-[var(--border)] rounded animate-pulse mt-0.5" />
            ) : (
              <span
                className={`text-[13px] leading-tight tabular-nums font-extrabold block ${item.color}`}
              >
                {item.value}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const StockLedgerView: React.FC<StockLedgerViewProps> = ({
  itemCode,
  batchNo,
  onBack,
}) => {
  const {
    filters,
    updateFilter,
    handleApply,
    loading,
    isInitialLoad,
    error,
    rows,
    kpiValues,
    columns,
    table,
    leafColumns,
    page,
    setPage,
    pageSize,
    totalPages,
  } = useStockLedger({ itemCode, batchNo });

  return (
    <div className="flex flex-col gap-3 h-full min-h-0">
      <StockKpiStrip kpi={kpiValues} loading={isInitialLoad} />

      <StockLedgerFilters
        filters={filters}
        updateFilter={updateFilter}
        onApply={handleApply}
        onBack={onBack}
        loading={loading}
      />

      {error && (
        <div className="px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-500">
          {error}
        </div>
      )}

      <StockLedgerTable
        table={table}
        columnsCount={columns.length}
        rows={rows}
        loading={loading}
        isInitialLoad={isInitialLoad}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  );
};

export default StockLedgerView;