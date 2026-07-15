// ─────────────────────────────────────────────────────────────────────────
// Types for the Stock Correction / Movement form.
// Kept separate from Usestockcorrectionform.ts so the hook file only
// contains logic, and any component can import types without pulling
// in the hook implementation.
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

export interface CorrectionRow {
  id: string;
  branch: string; // real warehouse name, taken directly from the API's batches[].warehouse
  batchNo: string; // auto-resolved (read-only) from stockSummary once branch is picked
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
  /** Real warehouse name for this batch, if the caller has it. */
  warehouse?: string;
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
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (payload: StockCorrectionSubmitPayload) => void | Promise<void>;
  selectedBatch?: SelectedBatch | null;
  /** Used only for the Movement tab's From/To selects (not item-specific). */
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