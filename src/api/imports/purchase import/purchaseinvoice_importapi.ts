import { createImportApi } from "../createImportApi";

interface PurchaseInvoiceImportEntry {
  supplier?: string;
  bill_no?: string;
  purchase_invoice?: string;
  error?: string;
}

interface PurchaseInvoiceImportRawResponse {
  total_invoices: number;
  success_count: number;
  failed_count: number;
  details: {
    success: PurchaseInvoiceImportEntry[];
    failed: PurchaseInvoiceImportEntry[];
  };
}

export const purchaseInvoiceImportApi = createImportApi<PurchaseInvoiceImportRawResponse>({
  uploadEndpoint:
    "/api/method/custom_api.api.purchase_invoice_import.import_purchase_invoices",
  templatePath: "procurement/purchase_invoice_import_template.xlsx",
  parseResponse: (data) => ({
    success: data.failed_count === 0,
    message:
      data.failed_count > 0
        ? `${data.success_count} of ${data.total_invoices} invoices imported, ${data.failed_count} failed`
        : `${data.success_count} purchase invoices imported successfully`,
    total_rows: data.total_invoices,
    items_processed: data.success_count,
    errors: data.details.failed.map(
      (f) => `${f.supplier ?? "Unknown supplier"} / ${f.bill_no ?? "no bill_no"}: ${f.error}`,
    ),
  }),
});