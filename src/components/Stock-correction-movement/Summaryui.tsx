import { Plus, Trash2 } from "lucide-react";
import { getGLNameWithoutAbbreviation } from "../../api/utils/glAccountUtils";
import type { ManufactureRow, Mode, Option } from "../../hooks/stock correction-movement/Usestockcorrectionform";

// ─── Tiny atoms ─────────────────────────────────────────────────────────────

export const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="block text-[13px] font-bold text-main">{children}</span>
);

export const FieldLabel: React.FC<{ children: React.ReactNode; required?: boolean }> = ({
  children,
  required,
}) => (
  <span className="block text-[10px] font-medium text-main mb-1">
    {children}
    {required && <span className="text-danger">*</span>}
  </span>
);

export const GhostButton: React.FC<{ onClick: () => void; children: React.ReactNode }> = ({
  onClick,
  children,
}) => (
  <button
    type="button"
    onClick={onClick}
    className="inline-flex items-center gap-1 h-[26px] px-2.5 rounded-md bg-primary/10 text-primary text-[12px] font-bold hover:bg-primary/15 transition-colors"
  >
    <Plus className="w-3.5 h-3.5" />
    {children}
  </button>
);

export const SectionHeader: React.FC<{ title: string; action?: React.ReactNode }> = ({ title, action }) => (
  <div className="flex items-center justify-between mb-1.5">
    <SectionLabel>{title}</SectionLabel>
    {action}
  </div>
);

export const SummaryCard: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => <div className={["rounded-[10px] border border-theme bg-card px-3 py-2.5", className].join(" ")}>{children}</div>;

const CardTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h3 className="m-0 mb-1 text-[12px] font-bold text-muted">{children}</h3>
);

export const KeyValueRow: React.FC<{
  label: string;
  value: React.ReactNode;
  badge?: boolean;
  valueClassName?: string;
}> = ({ label, value, badge = false, valueClassName = "" }) => (
  <div className="flex items-center justify-between gap-2.5 py-1.5 text-[12px] border-t border-theme first:border-t-0">
    <span className="text-muted truncate">{label}</span>
    {badge ? (
      <span className="px-2 py-px rounded-md text-[11px] font-bold bg-primary/10 text-primary">{value}</span>
    ) : (
      <span className={["font-semibold text-main text-right tabular-nums truncate", valueClassName].join(" ")}>
        {value}
      </span>
    )}
  </div>
);

const HighlightBox: React.FC<{ label: string; value: string; unit: string; negative?: boolean }> = ({
  label,
  value,
  unit,
  negative = false,
}) => (
  <div
    className={[
      "flex items-baseline justify-between mt-1.5 px-2.5 py-2 rounded-lg",
      negative ? "bg-danger/10" : "bg-primary/10",
    ].join(" ")}
  >
    <span className="text-[12px] text-muted">{label}</span>
    <span className={["text-[18px] font-bold tabular-nums", negative ? "text-danger" : "text-primary"].join(" ")}>
      {value}
      <small className="ml-1 text-[11px] font-semibold">{unit}</small>
    </span>
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
    aria-label="Remove row"
    className="grid place-items-center w-7 h-7 rounded-md text-muted transition-colors enabled:hover:bg-danger/10 enabled:hover:text-danger disabled:opacity-35 disabled:cursor-not-allowed"
  >
    <Trash2 className="w-[15px] h-[15px]" />
  </button>
);

// ─── Table ──────────────────────────────────────────────────────────────────

export interface ScmColumn {
  label: string;
  align?: "left" | "right";
}

export function ScmTable<T extends { id: string }>({
  columns,
  gridTemplate,
  rows,
  renderRow,
  empty,
}: {
  columns: ScmColumn[];
  gridTemplate: string;
  rows: T[];
  renderRow: (row: T) => React.ReactNode;
  empty?: React.ReactNode;
}) {
  return (
    <div className="border border-theme rounded-[10px] overflow-x-auto mb-3.5">
      {empty ? (
        <div className="px-4 py-6 text-center text-[12px] text-muted">{empty}</div>
      ) : (
        <div className="min-w-[640px]">
          <div
            className="grid gap-2 items-center px-2.5 py-[7px] bg-app border-b border-theme text-[12px] font-bold text-muted"
            style={{ gridTemplateColumns: gridTemplate }}
          >
            {columns.map((c, i) => (
              <span key={i} className={c.align === "right" ? "text-right" : undefined}>
                {c.label}
              </span>
            ))}
          </div>
          {rows.map((row) => (
            <div
              key={row.id}
              className="grid gap-2 items-center px-2.5 py-1.5 border-t border-theme first-of-type:border-t-0"
              style={{ gridTemplateColumns: gridTemplate }}
            >
              {renderRow(row)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export const TextCell: React.FC<{
  children: React.ReactNode;
  align?: "left" | "right";
  muted?: boolean;
  className?: string;
}> = ({ children, align = "left", muted = false, className = "" }) => (
  <span
    className={[
      "text-[12px] tabular-nums whitespace-nowrap overflow-hidden text-ellipsis",
      align === "right" ? "text-right" : "",
      muted ? "text-muted" : "text-main",
      className,
    ].join(" ")}
  >
    {children}
  </span>
);

// ─── Right-side summary rail ───────────────────────────────────────────────

const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const formatDisplayDate = (input?: string): string => {
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
  isIssue?: boolean;
  fromLabel?: string;
  toLabel?: string;
  warehouseLabel?: string;
  batchNo?: string;
  expiryDate?: string;
  batchAvailableQty?: number;
  valuationRate?: number;
  consumeRows?: ManufactureRow[];
  produceRow?: ManufactureRow;
  totalConsumedQty?: number;
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
  isIssue = false,
  fromLabel,
  toLabel,
  warehouseLabel,
  batchNo,
  expiryDate,

  valuationRate,
  consumeRows = [],
  produceRow,
  totalConsumedQty = 0,
}) => {
  const displayUnit = unit || "PCS";
  const isCorrection = mode === "correction";

  if (mode === "manufacture") {
    const pickedRows = consumeRows.filter((r) => r.itemCode);
    const produceQty = Number(produceRow?.qty) || 0;
    const produceUnit = produceRow?.unit || "PCS";

    return (
      <aside className="flex flex-col gap-2.5 h-full min-h-0 overflow-y-auto">
        <SummaryCard>
          <CardTitle>Manufacture impact</CardTitle>
          <KeyValueRow label="Raw materials" value={pickedRows.length} />
          <KeyValueRow label="Total consumed" value={totalConsumedQty.toLocaleString()} />
          <HighlightBox label="Produced qty" value={produceQty.toLocaleString()} unit={produceUnit} />
        </SummaryCard>

        <SummaryCard>
          <CardTitle>Manufacture details</CardTitle>
          {pickedRows.map((r) => (
            <KeyValueRow
              key={r.id}
              label={r.itemName}
              value={`-${Number(r.qty) || 0} ${r.unit || ""}`.trim()}
              valueClassName="text-danger"
            />
          ))}
          <KeyValueRow label="Finished product" value={produceRow?.itemName || "—"} />
          <KeyValueRow label="Target" value={getGLNameWithoutAbbreviation(produceRow?.warehouse) || "—"} />
          <KeyValueRow label="Mode" value="Manufacture" badge />
          <KeyValueRow label="Posting date" value={formatDisplayDate(postingDate)} />
        </SummaryCard>
      </aside>
    );
  }

  return (
    <aside className="flex flex-col gap-2.5 h-full min-h-0 overflow-y-auto">
      <SummaryCard>
        <CardTitle>{isCorrection ? "Inventory impact" : "Movement impact"}</CardTitle>
        <KeyValueRow
          label={isCorrection ? "Current stock" : "Available qty"}
          value={`${currentTotalQty.toLocaleString()} ${displayUnit}`}
        />
        <KeyValueRow
          label="Valuation rate"
          value={valuationRate != null ? valuationRate.toLocaleString() : "—"}
        />
        <KeyValueRow
          label={isCorrection ? "Correction qty" : isIssue ? "Issue qty" : "Transfer qty"}
          value={
            isCorrection
              ? `${netCorrectionQty > 0 ? "+" : ""}${netCorrectionQty} ${displayUnit}`
              : `${totalMovedQty} ${displayUnit}`
          }
          valueClassName={isCorrection && netCorrectionQty < 0 ? "text-danger" : ""}
        />
        <HighlightBox
          label={isCorrection ? "Projected stock" : "Remaining qty"}
          value={heroValue.toLocaleString()}
          unit={displayUnit}
          negative={heroIsNegative}
        />
        {heroIsNegative && (
          <p className="text-[11px] text-danger leading-snug mt-1.5 mb-0">
            {isCorrection ? "Correction would push stock below zero." : "Move quantity exceeds available stock."}
          </p>
        )}
      </SummaryCard>

      <SummaryCard>
        <CardTitle>{isCorrection ? "Selected batch" : "Movement details"}</CardTitle>
        {isCorrection ? (
          <KeyValueRow label="Warehouse" value={getGLNameWithoutAbbreviation(warehouseLabel) || "—"} />
        ) : (
          <>
            <KeyValueRow label="From" value={getGLNameWithoutAbbreviation(fromLabel) || "—"} />
            <KeyValueRow
              label="To"
              value={isIssue ? "Issued out" : getGLNameWithoutAbbreviation(toLabel) || "—"}
            />
          </>
        )}
        <KeyValueRow label="Batch no." value={batchNo || "—"} />
        <KeyValueRow label="Expiry date" value={formatDisplayDate(expiryDate)} />
        <KeyValueRow label="Mode" value={isCorrection ? "Correction" : "Movement"} badge />
        <KeyValueRow label="Posting date" value={formatDisplayDate(postingDate)} />
        <KeyValueRow label="Item" value={selectedItem?.label || "—"} />
      </SummaryCard>
    </aside>
  );
};
