import type { TermSection } from "./termsAndCondition";

export interface Invoice {
  invoiceNumber?: string;
  customerId: string;
  currencyCode: string;
  exchangeRt: string;
  dateOfInvoice: string;
  dueDate: string;
  invoiceType: string;
  destnCountryCd?: string;
  lpoNumber?: string;

  billingAddress: Address;
  shippingAddress: Address;
  paymentInformation: PaymentInformation;
  industryBases?: string;
  items: InvoiceItem[];
  terms: InvoiceTerms;
}

export interface InvoiceSummary {
  invoiceNumber: string;
  customerName: string;
  receiptNumber: string;
  currency: string;
  exchangeRate: string;
  dueDate: string | null;
  dateOfInvoice: Date;
  timeOfInvoice?: string;
  invoiceDateTime?: Date;
  total: number;
  totalTax: string;
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
  _priceZmw?: number;
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
