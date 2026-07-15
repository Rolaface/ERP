import { useEffect, useMemo, useRef, useState } from "react";
import { showApiError, showSuccess, showLoading, closeSwal } from "../../utils/alert";
import type {
  Mode,
  Option,
  StockSummaryRow,
  CorrectionRow,
  MovementRow,
  StockItemBatch,
  StockItemSelectPayload,
  SelectedBatch,
  StockCorrectionModalProps,
  StockCorrectionSubmitPayload,SingleBatchItemPickedPayload
} from "../../types/Stock/stockcorrectionform.types";

// Re-exported so existing imports elsewhere in the codebase
// (e.g. Summaryui.tsx, StockCorrectionModal.tsx) keep working
// unchanged even though the types now live in their own file.
export type {
  Mode,
  Option,
  StockSummaryRow,
  CorrectionRow,
  MovementRow,
  StockItemBatch,
  StockItemSelectPayload,
  SelectedBatch,
  StockCorrectionModalProps,
  StockCorrectionSubmitPayload,SingleBatchItemPickedPayload
} from "../../types/Stock/stockcorrectionform.types";

// ─────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────

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

/**
 * Default warehouse list ONLY used for the Movement tab's From/To selects
 * when the parent doesn't pass its own `branchOptions` prop. NOT used
 * anywhere for Correction rows anymore — those now come directly from the
 * item's real API `batches[].warehouse` data (see `itemBranchOptions`).
 * Replace with a real "list all warehouses" API call when you have one.
 */
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

export const CORRECTION_COLS = "1fr 1fr 0.9fr 0.9fr 1fr 36px";
// "From" given more breathing room than "To" / "Move Qty" for better readability.
export const MOVEMENT_COLS = "1.4fr 1fr 0.9fr 36px";
export const ROWS_PAGE_SIZE = 5;

// ─────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────

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

const reasonLabel = (code: string) => REASON_OPTIONS.find((r) => r.value === code)?.label ?? code;

// ─────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────

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
      // Use the real warehouse if the caller passed one; otherwise we have
      // no warehouse info at all here, so fall back to the first Movement
      // branch option purely as a last-resort label (SelectedBatch doesn't
      // carry warehouse from every call site yet — add it there if you can).
      const branchValue = selectedBatch.warehouse || branchOptions[0]?.value || "";
      const branchLabel = selectedBatch.warehouse || branchOptions[0]?.label || "—";
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
// ── Item picked via StockItemSelect (single item, single batch) ─────────
  const handleItemPicked = (payload: SingleBatchItemPickedPayload) => {
    const item: Option = { label: payload.itemName, value: payload.itemCode };
    setSelectedItem(item);
    setItemPrefillName(payload.itemName);
    setItemMeta({
      sku: payload.itemCode || "",
      category: "—",
      unit: payload.packingUnit || "PCS",
    });

    const unit = payload.packingUnit || "PCS";
    const warehouseName = payload.warehouse || "—";

    const row: StockSummaryRow = {
      id: genId(),
      branchValue: warehouseName,
      branchLabel: warehouseName,
      batchNo: payload.batchNo || "-",
      availableQty: Number(payload.qty ?? 0),
      unit,
      expiryDate: payload.expiryDate ? payload.expiryDate.slice(0, 10) : "",
    };

    setStockSummary([row]);

    // single-batch flow: lock the one correction row to this batch/warehouse
    setCorrectionRows([
      {
        id: genId(),
        branch: row.branchValue,
        batchNo: row.batchNo,
        expiryDate: row.expiryDate,
        availableQty: row.availableQty,
        qty: "",
        reasonCode: "",
      },
    ]);
  };

  const handleItemClear = () => {
    setSelectedItem(null);
    setItemMeta({ sku: "", category: "", unit: "PCS" });
    setItemPrefillName("");
    setStockSummary([]);
    setItemSelectResetKey((k) => k + 1);
  };

  // ── Correction row helpers ───────────────────────────────────────────────

  /** Real warehouses this item has stock in, derived straight from the API response (stockSummary). */
  const itemBranchOptions = useMemo<Option[]>(() => {
    const seen = new Set<string>();
    stockSummary.forEach((s) => seen.add(s.branchValue));
    return Array.from(seen).map((v) => ({ value: v, label: v }));
  }, [stockSummary]);

  /** Batches available for a given warehouse value, for the row-level Batch No. dropdown (kept for back-compat). */
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
          // Warehouse changed → auto-resolve its batch from stockSummary.
          // NOTE: if an item has multiple batches in the same warehouse
          // (real data can look like this), this picks the first match.
          // Switch Batch No. back to a row-level select scoped by
          // getBatchOptionsForBranch(value) if that's not good enough.
          const match = stockSummary.find((s) => s.branchValue === value);
          return {
            ...r,
            branch: value,
            batchNo: match?.batchNo ?? "",
            expiryDate: match?.expiryDate ?? "",
            availableQty: match?.availableQty ?? null,
          };
        }

        if (field === "batchNo") {
          // No longer triggered from the UI (Batch No. is read-only), kept
          // in case you wire a select back in later.
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

  // ── Movement row helpers ────────────────────────────────────────────────

  const updateMovementRow = (id: string, field: keyof Omit<MovementRow, "id">, value: string) => {
    setMovementRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const addMovementRow = () => setMovementRows((prev) => [...prev, emptyMovementRow()]);

  const removeMovementRow = (id: string) =>
    setMovementRows((prev) => (prev.length === 1 ? prev : prev.filter((r) => r.id !== id)));

  // ── Filtered "Available Stock" view ─────────────────────────────────────
  // Once every correction row agrees on the same warehouse, narrow the
  // summary table to just that warehouse's batches. If rows disagree (or
  // none picked yet), show every warehouse the item has stock in.
  const selectedBranchForFilter = useMemo(() => {
    const picked = correctionRows.map((r) => r.branch).filter(Boolean);
    if (picked.length === 0) return "";
    const unique = new Set(picked);
    return unique.size === 1 ? picked[0] : "";
  }, [correctionRows]);

  const visibleStockSummary = useMemo(() => {
    if (mode !== "correction" || !selectedBranchForFilter) return stockSummary;
    return stockSummary.filter((s) => s.branchValue === selectedBranchForFilter);
  }, [stockSummary, mode, selectedBranchForFilter]);

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

    return movementRows.some((r) => r.from && r.to && r.from !== r.to && r.qty.trim() && Number(r.qty) > 0);
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
    itemBranchOptions,
    mode,
    setMode,
    selectedItem,
    itemMeta,
    itemPrefillName,
    itemSelectResetKey,
    handleItemPicked,
    handleItemClear,
    stockSummary,
    visibleStockSummary,
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