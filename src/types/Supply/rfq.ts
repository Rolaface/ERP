

import type { TermSection } from "../termsAndCondition";

export type SupplierRow = {
  supplier: string;       
  supplierName: string;  
  contact: string;        
  email: string;     
  sendEmail: boolean;
};
 
export type ItemRow = {
  itemCode: string;           
  itemName: string;          
  description: string;
  uom: string;            
  warehouse: string;         
  quantity: number;
  requiredDate: string;
  conversionFactor: number;
};
 
export const emptySupplier: SupplierRow = {
  supplier: "",
  supplierName: "",
  contact: "",
  email: "",
  sendEmail: true,
};
 
export const emptyItem: ItemRow = {
  itemCode: "",
  itemName: "",
  description: "",
  uom: "",
  warehouse: "",
  quantity: 1,
  requiredDate: "",
  conversionFactor: 1,
};
 
export interface PaymentRow {
  paymentTerm: string;
  description: string;
  dueDate: string;
  invoicePortion: number;
  paymentAmount: number;
}

/*  RFQ FORM  */

export interface RfqFormData {
  rfqNumber: string;
  requestDate: string;
  quoteDeadline: string;
  status: string;

  suppliers: SupplierRow[];
  items: ItemRow[];

  paymentRows: PaymentRow[];


  terms?: {
    buying: TermSection;
  };

  /*  EMAIL TEMPLATE  */

  templateName: string;
  templateType: string;
  subject: string;
  messageHtml: string;
  sendAttachedFiles: boolean;
  sendPrint: boolean;
}


export const emptyPaymentRow: PaymentRow = {
  paymentTerm: "",
  description: "",
  dueDate: "",
  invoicePortion: 0,
  paymentAmount: 0,
};

/*  EMPTY TERMS  */


export const emptyTerms: TermSection = {
  general: "",
  payment: {
    phases: [],
    dueDates: "",
    lateCharges: "",
    taxes: "",
    notes: "",
  },
  delivery: "",
  cancellation: "",
  warranty: "",
  liability: "",
};

/* ================= EMPTY RFQ FORM ================= */

export const emptyRfqForm: RfqFormData = {
  rfqNumber: "PUR-RFQ-",
  requestDate: new Date().toISOString().split("T")[0],
  quoteDeadline: "",
  status: "Draft",
  suppliers: [{ ...emptySupplier }],
  items: [{ ...emptyItem }],
  paymentRows: [{ ...emptyPaymentRow }],
  terms: {
    buying: { ...emptyTerms },
  },

  /*  EMAIL  */

  templateName: "",
  templateType: "Quote Email",
  subject: "",
  messageHtml: "",

  sendAttachedFiles: true,
  sendPrint: false,
};

/*  TABS  */

export type RfqTab = "details" | "emailTemplates" | "terms";
