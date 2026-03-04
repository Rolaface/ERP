import type { TermSection } from "../termsAndCondition";

/*  SUPPLIER  */

export interface SupplierRow {
  supplier: string;
  contact: string;
  email: string;
  sendEmail: boolean;
}

/*  ITEMS  */

export interface ItemRow {
  itemCode: string;
  requiredDate: string;
  quantity: number;
  uom: string;
  warehouse: string;
}

/*  PAYMENT ROWS  */
/* 👉 Optional — keep only if RFQ payment table needed */

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

/*  EMPTY ROWS  */

export const emptySupplier: SupplierRow = {
  supplier: "",
  contact: "",
  email: "",
  sendEmail: true,
};

export const emptyItem: ItemRow = {
  itemCode: "",
  requiredDate: new Date().toISOString().split("T")[0],
  quantity: 0,
  uom: "",
  warehouse: "",
};

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
