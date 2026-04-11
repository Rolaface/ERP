export interface SalesTaxRow {
  name: string;
  charge_type: string;
  account_head: string;
  rate: number;
  tax_amount: number;
  description: string;
}

export interface SalesTaxCategoryFormData {
  name?: string;
  title: string;
  disabled: number; // 0 or 1
  tax_category: string;
  taxes: SalesTaxRow[];
}
export const defaultTaxRow: SalesTaxRow = {
  name: "",
  charge_type: "",
  account_head: "",
  rate: 0,
  tax_amount: 0,
  description: "",
};
export const defaultForm: SalesTaxCategoryFormData = {
  title: "",
  disabled: 0,
  tax_category: "",
  taxes: [
    {
      name: "",
      charge_type: "",
      account_head: "",
      rate: 0,
      tax_amount: 0,
      description: "",
    },
  ],
};
    

  


 