

import { useState, useEffect, useCallback } from "react";
import {
  showApiError,
  showSuccess,
  showLoading,
  closeSwal,
} from "../utils/alert";
// import { createItemStock } from "../api/stockItemApi";
import { createItemStock, getStockById }    from "../api/stockApi";

import { EMPTY_FORM }        from "../../src/types/Stockcorrection.constants";
import type {
  CorrectionFormState,
  CorrectionType,
  ActiveTab,
  BulkRow,
} from "../types/Stockcorrection.types";

// ── Derived value helper (pure) ───────────────────────────────────────────────
export function computeNewQty(
  currentQty:     number,
  adjustmentQty:  number,
  correctionType: CorrectionType
): number {
  if (correctionType === "add")    return currentQty + adjustmentQty;
  if (correctionType === "remove") return Math.max(0, currentQty - adjustmentQty);
  return adjustmentQty; // "set"
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useStockCorrection(
  isOpen:    boolean,
  onSubmit?: () => void,
  onClose?:  () => void
) {
  const [activeTab,    setActiveTab]    = useState<ActiveTab>("manual");
  const [form,         setForm]         = useState<CorrectionFormState>(EMPTY_FORM);
  const [loading,      setLoading]      = useState(false);
  const [bulkRows,     setBulkRows]     = useState<BulkRow[]>([]);
  const [bulkLoading,  setBulkLoading]  = useState(false);

  // ── Reset on modal open/close ─────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) {
      setForm(EMPTY_FORM);
      setBulkRows([]);
      setActiveTab("manual");
    }
  }, [isOpen]);

  // ── Auto-fetch system qty when item changes ───────────────────────────────
  useEffect(() => {
    if (!form.id) return;
    getStockById(form.id).then((res) => {
      const item = res?.items?.[0];
      if (!item) return;
      setForm((prev) => ({
        ...prev,
        itemClassCode: item.itemCode   ?? prev.itemClassCode,
        currentQty:    parseFloat(item.quantity) || 0,
      }));
    });
  }, [form.id]);

  // ── Field setters ─────────────────────────────────────────────────────────
  const setField = useCallback(
    <K extends keyof CorrectionFormState>(name: K, value: CorrectionFormState[K]) =>
      setForm((prev) => ({ ...prev, [name]: value })),
    []
  );

  const resetForm = useCallback(() => setForm(EMPTY_FORM), []);

  // ── Derived values ────────────────────────────────────────────────────────
  const adjQty  = parseFloat(form.adjustmentQty) || 0;
  const curQty  = form.currentQty ?? 0;
  const hasItem = !!form.id;
  const hasAdj  = adjQty > 0;
  const newQty  = computeNewQty(curQty, adjQty, form.correctionType);
  const diff    = newQty - curQty;
  const isValid = hasItem && hasAdj && !!form.reason;

  // ── Manual submit ─────────────────────────────────────────────────────────
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.id)          { showApiError("Please select an item"); return; }
    if (!adjQty || adjQty <= 0) { showApiError("Adjustment quantity must be > 0"); return; }
    if (!form.reason)      { showApiError("Please select a reason for the correction"); return; }

    try {
      setLoading(true);
      showLoading("Applying stock correction…");
      const response = await createItemStock({
        items: [{
          item_code:        form.id,
          correction_type:  form.correctionType,
          adjustment_qty:   adjQty,
          new_qty:          newQty,
          unit_of_measure:  form.unitOfMeasureCd,
          reason_code:      form.reason,
          notes:            form.notes,
        }],
      });
      closeSwal();
      if (!response || response.status_code !== 200) {
        showApiError(response?.message || "Failed to apply correction");
        return;
      }
      showSuccess("Stock correction applied successfully");
      onSubmit?.();
      handleClose();
    } catch (error: any) {
      closeSwal();
      showApiError(error);
    } finally {
      setLoading(false);
    }
  };

  // ── Bulk submit ───────────────────────────────────────────────────────────
  

  // ── Close handler ─────────────────────────────────────────────────────────
  const handleClose = () => {
    setForm(EMPTY_FORM);
    setBulkRows([]);
    onClose?.();
  };

  return {
    // state
    activeTab, setActiveTab,
    form,      setForm, setField, resetForm,
    loading,
    bulkRows,  setBulkRows,
    bulkLoading,
    // derived
    adjQty, curQty, newQty, diff, hasItem, hasAdj, isValid,
    // actions
    handleManualSubmit,
    
    handleClose,
  };
}