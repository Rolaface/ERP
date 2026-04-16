import React, { useState } from "react";
import { MinimizableModal } from "../../components/common/MinimizableModal";
import CreditNoteInvoiceLikeForm from "./CreditNoteForm";
import { FileMinus } from "lucide-react";
import { Button } from "../../components/ui/modal/formComponent";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: any) => void;
  invoiceId: string;
  modalId?: string;
}

const CreateCreditNoteModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSubmit,
  invoiceId,
  modalId,
}) => {
  const [saving, setSaving] = useState(false);
  const resolvedModalId = modalId || `credit-note-create-${Date.now()}`;

  const footerContent = (
    <>
      <Button variant="secondary" onClick={onClose} type="button">
        Cancel
      </Button>

      <Button
        variant="primary"
        type="submit"
        form="credit-note-form"
        disabled={saving}
      >
        {saving ? "Saving..." : "Create Credit Note"}
      </Button>
    </>
  );

  return (
    <MinimizableModal
      modalId={resolvedModalId}
      isOpen={isOpen}
      onClose={onClose}
      title="Create Credit Note"
      subtitle="Sales Invoice Adjustment"
      footer={footerContent}
      icon={FileMinus}
      maxWidth="6xl"
      height="82vh"
    >
      <CreditNoteInvoiceLikeForm
        onSubmit={onSubmit}
        invoiceId={invoiceId}
        saving={saving}
        setSaving={setSaving}
      />
    </MinimizableModal>
  );
};

export default CreateCreditNoteModal;
