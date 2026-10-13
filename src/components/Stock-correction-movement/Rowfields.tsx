import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowRightLeft, Check, ChevronDown, Factory, Wrench } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { NumericInput, ToggleSwitch } from "../../components/ui/modal/modalComponent";
import type {
  CorrectionRow,
  ManufactureRow,
  Mode,
  MovementRow,
  Option,
  StockEntryType,
  StockItemSelectPayload,
} from "../../hooks/stock correction-movement/Usestockcorrectionform";
import { FieldLabel, RemoveRowButton, TextCell } from "../../components/Stock-correction-movement/Summaryui";
import StockItemSelect from "../../components/selects/StockItemSelect";
import ItemSelect from "../../components/selects/ItemSelect";
import type { SelectedStockItem } from "../../components/selects/ItemSelect";

import WarehouseSelect from "../selects/WarehouseSelect";
import { getGLNameWithoutAbbreviation } from "../../api/utils/glAccountUtils";

const NUM_INPUT = "h-[28px] text-[12px] w-full text-right tabular-nums";

const fmtQty = (n: number | null | undefined) => (n == null ? "—" : n.toLocaleString());

// ─── Item picker + transaction type ─────────────────────────────────────────

export const ItemPicker: React.FC<{
  mode: Mode;
  selectedItem: Option | null;
  onItemPicked: (payload: StockItemSelectPayload) => void;
  onItemClear: () => void;
}> = ({ mode, selectedItem, onItemPicked, onItemClear }) => (
  <div>
    <FieldLabel>Item</FieldLabel>
    <StockItemSelect
      itemName={selectedItem?.label}
      onChange={onItemPicked}
      onClear={onItemClear}
      invoiceType="Product"
      // correction ke liye 0-stock items bhi pick karne dena hai (loss/damage likhne ke liye),
      // movement ke liye sirf stock wale items — isQuotation=true disable check ko bypass kar deta hai
      isQuotation={mode === "correction"}
      // Sirf is Stock Correction/Movement modal ke liye — dropdown me item pick karte hi
      // "Select item" box me ItemName-BatchNo-Warehouse format me dikhta hai.
      // StockItemSelect ke andar formatDisplayName na diya jaye to default behavior
      // (sirf item name) hi chalta hai, isliye baaki jagah kuch nahi badalta.
      formatDisplayName={(row: any) =>
        [row.itemName, row.batchNo, row.warehouse].filter(Boolean).join("-")
      }
    />
  </div>
);

export const MODE_META: Record<Mode, { label: string; sub: string; headline: string; icon: LucideIcon }> = {
  correction: {
    label: "Correction",
    sub: "Fix stock levels in a warehouse",
    headline: "Adjust stock levels with batch-level traceability.",
    icon: Wrench,
  },
  movement: {
    label: "Movement",
    sub: "Transfer or issue stock",
    headline: "Move stock between warehouses or issue it out.",
    icon: ArrowRightLeft,
  },
  manufacture: {
    label: "Manufacture",
    sub: "Consume materials, produce goods",
    headline: "Turn raw materials into finished products.",
    icon: Factory,
  },
};

const MODES: Mode[] = ["correction", "movement", "manufacture"];

export const TransactionTypeSelect: React.FC<{ mode: Mode; onModeChange: (mode: Mode) => void }> = ({
  mode,
  onModeChange,
}) => {
  const [rect, setRect] = useState<DOMRect | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const Current = MODE_META[mode].icon;

  useEffect(() => {
    if (!rect) return;
    const close = (e: MouseEvent) => {
      const t = e.target as Node;
      if (btnRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setRect(null);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setRect(null);
    const onResize = () => setRect(null);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [rect]);

  return (
    <div className="w-[170px]">
      <FieldLabel>Transaction Type</FieldLabel>
      <button
        ref={btnRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={!!rect}
        onClick={() => setRect(rect ? null : btnRef.current!.getBoundingClientRect())}
        className={[
          "w-full h-[28px] flex items-center gap-2 px-2 border rounded bg-card text-[12px] font-semibold text-main transition-colors",
          rect ? "border-primary ring-2 ring-primary/20" : "border-theme hover:border-primary",
        ].join(" ")}
      >
        <Current className="w-3.5 h-3.5 text-primary" />
        <span className="flex-1 text-left truncate">{MODE_META[mode].label}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-muted transition-transform ${rect ? "rotate-180" : ""}`} />
      </button>

      {rect &&
        createPortal(
          <div
            ref={menuRef}
            role="listbox"
            className="fixed p-1 rounded-[10px] border border-theme bg-card shadow-xl"
            style={{ top: rect.bottom + 4, left: rect.left, minWidth: Math.max(rect.width, 240), zIndex: 9999 }}
          >
            {MODES.map((m) => {
              const meta = MODE_META[m];
              const Icon = meta.icon;
              const active = m === mode;
              return (
                <button
                  key={m}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    setRect(null);
                    onModeChange(m);
                  }}
                  className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-left hover:bg-app transition-colors"
                >
                  <span className="grid place-items-center w-7 h-7 rounded-md bg-primary/10 text-primary">
                    <Icon className="w-[15px] h-[15px]" />
                  </span>
                  <span className="flex-1 min-w-0">
                    <b className="block text-[12px] font-semibold text-main">{meta.label}</b>
                    <i className="block not-italic text-[11px] text-muted">{meta.sub}</i>
                  </span>
                  <Check className={`w-[15px] h-[15px] text-primary ${active ? "opacity-100" : "opacity-0"}`} />
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </div>
  );
};

export const StockEntryTypeToggle: React.FC<{
  stockEntryType: StockEntryType;
  onChange: (type: StockEntryType) => void;
}> = ({ stockEntryType, onChange }) => (
  <ToggleSwitch
    name="stockEntryType"
    label="Entry Type"
    checked={stockEntryType === "Material Issue"}
    offLabel="Transfer"
    onLabel="Issue"
    onChange={(e) => onChange(e.target.checked ? "Material Issue" : "Material Transfer")}
  />
);

// ─── Correction row ─────────────────────────────────────────────────────────

interface CorrectionRowFieldsProps {
  row: CorrectionRow;
  isOpeningStock: boolean;
  onChange: (id: string, field: "branch" | "batchNo" | "correctQty" | "valuationRate", value: string) => void;
}

export const CorrectionRowFields: React.FC<CorrectionRowFieldsProps> = ({ row, isOpeningStock, onChange }) => {
  const finalQty = row.finalQty === "" ? null : Number(row.finalQty);
  const touched = row.correctQty !== "" && row.correctQty !== "-";

  return (
    <>
      <TextCell>{getGLNameWithoutAbbreviation(row.branch) || "—"}</TextCell>
      <TextCell>{row.batchNo || "—"}</TextCell>
      <TextCell muted>{row.expiryDate || "—"}</TextCell>
      <TextCell align="right" muted>{fmtQty(row.availableQty)}</TextCell>
      {isOpeningStock ? (
        <NumericInput
          value={row.valuationRate}
          allowNegative={false}
          decimalScale={2}
          placeholder="0.00"
          onChange={(v) => onChange(row.id, "valuationRate", v === null ? "" : String(v))}
          className={NUM_INPUT}
        />
      ) : (
        <TextCell align="right" muted>{fmtQty(row.valuationRate)}</TextCell>
      )}
      <NumericInput
        value={touched ? Number(row.correctQty) : null}
        allowNegative
        decimalScale={0}
        placeholder="+ / −"
        onChange={(v) => onChange(row.id, "correctQty", v === null ? "" : String(v))}
        className={NUM_INPUT}
      />
      <TextCell
        align="right"
        className={touched && finalQty != null ? (finalQty < 0 ? "text-danger font-bold" : "text-success font-bold") : ""}
      >
        {touched ? fmtQty(finalQty) : "—"}
      </TextCell>
    </>
  );
};

// ─── Movement row ───────────────────────────────────────────────────────────

interface MovementRowFieldsProps {
  row: MovementRow;
  stockEntryType: StockEntryType;
  batchNo?: string;
  availableQty?: number | null;
  onChange: (id: string, field: keyof Omit<MovementRow, "id">, value: string) => void;
  onRemove: (id: string) => void;
  removeDisabled: boolean;
}

export const MovementRowFields: React.FC<MovementRowFieldsProps> = ({
  row,
  stockEntryType,
  batchNo,
  availableQty,
  onChange,
  onRemove,
  removeDisabled,
}) => {
  const isIssue = stockEntryType === "Material Issue";
  const exceeds = availableQty != null && Number(row.qty) > availableQty;

  return (
    <>
      <WarehouseSelect value={row.from} compact onChange={(e) => onChange(row.id, "from", e.target.value)} />
      <TextCell>{batchNo || "—"}</TextCell>
      {isIssue ? (
        <TextCell muted>Issued out of stock</TextCell>
      ) : (
        <WarehouseSelect value={row.to} compact onChange={(e) => onChange(row.id, "to", e.target.value)} />
      )}
      <NumericInput
        value={row.qty === "" ? null : Number(row.qty)}
        allowNegative={false}
        decimalScale={0}
        placeholder="0"
        onChange={(v) => onChange(row.id, "qty", v === null ? "" : String(v))}
        className={NUM_INPUT}
      />
      <TextCell align="right" muted={!exceeds} className={exceeds ? "text-danger font-bold" : ""}>
        {fmtQty(availableQty)}
      </TextCell>
      <RemoveRowButton onClick={() => onRemove(row.id)} disabled={removeDisabled} />
    </>
  );
};

// ─── Manufacture rows ───────────────────────────────────────────────────────

interface ConsumeRowFieldsProps {
  row: ManufactureRow;
  onItemPicked: (id: string, payload: StockItemSelectPayload) => void;
  onItemClear: (id: string) => void;
  onQtyChange: (id: string, value: string) => void;
  onRemove: (id: string) => void;
  removeDisabled: boolean;
}

export const ConsumeRowFields: React.FC<ConsumeRowFieldsProps> = ({
  row,
  onItemPicked,
  onItemClear,
  onQtyChange,
  onRemove,
  removeDisabled,
}) => {
  const exceeds = row.itemCode !== "" && Number(row.qty) > Number(row.availableQty ?? 0);

  return (
    <>
      <StockItemSelect
        itemName={row.itemName}
        onChange={(p: StockItemSelectPayload) => onItemPicked(row.id, p)}
        onClear={() => onItemClear(row.id)}
        invoiceType="Product"
        formatDisplayName={(r: any) => [r.itemName, r.batchNo, r.warehouse].filter(Boolean).join("-")}
      />
      <TextCell>{getGLNameWithoutAbbreviation(row.warehouse) || "—"}</TextCell>
      <TextCell>{row.batchNo && row.batchNo !== "-" ? row.batchNo : "—"}</TextCell>
      <TextCell align="right" muted={!exceeds} className={exceeds ? "text-danger font-bold" : ""}>
        {fmtQty(row.availableQty)}
      </TextCell>
      <NumericInput
        value={row.qty === "" ? null : Number(row.qty)}
        allowNegative={false}
        decimalScale={2}
        placeholder="0"
        onChange={(v) => onQtyChange(row.id, v === null ? "" : String(v))}
        className={NUM_INPUT}
      />
      <RemoveRowButton onClick={() => onRemove(row.id)} disabled={removeDisabled} />
    </>
  );
};

interface ProduceRowFieldsProps {
  row: ManufactureRow;
  onItemPicked: (item: SelectedStockItem) => void;
  onChange: (field: "warehouse" | "qty", value: string) => void;
}

export const ProduceRowFields: React.FC<ProduceRowFieldsProps> = ({ row, onItemPicked, onChange }) => (
  <>
    <ItemSelect value={row.itemCode} onChange={onItemPicked} />
    <WarehouseSelect value={row.warehouse} compact onChange={(e) => onChange("warehouse", e.target.value)} />
    <NumericInput
      value={row.qty === "" ? null : Number(row.qty)}
      allowNegative={false}
      decimalScale={2}
      placeholder="0"
      onChange={(v) => onChange("qty", v === null ? "" : String(v))}
      className={NUM_INPUT}
    />
  </>
);
