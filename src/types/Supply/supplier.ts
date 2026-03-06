export interface SupplierFormData {
  tpin?: string;
  supplierName?: string;
  supplierCode?: string;
  taxCategory: string;
  paymentTerms: string;
  currency?: string;
  bankAccount?: string;
  contactPerson?: string;
  phoneNo?: string;
  alternateNo?: string;
  emailId?: string;
  dateOfAddition?: string;
  openingBalance?: string | number;
  accountNumber?: string;
  accountHolder?: string;
  sortCode?: string;
  swiftCode?: string;
  branchAddress?: string;
  billingAddressLine1?: string;
  billingAddressLine2?: string;
  billingCity?: string;
  district?: string;
  province?: string;
  billingCountry?: string;
  billingPostalCode?: string;
}

export const emptySupplierForm: SupplierFormData = {
  tpin: "",
  supplierName: "",
  supplierCode: "",
  taxCategory: "",
  paymentTerms: "",
  currency: "",
  bankAccount: "",
  contactPerson: "",
  phoneNo: "",
  alternateNo: "",
  emailId: "",
  dateOfAddition: "",
  openingBalance: 0,
  accountNumber: "",
  accountHolder: "",
  sortCode: "",
  swiftCode: "",
  branchAddress: "",
  billingAddressLine1: "",
  billingAddressLine2: "",
  billingCity: "",
  district: "",
  province: "",
  billingCountry: "",
  billingPostalCode: "",
};

export const currencyOptions = ["ZMW", "USD", "INR"] as const;
export type Currency = (typeof currencyOptions)[number];

export type SupplierTab = "supplier" | "payment" | "address";

export type SupplierStatus = "active" | "inactive";

export type Supplier = SupplierFormData & {
  supplierId?: string;
  status?: SupplierStatus;
};

export interface Supplierr {
  id: string;
  code: string;
  name: string;
  email?: string;
  phone?: string;
}

export const currencySelectOptions = currencyOptions.map((c) => ({
  value: c,
  label: c,
}));

export const taxCategoryOptions = ["Export", "Non-Export", "LPO"] as const;
export type TaxCategory = (typeof taxCategoryOptions)[number];

export const taxCategorySelectOptions = taxCategoryOptions.map((t) => ({
  value: t,
  label: t === "Non-Export" ? "Non-Export" : t === "Export" ? "Export" : "LPO",
}));
