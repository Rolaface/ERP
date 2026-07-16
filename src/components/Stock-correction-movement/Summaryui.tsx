
import { Trash2 } from "lucide-react";
import { getGLNameWithoutAbbreviation } from "../../api/utils/glAccountUtils";
import type { Mode, Option } from "../../hooks/stock correction-movement/Usestockcorrectionform";

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

export const KeyValueRow: React.FC<{
  label: string;
  value: React.ReactNode;
  badge?: boolean;
  valueClassName?: string;
}> = ({ label, value, badge = false, valueClassName = "" }) => (
  <div className="flex items-start justify-between gap-3 py-1 text-[11px]">
    <span className="text-muted">{label}</span>
    {badge ? (
      <span
        className="px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wide"
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
  valuationRate?: number;
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
  
  fromLabel,
  toLabel,
  warehouseLabel,
  batchNo,
  expiryDate,
  
  valuationRate,
}) => {
  const displayUnit = unit || "PCS";
  const isCorrection = mode === "correction";

  return (
    <aside className="flex flex-col gap-2 h-full min-h-0 overflow-y-auto">
      {/* ── Impact card ── */}
      <SummaryCard className="p-2.5">
        <span className="block text-[9px] font-bold uppercase tracking-widest text-muted mb-1">
          {isCorrection ? "Inventory Impact" : "Movement Impact"}
        </span>
        <div className="divide-y divide-theme">
          <KeyValueRow
            label={isCorrection ? "Current Stock" : "Available Qty"}
            value={`${currentTotalQty.toLocaleString()} ${displayUnit}`}
          />
          <KeyValueRow
            label="Valuation Rate"
            value={valuationRate != null ? valuationRate.toLocaleString() : "—"}
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
          className="rounded-lg py-1.5 px-2.5 mt-1.5 flex items-center justify-between"
          style={{ background: heroIsNegative ? "rgba(239,68,68,0.08)" : "rgba(28,63,110,0.06)" }}
        >
          <span className="text-[10px] font-semibold text-muted">
            {isCorrection ? "Projected Stock" : "Remaining Qty"}
          </span>
          <span
            className={["text-base font-black leading-none", heroIsNegative ? "text-danger" : ""].join(" ")}
            style={!heroIsNegative ? { color: "var(--primary,#1c3f6e)" } : undefined}
          >
            {heroValue.toLocaleString()}{" "}
            <span className="text-[10px] font-bold text-muted align-middle">{displayUnit}</span>
          </span>
        </div>
        {heroIsNegative && (
          <p className="text-[9px] text-danger leading-snug mt-1">
            {isCorrection ? "Correction would push stock below zero." : "Move quantity exceeds available stock."}
          </p>
        )}
      </SummaryCard>

      {/* ── Details card: batch/movement + transaction merged ── */}
      <SummaryCard className="p-2.5">
        <span className="block text-[9px] font-bold uppercase tracking-widest text-muted mb-0.5">
          {isCorrection ? "Selected Batch" : "Movement Details"}
        </span>
        <div className="divide-y divide-theme">
          {isCorrection ? (
            <KeyValueRow label="Warehouse" value={getGLNameWithoutAbbreviation(warehouseLabel) || "—"} />
          ) : (
            <>
              <KeyValueRow label="From" value={getGLNameWithoutAbbreviation(fromLabel) || "—"} />
              <KeyValueRow label="To" value={getGLNameWithoutAbbreviation(toLabel) || "—"} />
            </>
          )}
          <KeyValueRow label="Batch No." value={batchNo || "—"} />
          <KeyValueRow label="Expiry Date" value={formatDisplayDate(expiryDate)} />
          <KeyValueRow label="Mode" value={isCorrection ? "Correction" : "Movement"} badge />
          <KeyValueRow label="Posting Date" value={formatDisplayDate(postingDate)} />
          <KeyValueRow label="Item" value={selectedItem?.label || "—"} />
        </div>
      </SummaryCard>
    </aside>
  );
};