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

export const openSupplierModal = createModalOpener("supplier");

export const openPurchaseOrderModal = (
  poId?: string | number,
  context?: ModalContext,
  meta?: ModalMeta,
) =>
  useModalStore
    .getState()
    .openModal("purchaseOrder", { poId }, !!poId, context, meta);

export const openPurchaseInvoiceModal = (
  pId?: string | number,
  context?: ModalContext,
  meta?: ModalMeta,
) =>
  useModalStore
    .getState()
    .openModal("purchaseInvoice", { pId }, !!pId, context, meta);

export const openRfqModal = createModalOpener("Rfq");

export const openScanPIModal = (
  pId?: string,
  context?: ModalContext,
  meta?: ModalMeta,
) =>
  useModalStore
    .getState()
    .openModal("scanPI", { pId }, !!pId, context, meta);