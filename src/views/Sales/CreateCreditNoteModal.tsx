import React, { useMemo } from "react";
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
  invoiceId?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

const CreateCreditNoteModal: React.FC<CreateCreditNoteModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  modalId,
}) => {
  const resolvedModalId = modalId ?? `credit-note-create-${Date.now()}`;

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
  } = useCreditNoteForm(onSubmit, onClose);

  // ── Footer ───────────────────────────────────────────────────────────────

  const footer = useMemo(
    () => (
      <>
        <Button variant="secondary" type="button" onClick={onClose}>
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
            {saving ? "Saving…" : "Create Credit Note"}
          </Button>
        </div>
      </>
    ),
    [onClose, reset, saving],
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
      onClose={onClose}
      title="Create Credit Note"
      subtitle="Sales Return / Invoice Adjustment"
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

        {/* Tab content */}
        <section className="flex-1 overflow-y-auto">
          {tabContent}
        </section>
      </form>
    </MinimizableModal>
  );
};

export default CreateCreditNoteModal;