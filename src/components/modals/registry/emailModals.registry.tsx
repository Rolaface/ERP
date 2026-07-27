import { lazy } from "react";
import { getModalSeedValue, isRecord } from "../modalHelpers";
import type { ModalRenderFn } from "./registryTypes";

const EmailTemplateModal = lazy(() => import("../../Email/EmailTemplatemodal"));
const SendEmailModal = lazy(() => import("../../common/SendEmailModal"));

export const emailModalsRegistry: Record<string, ModalRenderFn> = {
  emailTemplate: (modal, context, { handleClose, handleSubmit }) => (
    <EmailTemplateModal
      key={modal.id}
      modalId={modal.id}
      isOpen={true}
      onClose={handleClose}
      onSubmit={handleSubmit}
      templateId={getModalSeedValue(modal.initialData, "templateId") as string | undefined}
      isViewMode={context?.isViewMode ?? false}
    />
  ),

  sendEmail: (modal, _context, { handleClose }) => {
    const d = isRecord(modal.initialData) ? modal.initialData : {};
    return (
      <SendEmailModal
        key={modal.id}
        modalId={modal.id}
        open={true}
        onClose={handleClose}
        docType={d.docType as any}
        isProforma={d.isProforma as boolean | undefined}
        invoiceNumber={d.invoiceNumber as string | undefined}
        contactEmail={d.contactEmail as string | null | undefined}
        customerName={d.customerName as string | null | undefined}
        supplierName={d.supplierName as string | null | undefined}
        invoiceAttachments={d.invoiceAttachments as any}
        periodText={d.periodText as string | undefined}
      />
    );
  },
};