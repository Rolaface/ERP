import type { TermSection } from "./termsAndCondition";

export interface ProformaInvoice {
  proformaId?: string;
  customerId: string;
  currencyCode: string;
  exchangeRt: string;
  dateOfInvoice: string;
  dueDate: string;
  invoiceType: string;
  destnCountryCd?: string;
  lpoNumber?: string;
  receipt?: string;
  receiptNo?: string;

  billingAddress: Address;
  shippingAddress: Address;
  paymentInformation: PaymentInformation;

  items: InvoiceItem[];
  terms: InvoiceTerms;
}

export interface ProformaInvoiceSummary {
  proformaId: string;
  customerName: string;
  currency: string;
  exchangeRate: string;
  dueDate: string | null;
  totalAmount: number;
  createdAt: Date;
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
  vatRate: string | number;
  price: number;
  vatCode: string;
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
