import { TermSection } from "../termsAndCondition";

export interface ItemRow {
  itemCode: string;
  itemName?: string;
  quantity: number;
  uom: string;
  rate: number;
  vatCd: string;
  vatRate: number;
  description?: string;
  packing?: string;
  batchNo?: string;
  mfgDate?: string;
  expDate?: string;
  discount?: number;
  packingUnit?: number;
packingSize?: number;
requiresBatch?: boolean; 
warehouse?: string;
  
}


export interface TaxRow {
  type: string;
  accountHead: string;
  taxRate: number;
  amount: number;
}
export interface ItemTerms {
  termName: string;
  description: string;
  isMandatory: boolean;
  itemCode?: string; // Track which item this term came from
}
export interface PaymentRow {
  paymentTerm: string;
  description: string;
  dueDate: string;
  invoicePortion: number;
  paymentAmount: number;
}

export type AddressBlock = {
  addressTitle: string;
  addressType: "Billing" | "Shipping";
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  phone?: string;
  email?: string;
};

export interface PurchaseInvoiceFormData {
  poNumber: string;
  date: string;
  supplier: string;
  supplierId: string;
  supplierEmail?: string;
  supplierPhone?: string;


  supplierCode: string;
  taxCategory: string;
  supplierContact: string;
  paymentType: string;
  transactionProgress: string;
  supplierInvoiceNumber: string;

  destnCountryCd: string; // New field for Export country
  shippingRule: string;
  incoterm: string;
  taxesChargesTemplate: string;
  currency: string;
  status: string;
  costCenter: string;
  project: string;

  addresses: {
    supplierAddress: AddressBlock;
    dispatchAddress: AddressBlock;
    shippingAddress: AddressBlock;
    companyBillingAddress: AddressBlock;
  };

  placeOfSupply: string;
  paymentTermsTemplate: string;

  totalQuantity: number;
  grandTotal: number;
  totalTax: number;
subTotal: number;

  roundedTotal: number;
  items: ItemRow[];
  taxRows: TaxRow[];

  templateName: string;
  templateType: string;
  subject: string;
  messageHtml: string;
  sendAttachedFiles: boolean;
  sendPrint: boolean;

  terms?: {
    buying: TermSection;
  };
  itemTerms: ItemTerms[];
  acceptedTerms: Record<string, boolean>;
  paymentRows: PaymentRow[];
}

export const emptyItem: ItemRow = {
  itemCode: "",
  itemName: "",
  quantity: 1,
  uom: "Unit",
  rate: 0,
  vatCd: "",
  vatRate: 0,
  description: "",
  packing: "",
  batchNo: "",
  mfgDate: "",
  expDate: "",
  discount: 0,
};


export const emptyTaxRow: TaxRow = {
  type: "",
  accountHead: "",
  taxRate: 0,
  amount: 0,
};

export const emptyPaymentRow: PaymentRow = {
  paymentTerm: "",
  description: "",
  dueDate: "",
  invoicePortion: 0,
  paymentAmount: 0,
};

export const emptyAddress: AddressBlock = {
  addressTitle: "",
  addressType: "Billing",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  country: "",
  postalCode: "",
  phone: "",
  email: "",
};

export const emptyPOForm: PurchaseInvoiceFormData = {
  poNumber: "",
  date: "",
  supplier: "",
  supplierContact: "",
  taxCategory: "",
  currency: "INR",
  status: "Draft",
  destnCountryCd: "",
  shippingRule: "STANDARD",
  incoterm: "EXW",
  taxesChargesTemplate: "",
  supplierInvoiceNumber: "",
  paymentType: "",
  transactionProgress: "",

  costCenter: "UD-001 - Udvil - RI",
  project: "Project-0001",

  addresses: {
    supplierAddress: {
      ...emptyAddress,
      addressTitle: "Supplier Main Address",
      addressType: "Billing",
    },
    dispatchAddress: {
      ...emptyAddress,
      addressTitle: "Warehouse Dispatch",
      addressType: "Shipping",
    },
    shippingAddress: {
      ...emptyAddress,
      addressTitle: "Customer Delivery Address",
      addressType: "Shipping",
    },
    companyBillingAddress: {
      ...emptyAddress,
      addressTitle: "Company HQ Billing",
      addressType: "Billing",
    },
  },

  placeOfSupply: "",
  supplierId: "",
  supplierCode: "",

  paymentTermsTemplate: "",
  totalQuantity: 0,
  grandTotal: 0,
  subTotal: 0,
  roundedTotal: 0,
  totalTax: 0,


  items: [{ ...emptyItem }],
  taxRows: [], // Start with empty array, user can add as needed
  paymentRows: [], // Start with empty array, user can add as needed

  templateName: "",
  templateType: "",
  subject: "",
  messageHtml: "",
  sendAttachedFiles: false,
  sendPrint: false,
  terms: undefined,
  itemTerms: [],
  acceptedTerms: {},
};

export type POTab = "details" | "email" | "tax" | "address" | "terms";