import { createImportApi } from "../createImportApi";

interface InventoryImportReconciliation {
  warehouse: string;
  name: string;
  status: string;
}

interface InventoryImportRawResponse {
  success: boolean;
  queued?: boolean;
  message?: string;
  total_rows?: number;
  items_processed?: number;
  unique_items?: number;
  reconciliations?: InventoryImportReconciliation[];
  errors?: string[];
}

export const inventoryItemImportApi = createImportApi<InventoryImportRawResponse>({
 
  uploadEndpoint: "/api/method/custom_api.api.inventory_import.import_inventory",
  templatePath: "inventory/inventory_import_template.xlsx",
  parseResponse: (data) => ({
    success: data.success,
    message: data.message ?? "",
    total_rows: data.total_rows ?? 0,
    items_processed: data.items_processed ?? 0,
    errors: data.errors,
  }),
});