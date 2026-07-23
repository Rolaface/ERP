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

export const openKRAModal = createModalOpener("KRA");
export const openFeedbackModal = createModalOpener("feedback");
export const openAppraisalCycleModal = createModalOpener("appraisalCycle");
export const openAppraisalModal = createModalOpener("appraisal");
export const openEmployeeFeedbackModal = createModalOpener("employeeFeedback");