import type { InvoiceItem, InvoiceTerms } from "../types/invoice";

export const EMPTY_ITEM: InvoiceItem = {
  itemCode: "",
  description: "",
  quantity: 0,
  price: 0,
  discount: 0,
  vatRate: 0,
  vatCode: "",
  packingUnit: "",
  packingSize: "",
  mfgDate: "",
  expDate: "",
  boxStart:0,
  boxEnd: 0,
  batchNo: "",
};

export const EMPTY_TERMS: InvoiceTerms = {
  selling: {
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
  },
};
export const paymentMethodOptions = [
  { value: "01", label: "CASH" },
  { value: "02", label: "CREDIT" },
  { value: "03", label: "CASH / CREDIT" },
  { value: "04", label: "BANK CHECK" },
  { value: "05", label: "DEBIT & CREDIT CARD" },
  { value: "06", label: "MOBILE MONEY" },
  { value: "07", label: "OTHER" },
  { value: "08", label: "BANK TRANSFER" },
] as const;

export const getPaymentMethodLabel = (code?: string) =>
  paymentMethodOptions.find((p) => p.value === code)?.label ?? "UNKNOWN";

import type { Invoice } from "../types/invoice";

export const DEFAULT_INVOICE_FORM: Invoice = {
  customerId: "",
  currencyCode: "",
  exchangeRt: "1",
  dateOfInvoice: "",
  dueDate: "",
  invoiceStatus: "Draft",
  invoiceType: "Non-Export",
  destnCountryCd: "",
  lpoNumber: "",

  billingAddress: {
    line1: "",
    line2: "",
    postalCode: "",
    city: "",
    state: "",
    country: "",
  },

  shippingAddress: {
    line1: "",
    line2: "",
    postalCode: "",
    city: "",
    state: "",
    country: "",
  },

  paymentInformation: {
    paymentTerms: "",
    paymentMethod: paymentMethodOptions[0].value,
    bankName: "",
    accountNumber: "",
    routingNumber: "",
    swiftCode: "",
  },

  items: [{ ...EMPTY_ITEM }],
  terms: {
    selling: {
      payment: {
        phases: [],
      },
    },
  },
};


/* =========================
   INVOICE STATUS
========================= */

export const invoiceStatusOptions = [
  { value: "Draft", label: "Draft" },
  { value: "Sent", label: "Sent" },
  { value: "Paid", label: "Paid" },
  { value: "Overdue", label: "Overdue" },
] as const;

export const invoiceTypeOptions = [
  { value: "LPO", label: "LPO" },
  { value: "Export", label: "Export" },
  { value: "Non-Export", label: "Non Export" },
] as const;

export const currencyOptions = [
  { value: "ZMW", label: "ZMW (ZK)" },
  { value: "USD", label: "USD ($)" },
  { value: "ZAR", label: "ZAR (R)" },
  { value: "GBP", label: "GBP (£)" },
  { value: "CNY", label: "CNY (¥)" },
  { value: "EUR", label: "EUR (€)" },
  { value: "INR", label: "INR (₹)" },
  { value: "GHS", label: "GHS (₵)" },
] as const;

export const currencySymbols: Record<string, string> = {
  ZMW: "ZK",
  INR: "₹",
  USD: "$",
  ZAR: "R",
  GBP: "£",
  CNY: "¥",
  EUR: "€",
};

export const ITEMS_PER_PAGE = 5;

