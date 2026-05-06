import { TermSection } from "../termsAndCondition";

export interface ItemRow {
  itemCode: string;
  itemName?: string;
  quantity: number;
  uom: string;
  rate: number;
  vatCd: string;
  vatRate: number;
  taxTypes?: string[];
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
  id:string;
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
  advanceAmount?: number;
  warehouse?: string;
  poNumber: string;
  date: string;
  supplier: string;
  supplierId: string;
  supplierEmail?: string;
  supplierPhone?: string;
  updateStock?: boolean;

  supplierCode: string;
  taxCategory: string;
  supplierContact: string;
  supplierContactDisplay?: string;
  paymentType: string;
  transactionProgress: string;
  supplierInvoiceNumber: string;
  supplierInvoiceDate: string;

  destnCountryCd: string; 
  shippingRule: string;
  incoterm: string;
  taxesChargesTemplate: string;
  currency: string;
  status: string;
  costCenter: string;
  project: string;
  useSupplierAddress?: boolean;
  useDispatchAddress?: boolean;
  useShippingAddress?: boolean;
  useCompanyBillingAddress?: boolean;
  selectedSupplierAddressIds: [];

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
  totalDiscount?: number;

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
  uom: "",
  rate: 0,
  vatCd: "",
  vatRate: 0,
  taxTypes: [],
  description: "",
  packing: "",
  packingUnit: 0,
  packingSize: 0,
  batchNo: "",
  mfgDate: "",
  expDate: "",
  discount: 0,
  warehouse: "",
  requiresBatch: false,
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
  id: "",
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
  supplierContactDisplay: "",
  taxCategory: "",
  currency: "",
  status: "Draft",
  destnCountryCd: "",
  shippingRule: "",
  incoterm: "",
  taxesChargesTemplate: "",
  supplierInvoiceNumber: "",
  supplierInvoiceDate: "",
  paymentType: "",
  transactionProgress: "APPROVED",
  updateStock: true,
  costCenter: "",
  project: "",
  useSupplierAddress: true,
  useDispatchAddress: true,
  useShippingAddress: true,
  useCompanyBillingAddress: true,
  selectedSupplierAddressIds: [],

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
  warehouse: "",
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
