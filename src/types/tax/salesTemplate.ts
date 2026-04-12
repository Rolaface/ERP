// ─── Sales Tax Template Types ────────────────────────────────────────────────

export type ChargeType = "Actual" | "On Net Total" | "On Previous Row Amount" | "On Previous Row Total";

export interface SalesTaxRow {
  name?: string;                   // auto-generated / returned by API
  charge_type: ChargeType;
  account_head: string;
  rate: number;
  tax_amount: number;
  description: string;
}

export interface SalesTaxTemplateFormData {
  name?: string;                   // read-only in edit mode (docname)
  title: string;
  disabled: 0 | 1;                 // 0 = enabled, 1 = disabled  (API uses int)
  tax_category: string;
  taxes: SalesTaxRow[];
}

// ─── Defaults ────────────────────────────────────────────────────────────────

export const defaultSalesTaxRow: SalesTaxRow = {
  charge_type: "On Net Total",
  account_head: "",
  rate: 0,
  tax_amount: 0,
  description: "",
};

export const defaultSalesTaxForm: SalesTaxTemplateFormData = {
  title: "",
  disabled: 0,
  tax_category: "",
  taxes: [{ ...defaultSalesTaxRow }],
};

// ─── Summary (list view) ─────────────────────────────────────────────────────

export interface SalesTaxTemplateSummary {
  name: string;
  title: string;
  company?: string;
  disabled: 0 | 1;
  tax_category: string;
  taxes: SalesTaxRow[];
}

// ─── API Response wrappers ───────────────────────────────────────────────────

export interface SalesTaxTemplatePagination {
  total: number;
  total_pages: number;
  page: number;
  page_size: number;
}

export interface SalesTaxTemplateListResponse {
  templates: SalesTaxTemplateSummary[];
  pagination: SalesTaxTemplatePagination;
}

// ─── Charge type options (for select) ────────────────────────────────────────

export const CHARGE_TYPE_OPTIONS: { value: ChargeType; label: string }[] = [
  { value: "Actual", label: "Actual" },
  { value: "On Net Total", label: "On Net Total" },
  { value: "On Previous Row Amount", label: "On Previous Row Amount" },
  { value: "On Previous Row Total", label: "On Previous Row Total" },
];