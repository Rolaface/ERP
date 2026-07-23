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

export const openItemModal = createModalOpener("item");
export const openItemCategoryModal = createModalOpener("itemCategory");
export const openWarehouseModal = createModalOpener("warehouse");
export const openStockCorrectionModal = createModalOpener("stockCorrection");

export const openImportInventoryModal = (
  initialData?: unknown,
  context?: ModalContext,
  meta?: ModalMeta,
) =>
  useModalStore
    .getState()
    .openModal("importInventory", initialData, false, context, meta);