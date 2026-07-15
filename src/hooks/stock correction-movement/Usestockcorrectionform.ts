import { useEffect, useMemo, useRef, useState } from "react";
import { showApiError, showSuccess, showLoading, closeSwal } from "../../utils/alert";

// ─── Types ──────────────────────────────────────────────────────────────────

export type Mode = "correction" | "movement";

export interface Option {
  label: string;
  value: string;
}

/** One batch of stock for the selected item, as shown in "Available Stock For This Item". */
export interface StockSummaryRow {
  id: string;
  branchValue: string;
  branchLabel: string;
  batchNo: string;
  availableQty: number;
  unit: string;
  expiryDate: string;
}

export interface CorrectionRow {
  id: string;
  branch: string; // branchOptions value
  batchNo: string; // must match a batchNo available for `branch`
  expiryDate: string; // derived (read-only) from the matched batch
  availableQty: number | null; // derived (read-only) from the matched batch
  qty: string; // string so user can type "-15" / "10" naturally
  reasonCode: string;
}

export interface MovementRow {
  id: string;
  from: string;
  to: string;
  qty: string;
}

/** Optional per-batch breakdown a real API can attach to the item payload. */
export interface StockItemBatch {
  batchNo: string;
  qty: number;
  expiryDate?: string;
  warehouse?: string;
}

/** Shape StockItemSelect's onChange fires — matches its internal handleSelect() payload. */
export interface StockItemSelectPayload {
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
  /** Optional: full batch breakdown for this item, if the backend provides it. */
  batches?: StockItemBatch[];
}

export interface SelectedBatch {
  item_code?: string;
  item_name?: string;
  batch_no?: string;
  expiry_date?: string;
  bal_qty?: number;
}

export interface StockCorrectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (payload: StockCorrectionSubmitPayload) => void | Promise<void>;
  selectedBatch?: SelectedBatch | null;
  branchOptions?: Option[];
}

export interface StockCorrectionSubmitPayload {
  mode: Mode;
  item: Option | null;
  date: string;
  reason: string;
  correctionRows?: Array<{
    branch: string;
    batchNo: string;
    qty: number;
    reasonCode: string;
  }>;
  movementRows?: Array<{ from: string; to: string; qty: number }>;
}

// ─── Constants ──────────────────────────────────────────────────────────────

export const SCM_STYLES = `
.scm-table-wrap { overflow-y: auto; overflow-x: hidden; }
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

const SCM_STYLE_TAG_ID = "scm-table-styles";

export const FALLBACK_BRANCHES: Option[] = [
  { label: "Stores - YC", value: "stores-yc" },
  { label: "Regional Hub A", value: "regional-hub-a" },
];

export const REASON_OPTIONS: Option[] = [
  { label: "Physical count", value: "physical_count" },
  { label: "Damage stock", value: "damage_stock" },
  { label: "Expiration", value: "expiration" },
  { label: "Return", value: "return" },
  { label: "Other", value: "other" },
];

export const CORRECTION_COLS = "0.9fr 0.9fr 0.9fr 0.9fr 1fr 1fr 36px";
export const MOVEMENT_COLS = "1fr 1fr 1fr 36px";
export const ROWS_PAGE_SIZE = 5;

// ─── Helpers ────────────────────────────────────────────────────────────────

const todayISO = () => new Date().toISOString().slice(0, 10);

const genId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `row-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const emptyCorrectionRow = (): CorrectionRow => ({
  id: genId(),
  branch: "",
  batchNo: "",
  expiryDate: "",
  availableQty: null,
  qty: "",
  reasonCode: "",
});

const emptyMovementRow = (): MovementRow => ({
  id: genId(),
  from: "",
  to: "",
  qty: "",
});

/** Matches a warehouse label coming back from StockItemSelect to one of our branch option values. */
const matchBranchValue = (warehouse: string | undefined, branches: Option[]) => {
  if (!warehouse) return "";
  const hit = branches.find((b) => b.label.toLowerCase() === warehouse.toLowerCase());
  return hit?.value ?? "";
};

const reasonLabel = (code: string) => REASON_OPTIONS.find((r) => r.value === code)?.label ?? code;

// ─── Hook ───────────────────────────────────────────────────────────────────

type UseStockCorrectionFormArgs = Pick<
  StockCorrectionModalProps,
  "isOpen" | "onClose" | "onSubmit" | "selectedBatch"
> & {
  branchOptions?: Option[];
};

export function useStockCorrectionForm({
  isOpen,
  onClose,
  onSubmit,
  selectedBatch,
  branchOptions = FALLBACK_BRANCHES,
}: UseStockCorrectionFormArgs) {
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

  const [correctionRows, setCorrectionRows] = useState<CorrectionRow[]>([emptyCorrectionRow()]);
  const [movementRows, setMovementRows] = useState<MovementRow[]>([emptyMovementRow()]);

  const [correctionDate, setCorrectionDate] = useState(todayISO());
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  // Inject the table styles once (same approach SalaryStructureModal uses).
  useEffect(() => {
    if (!document.getElementById(SCM_STYLE_TAG_ID)) {
      const s = document.createElement("style");
      s.id = SCM_STYLE_TAG_ID;
      s.textContent = SCM_STYLES;
      document.head.appendChild(s);
    }
  }, []);

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

  // ── Prefill from selectedBatch (e.g. opened from a batch row's "Correct" action)
  useEffect(() => {
    if (!isOpen) return;
    if (selectedBatch) {
      const item: Option = {
        label: selectedBatch.item_name || selectedBatch.item_code || "",
        value: selectedBatch.item_code || "",
      };
      const branchValue = branchOptions[0]?.value ?? "";
      const branchLabel = branchOptions[0]?.label ?? "—";
      const availableQty = Number(selectedBatch.bal_qty ?? 0);
      const expiryDate = selectedBatch.expiry_date ? selectedBatch.expiry_date.slice(0, 10) : "";

      setSelectedItem(item);
      setItemPrefillName(item.label);
      setMode("correction");
      setStockSummary([
        {
          id: genId(),
          branchValue,
          branchLabel,
          batchNo: selectedBatch.batch_no || "-",
          availableQty,
          unit: "PCS",
          expiryDate,
        },
      ]);
      setCorrectionRows([
        {
          id: genId(),
          branch: branchValue,
          batchNo: selectedBatch.batch_no || "",
          expiryDate,
          availableQty,
          qty: "",
          reasonCode: "",
        },
      ]);
    } else {
      resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, selectedBatch]);

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

    const unit = payload.packingUnit || "PCS";

    // Prefer a full per-batch breakdown from the backend; fall back to the
    // single warehouse/batch the item picker itself returned.
    const rows: StockSummaryRow[] =
      payload.batches && payload.batches.length > 0
        ? payload.batches.map((b) => {
            const branchValue = matchBranchValue(b.warehouse, branchOptions) || branchOptions[0]?.value || "";
            const branchLabel =
              branchOptions.find((o) => o.value === branchValue)?.label || b.warehouse || "—";
            return {
              id: genId(),
              branchValue,
              branchLabel,
              batchNo: b.batchNo,
              availableQty: Number(b.qty ?? 0),
              unit,
              expiryDate: b.expiryDate ? b.expiryDate.slice(0, 10) : "",
            };
          })
        : [
            {
              id: genId(),
              branchValue: matchBranchValue(payload.warehouse, branchOptions) || branchOptions[0]?.value || "",
              branchLabel: payload.warehouse || branchOptions[0]?.label || "—",
              batchNo: payload.batchNo || "-",
              availableQty: Number(payload.qty ?? 0),
              unit,
              expiryDate: payload.expiryDate ? payload.expiryDate.slice(0, 10) : "",
            },
          ];

    setStockSummary(rows);

    // Convenience: seed the first (still-empty) correction row with this
    // item's first batch so the user doesn't retype it.
    setCorrectionRows((prev) => {
      if (prev.length !== 1) return prev;
      const only = prev[0];
      if (only.branch || only.batchNo || only.qty) return prev;
      const first = rows[0];
      if (!first) return prev;
      return [
        {
          ...only,
          branch: first.branchValue,
          batchNo: first.batchNo,
          expiryDate: first.expiryDate,
          availableQty: first.availableQty,
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

  /** Batches available for a given warehouse value, for the row-level Batch No. dropdown. */
  const getBatchOptionsForBranch = (branchValue: string): Option[] =>
    stockSummary
      .filter((s) => s.branchValue === branchValue)
      .map((s) => ({ label: s.batchNo, value: s.batchNo }));

  const updateCorrectionRow = (
    id: string,
    field: keyof Omit<CorrectionRow, "id" | "expiryDate" | "availableQty">,
    value: string,
  ) => {
    setCorrectionRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;

        if (field === "branch") {
          // Warehouse changed → batch list changes, so clear the derived fields.
          return { ...r, branch: value, batchNo: "", expiryDate: "", availableQty: null };
        }

        if (field === "batchNo") {
          const match = stockSummary.find((s) => s.branchValue === r.branch && s.batchNo === value);
          return {
            ...r,
            batchNo: value,
            expiryDate: match?.expiryDate ?? "",
            availableQty: match?.availableQty ?? null,
          };
        }

        return { ...r, [field]: value };
      }),
    );
  };

  const addCorrectionRow = () => setCorrectionRows((prev) => [...prev, emptyCorrectionRow()]);
  const removeCorrectionRow = (id: string) =>
    setCorrectionRows((prev) => (prev.length === 1 ? prev : prev.filter((r) => r.id !== id)));

  // ── Movement row handlers ───────────────────────────────────────────────
  const updateMovementRow = (id: string, field: keyof Omit<MovementRow, "id">, value: string) => {
    setMovementRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };
  const addMovementRow = () => setMovementRows((prev) => [...prev, emptyMovementRow()]);
  const removeMovementRow = (id: string) =>
    setMovementRows((prev) => (prev.length === 1 ? prev : prev.filter((r) => r.id !== id)));

  // ── Derived summary numbers ─────────────────────────────────────────────
  const currentTotalQty = useMemo(
    () => stockSummary.reduce((sum, r) => sum + (Number(r.availableQty) || 0), 0),
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

  /** Reason → summed qty, for the "Reason Summary" card. Only rows with both a reason and a qty count. */
  const reasonSummary = useMemo(() => {
    const totals = new Map<string, number>();
    correctionRows.forEach((r) => {
      const n = Number(r.qty);
      if (!r.reasonCode || isNaN(n) || n === 0) return;
      totals.set(r.reasonCode, (totals.get(r.reasonCode) ?? 0) + n);
    });
    return Array.from(totals.entries()).map(([code, qty]) => ({ label: reasonLabel(code), qty }));
  }, [correctionRows]);

  const projectedTotal = currentTotalQty + netCorrectionQty;
  const remainingAfterMove = currentTotalQty - totalMovedQty;
  const movementExceedsStock = mode === "movement" && totalMovedQty > currentTotalQty;
  const heroValue = mode === "correction" ? projectedTotal : remainingAfterMove;
  const heroIsNegative = heroValue < 0 || movementExceedsStock;

  // ── Validation ───────────────────────────────────────────────────────────
  const isValid = useMemo(() => {
    if (!selectedItem || !correctionDate) return false;
    if (mode === "correction") {
      return correctionRows.some(
        (r) => r.branch && r.batchNo && r.qty.trim() && !isNaN(Number(r.qty)) && Number(r.qty) !== 0,
      );
    }
    return movementRows.some(
      (r) => r.from && r.to && r.from !== r.to && r.qty.trim() && Number(r.qty) > 0,
    );
  }, [mode, selectedItem, correctionDate, correctionRows, movementRows]);

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
              .filter((r) => r.branch && r.batchNo && r.qty.trim())
              .map((r) => ({ branch: r.branch, batchNo: r.batchNo, qty: Number(r.qty), reasonCode: r.reasonCode })),
          }
        : {
            movementRows: movementRows
              .filter((r) => r.from && r.to && r.qty.trim())
              .map((r) => ({ from: r.from, to: r.to, qty: Number(r.qty) })),
          }),
    };

    try {
      setSaving(true);
      showLoading(mode === "correction" ? "Saving stock correction..." : "Saving stock movement...");
      await onSubmit?.(payload);
      closeSwal();
      showSuccess(mode === "correction" ? "Stock correction saved successfully" : "Stock movement saved successfully");
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

  return {
    modalId: modalIdRef.current,
    branchOptions,
    mode,
    setMode,
    selectedItem,
    itemMeta,
    itemPrefillName,
    itemSelectResetKey,
    handleItemPicked,
    handleItemClear,
    stockSummary,
    correctionRows,
    updateCorrectionRow,
    addCorrectionRow,
    removeCorrectionRow,
    getBatchOptionsForBranch,
    movementRows,
    updateMovementRow,
    addMovementRow,
    removeMovementRow,
    correctionDate,
    setCorrectionDate,
    reason,
    setReason,
    saving,
    isValid,
    currentTotalQty,
    netCorrectionQty,
    totalMovedQty,
    projectedTotal,
    remainingAfterMove,
    movementExceedsStock,
    heroValue,
    heroIsNegative,
    reasonSummary,
    handleSave,
    handleReset,
  };
}

export type StockCorrectionFormState = ReturnType<typeof useStockCorrectionForm>;