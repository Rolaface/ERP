import { createImportApi } from "../createImportApi";

interface SupplierImportRow {
  row: number;
  supplier?: string;
  error?: string;
}

interface SupplierImportRawResponse {
  total: number;
  success_count: number;
  failed_count: number;
  success: SupplierImportRow[];
  failed: SupplierImportRow[];
}

export const supplierImportApi = createImportApi<SupplierImportRawResponse>({
  uploadEndpoint: "/api/method/custom_api.api.supplier_import.import_suppliers",
  templatePath: "supplier/supplier_import_template.csv",
  parseResponse: (data) => ({
    success: data.failed_count === 0,
    message:
      data.failed_count > 0
        ? `${data.success_count} of ${data.total} imported, ${data.failed_count} failed`
        : `${data.success_count} suppliers imported successfully`,
    total_rows: data.total,
    items_processed: data.success_count,
    errors: data.failed.map((f) => `Row ${f.row}: ${f.error}`),
  }),
});