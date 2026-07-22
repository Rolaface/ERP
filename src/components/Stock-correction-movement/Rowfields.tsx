import React from "react";
// import StockItemNameCodeSelect from "../../components/selects/StockCorrectionItemSelect";
import { ModalInput, ModalSelect, NumericInput, ToggleSwitch } from "../../components/ui/modal/modalComponent";
import type { CorrectionRow, Mode, MovementRow, Option, StockItemSelectPayload } from "../../hooks/stock correction-movement/Usestockcorrectionform";
import { RemoveRowButton, SectionLabel } from "../../components/Stock-correction-movement/Summaryui";
import StockItemSelect from "../../components/selects/StockItemSelect";

import WarehouseSelect from "../selects/WarehouseSelect";

// ─── Item picker + Correction/Movement toggle ──────────────────────────────

const ModeButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({
  active,
  onClick,
  children,
}) => (
  <button
    type="button"
    onClick={onClick}
    className={[
      "h-9 rounded-md text-[11px] font-bold uppercase tracking-wide transition-all border leading-none",
      active ? "text-white shadow-sm border-transparent" : "text-muted hover:text-main border-theme bg-row-hover/40",
    ].join(" ")}
    style={active ? { background: "var(--primary,#1c3f6e)" } : undefined}
  >
    {children}
  </button>
);

interface ItemAndModeHeaderProps {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
  itemSelectResetKey: number;
  itemPrefillName: string;
  onItemPicked: (payload: StockItemSelectPayload) => void;
  onItemClear: () => void;
}

export const ItemPicker: React.FC<{
  mode: Mode;
  selectedItem: Option | null;
  onItemPicked: (payload: StockItemSelectPayload) => void;
  onItemClear: () => void;
}> = ({ mode, selectedItem, onItemPicked, onItemClear }) => (
  <div>
    <SectionLabel>Item</SectionLabel>
    <div className="mt-2">
      <StockItemSelect
        itemName={selectedItem?.label}
        onChange={onItemPicked}
        onClear={onItemClear}
        invoiceType="Product"
        // correction ke liye 0-stock items bhi pick karne dena hai (loss/damage likhne ke liye),
        // movement ke liye sirf stock wale items — isQuotation=true disable check ko bypass kar deta hai
        isQuotation={mode === "correction"}
      />
    </div>
  </div>
);

export const TransactionTypeToggle: React.FC<{ mode: Mode; onModeChange: (mode: Mode) => void }> = ({
  mode,
  onModeChange,
}) => (
  <ToggleSwitch
    name="transactionType"
    label="Transaction Type"
    checked={mode === "movement"}
    offLabel="Correction"
    onLabel="Movement"
    onChange={(e) => onModeChange(e.target.checked ? "movement" : "correction")}
  />
);


interface CorrectionRowFieldsProps {
  row: CorrectionRow;
  branchOptions: Option[];
  batchOptionsForRow?: Option[];
  onChange: (id: string, field: "branch" | "batchNo" | "correctQty", value: string) => void;
  onRemove: (id: string) => void;
  removeDisabled: boolean;
}

export const CorrectionRowFields: React.FC<CorrectionRowFieldsProps> = ({
  row,
  branchOptions,
  onChange,
  onRemove,
  removeDisabled,
}) => (
  <>
    <div className="scm-cell scm-cell-border" style={{ padding: "6px 10px" }}>
      
  <WarehouseSelect
  value={row.branch}
  compact
  onChange={(e) => onChange(row.id, "branch", e.target.value)}
   readOnlyField
  disabled
/>
    </div>
    <div className="scm-cell scm-cell-border" style={{ padding: "6px 10px" }}>
      <ModalInput
        label=""
        type="text"
        value={row.batchNo || ""}
        placeholder="—"
        disabled
        readOnly
      />
    </div>
    <div className="scm-cell scm-cell-border text-[12px] text-muted" style={{ padding: "6px 10px" }}>
      {row.expiryDate || "—"}
    </div>
    <div className="scm-cell scm-cell-border text-[12px] font-semibold text-main" style={{ padding: "6px 10px" }}>
      {row.availableQty === null ? "—" : row.availableQty.toLocaleString()}
    </div>

    {/* Correct Qty — signed delta, e.g. -30 to decrease, 20 to increase */}
    <div className="scm-cell scm-cell-border" style={{ padding: "6px 10px" }}>
      <NumericInput
        value={row.correctQty === "" || row.correctQty === "-" ? null : Number(row.correctQty)}
        allowNegative
        decimalScale={0}
        placeholder="0"
        onChange={(v) => onChange(row.id, "correctQty", v === null ? "" : String(v))}
        className="h-[28px] text-[11px] w-full"
      />
    </div>

    {/* Final Qty — read-only, auto-calculated from Available Stock + Correct Qty */}
    <div className="scm-cell scm-cell-border text-[12px] font-semibold text-main" style={{ padding: "6px 10px" }}>
      {row.finalQty === "" ? "—" : Number(row.finalQty).toLocaleString()}
    </div>

    <div className="scm-cell" style={{ justifyContent: "center", padding: "6px 10px" }}>
      <RemoveRowButton onClick={() => onRemove(row.id)} disabled={removeDisabled} />
    </div>
  </>
);

// ─── Movement row fields ─────────────────────────────────────────────────────

interface MovementRowFieldsProps {
  row: MovementRow;
  onChange: (
    id: string,
    field: keyof Omit<MovementRow, "id">,
    value: string
  ) => void;
  onRemove: (id: string) => void;
  removeDisabled: boolean;
}
export const MovementRowFields: React.FC<MovementRowFieldsProps> = ({
  row,
  onChange,
  onRemove,
  removeDisabled,
}) => (
  <>
    <div className="scm-cell scm-cell-border" style={{ padding: "6px 10px" }}>
     <WarehouseSelect
  value={row.from}
  compact
  onChange={(e) => onChange(row.id, "from", e.target.value)}
/>
    </div>
    <div className="scm-cell scm-cell-border" style={{ padding: "6px 10px" }}>
    <WarehouseSelect
  value={row.to}
  compact
  onChange={(e) => onChange(row.id, "to", e.target.value)}
/>
    </div>
    <div className="scm-cell scm-cell-border" style={{ padding: "6px 10px" }}>
      <NumericInput
        value={row.qty === "" ? null : Number(row.qty)}
        allowNegative={false}
        decimalScale={0}
        placeholder="0"
        onChange={(v) => onChange(row.id, "qty", v === null ? "" : String(v))}
        className="h-[28px] text-[11px] w-full"
      />
    </div>
    <div className="scm-cell" style={{ justifyContent: "center", padding: "6px 10px" }}>
      <RemoveRowButton onClick={() => onRemove(row.id)} disabled={removeDisabled} />
    </div>
  </>
);