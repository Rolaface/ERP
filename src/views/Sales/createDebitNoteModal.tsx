import React, { useState } from "react";
import Modal from "../../components/ui/modal/modal";
import DebitNoteForm from "./debitNoteform";
import { FileMinus } from "lucide-react";
import { Button } from "../../components/ui/modal/formComponent";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: any) => void;
  invoiceId: string;
}

const CreateDebitNoteModal: React.FC<Props> = ({
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
        form="debit-note-form"
        loading={saving}
      >
        {saving ? "Saving..." : "Create Debit Note"}
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Debit Note"
      footer={footerContent}
      subtitle="Sales Invoice Adjustment"
      icon={FileMinus}
      maxWidth="wide"
      height="84vh"
    >
      <DebitNoteForm
        onSubmit={onSubmit}
        invoiceId={invoiceId}
        saving={saving}
        setSaving={setSaving}
      />
    </Modal>
  );
};

export default CreateDebitNoteModal;
