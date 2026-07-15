import React from "react";
// import StockItemNameCodeSelect from "../../components/selects/StockCorrectionItemSelect";
import { ModalInput, ModalSelect, NumericInput, ToggleSwitch } from "../../components/ui/modal/modalComponent";
import type { CorrectionRow, Mode, MovementRow, Option, StockItemSelectPayload } from "../../hooks/stock correction-movement/Usestockcorrectionform";
import { RemoveRowButton, SectionLabel } from "../../components/Stock-correction-movement/Summaryui";
import StockItemSelect from "../../components/selects/StockItemSelect";
import type { SingleBatchItemPickedPayload } from "../../hooks/stock correction-movement/Usestockcorrectionform";
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
  onItemPicked: (payload: SingleBatchItemPickedPayload) => void;
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

// ─── Correction row fields ──────────────────────────────────────────────────
// NOTE:
// - Per-row "Reason" column removed — the modal already has a single
//   "Reason / Remarks" textarea covering the whole transaction, so a per-row
//   reason dropdown was redundant.
// - Batch No. is now READ-ONLY (a disabled ModalInput), not a select. The
//   batch is expected to be auto-resolved from the selected Warehouse
//   upstream (in your form hook), not picked by the user in this cell.
//   `batchOptionsForRow` is no longer used by this component — you can drop
//   that prop from the <CorrectionRowFields /> call in
//   StockCorrectionModal.tsx. It's kept (unused) in the props interface here
//   only so you don't get a type error at the call site if you haven't
//   removed it there yet — feel free to delete it once you do.

interface CorrectionRowFieldsProps {
  row: CorrectionRow;
  branchOptions: Option[];
  batchOptionsForRow?: Option[];
  onChange: (id: string, field: keyof Omit<CorrectionRow, "id" | "expiryDate" | "availableQty">, value: string) => void;
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
    <div className="scm-cell scm-cell-border" style={{ padding: "6px 10px" }}>
      <NumericInput
        value={row.qty === "" ? null : Number(row.qty)}
        allowNegative
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