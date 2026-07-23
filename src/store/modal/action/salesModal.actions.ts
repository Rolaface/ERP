import { useModalStore } from "../../../store/modalStore";
import type { ModalContext, ModalMeta, ModalType } from "../../../types/modal_store_types/modalTypes";

const createModalOpener =
  (type: ModalType) =>
  (
    initialData?: unknown,
    isEdit = false,
    context?: ModalContext,
    meta?: ModalMeta,
  ) =>
    useModalStore.getState().openModal(type, initialData, isEdit, context, meta);

export const openInvoiceModal = createModalOpener("invoice");
export const openProformaModal = createModalOpener("proforma");
export const openQuotationModal = createModalOpener("quotation");
export const openSalesOrderModal = createModalOpener("salesOrder");
export const openCreditNoteModal = createModalOpener("CreditNote");
export const openSalesDebitNoteModal = createModalOpener("SalesDebitNote");
export const openDebitNoteModal = createModalOpener("DebitNote");
// export const openRfqModal = createModalOpener("Rfq");
export const openCustomerModal = createModalOpener("customer");