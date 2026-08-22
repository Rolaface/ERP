// ─── Inventory Import — Types ────────────────────────────────────────────────

export interface BulkRow {
  id:            string;
  itemCode:      string;
  itemName:      string;
  itemGroup:     string;
  uom:           string;
  warehouse:     string;
  openingQty:    string;
  valuationRate: string;
  description:   string;
  brand:         string;
  status:        "valid" | "error";
  error?:        string;
}

export interface InventoryImportReconciliation {
  warehouse: string;
  name:      string;
  status:    string;
}

export interface InventoryImportResult {
  success:          boolean;
  queued?:          boolean;
  message?:         string;
  total_rows?:      number;
  items_processed?: number;
  unique_items?:    number;
  reconciliations?: InventoryImportReconciliation[];
  errors?:          string[];
}