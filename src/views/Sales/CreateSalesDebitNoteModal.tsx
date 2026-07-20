import React, { useMemo, useRef } from "react";
import { FilePlus } from "lucide-react";
import { MinimizableModal } from "../../components/common/MinimizableModal";
import { Button } from "../../components/ui/modal/formComponent";
import { SalesDebitNoteDetailsTab } from "./SalesDebitNoteDetailsTab";
import { useSalesDebitNoteForm } from "../../hooks/useSalesDebitNoteForm";

// ─── Constants ────────────────────────────────────────────────────────────────

const FORM_ID = "sales-debit-note-form";

// ─── Props ────────────────────────────────────────────────────────────────────

interface CreateSalesDebitNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: any) => void;
  initialData?: any;
  isEdit?: boolean;
  modalId?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

const CreateSalesDebitNoteModal: React.FC<CreateSalesDebitNoteModalProps> = ({
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
        ? `sales-debit-note-edit-${initialData.name}-${Date.now()}`
        : `sales-debit-note-create-${Date.now()}`),
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
    reset,
    handleSubmit,
    handleCloseWithConfirm,
    reasonOptions,
    reasonsLoading,     
    setReason,
    setDescription,
    fetchReasonOptions,
  } = useSalesDebitNoteForm(onSubmit, onClose, initialData, isEdit);

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
    [saving, isEdit, handleClose, reset],
  );

  const tabContent = useMemo(
    () => (
      <SalesDebitNoteDetailsTab
        form={form}
        invoiceLoading={invoiceLoading}
        grandTotal={grandTotal}
        fetchInvoiceOptions={fetchInvoiceOptions}
        onInvoiceSelect={handleInvoiceSelect}
        onItemChange={handleItemChange}
        onWarehouseDefault={handleWarehouseDefault}
        onRemoveItem={removeItem}
        reasonOptions={reasonOptions}      
        reasonsLoading={reasonsLoading}     
        onReasonChange={setReason} 
        fetchReasonOptions={fetchReasonOptions}
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
      reasonOptions,
      reasonsLoading,
      setReason,
      setDescription,
      fetchReasonOptions
    ],
  );

  return (
    <MinimizableModal
      modalId={resolvedModalId}
      isOpen={isOpen}
      onClose={handleClose}
      title={isEdit ? "Edit Sales Debit Note" : "Add Sales Debit Note"}
      subtitle={isEdit ? "Edit and Manage Rate Adjustment" : "Add and Manage Rate Adjustment"}
      icon={FilePlus}
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

export default CreateSalesDebitNoteModal;