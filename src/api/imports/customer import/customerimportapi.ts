import { createImportApi } from "../createImportApi";

interface CustomerImportRow {
  row: number;
  customer?: string;
  action?: string;
  error?: string;
}

interface CustomerImportRawResponse {
  total: number;
  success_count: number;
  failed_count: number;
  success: CustomerImportRow[];
  failed: CustomerImportRow[];
}

export const customerImportApi = createImportApi<CustomerImportRawResponse>({
  uploadEndpoint: "/api/method/custom_api.api.customer_import.import_customers",
  templatePath: "customer/customer_import_template.csv",
  parseResponse: (data) => ({
    success: data.failed_count === 0,
    message:
      data.failed_count > 0
        ? `${data.success_count} of ${data.total} imported, ${data.failed_count} failed`
        : `${data.success_count} customers imported successfully`,
    total_rows: data.total,
    items_processed: data.success_count,
    errors: data.failed.map((f) => `Row ${f.row}: ${f.error}`),
  }),
});