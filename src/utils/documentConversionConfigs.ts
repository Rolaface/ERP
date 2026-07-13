import { createSalesSiFromSo, createPiFromSo, getSalesOrderById } from "../api/SalesOrder/salesOrderAPi";
import { getSalesInvoiceById } from "../api/salesApi";
import { createSiFromQuotation, createSoFromQuotation, getProformaInvoiceById, createPiFromQuotation} from "../api/proformaInvoiceApi";
import { openInvoiceModal, openSalesOrderModal, openProformaModal, openCreditNoteModal } from "../store/modalStore";
import {getCreditNoteById} from "../api/CreditNoteapi";
import { createCnFromSalesInvoice } from "../api/salesApi";
import { REFRESH_KEYS } from "../store/dataRefreshStore";
import type { ModalContext } from "../store/modalStore";

export interface DocumentConversionConfig {
  confirmTitle: string;
  confirmText: (sourceId: string) => string;
  confirmButtonText?: string;
  confirmButtonColor?: string;
  loadingMessage: string;
  // successMessage: string;
  successMessage: (sourceId: string, createdId: string) => string;
  createFn: (sourceId: string) => Promise<any>;
  extractStatusCode: (res: any) => number | undefined;
  extractCreatedId: (res: any) => string | undefined;
  extractErrorMessage?: (res: any) => string | undefined;
  getByIdFn?: (id: string) => Promise<any>;
  extractDetail?: (res: any) => any;
  openModalFn: (detail: any, createdId: string, context?: ModalContext) => void;
  refreshKeys: string[];
}

export const DOCUMENT_CONVERSIONS: Record<string, DocumentConversionConfig> = {
  soToSi: {
    confirmTitle: "Create Sales Invoice?",
    confirmText: (soId) => `Create a Sales Invoice from ${soId}?`,
    loadingMessage: "Creating Sales Invoice...",
    // successMessage: "Sales Invoice created successfully",
     successMessage: (soId, createdId) =>
      `Sales Invoice ${createdId} created successfully from Sales Order ${soId}`,
    createFn: createSalesSiFromSo,
    extractStatusCode: (res) => res?.message?.status_code || res?.status_code,
    extractCreatedId: (res) =>
  res?.message?.data?.id || res?.data?.id,
    getByIdFn: getSalesInvoiceById,
    openModalFn: (detail, _id, context) =>
      detail && openInvoiceModal(detail, true, context),
    refreshKeys: [REFRESH_KEYS.INVOICE_LIST],
  },

  quoteToSi: {
  confirmTitle: "Create Sales Invoice?",
  confirmText: (quotationId) => `Create a Sales Invoice from ${quotationId}?`,
  loadingMessage: "Creating Sales Invoice...",
  // successMessage: "Sales Invoice created successfully",
  successMessage: (quotationId, createdId) =>
    `Sales Invoice ${createdId} created successfully from Quotation ${quotationId}`,
  createFn: createSiFromQuotation,
  extractStatusCode: (res) => res?.message?.status_code || res?.status_code,
  extractCreatedId: (res) => res?.message?.data?.id || res?.data?.id,
  getByIdFn: getSalesInvoiceById,
  openModalFn: (detail, _id, context) =>
    detail && openInvoiceModal(detail, true, context),
  refreshKeys: [REFRESH_KEYS.INVOICE_LIST],
},

proformaToSi: {
  confirmTitle: "Create Sales Invoice?",
  confirmText: (proformaId) => `Create a Sales Invoice from ${proformaId}?`,
  loadingMessage: "Creating Sales Invoice...",
  // successMessage: "Sales Invoice created successfully",
  successMessage: (proformaId, createdId) =>
    `Sales Invoice ${createdId} created successfully from Proforma Invoice ${proformaId}`,
  createFn: createSiFromQuotation,
  extractStatusCode: (res) => res?.message?.status_code || res?.status_code,
  extractCreatedId: (res) => res?.message?.data?.id || res?.data?.id,
  getByIdFn: getSalesInvoiceById,
  openModalFn: (detail, _id, context) =>
    detail && openInvoiceModal(detail, true, context),
  refreshKeys: [REFRESH_KEYS.INVOICE_LIST],
},


quoteToSo: {
  confirmTitle: "Create Sales Order?",
  confirmText: (quotationId) => `Create a Sales Order from ${quotationId}?`,
  loadingMessage: "Creating Sales Order...",
  successMessage: (quotationId, createdId) =>
    `Sales Order ${createdId} created successfully from Quotation ${quotationId}`,
  createFn: createSoFromQuotation,
  extractStatusCode: (res) => res?.message?.status_code || res?.status_code,
  extractCreatedId: (res) => res?.message?.data?.id || res?.data?.id,
  getByIdFn: getSalesOrderById,
  openModalFn: (detail, _id, context) =>
    detail && openSalesOrderModal(detail, true, context),
  refreshKeys: [REFRESH_KEYS.SALES_ORDER_LIST],
},
quoteToProforma: {
  confirmTitle: "Create Proforma Invoice?",
  confirmText: (quotationId) => `Create a Proforma Invoice from ${quotationId}?`,
  loadingMessage: "Creating Proforma Invoice...",
  successMessage: (quotationId, createdId) =>
    `Proforma Invoice ${createdId} created successfully from Quotation ${quotationId}`,
  createFn: createPiFromQuotation,
  extractStatusCode: (res) => res?.message?.status_code || res?.status_code,
  extractCreatedId: (res) => res?.message?.data?.id || res?.data?.id,
  getByIdFn: getProformaInvoiceById,
  openModalFn: (detail, _id, context) =>
    detail && openProformaModal(detail, true, context),
  refreshKeys: [REFRESH_KEYS.PROFORMA_LIST],
},

soToProforma: {
  confirmTitle: "Create Proforma Invoice?",
  confirmText: (soId) => `Create a Proforma Invoice from ${soId}?`,
  loadingMessage: "Creating Proforma Invoice...",
  successMessage: (soId, createdId) =>
    `Proforma Invoice ${createdId} created successfully from Sales Order ${soId}`,
  createFn: createPiFromSo,
  extractStatusCode: (res) => res?.message?.status_code || res?.status_code,
  extractCreatedId: (res) => res?.message?.data?.id || res?.data?.id,
  getByIdFn: getProformaInvoiceById,
  openModalFn: (detail, _id, context) =>
    detail && openProformaModal(detail, true, context),
  refreshKeys: [REFRESH_KEYS.PROFORMA_LIST],
},

siToCreditNote: {
  confirmTitle: "Create Credit Note?",
  confirmText: (siId) => `Create a Credit Note from ${siId}?`,
  loadingMessage: "Creating Credit Note...",
  successMessage: (siId, createdId) =>
    `Credit Note ${createdId} created successfully from Sales Invoice ${siId}`,
  createFn: createCnFromSalesInvoice,
  extractStatusCode: (res) => res?.message?.status_code || res?.status_code,
  extractCreatedId: (res) => res?.message?.data?.id || res?.data?.id,
  getByIdFn: getCreditNoteById,
  openModalFn: (detail, _id, context) =>
    detail && openCreditNoteModal(detail, true, context),
  refreshKeys: [REFRESH_KEYS.CREDIT_NOTE_LIST],
},
};

export type ConversionKey = keyof typeof DOCUMENT_CONVERSIONS;