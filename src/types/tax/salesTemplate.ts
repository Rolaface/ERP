export type ChargeType = "Actual" | "On Net Total" | "On Previous Row Amount" | "On Previous Row Total"|"On Item Quantity";

export interface SalesTaxRow {
  name?: string;                   
  charge_type: ChargeType;
  account_head: string;
  rate: number;
  tax_amount: number;
  description: string;
  account_head_display?: string;
}

export interface SalesTaxTemplateFormData {
  name?: string;                  
  title: string;
  disabled: 0 | 1;                 
  tax_category: string;
  taxes: SalesTaxRow[];
}



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



export interface SalesTaxTemplateSummary {
  name: string;
  title: string;
  company?: string;
  disabled: 0 | 1;
  tax_category: string;
  taxes: SalesTaxRow[];
}



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



export const CHARGE_TYPE_OPTIONS: { value: ChargeType; label: string }[] = [
  { value: "Actual", label: "Actual" },
  { value: "On Net Total", label: "On Net Total" },
  { value: "On Previous Row Amount", label: "On Previous Row Amount" },
  { value: "On Previous Row Total", label: "On Previous Row Total" },
  { value: "On Item Quantity",label:"On Item Quantity"},
];