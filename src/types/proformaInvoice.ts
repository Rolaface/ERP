import type { TermSection } from "./termsAndCondition";


export type ProformaInvoiceStatus =
  | "Draft"
  | "Paid"
  | "Cancelled"
  | "Approved"
  | "Amend";
// export type InvoiceStatus =
//   | "Draft"
//   | "Rejected"
//   | "Paid"
//   | "Cancelled"
//   | "Approved"
//   | "Amend";


// export interface ProformaInvoice {
//   invoiceNumber?: string;
//   customerId: string;
//   currencyCode: string;
//   exchangeRt: string;
//   dateOfInvoice: string;
//   dueDate: string;
//   taxCategory: string;
//   destnCountryCd?: string;
//   lpoNumber?: string;
//   mode?: string;
//   updateStock?: boolean
//   warehouse?: string
// billingAddress: string;
// shippingAddress: string;
//   paymentInformation: PaymentInformation;
//   industryBases?: string;
//   items: InvoiceItem[];
//   terms: InvoiceTerms;
//  shippingCharges?:number;
//  insuranceCharges?:number;
//   invoiceCharges: {
//     charge_type: string;
//     amount: string;
//     rate:string;
//   }[];
//   taxes?: {
//   chargeType: string;
//   accountHead: string;
//   description?: string;
//   rate: number| null;
//   amount: number;
// }[];
//   salesTaxTemplate:string;
//   addresses?: {
//   companyBillingAddress?: any;
//   supplierAddress?: any;
//   shippingAddress?: any;
//   dispatchAddress?: any;
// };
// }

export interface ProformaInvoice {
  invoiceNumber?: string;
  customerId: string;
  currencyCode: string;
  exchangeRt: string;
  dateOfInvoice: string;
  dueDate: string;
    validTill?: string;
  invoiceStatus?: ProformaInvoiceStatus | string;
  invoiceType?: string; 
  
  taxCategory: string;
  destnCountryCd?: string;
  lpoNumber?: string;
  mode?: string;
  payment_mode?: string;
  updateStock?: boolean;
  warehouse?: string;
  billingAddress: string;
  shippingAddress: string;
  paymentInformation: PaymentInformation;
  industryBases?: string;
  items: InvoiceItem[];
  terms: InvoiceTerms;
  shippingCharges?: number;
  insuranceCharges?: number;
  invoiceCharges: {
    charge_type: string;
    amount: string;
    rate: string;
  }[];
  taxes?: {
    chargeType: string;
    accountHead: string;
    description?: string;
    rate: number | null;
    amount: number;
  }[];
  salesTaxTemplate: string;
  addresses?: {
    companyBillingAddress?: any;
    supplierAddress?: any;
    shippingAddress?: any;
    dispatchAddress?: any;
  };
}
export interface ProformaInvoiceSummary {
  proformaId: string;
  customerName: string;
  currency: string;
  exchangeRate: string;
  validTill: string | null;
  totalAmount: number;
  total: number;
  status: ProformaInvoiceStatus;   
  createdAt: Date;   

  // invoiceNumber: string;
  // customerId: string;
  // receiptNumber: string;
  // dateOfInvoice: Date;
  // total: number;
  // outstandingAmount: number;
  // totalDiscount: string;
  // totalTax: string;
  proformaInvoiceStatus: ProformaInvoiceStatus;
  // invoiceTypeParent: string;
  // invoiceType: string;
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
  vatCd?: string;
  uom?: string;
  unitOfMeasureCd?: string;
  _fromInvoice?: boolean;
  batchNo?: string;
  packingUnit?: string;
  packingSize?: string;
  piecesPerBox?: number;
  mfgDate?: string;
  expDate?: string;
 boxStart?: number;
  boxEnd?: number;
qty?: number;
availableQty?: number;
warehouse?: string;
 isServiceItem?: boolean;
  originalQty?: number;
  _skipCap?: boolean;

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
