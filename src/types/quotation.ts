// export interface QuotationItem {
//   itemCode: string;
//   itemName: string;
//   quantity: number;
//   rate: number;
//   amount: number;
// }


export interface QuotationItem {
  productName: string;
  description: string;
  quantity: number;
  listPrice: number;
  discount: number;
  tax: number;
}

export interface QuotationSummary {
  quotationNumber: string;
  customerName: string;
  industryBases?: string;
  transactionDate: string;
  validTill: string;
  grandTotal: number;
  currency: string;
  status: string;
}

// export interface QuotationData {
//   quotationNumber: string;
//   customerName: string;
//   currency: string;

//   industryType?: string;

//   transactionDate: string;
//   validTill: string;

//   grandTotal: number;

//   termsAndConditionsId?: string;

//   swift?: string;
//   bankName?: string;
//   paymentTerms?: string;
//   paymentMethod?: string;
//   accountNumber?: string;
//   routingNumber?: string;

//   billingAddressLine1?: string;
//   billingAddressLine2?: string;
//   billingCity?: string;
//   billingPostalCode?: string;

//   items: QuotationItem[];         // List of items
// }
export interface QuotationData {
  id?: string; // Added for table
  quotationId?: string;
  quotationNumber?: string;
  customerName: string;
  quotationDate: string;
  validUntil: string;
  currency: string;
  billingAddressLine1?: string;
  billingAddressLine2?: string;
  billingCity?: string;
  billingState?: string;
  billingPostalCode?: string;
  billingCountry?: string;

  shippingAddressLine1?: string;
  shippingAddressLine2?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingPostalCode?: string;
  shippingCountry?: string;

  items: QuotationItem[];

  subTotal: number;
  totalDiscount: number;
  totalTax: number;
  adjustment: number;
  grandTotal: number;

  amount?: number; // Added for table
  opportunityStage?: string; // Added for table

  subject?: string;
  poNumber?: string;
  poDate?: string;
  paymentTerms?: string;
  termsAndConditions?: string;
  notes?: string;

  bankName?: string;
  accountNumber?: string;
  routingNumber?: string;
  iban?: string;
  swiftCode?: string;
}


export type QuotationStatus =
  | "Draft"
  | "Sent"
  | "Overdue";

export const quotationStatusOptions = [
  { value: "Draft", label: "Draft" },
  { value: "Sent", label: "Sent" },
  { value: "Overdue", label: "Overdue" },
] as const;