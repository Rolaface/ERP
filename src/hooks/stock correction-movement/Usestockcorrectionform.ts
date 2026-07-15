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
  StockCorrectionSubmitPayload,
} from "../../types/Stock/stockcorrectionform.types";

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
  StockCorrectionSubmitPayload,
} from "../../types/Stock/stockcorrectionform.types";

// ─────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────

export const SCM_STYLES = `
.scm-table-wrap { overflow-y: auto; overflow-x: hidden; }
.scm-table-wrap::-webkit-scrollbar { width: 3px; }
.scm-table-wrap::-webkit-scrollbar-track { background: transparent; }
.scm-table-wrap::-webkit-scrollbar-thumb { background: var(--border, #e5e7eb); border-radius: 4px; }
`;

const SCM_STYLE_TAG_ID = "scm-table-styles";

/** Fallback warehouse list ONLY used for the Movement tab's "Move To" select when the parent doesn't pass its own `branchOptions` prop. */
export const FALLBACK_BRANCHES: Option[] = [
  { label: "Stores - YC", value: "stores-yc" },
  { label: "Regional Hub A", value: "regional-hub-a" },
];

export const BATCH_TABLE_PAGE_SIZE = 5;

// ─────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────

const todayISO = () => new Date().toISOString().slice(0, 10);

const genId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `row-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;


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
  const [itemSelectResetKey, setItemSelectResetKey] = useState(0);

  const [stockSummary, setStockSummary] = useState<StockSummaryRow[]>([]);

  // Auto-derived, one row per batch — see the sync effect below.
  const [correctionRows, setCorrectionRows] = useState<CorrectionRow[]>([]);
  const [movementRows, setMovementRows] = useState<MovementRow[]>([]);

  const [correctionDate, setCorrectionDate] = useState(todayISO());
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

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
      const branchValue = selectedBatch.warehouse || branchOptions[0]?.value || "";
      const branchLabel = selectedBatch.warehouse || branchOptions[0]?.label || "—";
      const availableQty = Number(selectedBatch.bal_qty ?? 0);
      const expiryDate = selectedBatch.expiry_date ? selectedBatch.expiry_date.slice(0, 10) : "";

      setSelectedItem(item);
      setItemPrefillName(item.label);
      setMode("correction");
      // Setting stockSummary is enough — the sync effect below builds
      // correctionRows/movementRows from it automatically.
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

    const rows: StockSummaryRow[] =
      payload.batches && payload.batches.length > 0
        ? payload.batches.map((b) => {
            const warehouseName = b.warehouse || "—";
            return {
              id: genId(),
              branchValue: warehouseName,
              branchLabel: warehouseName,
              batchNo: b.batchNo,
              availableQty: Number(b.qty ?? 0),
              unit,
              expiryDate: b.expiryDate ? b.expiryDate.slice(0, 10) : "",
            };
          })
        : [
            {
              id: genId(),
              branchValue: payload.warehouse || "—",
              branchLabel: payload.warehouse || "—",
              batchNo: payload.batchNo || "-",
              availableQty: Number(payload.qty ?? 0),
              unit,
              expiryDate: payload.expiryDate ? payload.expiryDate.slice(0, 10) : "",
            },
          ];

    setStockSummary(rows);
  };

  const handleItemClear = () => {
    setSelectedItem(null);
    setItemMeta({ sku: "", category: "", unit: "PCS" });
    setItemPrefillName("");
    setStockSummary([]);
    setItemSelectResetKey((k) => k + 1);
  };

  // ── Sync correction/movement rows to stockSummary (one row per batch) ───
  // Runs only when stockSummary changes (item picked/cleared), so it never
  // wipes what the user is typing into a qty/"to" field mid-session.
  useEffect(() => {
    setCorrectionRows(
      stockSummary.map((s) => ({
        id: s.id,
        branch: s.branchValue,
        branchLabel: s.branchLabel,
        batchNo: s.batchNo,
        expiryDate: s.expiryDate,
        availableQty: s.availableQty,
        unit: s.unit,
        qty: "",
      })),
    );
    setMovementRows(
      stockSummary.map((s) => ({
        id: s.id,
        branch: s.branchValue,
        branchLabel: s.branchLabel,
        batchNo: s.batchNo,
        expiryDate: s.expiryDate,
        availableQty: s.availableQty,
        unit: s.unit,
        to: "",
        qty: "",
      })),
    );
  }, [stockSummary]);

  const updateCorrectionQty = (id: string, qty: string) => {
    setCorrectionRows((prev) => prev.map((r) => (r.id === id ? { ...r, qty } : r)));
  };

  const updateMovementRow = (id: string, field: "to" | "qty", value: string) => {
    setMovementRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

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
        return sum + (r.to && !isNaN(n) ? n : 0);
      }, 0),
    [movementRows],
  );

  const projectedTotal = currentTotalQty + netCorrectionQty;
  const remainingAfterMove = currentTotalQty - totalMovedQty;
  const movementExceedsStock = mode === "movement" && totalMovedQty > currentTotalQty;
  const heroValue = mode === "correction" ? projectedTotal : remainingAfterMove;
  const heroIsNegative = heroValue < 0 || movementExceedsStock;

  // Reason Summary card is now transaction-level only (no per-row reason in
  // the new merged table), so it stays empty/hidden — kept in SummaryRail
  // props for backward compat but always [].
  const reasonSummary: Array<{ label: string; qty: number }> = [];

  // ── Validation ───────────────────────────────────────────────────────────

  const isValid = useMemo(() => {
    if (!selectedItem || !correctionDate) return false;

    if (mode === "correction") {
      return correctionRows.some((r) => r.qty.trim() && !isNaN(Number(r.qty)) && Number(r.qty) !== 0);
    }

    return movementRows.some(
      (r) => r.to && r.to !== r.branch && r.qty.trim() && Number(r.qty) > 0 && Number(r.qty) <= r.availableQty,
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
              .filter((r) => r.qty.trim() && Number(r.qty) !== 0)
              .map((r) => ({ branch: r.branch, batchNo: r.batchNo, qty: Number(r.qty) })),
          }
        : {
            movementRows: movementRows
              .filter((r) => r.to && r.qty.trim() && Number(r.qty) > 0)
              .map((r) => ({ from: r.branch, to: r.to, batchNo: r.batchNo, qty: Number(r.qty) })),
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
    updateCorrectionQty,
    movementRows,
    updateMovementRow,
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