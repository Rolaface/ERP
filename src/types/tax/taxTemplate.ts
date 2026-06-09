export interface TaxRow {
  tax_type: string;
  tax_rate: number;
  tax_type_display?: string;
}

export interface TaxCategoryFormData {
  name?: string;
  title: string;
  disabled: boolean;
  title_code: string;
  title_desc: string;
  taxes: TaxRow[];
}

export const defaultTaxRow: TaxRow = {
  tax_type: "",
  tax_rate: 0,
};

export const defaultForm: TaxCategoryFormData = {
  title: "",
  disabled: false,
  title_code: "",
  title_desc: "",
  taxes: [{ tax_type: "", tax_rate: 0 }],
};