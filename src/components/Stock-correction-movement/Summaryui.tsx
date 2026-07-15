import React, { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Info, Trash2 } from "lucide-react";
import type { Mode, Option, StockSummaryRow } from "../../hooks/stock correction-movement/Usestockcorrectionform";

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

export const RemoveRowButton: React.FC<{ onClick: () => void; disabled?: boolean }> = ({
  onClick,
  disabled = false,
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="flex items-center justify-center rounded-full"
    style={{
      width: 26,
      height: 26,
      border: "none",
      background: disabled ? "transparent" : "rgba(239,68,68,0.08)",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.3 : 1,
      color: "#ef4444",
      padding: 0,
    }}
  >
    <Trash2 style={{ width: 13, height: 13 }} />
  </button>
);

// ─── Available stock batches table ─────────────────────────────────────────

const STOCK_SUMMARY_PAGE_SIZE = 5;

export const StockSummaryTable: React.FC<{ rows: StockSummaryRow[] }> = ({ rows }) => {
  const [page, setPage] = useState(1);

  // Reset to page 1 whenever a new item is selected (rows array identity
  // changes in handleItemPicked / handleItemClear) or cleared.
  useEffect(() => {
    setPage(1);
  }, [rows]);

  const totalPages = Math.max(1, Math.ceil(rows.length / STOCK_SUMMARY_PAGE_SIZE));
  // Guard against a stale page number if rows shrink (e.g. fewer batches on a re-pick).
  const safePage = Math.min(page, totalPages);

  const pageRows = useMemo(() => {
    const start = (safePage - 1) * STOCK_SUMMARY_PAGE_SIZE;
    return rows.slice(start, start + STOCK_SUMMARY_PAGE_SIZE);
  }, [rows, safePage]);

  if (rows.length === 0) return null;

  const start = (safePage - 1) * STOCK_SUMMARY_PAGE_SIZE + 1;
  const end = Math.min(safePage * STOCK_SUMMARY_PAGE_SIZE, rows.length);

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
              <th className="text-left px-3 py-2 font-semibold">Expiry Date</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row) => (
              <tr key={row.id} className="border-t border-theme">
                <td className="px-3 py-2.5 text-main">{row.branchLabel}</td>
                <td className="px-3 py-2.5 text-main">{row.batchNo}</td>
                <td className="px-3 py-2.5 font-bold text-main">
                  {row.availableQty.toLocaleString()} {row.unit}
                </td>
                <td className="px-3 py-2.5 text-main">{row.expiryDate || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
      </div>
    </div>
  );
};

// ─── Right-side summary rail ───────────────────────────────────────────────

const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const formatDisplayDate = (input?: string): string => {
  if (!input) return "—";
  const datePart = input.slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datePart);
  if (!match) return input; // not plain ISO — show as-is rather than guess
  const [, y, m, d] = match;
  const mi = parseInt(m, 10) - 1;
  if (mi < 0 || mi > 11) return input;
  return `${d}-${MONTH_ABBR[mi]}-${y}`;
};

// ─── Right-side summary rail ───────────────────────────────────────────────

interface SummaryRailProps {
  mode: Mode;
  selectedItem: Option | null;
  unit: string;
  postingDate: string;
  currentTotalQty: number;
  netCorrectionQty: number; 
  totalMovedQty: number;

  heroValue: number; 
  heroIsNegative: boolean;
  movementExceedsStock: boolean;
  fromLabel?: string;
  toLabel?: string;
  warehouseLabel?: string;
  batchNo?: string;
  expiryDate?: string;
  batchAvailableQty?: number;
}

export const SummaryRail: React.FC<SummaryRailProps> = ({
  mode,
  selectedItem,
  unit,
  postingDate,
  currentTotalQty,
  netCorrectionQty,
  totalMovedQty,
  heroValue,
  heroIsNegative,
  movementExceedsStock,
  fromLabel,
  toLabel,
  warehouseLabel,
  batchNo,
  expiryDate,
  batchAvailableQty,
}) => {
  const displayUnit = unit || "PCS";
  const isCorrection = mode === "correction";

  return (
    <aside className="flex flex-col gap-2.5 h-full min-h-0 overflow-y-auto">
      {/* ── Impact card ── */}
      <SummaryCard className="p-3">
        <span className="block text-[10px] font-bold uppercase tracking-widest text-muted mb-1.5">
          {isCorrection ? "Inventory Impact" : "Movement Impact"}
        </span>
        <div className="divide-y divide-theme">
          <KeyValueRow
            label={isCorrection ? "Current Stock" : "Available Qty"}
            value={`${currentTotalQty.toLocaleString()} ${displayUnit}`}
          />
          <KeyValueRow
            label={isCorrection ? "Correction Qty" : "Transfer Qty"}
            value={
              isCorrection
                ? `${netCorrectionQty > 0 ? "+" : ""}${netCorrectionQty} ${displayUnit}`
                : `${totalMovedQty} ${displayUnit}`
            }
            valueClassName={isCorrection && netCorrectionQty < 0 ? "text-danger" : ""}
          />
        </div>
        <div
          className="rounded-lg py-2 px-3 mt-2 flex items-center justify-between"
          style={{ background: heroIsNegative ? "rgba(239,68,68,0.08)" : "rgba(28,63,110,0.06)" }}
        >
          <span className="text-[11px] font-semibold text-muted">
            {isCorrection ? "Projected Stock" : "Remaining Qty"}
          </span>
          <span
            className={["text-lg font-black leading-none", heroIsNegative ? "text-danger" : ""].join(" ")}
            style={!heroIsNegative ? { color: "var(--primary,#1c3f6e)" } : undefined}
          >
            {heroValue.toLocaleString()} <span className="text-xs font-bold text-muted align-middle">{displayUnit}</span>
          </span>
        </div>
        {heroIsNegative && (
          <p className="text-[10px] text-danger leading-snug mt-1.5">
            {isCorrection ? "Correction would push stock below zero." : "Move quantity exceeds available stock."}
          </p>
        )}
      </SummaryCard>

      {/* ── Details card ── */}
      <SummaryCard className="p-3">
        <span className="block text-[10px] font-bold uppercase tracking-widest text-muted mb-0.5">
          {isCorrection ? "Selected Batch" : "Movement Details"}
        </span>
        <div className="divide-y divide-theme">
          {isCorrection ? (
            <KeyValueRow label="Warehouse" value={warehouseLabel || "—"} />
          ) : (
            <>
              <KeyValueRow label="From" value={fromLabel || "—"} />
              <KeyValueRow label="To" value={toLabel || "—"} />
            </>
          )}
          <KeyValueRow label="Batch No." value={batchNo || "—"} />
          <KeyValueRow label="Expiry Date" value={formatDisplayDate(expiryDate)} />
          {isCorrection && (
            <KeyValueRow
              label="Available Qty"
              value={`${(batchAvailableQty ?? currentTotalQty).toLocaleString()} ${displayUnit}`}
            />
          )}
        </div>
      </SummaryCard>

      {/* ── Transaction card ── */}
      <SummaryCard className="p-3">
        <span className="block text-[10px] font-bold uppercase tracking-widest text-muted mb-0.5">
          Transaction
        </span>
        <div className="divide-y divide-theme">
          <KeyValueRow label="Mode" value={isCorrection ? "Correction" : "Movement"} badge />
          <KeyValueRow label="Posting Date" value={formatDisplayDate(postingDate)} />
          <KeyValueRow label="Item" value={selectedItem?.label || "—"} />
        </div>
      </SummaryCard>
    </aside>
  );
};