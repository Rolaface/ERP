import type { TermSection } from "../termsAndCondition";

export interface SupplierContact {
  id: string;
  firstName: string;
  middleName?: string;
  lastName?: string;
  fullName: string;
  salutation?: string;
  gender?: string;
  companyName?: string;
  status: string;            
  email: string;
  mobile: string;
  phone?: string;
  designation?: string;
  department?: string;
  isPrimary: boolean;
  isBilling: boolean;
}

export interface SupplierAddress {
  id?: string;
  type: "Billing" | "Shipping" | string;
  line1: string;
  line2?: string;
  city?: string;
  county?: string;           // district / county — NOT the same as country
  state?: string;
  postalCode?: string;
  country?: string;          // actual country name
  isPrimary?: boolean;
  isShipping?: boolean;
}

export interface PaymentPhase {
  id: string;
  name: string;
  percentage: string | number;
  condition?: string;
  credit_days?: string | number;
}

export interface SupplierPaymentTerms {
  phases: PaymentPhase[];
  dueDates?: string;
  lateCharges?: string;
  taxes?: string;
  notes?: string;
}

export interface BuyingTerms {
  general?: string;
  delivery?: string;
  cancellation?: string;
  warranty?: string;
  liability?: string;
  payment: SupplierPaymentTerms;
}


export interface SupplierFormData {
  id?: string;
  supplierId?: string;
  supplierName?: string;
  supplierCode?: string;
  taxCategory: string;
  paymentTerms: string;
  currency?: string;
  type?: string;
  supplierGroup?: string;
  status?: string;
  tpin?: string;
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
  contacts?: SupplierContact[];
  addresses?: SupplierAddress[];
  terms?: {
    buying?: BuyingTerms | TermSection;
    Buying?: BuyingTerms; 
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

// ─── STORE TYPE (union of form data + API-only fields) ───────────────────────

export type Supplier = SupplierFormData & {
  name?: string;                
  createdAt?: string;           
  supplierTaxCategory?: string;
};


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



export type SupplierTab    = "supplier" | "payment" | "address" | "terms";
export type SupplierStatus = "active" | "inactive";

export interface Supplierr {
  id: string;
  code: string;
  name: string;
  email?: string;
  phone?: string;
}