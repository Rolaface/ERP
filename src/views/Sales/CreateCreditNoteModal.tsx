import React, { useState } from "react";
import Modal from "../../components/ui/modal/modal";
import CreditNoteInvoiceLikeForm from "./CreditNoteForm";
import { FileMinus } from "lucide-react";
import { Button } from "../../components/ui/modal/formComponent";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: any) => void;
  invoiceId: string;
}

const CreateCreditNoteModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSubmit,
  invoiceId,
}) => {
  const [saving, setSaving] = useState(false);

  const footerContent = (
    <>
      <Button
        variant="secondary"
        onClick={onClose}
        type="button"
        disabled={saving}
      >
        Cancel
      </Button>

      <Button
        variant="primary"
        type="submit"
        form="credit-note-form"
        loading={saving}
      >
        {saving ? "Saving..." : "Create Credit Note"}
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Credit Note"
      subtitle="Sales Invoice Adjustment"
      footer={footerContent}
      icon={FileMinus}
      maxWidth="wide"
      height="82vh"
    >
      <CreditNoteInvoiceLikeForm
        onSubmit={onSubmit}
        invoiceId={invoiceId}
        saving={saving}
        setSaving={setSaving}
      />
    </Modal>
  );
};

export default CreateCreditNoteModal;
