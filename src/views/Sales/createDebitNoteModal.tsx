import React, { useMemo, useRef } from "react";
import { FileMinus } from "lucide-react";
import { MinimizableModal } from "../../components/common/MinimizableModal";
import { Button } from "../../components/ui/modal/formComponent";
import { DebitNoteDetailsTab } from "./DebitNoteDetailsTab";
import { useDebitNoteForm } from "../../hooks/useDebitNoteForm";

// ─── Constants ────────────────────────────────────────────────────────────────

const FORM_ID = "debit-note-form";

// ─── Props ────────────────────────────────────────────────────────────────────

interface CreateDebitNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: any) => void;
  initialData?: any;
  isEdit?: boolean;
  modalId?: string;
  invoiceId?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

const CreateDebitNoteModal: React.FC<CreateDebitNoteModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  modalId,
  initialData,
  isEdit = false,
}) => {
  // Stable modal ID — computed once per mount, same strategy as Asset modal
  const resolvedModalId = useRef(
    modalId ??
      (isEdit && initialData?.name
        ? `debit-note-edit-${initialData.name}-${Date.now()}`
        : `debit-note-create-${Date.now()}`),
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
    handleCloseWithConfirm, // ← from useUnsavedChanges inside the hook
  } = useDebitNoteForm(onSubmit, onClose, initialData, isEdit);

  // ── Close handler — asks for confirmation when dirty ────────────────────
  const handleClose = () => handleCloseWithConfirm(onClose, resolvedModalId);

  // ── Footer ───────────────────────────────────────────────────────────────

  const footer = useMemo(
    () => (
      <>
        <Button variant="secondary" type="button" onClick={handleClose}>
          Cancel
        </Button>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            type="button"
            onClick={reset}
          >
            Reset
          </Button>
          <Button
            variant="primary"
            type="submit"
            form={FORM_ID}
            disabled={saving}
          >
            {saving
              ? "Saving..."
              : isEdit
                ? "Update Debit Note"
                : "Create Debit Note"}
          </Button>
        </div>
      </>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [saving, isEdit],
  );

  // ── Tab content ──────────────────────────────────────────────────────────

  const tabContent = useMemo(
    () => (
      <DebitNoteDetailsTab
        form={form}
        invoiceLoading={invoiceLoading}
        grandTotal={grandTotal}
        fetchInvoiceOptions={fetchInvoiceOptions}
        onInvoiceSelect={handleInvoiceSelect}
        onItemChange={handleItemChange}
        onWarehouseDefault={handleWarehouseDefault}
        onRemoveItem={removeItem}
        onToggleUpdateStock={toggleUpdateStock}
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
    ],
  );

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <MinimizableModal
      modalId={resolvedModalId}
      isOpen={isOpen}
      onClose={handleClose} // ← guarded close
      title={isEdit ? "Edit Debit Note" : "Create Debit Note"}
      subtitle="Create and manage debit notes"
      icon={FileMinus}
      footer={footer}
      maxWidth="6xl"
      height="82vh"
    >
      <form
        id={FORM_ID}
        onSubmit={handleSubmit}
        className="h-full flex flex-col"
      >
        {/* ── Tab bar ── */}
        <div className="bg-app border-b border-theme px-8 shrink-0">
          <div className="flex gap-8">
            <button
              type="button"
              className="py-2.5 bg-transparent border-none text-xs font-medium cursor-pointer transition-all text-primary border-b-[3px] border-primary"
            >
              Details
            </button>
          </div>
        </div>

        {/* ── Tab content ── */}
        <section className="flex-1 overflow-y-auto">
          {tabContent}
        </section>
      </form>
    </MinimizableModal>
  );
};

export default CreateDebitNoteModal;