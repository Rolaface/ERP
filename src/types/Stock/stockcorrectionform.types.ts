// ─────────────────────────────────────────────────────────────────────────
// Types for the Stock Correction / Movement form.
// ─────────────────────────────────────────────────────────────────────────

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

/**
 * ONE ROW PER BATCH — auto-derived from stockSummary (see useStockCorrectionForm).
 * No more free "Add Row" / pick-your-own-warehouse: branch + batchNo + expiryDate +
 * availableQty are all fixed/read-only, only `qty` (Correct/Quantity) is editable.
 */
export interface CorrectionRow {
  id: string; // same id as the matching StockSummaryRow
  branch: string;
  branchLabel: string;
  batchNo: string;
  expiryDate: string;
  availableQty: number;
  unit: string;
  qty: string; // string so user can type "-15" / "10" naturally
}

/**
 * ONE ROW PER BATCH (same idea as CorrectionRow) — the source warehouse/batch
 * is fixed, user only picks a destination (`to`) and a `qty` to move.
 */
export interface MovementRow {
  id: string; // same id as the matching StockSummaryRow
  branch: string; // source warehouse (fixed, from the batch)
  branchLabel: string;
  batchNo: string;
  expiryDate: string;
  availableQty: number;
  unit: string;
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
  batches?: StockItemBatch[];
}

export interface SelectedBatch {
  item_code?: string;
  item_name?: string;
  batch_no?: string;
  expiry_date?: string;
  bal_qty?: number;
  warehouse?: string;
}

export interface StockCorrectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (payload: StockCorrectionSubmitPayload) => void | Promise<void>;
  selectedBatch?: SelectedBatch | null;
  /** Used only for the Movement tab's "Move To" select (not item-specific). */
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
  }>;
  movementRows?: Array<{ from: string; to: string; batchNo: string; qty: number }>;
}