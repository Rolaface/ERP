import { createSalesSiFromSo } from "../api/SalesOrder/salesOrderAPi";
import { getSalesInvoiceById } from "../api/salesApi";
import { openInvoiceModal } from "../store/modalStore";
import { REFRESH_KEYS } from "../store/dataRefreshStore";
import type { ModalContext } from "../store/modalStore";

export interface DocumentConversionConfig {
  confirmTitle: string;
  confirmText: (sourceId: string) => string;
  confirmButtonText?: string;
  confirmButtonColor?: string;
  loadingMessage: string;
  successMessage: string;
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
    successMessage: "Sales Invoice created successfully",
    createFn: createSalesSiFromSo,
    extractStatusCode: (res) => res?.message?.status_code || res?.status_code,
    extractCreatedId: (res) =>
  res?.message?.data?.id || res?.data?.id,
    getByIdFn: getSalesInvoiceById,
    openModalFn: (detail, _id, context) =>
      detail && openInvoiceModal(detail, true, context),
    refreshKeys: [REFRESH_KEYS.INVOICE_LIST],
  },

//-other modules
};

export type ConversionKey = keyof typeof DOCUMENT_CONVERSIONS;