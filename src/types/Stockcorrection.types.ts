// ─── Stock Correction — Shared Types ─────────────────────────────────────────
// All types for the Stock Correction feature module.
// Import from here — never redefine these elsewhere.

export type CorrectionType = "add" | "remove" | "set";
export type ActiveTab      = "manual" | "bulk";
export type RowStatus      = "pending" | "valid" | "error";

// ── Manual form ───────────────────────────────────────────────────────────────
export interface CorrectionFormState {
  id:              string;
  itemName:        string;
  itemClassCode:   string;
  unitOfMeasureCd: string;
  currentQty:      number | null;
  correctionType:  CorrectionType;
  adjustmentQty:   string;
  reason:          string;
  notes:           string;
}

// ── Bulk upload ───────────────────────────────────────────────────────────────
export interface BulkRow {
  id: string;
  itemCode: string;
  itemName: string;
  itemGroup: string;
  uom: string;
  warehouse: string;
  openingQty: string;
  valuationRate: string;
  description: string;
  brand: string;
  status: "valid" | "error";
  error?: string;
}

// ── API payload shapes ────────────────────────────────────────────────────────
export interface CorrectionItem {
  item_code:       string;
  correction_type: CorrectionType;
  adjustment_qty:  number;
  new_qty?:        number;
  unit_of_measure?: string;
  reason_code:     string;
  notes?:          string;
}

export interface CorrectionPayload {
  items: CorrectionItem[];
}

// ── Reason code ───────────────────────────────────────────────────────────────
export interface ReasonCode {
  id:    string;
  label: string;
}