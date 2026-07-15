import React, { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Info } from "lucide-react";
import { ModalSelect, NumericInput } from "../ui/modal/modalComponent";
import type {
  CorrectionRow,
  Mode,
  MovementRow,
  Option,
} from "../../hooks/stock correction-movement/Usestockcorrectionform";

// ─── Tiny atoms ─────────────────────────────────────────────────────────────

export const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="block text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--primary,#1c3f6e)" }}>
    {children}
  </span>
);

export const SummaryCard: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => <div className={["rounded-xl border border-theme bg-card p-4", className].join(" ")}>{children}</div>;

export const KeyValueRow: React.FC<{ label: string; value: React.ReactNode; badge?: boolean; valueClassName?: string }> = ({
  label,
  value,
  badge = false,
  valueClassName = "",
}) => (
  <div className="flex items-start justify-between gap-3 py-1.5 text-[12px]">
    <span className="text-muted">{label}</span>
    {badge ? (
      <span
        className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide"
        style={{ background: "rgba(47,85,151,0.10)", color: "var(--primary,#2f5597)" }}
      >
        {value}
      </span>
    ) : (
      <span className={["font-semibold text-main text-right", valueClassName].join(" ")}>{value}</span>
    )}
  </div>
);

// ─── Merged "Available Stock" + editable qty table ─────────────────────────

const BATCH_TABLE_PAGE_SIZE = 10;

interface StockBatchTableProps {
  mode: Mode;
  unit: string;
  correctionRows: CorrectionRow[];
  onCorrectionQtyChange: (id: string, qty: string) => void;
  movementRows: MovementRow[];
  onMovementRowChange: (id: string, field: "to" | "qty", value: string) => void;
  branchOptions: Option[];
  hasItem: boolean;
}

export const StockBatchTable: React.FC<StockBatchTableProps> = ({
  mode,
  unit,
  correctionRows,
  onCorrectionQtyChange,
  movementRows,
  onMovementRowChange,
  branchOptions,
  hasItem,
}) => {
  const [page, setPage] = useState(1);

  const rows = mode === "correction" ? correctionRows : movementRows;

  useEffect(() => {
    setPage(1);
  }, [mode, rows.length]);

  const totalPages = Math.max(1, Math.ceil(rows.length / BATCH_TABLE_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const pageCorrectionRows = useMemo(() => {
    const start = (safePage - 1) * BATCH_TABLE_PAGE_SIZE;
    return correctionRows.slice(start, start + BATCH_TABLE_PAGE_SIZE);
  }, [correctionRows, safePage]);

  const pageMovementRows = useMemo(() => {
    const start = (safePage - 1) * BATCH_TABLE_PAGE_SIZE;
    return movementRows.slice(start, start + BATCH_TABLE_PAGE_SIZE);
  }, [movementRows, safePage]);

  const colCount = 6;
  const isEmpty = rows.length === 0;

  const start = isEmpty ? 0 : (safePage - 1) * BATCH_TABLE_PAGE_SIZE + 1;
  const end = isEmpty ? 0 : Math.min(safePage * BATCH_TABLE_PAGE_SIZE, rows.length);

  return (
    <div>
      <SectionLabel>Available Stock For This Item</SectionLabel>
      <div className="mt-2 rounded-xl border border-theme overflow-hidden">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="bg-row-hover text-muted text-[10px] uppercase tracking-wide">
              <th className="text-left px-3 py-2 font-semibold">Warehouse</th>
              <th className="text-left px-3 py-2 font-semibold">Batch No.</th>
              <th className="text-left px-3 py-2 font-semibold">Available Stock</th>
              {mode === "correction" ? (
                <>
                  <th className="text-left px-3 py-2 font-semibold">New Balance</th>
                  <th className="text-left px-3 py-2 font-semibold">Expiry Date</th>
                  <th className="text-left px-3 py-2 font-semibold">Correct/Quantity</th>
                </>
              ) : (
                <>
                  <th className="text-left px-3 py-2 font-semibold">Expiry Date</th>
                  <th className="text-left px-3 py-2 font-semibold">Move To</th>
                  <th className="text-left px-3 py-2 font-semibold">Move Qty</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {isEmpty ? (
              <tr>
                <td colSpan={colCount} className="px-3 py-10 text-center">
                  <div className="flex flex-col items-center gap-1 text-muted">
                    <Info size={18} className="opacity-50" />
                    <span className="text-[12px] font-medium">
                      {hasItem ? "No stock found for this item." : "Please select an item to view available stock."}
                    </span>
                  </div>
                </td>
              </tr>
            ) : mode === "correction" ? (
              pageCorrectionRows.map((row) => {
                const qtyNum = row.qty.trim() === "" ? 0 : Number(row.qty);
                const newBalance = row.availableQty + (isNaN(qtyNum) ? 0 : qtyNum);
                return (
                  <tr key={row.id} className="border-t border-theme">
                    <td className="px-3 py-2.5 text-main">{row.branchLabel}</td>
                    <td className="px-3 py-2.5 text-main">{row.batchNo}</td>
                    <td className="px-3 py-2.5 font-bold text-main">
                      {row.availableQty.toLocaleString()} {row.unit}
                    </td>
                    <td
                      className="px-3 py-2.5 font-bold"
                      style={{ color: newBalance < 0 ? "#ef4444" : "var(--primary,#1c3f6e)" }}
                    >
                      {newBalance.toLocaleString()} {row.unit}
                    </td>
                    <td className="px-3 py-2.5 text-main">{row.expiryDate || "—"}</td>
                    <td className="px-3 py-2.5" style={{ maxWidth: 130 }}>
                      <NumericInput
                        value={row.qty === "" ? null : Number(row.qty)}
                        allowNegative
                        decimalScale={0}
                        placeholder="0"
                        onChange={(v) => onCorrectionQtyChange(row.id, v === null ? "" : String(v))}
                        className="h-[30px] text-[12px] w-full"
                      />
                    </td>
                  </tr>
                );
              })
            ) : (
              pageMovementRows.map((row) => {
                const toOptions = branchOptions.filter((b) => b.value !== row.branch);
                const remaining = row.availableQty - (row.to && row.qty ? Number(row.qty) || 0 : 0);
                return (
                  <tr key={row.id} className="border-t border-theme">
                    <td className="px-3 py-2.5 text-main">{row.branchLabel}</td>
                    <td className="px-3 py-2.5 text-main">{row.batchNo}</td>
                    <td className="px-3 py-2.5 font-bold text-main">
                      {row.availableQty.toLocaleString()} {row.unit}
                      {row.to && (
                        <span className="block text-[10px] font-normal text-muted mt-0.5">
                          Remaining: {remaining.toLocaleString()}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-main">{row.expiryDate || "—"}</td>
                    <td className="px-3 py-2.5" style={{ maxWidth: 170 }}>
                      <ModalSelect
                        label=""
                        options={toOptions}
                        value={row.to}
                        onChange={(e) => onMovementRowChange(row.id, "to", e.target.value)}
                      />
                    </td>
                    <td className="px-3 py-2.5" style={{ maxWidth: 130 }}>
                      <NumericInput
                        value={row.qty === "" ? null : Number(row.qty)}
                        allowNegative={false}
                        decimalScale={0}
                        placeholder="0"
                        onChange={(v) => onMovementRowChange(row.id, "qty", v === null ? "" : String(v))}
                        className="h-[30px] text-[12px] w-full"
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        {!isEmpty && (
          <div className="flex items-center justify-between px-3 py-2 text-[11px] text-muted border-t border-theme">
            <span>
              Showing {start} to {end} of {rows.length} batches
            </span>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="flex items-center justify-center rounded-md border border-theme"
                  style={{
                    width: 22,
                    height: 22,
                    background: "transparent",
                    cursor: safePage === 1 ? "not-allowed" : "pointer",
                    opacity: safePage === 1 ? 0.4 : 1,
                  }}
                  aria-label="Previous page"
                >
                  <ChevronLeft style={{ width: 13, height: 13 }} />
                </button>
                <span className="text-main font-semibold">
                  {safePage} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  className="flex items-center justify-center rounded-md border border-theme"
                  style={{
                    width: 22,
                    height: 22,
                    background: "transparent",
                    cursor: safePage === totalPages ? "not-allowed" : "pointer",
                    opacity: safePage === totalPages ? 0.4 : 1,
                  }}
                  aria-label="Next page"
                >
                  <ChevronRight style={{ width: 13, height: 13 }} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Right-side summary rail (unchanged from before) ───────────────────────

interface SummaryRailProps {
  mode: Mode;
  selectedItem: Option | null;
  unit: string;
  rowCount: number;
  currentTotalQty: number;
  netCorrectionQty: number;
  totalMovedQty: number;
  projectedTotal: number;
  heroValue: number;
  heroIsNegative: boolean;
  movementExceedsStock: boolean;
  reasonSummary: Array<{ label: string; qty: number }>;
}
export const SummaryRail: React.FC<SummaryRailProps> = ({
  mode,
  selectedItem,
  unit,
  rowCount,
  currentTotalQty,
  netCorrectionQty,
  totalMovedQty,
  projectedTotal,
  heroValue,
  heroIsNegative,
  movementExceedsStock,
  reasonSummary,
}) => {
  const netIsNegative = mode === "correction" ? netCorrectionQty < 0 : movementExceedsStock;

  return (
    <aside className="flex flex-col gap-2.5 h-full min-h-0 overflow-y-auto">
      <SummaryCard className="p-3">
        <span className="block text-[10px] font-bold uppercase tracking-widest text-muted mb-1.5">
          {mode === "correction" ? "Projected Stock" : "Remaining After Move"}
        </span>
        <div
          className={["text-3xl font-black leading-none", heroIsNegative ? "text-danger" : "text-primary"].join(" ")}
          style={!heroIsNegative ? { color: "var(--primary,#1c3f6e)" } : undefined}
        >
          {heroValue.toLocaleString()}{" "}
          <span className="text-sm font-bold text-muted align-middle">{unit || "PCS"}</span>
        </div>
        <div className="flex items-center gap-1 mt-1.5 text-[11px] text-muted">
          <Info size={12} />
          <span>
            {mode === "correction"
              ? `Was ${currentTotalQty.toLocaleString()} across all warehouses`
              : `Across all warehouses (was ${currentTotalQty.toLocaleString()})`}
          </span>
        </div>
      </SummaryCard>

      <SummaryCard className="p-3">
        <span className="block text-[10px] font-bold uppercase tracking-widest text-muted mb-0.5">
          Transaction Overview
        </span>
        <div className="divide-y divide-theme">
          <KeyValueRow label="Mode" value={mode === "correction" ? "Correction" : "Movement"} badge />
          <KeyValueRow label="Item" value={selectedItem?.label || "—"} />
          <KeyValueRow label="Current Stock" value={`${currentTotalQty.toLocaleString()} ${unit || "PCS"}`} />
          {mode === "correction" && (
            <KeyValueRow
              label="Total Adjustment"
              value={`${netCorrectionQty > 0 ? "+" : ""}${netCorrectionQty} ${unit || "PCS"}`}
              valueClassName={netCorrectionQty < 0 ? "text-danger" : ""}
            />
          )}
          <KeyValueRow label="Batches" value={rowCount} />
        </div>
      </SummaryCard>

      <SummaryCard className="p-3">
        <span className="block text-[10px] font-bold uppercase tracking-widest text-muted mb-1.5">
          {mode === "correction" ? "Net Inventory Change" : "Total Moved"}
        </span>
        <div
          className="rounded-lg py-2 px-3 text-center"
          style={{ background: netIsNegative ? "rgba(239,68,68,0.08)" : "rgba(28,63,110,0.06)" }}
        >
          <div
            className={["text-xl font-black leading-none", netIsNegative ? "text-danger" : ""].join(" ")}
            style={!netIsNegative ? { color: "var(--primary,#1c3f6e)" } : undefined}
          >
            {mode === "correction" ? `${netCorrectionQty > 0 ? "+" : ""}${netCorrectionQty}` : totalMovedQty}{" "}
            <span className="text-xs font-bold text-muted align-middle">{unit || "PCS"}</span>
          </div>
        </div>
        {mode === "correction" && projectedTotal < 0 && (
          <p className="text-[10px] text-danger leading-snug mt-1.5">Correction would push stock below zero.</p>
        )}
        {mode === "movement" && movementExceedsStock && (
          <p className="text-[10px] text-danger leading-snug mt-1.5">Move quantity exceeds available stock.</p>
        )}
      </SummaryCard>

      {mode === "correction" && reasonSummary.length > 0 && (
        <SummaryCard className="p-3">
          <span className="block text-[10px] font-bold uppercase tracking-widest text-muted mb-0.5">
            Reason Summary
          </span>
          <div className="divide-y divide-theme">
            {reasonSummary.map((r) => (
              <div key={r.label} className="flex items-center justify-between gap-3 py-1 text-[12px]">
                <span className="text-muted">{r.label}</span>
                <span className={["font-semibold", r.qty < 0 ? "text-danger" : "text-main"].join(" ")}>
                  {r.qty > 0 ? "+" : ""}
                  {r.qty} {unit || "PCS"}
                </span>
              </div>
            ))}
          </div>
        </SummaryCard>
      )}
    </aside>
  );
};