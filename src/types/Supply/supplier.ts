import type { TermSection } from "../termsAndCondition";

export interface SupplierFormData {
  tpin?: string;
  id?: string;
  supplierName?: string;
  supplierCode?: string;
  taxCategory: string;
  paymentTerms: string;
  currency?: string;
  type?: string; //
  supplierGroup?: string;
  status?: string; //

  contactPerson?: string;
  phoneCode?: string;
  phoneNo?: string;

  alternateCode?: string;
  alternateNo?: string;
  emailId?: string;

  dateOfAddition?: string;
  openingBalance?: string | number;

  billingAddressLine1?: string;
  billingAddressLine2?: string;
  billingCity?: string;
  district?: string;
  province?: string;
  billingCountry?: string;
  billingCounty?: string;
  billingPostalCode?: string;


  contacts?: any[];
  addresses?: any[];

  terms?: {
    buying?: TermSection;
  };

  bankAccounts?: SupplierBankAccount[];
}
export interface SupplierBankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  sortCode: string;
  swiftCode?: string;
  branchAddress?: string;
  isDefault?: boolean;
}

export const emptySupplierForm: SupplierFormData = {
  tpin: "",
  supplierName: "",
  supplierCode: "",
  taxCategory: "",
  paymentTerms: "",
  currency: "",
  type: "",
  supplierGroup: "",
  status: "",
  contacts: [],
  addresses: [],
  bankAccounts: [],
  contactPerson: "",
  phoneCode: "",
  phoneNo: "",
  alternateCode: "",
  alternateNo: "",
  emailId: "",
  dateOfAddition: "",
  openingBalance: 0,
  billingAddressLine1: "",
  billingAddressLine2: "",
  billingCity: "",
  district: "",
  province: "",
  billingCountry: "",
  billingCounty: "",
  billingPostalCode: "",
  terms: {
    buying: { payment: { phases: [] } },
  },
};

export type SupplierTab = "supplier" | "payment" | "address" | "terms";

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
