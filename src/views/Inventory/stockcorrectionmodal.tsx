import React, { useMemo, useRef, useState, useEffect } from "react";
import { Wrench, ArrowRightLeft, Info, Trash2 } from "lucide-react";

import { MinimizableModal } from "../../components/common/MinimizableModal";
import PaginatedRowsTable from "../../components/common/Paginatedrowstable";
import {
  ModalInput,
  ModalSelect,
  NumericInput,
} from "../../components/ui/modal/modalComponent";
import StockItemSelect from "../../components/selects/StockItemSelect";
import {
  showApiError,
  showSuccess,
  showLoading,
  closeSwal,
} from "../../utils/alert";
// ────────────────────────────────────────────────────────────────────────────

// ─── Table styles (same pattern as SalaryStructureModal's ss- table) ───────
const SCM_STYLES = `
.scm-table-wrap {
  overflow-y: auto;
  overflow-x: hidden;
}
.scm-table-wrap::-webkit-scrollbar { width: 3px; }
.scm-table-wrap::-webkit-scrollbar-track { background: transparent; }
.scm-table-wrap::-webkit-scrollbar-thumb { background: var(--border, #e5e7eb); border-radius: 4px; }

.scm-row {
  display: grid;
  align-items: center;
  gap: 0;
  border-bottom: 1px solid var(--border-subtle, rgba(0,0,0,0.05));
  min-height: 36px;
  transition: background 0.1s;
}
.scm-row:hover { background: var(--bg-hover, rgba(0,0,0,0.015)); }

.scm-cell {
  padding: 0 8px;
  display: flex;
  align-items: center;
  height: 100%;
  min-height: 36px;
  min-width: 0;
}
.scm-cell-border { border-right: 1px solid var(--border-subtle, rgba(0,0,0,0.06)); }

.scm-col-header {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--text-sub, #9ca3af);
  white-space: nowrap;
}
`;

// ─── Types ──────────────────────────────────────────────────────────────────

type Mode = "correction" | "movement";

interface Option {
  label: string;
  value: string;
}

interface StockSummaryRow {
  branch: string;
  quantity: number;
  unit: string;
  mrp: number;
  batchSerial: string;
}

interface CorrectionRow {
  id: string;
  branch: string;
  qty: string; // string so user can type "-15" / "10" naturally
  batchNo: string;
  expiryDate: string;
}

interface MovementRow {
  id: string;
  from: string;
  to: string;
  qty: string;
}

/** Shape StockItemSelect's onChange fires — matches its internal handleSelect() payload. */
interface StockItemSelectPayload {
  itemCode: string;
  itemName: string;
  description?: string;
  batchNo?: string;
  expiryDate?: string;
  mfgDate?: string;
  qty?: number;
  price_list?: number;
  price?: number;
  packingSize?: string;
  packingUnit?: string;
  piecesPerBox?: string | number;
  valuation_rate?: number;
  sellingPrice?: number;
  purchasePrice?: number;
  warehouse?: string;
  vatRate?: number;
  vatCode?: string;
  taxInfo?: any[];
  isServiceItem?: number;
  sku?: string;
  category?: string;
}

export interface StockCorrectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called with the built payload on Save. Wire this to your real API. */
  onSubmit?: (payload: StockCorrectionSubmitPayload) => void | Promise<void>;
  /** Pass a batch here (e.g. from a row's "Correct Stock" action) to prefill the item + a single correction row. */
  selectedBatch?: {
    item_code?: string;
    item_name?: string;
    batch_no?: string;
    expiry_date?: string;
    bal_qty?: number;
  } | null;
  /** Optional: supply real branch list; falls back to a placeholder list. */
  branchOptions?: Option[];
}

export interface StockCorrectionSubmitPayload {
  mode: Mode;
  item: Option | null;
  date: string;
  reason: string;
  correctionRows?: Array<{
    branch: string;
    qty: number;
    batchNo: string;
    expiryDate: string;
  }>;
  movementRows?: Array<{ from: string; to: string; qty: number }>;
}

// ─── Placeholder data / helpers ────────────────────────────────────────────

const FALLBACK_BRANCHES: Option[] = [
  { label: "Main Warehouse (WM-082)", value: "wm-082" },
  { label: "Regional Hub A", value: "regional-hub-a" },
];

const todayISO = () => new Date().toISOString().slice(0, 10);

const genId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `row-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const emptyCorrectionRow = (): CorrectionRow => ({
  id: genId(),
  branch: "",
  qty: "",
  batchNo: "",
  expiryDate: "",
});

const emptyMovementRow = (): MovementRow => ({
  id: genId(),
  from: "",
  to: "",
  qty: "",
});

// Column templates for the two table modes (kept in one place so header + rows always agree)
const CORRECTION_COLS = "1.4fr 1fr 1fr 1fr 36px";
const MOVEMENT_COLS = "1fr 1fr 1fr 36px";

// Rows per page — matches the "Showing X to Y of Z items" pagination pattern.
const ROWS_PAGE_SIZE = 5;

/** Matches a warehouse label coming back from StockItemSelect to one of our branch option values. */
const matchBranchValue = (warehouse: string | undefined, branches: Option[]) => {
  if (!warehouse) return "";
  const hit = branches.find(
    (b) => b.label.toLowerCase() === warehouse.toLowerCase(),
  );
  return hit?.value ?? "";
};

/** Small reusable remove-row button — same look everywhere a row can be deleted. */
const RemoveRowButton: React.FC<{ onClick: () => void; disabled?: boolean }> = ({
  onClick,
  disabled = false,
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: 20,
      height: 20,
      borderRadius: 4,
      border: "none",
      background: "transparent",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.3 : 1,
      color: "var(--text-sub)",
      padding: 0,
    }}
    onMouseEnter={(e) => {
      if (disabled) return;
      (e.currentTarget as HTMLButtonElement).style.color = "#ef4444";
      (e.currentTarget as HTMLButtonElement).style.background = "#fef2f2";
    }}
    onMouseLeave={(e) => {
      (e.currentTarget as HTMLButtonElement).style.color = "var(--text-sub)";
      (e.currentTarget as HTMLButtonElement).style.background = "transparent";
    }}
  >
    <Trash2 style={{ width: 11, height: 11 }} />
  </button>
);

// ─── Small presentational bits ─────────────────────────────────────────────

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="block text-[10px] font-bold uppercase tracking-widest text-muted">
    {children}
  </span>
);

/** Right-rail summary card — matches the reference screenshot's boxed-card look. */
const SummaryCard: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => (
  <div className={["rounded-xl border border-theme bg-card p-4", className].join(" ")}>
    {children}
  </div>
);

const KeyValueRow: React.FC<{ label: string; value: React.ReactNode; badge?: boolean }> = ({
  label,
  value,
  badge = false,
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
      <span className="font-semibold text-main text-right">{value}</span>
    )}
  </div>
);

// ─── Component ──────────────────────────────────────────────────────────────

const StockCorrectionModal: React.FC<StockCorrectionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  selectedBatch,
  branchOptions = FALLBACK_BRANCHES,
}) => {
  const modalIdRef = useRef(`stock-correction-movement-${genId()}`);

  const [mode, setMode] = useState<Mode>("correction");

  const [selectedItem, setSelectedItem] = useState<Option | null>(null);
  const [itemMeta, setItemMeta] = useState<{ sku: string; category: string; unit: string }>({
    sku: "",
    category: "",
    unit: "PCS",
  });
  const [itemPrefillName, setItemPrefillName] = useState<string>("");
  // Bumping this forces StockItemSelect to remount, clearing its internal selection.
  const [itemSelectResetKey, setItemSelectResetKey] = useState(0);

  const [stockSummary, setStockSummary] = useState<StockSummaryRow[]>([]);

  const [correctionRows, setCorrectionRows] = useState<CorrectionRow[]>([
    emptyCorrectionRow(),
  ]);
  const [movementRows, setMovementRows] = useState<MovementRow[]>([
    emptyMovementRow(),
  ]);

  const [correctionDate, setCorrectionDate] = useState(todayISO());
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  // Inject the table styles once (same approach SalaryStructureModal uses).
  useEffect(() => {
    const id = "scm-table-styles";
    if (!document.getElementById(id)) {
      const s = document.createElement("style");
      s.id = id;
      s.textContent = SCM_STYLES;
      document.head.appendChild(s);
    }
  }, []);

  // ── Prefill from selectedBatch (e.g. opened from a batch row's "Correct" action)
  useEffect(() => {
    if (!isOpen) return;
    if (selectedBatch) {
      const item: Option = {
        label: selectedBatch.item_name || selectedBatch.item_code || "",
        value: selectedBatch.item_code || "",
      };
      setSelectedItem(item);
      setItemPrefillName(item.label);
      setMode("correction");
      setStockSummary([
        {
          branch: branchOptions[0]?.label || "—",
          quantity: Number(selectedBatch.bal_qty ?? 0),
          unit: "PCS",
          mrp: 0,
          batchSerial: selectedBatch.batch_no || "-",
        },
      ]);
      setCorrectionRows([
        {
          id: genId(),
          branch: branchOptions[0]?.value ?? "",
          qty: "",
          batchNo: selectedBatch.batch_no || "",
          expiryDate: selectedBatch.expiry_date
            ? selectedBatch.expiry_date.slice(0, 10)
            : "",
        },
      ]);
    } else {
      resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, selectedBatch]);

  const resetForm = () => {
    setMode("correction");
    setSelectedItem(null);
    setItemMeta({ sku: "", category: "", unit: "PCS" });
    setItemPrefillName("");
    setStockSummary([]);
    setCorrectionRows([emptyCorrectionRow()]);
    setMovementRows([emptyMovementRow()]);
    setCorrectionDate(todayISO());
    setReason("");
    setItemSelectResetKey((k) => k + 1);
  };

  // ── Item picked via StockItemSelect ─────────────────────────────────────
  const handleItemPicked = (payload: StockItemSelectPayload) => {
    const item: Option = { label: payload.itemName, value: payload.itemCode };
    setSelectedItem(item);
    setItemPrefillName(payload.itemName);
    setItemMeta({
      sku: payload.sku || payload.itemCode || "",
      category: payload.category || "—",
      unit: payload.packingUnit || "PCS",
    });

    setStockSummary([
      {
        branch: payload.warehouse || branchOptions[0]?.label || "—",
        quantity: Number(payload.qty ?? 0),
        unit: payload.packingUnit || "PCS",
        mrp: Number(payload.price_list ?? payload.sellingPrice ?? 0),
        batchSerial: payload.batchNo || "-",
      },
    ]);

    // Convenience: seed the first (still-empty) correction row with this
    // item's branch/batch/expiry so the user doesn't retype it.
    setCorrectionRows((prev) => {
      if (prev.length !== 1) return prev;
      const only = prev[0];
      if (only.branch || only.batchNo || only.qty) return prev;
      return [
        {
          ...only,
          branch: matchBranchValue(payload.warehouse, branchOptions) || only.branch,
          batchNo: payload.batchNo || "",
          expiryDate: payload.expiryDate ? payload.expiryDate.slice(0, 10) : "",
        },
      ];
    });
  };

  const handleItemClear = () => {
    setSelectedItem(null);
    setItemMeta({ sku: "", category: "", unit: "PCS" });
    setItemPrefillName("");
    setStockSummary([]);
    setItemSelectResetKey((k) => k + 1);
  };

  // ── Correction row handlers ─────────────────────────────────────────────
  const updateCorrectionRow = (
    id: string,
    field: keyof Omit<CorrectionRow, "id">,
    value: string,
  ) => {
    setCorrectionRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)),
    );
  };

  const addCorrectionRow = () =>
    setCorrectionRows((prev) => [...prev, emptyCorrectionRow()]);

  const removeCorrectionRow = (id: string) =>
    setCorrectionRows((prev) =>
      prev.length === 1 ? prev : prev.filter((r) => r.id !== id),
    );

  // ── Movement row handlers ───────────────────────────────────────────────
  const updateMovementRow = (
    id: string,
    field: keyof Omit<MovementRow, "id">,
    value: string,
  ) => {
    setMovementRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)),
    );
  };

  const addMovementRow = () =>
    setMovementRows((prev) => [...prev, emptyMovementRow()]);

  const removeMovementRow = (id: string) =>
    setMovementRows((prev) =>
      prev.length === 1 ? prev : prev.filter((r) => r.id !== id),
    );

  // ── Derived summary numbers ─────────────────────────────────────────────
  const currentTotalQty = useMemo(
    () => stockSummary.reduce((sum, r) => sum + (Number(r.quantity) || 0), 0),
    [stockSummary],
  );

  const netCorrectionQty = useMemo(
    () =>
      correctionRows.reduce((sum, r) => {
        const n = Number(r.qty);
        return sum + (isNaN(n) ? 0 : n);
      }, 0),
    [correctionRows],
  );

  const totalMovedQty = useMemo(
    () =>
      movementRows.reduce((sum, r) => {
        const n = Number(r.qty);
        return sum + (isNaN(n) ? 0 : n);
      }, 0),
    [movementRows],
  );

  const projectedTotal = currentTotalQty + netCorrectionQty;
  const remainingAfterMove = currentTotalQty - totalMovedQty;
  const movementExceedsStock = mode === "movement" && totalMovedQty > currentTotalQty;
  const heroValue = mode === "correction" ? projectedTotal : remainingAfterMove;
  const heroIsNegative = heroValue < 0 || movementExceedsStock;

  // ── Validation ───────────────────────────────────────────────────────────
  const isValid = useMemo(() => {
    if (!selectedItem || !reason.trim() || !correctionDate) return false;
    if (mode === "correction") {
      return correctionRows.some(
        (r) => r.branch && r.qty.trim() && !isNaN(Number(r.qty)) && Number(r.qty) !== 0,
      );
    }
    return movementRows.some(
      (r) => r.from && r.to && r.from !== r.to && r.qty.trim() && Number(r.qty) > 0,
    );
  }, [mode, selectedItem, reason, correctionDate, correctionRows, movementRows]);

  // ── Save ─────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!isValid) {
      showApiError("Please fill all required fields before saving");
      return;
    }

    const payload: StockCorrectionSubmitPayload = {
      mode,
      item: selectedItem,
      date: correctionDate,
      reason,
      ...(mode === "correction"
        ? {
            correctionRows: correctionRows
              .filter((r) => r.branch && r.qty.trim())
              .map((r) => ({
                branch: r.branch,
                qty: Number(r.qty),
                batchNo: r.batchNo,
                expiryDate: r.expiryDate,
              })),
          }
        : {
            movementRows: movementRows
              .filter((r) => r.from && r.to && r.qty.trim())
              .map((r) => ({ from: r.from, to: r.to, qty: Number(r.qty) })),
          }),
    };

    try {
      setSaving(true);
      showLoading(
        mode === "correction" ? "Saving stock correction..." : "Saving stock movement...",
      );
      await onSubmit?.(payload);
      closeSwal();
      showSuccess(
        mode === "correction"
          ? "Stock correction saved successfully"
          : "Stock movement saved successfully",
      );
      resetForm();
      onClose();
    } catch (err) {
      closeSwal();
      showApiError(err);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => resetForm();

  return (
    <MinimizableModal
      modalId={modalIdRef.current}
      isOpen={isOpen}
      onClose={onClose}
      title="Stock Correction / Movement"
      subtitle={
        selectedBatch
          ? `Editing batch ${selectedBatch.batch_no ?? "-"}`
          : "Adjust inventory levels or transfer items between warehouses with full traceability and batch control."
      }
      icon={mode === "correction" ? Wrench : ArrowRightLeft}
      maxWidth="6xl"
      height="720px"
      footer={
        <>
          <button
            type="button"
            onClick={handleReset}
            disabled={saving}
            className="px-4 py-2 rounded-lg text-[12px] font-semibold text-muted hover:text-main transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !isValid}
            className="px-5 py-2 rounded-lg text-[12px] font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "var(--primary,#1c3f6e)" }}
          >
            {saving ? "Saving..." : "Submit Transaction"}
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5 h-full min-h-0 items-stretch">
        {/* ── LEFT: form ─────────────────────────────────────────────── */}
        <div className="flex flex-col gap-5 min-w-0 overflow-y-auto pr-1">
          {/* Item select + Mode toggle — same row, 2-column grid */}
          <div className="grid grid-cols-2 gap-3 items-end">
            <div>
              <SectionLabel>Item Selection</SectionLabel>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <StockItemSelect
                    key={itemSelectResetKey}
                    itemName={itemPrefillName}
                    invoiceType="Product"
                    // Bypasses the "out of stock" disable-state — corrections often
                    // need to select an item that currently has zero stock.
                    isQuotation
                    onChange={handleItemPicked}
                    onClear={handleItemClear}
                  />
                </div>
              </div>
            </div>

            <div>
              <SectionLabel>Transaction Type</SectionLabel>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMode("correction")}
                  className={[
                    "h-7 rounded text-[9px] font-bold uppercase tracking-wide transition-all border leading-none",
                    mode === "correction"
                      ? "text-white shadow-sm border-transparent"
                      : "text-muted hover:text-main border-theme bg-row-hover/40",
                  ].join(" ")}
                  style={mode === "correction" ? { background: "var(--primary,#1c3f6e)" } : undefined}
                >
                  Correction
                </button>
                <button
                  type="button"
                  onClick={() => setMode("movement")}
                  className={[
                    "h-7 rounded text-[9px] font-bold uppercase tracking-wide transition-all border leading-none",
                    mode === "movement"
                      ? "text-white shadow-sm border-transparent"
                      : "text-muted hover:text-main border-theme bg-row-hover/40",
                  ].join(" ")}
                  style={mode === "movement" ? { background: "var(--primary,#1c3f6e)" } : undefined}
                >
                  Movement
                </button>
              </div>
            </div>
          </div>

          {selectedItem && (
            <div className="flex items-center gap-4 -mt-3 text-[11px] text-muted">
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
          )}

          {/* Current stock summary table */}
          {stockSummary.length > 0 && (
            <div>
              <SectionLabel>Current Inventory Status</SectionLabel>
              <div className="mt-2 rounded-xl border border-theme overflow-hidden">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="bg-row-hover text-muted text-[10px] uppercase tracking-wide">
                      <th className="text-left px-3 py-2 font-semibold">Warehouse</th>
                      <th className="text-left px-3 py-2 font-semibold">Qty On Hand</th>
                      <th className="text-left px-3 py-2 font-semibold">MRP (Unit)</th>
                      <th className="text-left px-3 py-2 font-semibold">Batch / Serial</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockSummary.map((row, idx) => (
                      <tr key={idx} className="border-t border-theme">
                        <td className="px-3 py-2.5 text-main">{row.branch}</td>
                        <td className="px-3 py-2.5 font-bold text-main">
                          {row.quantity.toLocaleString()} {row.unit}
                        </td>
                        <td className="px-3 py-2.5 text-main">${row.mrp.toFixed(2)}</td>
                        <td className="px-3 py-2.5 text-primary">{row.batchSerial}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Dynamic rows — reusable PaginatedRowsTable (header + paged rows +
              Add Row + "Showing X to Y of Z" pagination footer). Columns swap
              with mode; the component itself is generic and reusable elsewhere. */}
          <div>
            <SectionLabel>
              {mode === "correction" ? "Stock Adjustment Details" : "Movement Details"}
            </SectionLabel>

            <div className="mt-2">
              {mode === "correction" ? (
                <PaginatedRowsTable<CorrectionRow>
                  columns={["Warehouse", "Corr. Qty", "Batch No.", "Expiry Date", ""]}
                  gridTemplate={CORRECTION_COLS}
                  rows={correctionRows}
                  pageSize={ROWS_PAGE_SIZE}
                  onAddRow={addCorrectionRow}
                  addLabel="Add Row"
                  renderRow={(row) => (
                    <>
                      <div className="scm-cell scm-cell-border" style={{ padding: "2px 6px" }}>
                        <ModalSelect
                          label=""
                          options={branchOptions}
                          value={row.branch}
                          onChange={(e) => updateCorrectionRow(row.id, "branch", e.target.value)}
                        />
                      </div>
                      <div className="scm-cell scm-cell-border">
                        <NumericInput
                          value={row.qty === "" ? null : Number(row.qty)}
                          allowNegative
                          decimalScale={0}
                          placeholder="0"
                          onChange={(v) =>
                            updateCorrectionRow(row.id, "qty", v === null ? "" : String(v))
                          }
                          className="h-[24px] text-[11px] border-0 shadow-none px-0 bg-transparent"
                        />
                      </div>
                      <div className="scm-cell scm-cell-border" style={{ padding: "2px 6px" }}>
                        <ModalInput
                          label=""
                          placeholder="Enter Batch No."
                          value={row.batchNo}
                          onChange={(e) => updateCorrectionRow(row.id, "batchNo", e.target.value)}
                          className="h-[24px] text-[11px] border-0 shadow-none px-0 bg-transparent"
                        />
                      </div>
                      <div className="scm-cell scm-cell-border" style={{ padding: "2px 6px" }}>
                        <ModalInput
                          label=""
                          type="date"
                          value={row.expiryDate}
                          onChange={(e) => updateCorrectionRow(row.id, "expiryDate", e.target.value)}
                          className="h-[24px] text-[11px] border-0 shadow-none px-0 bg-transparent"
                        />
                      </div>
                      <div className="scm-cell" style={{ justifyContent: "center", padding: "0 4px" }}>
                        <RemoveRowButton
                          onClick={() => removeCorrectionRow(row.id)}
                          disabled={correctionRows.length === 1}
                        />
                      </div>
                    </>
                  )}
                />
              ) : (
                <PaginatedRowsTable<MovementRow>
                  columns={["From", "To", "Move Qty", ""]}
                  gridTemplate={MOVEMENT_COLS}
                  rows={movementRows}
                  pageSize={ROWS_PAGE_SIZE}
                  onAddRow={addMovementRow}
                  addLabel="Add Row"
                  renderRow={(row) => (
                    <>
                      <div className="scm-cell scm-cell-border" style={{ padding: "2px 6px" }}>
                        <ModalSelect
                          label=""
                          options={branchOptions}
                          value={row.from}
                          onChange={(e) => updateMovementRow(row.id, "from", e.target.value)}
                        />
                      </div>
                      <div className="scm-cell scm-cell-border" style={{ padding: "2px 6px" }}>
                        <ModalSelect
                          label=""
                          options={branchOptions.filter((b) => b.value !== row.from)}
                          value={row.to}
                          onChange={(e) => updateMovementRow(row.id, "to", e.target.value)}
                        />
                      </div>
                      <div className="scm-cell scm-cell-border">
                        <NumericInput
                          value={row.qty === "" ? null : Number(row.qty)}
                          allowNegative={false}
                          decimalScale={0}
                          placeholder="0"
                          onChange={(v) =>
                            updateMovementRow(row.id, "qty", v === null ? "" : String(v))
                          }
                          className="h-[24px] text-[11px] border-0 shadow-none px-0 bg-transparent"
                        />
                      </div>
                      <div className="scm-cell" style={{ justifyContent: "center", padding: "0 4px" }}>
                        <RemoveRowButton
                          onClick={() => removeMovementRow(row.id)}
                          disabled={movementRows.length === 1}
                        />
                      </div>
                    </>
                  )}
                />
              )}
            </div>
          </div>

          {/* Posting Date + Reason */}
          <div className="grid grid-cols-2 gap-3">
            <ModalInput
              label="Posting Date"
              type="date"
              required
              value={correctionDate}
              onChange={(e) => setCorrectionDate(e.target.value)}
            />
            <ModalInput
              label="Reason / Remarks"
              required
              placeholder="e.g. Annual Audit discrepancy..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>

        {/* ── RIGHT: summary rail — distinct stacked cards ─────────────── */}
        <aside className="flex flex-col gap-4 h-full min-h-0 overflow-y-auto">
          {/* Hero card */}
          <SummaryCard>
            <span className="block text-[10px] font-bold uppercase tracking-widest text-muted mb-2">
              {mode === "correction" ? "Projected Stock (Total)" : "Remaining After Move"}
            </span>
            <div
              className={[
                "text-4xl font-black leading-none",
                heroIsNegative ? "text-danger" : "text-primary",
              ].join(" ")}
              style={!heroIsNegative ? { color: "var(--primary,#1c3f6e)" } : undefined}
            >
              {heroValue.toLocaleString()}{" "}
              <span className="text-sm font-bold text-muted align-middle">
                {itemMeta.unit || "PCS"}
              </span>
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

          {/* Transaction overview */}
          <SummaryCard>
            <span className="block text-[10px] font-bold uppercase tracking-widest text-muted mb-1">
              Transaction Overview
            </span>
            <div className="divide-y divide-theme">
              <KeyValueRow
                label="Mode"
                value={mode === "correction" ? "Correction" : "Movement"}
                badge
              />
              <KeyValueRow label="Item" value={selectedItem?.label || "—"} />
              <KeyValueRow
                label="Current Stock"
                value={`${currentTotalQty.toLocaleString()} ${itemMeta.unit || "PCS"}`}
              />
              <KeyValueRow
                label={mode === "correction" ? "Rows" : "Movements"}
                value={mode === "correction" ? correctionRows.length : movementRows.length}
              />
            </div>
          </SummaryCard>

          {/* Net change */}
          <SummaryCard>
            <span className="block text-[10px] font-bold uppercase tracking-widest text-muted mb-2">
              {mode === "correction" ? "Net Inventory Change" : "Total Moved"}
            </span>
            <div
              className="rounded-lg py-3 px-3 text-center"
              style={{
                background:
                  (mode === "correction" ? netCorrectionQty < 0 : movementExceedsStock)
                    ? "rgba(239,68,68,0.08)"
                    : "rgba(28,63,110,0.06)",
              }}
            >
              <div
                className={[
                  "text-2xl font-black leading-none",
                  (mode === "correction" ? netCorrectionQty < 0 : movementExceedsStock)
                    ? "text-danger"
                    : "",
                ].join(" ")}
                style={
                  !(mode === "correction" ? netCorrectionQty < 0 : movementExceedsStock)
                    ? { color: "var(--primary,#1c3f6e)" }
                    : undefined
                }
              >
                {mode === "correction"
                  ? `${netCorrectionQty > 0 ? "+" : ""}${netCorrectionQty}`
                  : totalMovedQty}{" "}
                <span className="text-xs font-bold text-muted align-middle">
                  {itemMeta.unit || "PCS"}
                </span>
              </div>
            </div>
            {mode === "correction" && projectedTotal < 0 && (
              <p className="text-[10px] text-danger leading-snug mt-2">
                Correction would push stock below zero.
              </p>
            )}
            {mode === "movement" && movementExceedsStock && (
              <p className="text-[10px] text-danger leading-snug mt-2">
                Move quantity exceeds available stock.
              </p>
            )}
          </SummaryCard>

          {/* Reason preview */}
          <SummaryCard className="mt-auto">
            <span className="block text-[10px] font-bold uppercase tracking-widest text-muted mb-1">
              Reason
            </span>
            <p className="text-[12px] text-main leading-snug break-words min-h-[32px]">
              {reason || "—"}
            </p>
          </SummaryCard>
        </aside>
      </div>
    </MinimizableModal>
  );
};

export default StockCorrectionModal;