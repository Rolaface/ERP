import { useModalStore } from "../../../store/modalStore";
import type { ModalContext, ModalMeta, ModalType } from "../../../types/modal_store_types/modalTypes";

export const openEmailTemplateModal = (
  templateId?: string,
  context?: ModalContext,
  meta?: ModalMeta,
) =>
  useModalStore
    .getState()
    .openModal("emailTemplate", { templateId }, !!templateId, context, meta);

export const openSendEmailModal = (
  initialData?: unknown,
  context?: ModalContext,
  meta?: ModalMeta,
) =>
  useModalStore
    .getState()
    .openModal("sendEmail", initialData, false, context, meta);