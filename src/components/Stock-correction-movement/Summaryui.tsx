import React from "react";
import { Info, Trash2 } from "lucide-react";
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

export const StockSummaryTable: React.FC<{ rows: StockSummaryRow[] }> = ({ rows }) => {
  if (rows.length === 0) return null;

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
            {rows.map((row) => (
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
        <div className="px-3 py-2 text-[11px] text-muted border-t border-theme">
          Showing 1 to {rows.length} of {rows.length} batches
        </div>
      </div>
    </div>
  );
};

// ─── Right-side summary rail ───────────────────────────────────────────────

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
    <aside className="flex flex-col gap-4 h-full min-h-0 overflow-y-auto">
      <SummaryCard>
        <span className="block text-[10px] font-bold uppercase tracking-widest text-muted mb-2">
          {mode === "correction" ? "Projected Stock" : "Remaining After Move"}
        </span>
        <div
          className={["text-4xl font-black leading-none", heroIsNegative ? "text-danger" : "text-primary"].join(" ")}
          style={!heroIsNegative ? { color: "var(--primary,#1c3f6e)" } : undefined}
        >
          {heroValue.toLocaleString()}{" "}
          <span className="text-sm font-bold text-muted align-middle">{unit || "PCS"}</span>
        </div>
        <div className="flex items-center gap-1 mt-2 text-[11px] text-muted">
          <Info size={12} />
          <span>
            {mode === "correction"
              ? `Was ${currentTotalQty.toLocaleString()} across all warehouses`
              : `Across all warehouses (was ${currentTotalQty.toLocaleString()})`}
          </span>
        </div>
      </SummaryCard>

      <SummaryCard>
        <span className="block text-[10px] font-bold uppercase tracking-widest text-muted mb-1">
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
          <KeyValueRow label={mode === "correction" ? "Rows" : "Movements"} value={rowCount} />
        </div>
      </SummaryCard>

      <SummaryCard>
        <span className="block text-[10px] font-bold uppercase tracking-widest text-muted mb-2">
          {mode === "correction" ? "Net Inventory Change" : "Total Moved"}
        </span>
        <div
          className="rounded-lg py-3 px-3 text-center"
          style={{ background: netIsNegative ? "rgba(239,68,68,0.08)" : "rgba(28,63,110,0.06)" }}
        >
          <div
            className={["text-2xl font-black leading-none", netIsNegative ? "text-danger" : ""].join(" ")}
            style={!netIsNegative ? { color: "var(--primary,#1c3f6e)" } : undefined}
          >
            {mode === "correction" ? `${netCorrectionQty > 0 ? "+" : ""}${netCorrectionQty}` : totalMovedQty}{" "}
            <span className="text-xs font-bold text-muted align-middle">{unit || "PCS"}</span>
          </div>
        </div>
        {mode === "correction" && projectedTotal < 0 && (
          <p className="text-[10px] text-danger leading-snug mt-2">Correction would push stock below zero.</p>
        )}
        {mode === "movement" && movementExceedsStock && (
          <p className="text-[10px] text-danger leading-snug mt-2">Move quantity exceeds available stock.</p>
        )}
      </SummaryCard>

      {mode === "correction" && reasonSummary.length > 0 && (
        <SummaryCard>
          <span className="block text-[10px] font-bold uppercase tracking-widest text-muted mb-1">
            Reason Summary
          </span>
          <div className="divide-y divide-theme">
            {reasonSummary.map((r) => (
              <div key={r.label} className="flex items-center justify-between gap-3 py-1.5 text-[12px]">
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