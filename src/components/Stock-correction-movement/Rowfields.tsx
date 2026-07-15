import React from "react";
import StockItemSelect from "../../components/selects/StockItemSelect";
import { ModalSelect, NumericInput,ToggleSwitch } from "../../components/ui/modal/modalComponent";
import type { CorrectionRow, Mode, MovementRow, Option, StockItemSelectPayload } from "../../hooks/stock correction-movement/Usestockcorrectionform";
import { RemoveRowButton, SectionLabel } from "../../components/Stock-correction-movement/Summaryui";

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
  itemSelectResetKey: number;
  itemPrefillName: string;
  onItemPicked: (payload: StockItemSelectPayload) => void;
  onItemClear: () => void;
}> = ({ itemSelectResetKey, itemPrefillName, onItemPicked, onItemClear }) => (
  <div>
    <SectionLabel>Item</SectionLabel>
    <div className="mt-2">
      <StockItemSelect
        key={itemSelectResetKey}
        itemName={itemPrefillName}
        invoiceType="Product"
        // Bypasses the "out of stock" disable-state — corrections often
        // need to select an item that currently has zero stock.
        isQuotation
        onChange={onItemPicked}
        onClear={onItemClear}
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

export const ItemMetaLine: React.FC<{
  visible: boolean;
  itemMeta: { sku: string; category: string; unit: string };
}> = ({ visible, itemMeta }) => {
  if (!visible) return null;
  return (
    <div className="flex items-center gap-4 text-[11px] text-muted">
      <span>
        <strong className="text-main font-semibold">SKU:</strong> {itemMeta.sku || "—"}
      </span>
      <span>
        <strong className="text-main font-semibold">Category:</strong> {itemMeta.category || "—"}
      </span>
      <span>
        <strong className="text-main font-semibold">Unit:</strong> {itemMeta.unit}
      </span>
    </div>
  );
};

// ─── Correction row fields ──────────────────────────────────────────────────

interface CorrectionRowFieldsProps {
  row: CorrectionRow;
  branchOptions: Option[];
  batchOptionsForRow: Option[];
  reasonOptions: Option[];
  onChange: (id: string, field: keyof Omit<CorrectionRow, "id" | "expiryDate" | "availableQty">, value: string) => void;
  onRemove: (id: string) => void;
  removeDisabled: boolean;
}

export const CorrectionRowFields: React.FC<CorrectionRowFieldsProps> = ({
  row,
  branchOptions,
  batchOptionsForRow,
  reasonOptions,
  onChange,
  onRemove,
  removeDisabled,
}) => (
  <>
    <div className="scm-cell scm-cell-border" style={{ padding: "2px 6px" }}>
      <ModalSelect label="" options={branchOptions} value={row.branch} onChange={(e) => onChange(row.id, "branch", e.target.value)} />
    </div>
    <div className="scm-cell scm-cell-border" style={{ padding: "2px 6px" }}>
      <ModalSelect
        label=""
        options={batchOptionsForRow}
        value={row.batchNo}
        onChange={(e) => onChange(row.id, "batchNo", e.target.value)}
        disabled={!row.branch}
      />
    </div>
    <div className="scm-cell scm-cell-border text-[12px] text-muted">{row.expiryDate || "—"}</div>
    <div className="scm-cell scm-cell-border text-[12px] font-semibold text-main">
      {row.availableQty === null ? "—" : row.availableQty.toLocaleString()}
    </div>
    <div className="scm-cell scm-cell-border">
      <NumericInput
        value={row.qty === "" ? null : Number(row.qty)}
        allowNegative
        decimalScale={0}
        placeholder="0"
        onChange={(v) => onChange(row.id, "qty", v === null ? "" : String(v))}
        className="h-[24px] text-[11px] border-0 shadow-none px-0 bg-transparent"
      />
    </div>
    <div className="scm-cell scm-cell-border" style={{ padding: "2px 6px" }}>
      <ModalSelect label="" options={reasonOptions} value={row.reasonCode} onChange={(e) => onChange(row.id, "reasonCode", e.target.value)} />
    </div>
    <div className="scm-cell" style={{ justifyContent: "center", padding: "0 4px" }}>
      <RemoveRowButton onClick={() => onRemove(row.id)} disabled={removeDisabled} />
    </div>
  </>
);

// ─── Movement row fields ─────────────────────────────────────────────────────

interface MovementRowFieldsProps {
  row: MovementRow;
  branchOptions: Option[];
  onChange: (id: string, field: keyof Omit<MovementRow, "id">, value: string) => void;
  onRemove: (id: string) => void;
  removeDisabled: boolean;
}

export const MovementRowFields: React.FC<MovementRowFieldsProps> = ({
  row,
  branchOptions,
  onChange,
  onRemove,
  removeDisabled,
}) => (
  <>
    <div className="scm-cell scm-cell-border" style={{ padding: "2px 6px" }}>
      <ModalSelect label="" options={branchOptions} value={row.from} onChange={(e) => onChange(row.id, "from", e.target.value)} />
    </div>
    <div className="scm-cell scm-cell-border" style={{ padding: "2px 6px" }}>
      <ModalSelect label="" options={branchOptions.filter((b) => b.value !== row.from)} value={row.to} onChange={(e) => onChange(row.id, "to", e.target.value)} />
    </div>
    <div className="scm-cell scm-cell-border">
      <NumericInput
        value={row.qty === "" ? null : Number(row.qty)}
        allowNegative={false}
        decimalScale={0}
        placeholder="0"
        onChange={(v) => onChange(row.id, "qty", v === null ? "" : String(v))}
        className="h-[24px] text-[11px] border-0 shadow-none px-0 bg-transparent"
      />
    </div>
    <div className="scm-cell" style={{ justifyContent: "center", padding: "0 4px" }}>
      <RemoveRowButton onClick={() => onRemove(row.id)} disabled={removeDisabled} />
    </div>
  </>
);