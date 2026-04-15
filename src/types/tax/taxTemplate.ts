export interface TaxRow {
  tax_type: string;
  tax_rate: number;
}

export interface TaxCategoryFormData {
  name?: string;       
  title: string;
  disabled: boolean;
  taxes: TaxRow[];     
}

export const defaultTaxRow: TaxRow = {
  tax_type: "",
  tax_rate: 0,
};

export const defaultForm: TaxCategoryFormData = {
  title: "",
  disabled: false,
  taxes: [{ tax_type: "", tax_rate: 0 }], 
};