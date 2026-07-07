import React, { useMemo, useRef } from "react";
import { FileMinus } from "lucide-react";
import { MinimizableModal } from "../../components/common/MinimizableModal";
import { Button } from "../../components/ui/modal/formComponent";
import { CreditNoteDetailsTab } from "./CreditNoteDetailsTab";
import { useCreditNoteForm } from "../../hooks/useCreditNoteForm";

// ─── Constants ────────────────────────────────────────────────────────────────

const FORM_ID = "credit-note-form";

// ─── Props ────────────────────────────────────────────────────────────────────

interface CreateCreditNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: any) => void;
  initialData?: any;
  isEdit?: boolean;
  modalId?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

const CreateCreditNoteModal: React.FC<CreateCreditNoteModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  modalId,
  initialData,
  isEdit = false,
}) => {
  const resolvedModalId = useRef(
    modalId ??
      (isEdit && initialData?.name
        ? `credit-note-edit-${initialData.name}-${Date.now()}`
        : `credit-note-create-${Date.now()}`),
  ).current;

  const {
    form,
    saving,
    invoiceLoading,
    grandTotal,
    fetchInvoiceOptions,
    handleInvoiceSelect,
    handleItemChange,
    handleWarehouseDefault,
    removeItem,
    toggleUpdateStock,
    reset,
    handleSubmit,
    handleCloseWithConfirm,
    reasonOptions,
    reasonsLoading,     
    setReason,
    setDescription
  } = useCreditNoteForm(onSubmit, onClose, initialData, isEdit);

  const handleClose = () => handleCloseWithConfirm(onClose, resolvedModalId);

  const footer = useMemo(
    () => (
      <>
        <Button variant="secondary" type="button" onClick={handleClose}>
          Cancel
        </Button>
        <div className="flex gap-2">
          <Button variant="secondary" type="button" onClick={reset}>
            Reset
          </Button>
          <Button
            variant="primary"
            type="submit"
            form={FORM_ID}
            disabled={saving}
          >
            {saving ? "Saving..." : isEdit ? "Update" : "Submit"}
          </Button>
        </div>
      </>
    ),
    [saving, isEdit],
  );

  const tabContent = useMemo(
    () => (
      <CreditNoteDetailsTab
        form={form}
        invoiceLoading={invoiceLoading}
        grandTotal={grandTotal}
        fetchInvoiceOptions={fetchInvoiceOptions}
        onInvoiceSelect={handleInvoiceSelect}
        onItemChange={handleItemChange}
        onWarehouseDefault={handleWarehouseDefault}
        onRemoveItem={removeItem}
        onToggleUpdateStock={toggleUpdateStock}
        reasonOptions={reasonOptions}      
        reasonsLoading={reasonsLoading}     
        onReasonChange={setReason} 
        onDescriptionChange={setDescription} 

      />
    ),
    [
      form,
      invoiceLoading,
      grandTotal,
      fetchInvoiceOptions,
      handleInvoiceSelect,
      handleItemChange,
      handleWarehouseDefault,
      removeItem,
      toggleUpdateStock,
      reasonOptions,
      reasonsLoading,
      setReason,
      setDescription
    ],
  );

  return (
    <MinimizableModal
      modalId={resolvedModalId}
      isOpen={isOpen}
      onClose={handleClose}
      title={isEdit ? "Edit Credit Note" : "Add Credit Note"}
      subtitle={isEdit ? "Edit and Manage Credit Note" : "Add and Manage Credit Note"}      icon={FileMinus}
      footer={footer}
      maxWidth="full"
      height="600px"
    >
      <form
        id={FORM_ID}
        onSubmit={handleSubmit}
        className="h-full flex flex-col"
      >
        {/* ── Tab bar ── */}
        <div className="bg-app border-b border-theme px-4 sm:px-8 shrink-0">
          <div className="flex gap-8">
            <button
              type="button"
              className="py-2.5 bg-transparent border-none text-xs font-medium cursor-pointer transition-all text-primary border-b-[3px] border-primary whitespace-nowrap shrink-0"
            >
              Details
            </button>
          </div>
        </div>

        {/* ── Tab content ── */}
        <section className="flex-1 min-h-0 overflow-y-auto">
          {tabContent}
        </section>
      </form>
    </MinimizableModal>
  );
};

export default CreateCreditNoteModal;