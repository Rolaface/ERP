// importDataModal.actions.ts
import { useModalStore } from "../../../store/modalStore"; // apna actual relative path verify kar lena
import type { ModalContext, ModalMeta } from "../../../types/modal_store_types/modalTypes";

export const openImportDataModal = (
  importConfig: ModalContext["importConfig"],
  meta?: ModalMeta,
) =>
  useModalStore
    .getState()
    .openModal("importData", undefined, false, { importConfig }, meta);