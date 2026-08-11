// ─────────────────────────────────────────────────────────────────────────
// Types for the Stock Correction / Movement form.
// Kept separate from Usestockcorrectionform.ts so the hook file only
// contains logic, and any component can import types without pulling
// in the hook implementation.
// ─────────────────────────────────────────────────────────────────────────

export type Mode = "correction" | "movement";

/** Stock Entry sub-type for the Movement tab — mirrors Frappe's Stock Entry Type. */
export type StockEntryType = "Material Transfer" | "Material Issue";

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
  valuationRate: number;
}

export interface CorrectionRow {
  id: string;
  branch: string; // real warehouse name, taken directly from the API's batches[].warehouse
  batchNo: string; // auto-resolved (read-only) from stockSummary once branch is picked
  expiryDate: string; // derived (read-only) from the matched batch
  availableQty: number | null; // derived (read-only) from the matched batch — this is "Actual Quantity"

  // Replaces the old single signed `qty` field. Both are strings so the user
  // can type/clear freely; kept numerically in sync by updateCorrectionRow.
  correctQty: string; // signed delta the user enters, e.g. "-30" or "20" — can be blank
  finalQty: string; // resulting stock = availableQty + correctQty, always >= 0, string so field can be blank

  reasonCode: string;
  // Derived (read-only) from the matched batch by default. Becomes user-editable
  // when the form's "Opening Stock" checkbox is on (no existing batch to derive from).
  valuationRate: number | null;
}

export interface MovementRow {
  id: string;
  from: string;
  to: string; // ignored / cleared when stockEntryType is "Material Issue" (no target warehouse)
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
  stockUom?: string;
}

export interface SelectedBatch {
  item_code?: string;
  item_name?: string;
  batch_no?: string;
  expiry_date?: string;
  bal_qty?: number;
  /** Real warehouse name for this batch, if the caller has it. */
  warehouse?: string;
  valuation_rate?: number;
}

export interface SingleBatchItemPickedPayload {
  itemCode: string;
  itemName: string;
  batchNo?: string;
  expiryDate?: string;
  qty?: number;
  packingUnit?: string;
  warehouse?: string;
  isServiceItem?: number;
}

export interface StockCorrectionModalProps {
  modalId?: string;
  isViewMode?: boolean;
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (payload: StockCorrectionSubmitPayload) => Promise<void>;
  selectedBatch?: SelectedBatch | null;
  /** Used only for the Movement tab's From/To selects (not item-specific). */
  branchOptions?: Option[];
}

export interface StockCorrectionSubmitPayload {
  mode: Mode;
  item: Option | null;
  date: string;
  reason: string;
  /** Correction-only: marks this entry as opening stock, unlocking manual valuation rate. */
  isOpeningStock?: boolean;
  /** Movement-only: Material Transfer (needs target warehouse) or Material Issue (doesn't). */
  stockEntryType?: StockEntryType;

  correctionRows?: Array<{
    branch: string;
    batchNo: string;
    qty: number;
    reasonCode: string;
    valuationRate?: number | null;
  }>;
  movementRows?: Array<{
    from: string;
    to: string;
    qty: number;
    batchNo?: string;
  }>;
}