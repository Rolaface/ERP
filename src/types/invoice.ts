import type { TermSection } from "./termsAndCondition";


export type InvoiceStatus =
  | "Draft"
  | "Rejected"
  | "Paid"
  | "Cancelled"
  | "Approved";


export interface Invoice {
  invoiceNumber?: string;
  customerId: string;
  currencyCode: string;
  exchangeRt: string;
  dateOfInvoice: string;
  dueDate: string;
  invoiceStatus: InvoiceStatus;
  invoiceType: string;
  destnCountryCd?: string;
  lpoNumber?: string;
   updateStock?: boolean
  warehouse?: string
  billingAddress: Address;
  shippingAddress: Address;
  paymentInformation: PaymentInformation;
  industryBases?: string;
  items: InvoiceItem[];
  terms: InvoiceTerms;
}

export interface InvoiceSummary {
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  receiptNumber: string;
  currency: string;
  exchangeRate: string;
  dueDate: string | null;
  dateOfInvoice: Date;
  total: number;
  OutStandingAmount: number;
  totalDiscount: string;
  totalTax: string;
  invoiceStatus: InvoiceStatus;
  invoiceTypeParent: string;
  invoiceType: string;
}

export interface Address {
  line1: string;
  line2: string;
  postalCode: string;
  city: string;
  state: string;
  country: string;
}

export interface InvoiceItem {
  itemCode: string;
  quantity: number;
  description: string;
  discount: number;
  vatRate: number;
  price: number;
  vatCode: string;
  _fromInvoice?: boolean;
  batchNo?: string;
  packingUnit?: string;
  packingSize?: string;
  mfgDate?: string;
  expDate?: string;
 boxStart?: number;
  boxEnd?: number;
qty?: number;
availableQty?: number;
warehouse?: string;
}

export interface PaymentInformation {
  paymentTerms: string;
  paymentMethod: string;
  bankName: string;
  accountNumber: string;
  routingNumber: string;
  swiftCode: string;
}

export interface InvoiceTerms {
  selling: TermSection;
}
