import React, { useMemo, useEffect, useRef } from "react";
import { Building2, FileText } from "lucide-react";
import { Button } from "../../ui/modal/formComponent";
import { DetailsTab } from "./DetailsTab";
import TermsAndCondition from "../../TermsAndCondition";
import { useRfqForm } from "../../../hooks/useRfqForm";
import type { RfqFormData, RfqTab } from "../../../types/Supply/rfq";
import { MinimizableModal } from "../../common/MinimizableModal";
import { useUnsavedChanges } from "../../../hooks/useUnsavedChanges";


interface RfqModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: RfqFormData) => void;
  modalId: string;
  initialData?: unknown;
  isEdit?: boolean;
  isViewMode?: boolean;
}

/* ---------- TABS ---------- */

const tabs: { key: RfqTab; icon: typeof Building2; label: string }[] = [
  { key: "details", icon: Building2, label: "Details" },
  { key: "terms", icon: FileText, label: "Terms" },
];

const RfqModal: React.FC<RfqModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  modalId,
  initialData,
  isEdit = false,
  isViewMode = false
}) => {
  const stableModalId = useRef(modalId).current;

  const {
    markDirty,
    resetDirty,
    handleCloseWithConfirm,
    activate,
    deactivate,
  } = useUnsavedChanges();

  const {
    form,
    activeTab,
    setActiveTab,
    setRfqNumber,
    setRequestDate,
    setQuoteDeadline,
    setStatus,
    handleSupplierChange,
    addSupplier,
    removeSupplier,
    handleItemChange,
    addItem,
    removeItem,
    setTermsBuying,
    handleSubmit,
    saving,
    fetchRFQById,
    loading,
    reset,
  } = useRfqForm({
    onSuccess: onSubmit,
    onClose,
  });

  // Activate/deactivate the dirty guard with modal open state
  useEffect(() => {
    if (isOpen && !isViewMode) {
      const cleanup = activate();
      return () => {
        cleanup();
        deactivate();
      };
    }
  }, [isOpen, isViewMode, activate, deactivate]);

  // Fetch existing RFQ in edit mode
  useEffect(() => {
    if (isEdit && initialData && typeof initialData === "string") {
      fetchRFQById(initialData);
    }
  }, [isEdit, initialData]);

  /* ---------- FOOTER ---------- */

  const footer = useMemo(
    () =>
      isViewMode ? (
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      ) : (
        <>
          <Button
            variant="secondary"
            onClick={() => handleCloseWithConfirm(onClose, stableModalId)}
          >
            Cancel
          </Button>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                resetDirty();
                reset();
              }}
            >
              Reset
            </Button>
            <Button
              variant="primary"
              type="submit"
              form="rfqForm"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save RFQ"}
            </Button>
          </div>
        </>
      ),
    [isViewMode, handleCloseWithConfirm, onClose, stableModalId, resetDirty, reset, saving],
  );

  return (
    <MinimizableModal
      modalId={stableModalId}
      isOpen={isOpen}
      onClose={() =>
        isViewMode ? onClose() : handleCloseWithConfirm(onClose, stableModalId)
      }
      title={
        isViewMode ? "View RFQ" : isEdit ? "Edit RFQ" : "Add Request For Quotation"
      }
      subtitle={
        isViewMode
          ? `${initialData}`
          : isEdit
          ? `${initialData}`
          : "Add and send RFQ to suppliers"
      }
      icon={FileText}
      customWidth="73vw"
      height="81vh"
      footer={footer}
    >
      {/* ---------- FORM WRAPPER ---------- */}

      <form
        id="rfqForm"
        onChange={() => !isViewMode && markDirty()}
        onSubmit={async (e) => {
          e.preventDefault();
          if (isViewMode) return;
          const didSave = await handleSubmit();
          if (didSave) resetDirty();
        }}
        className="h-full flex flex-col"
      >

        {/* ---------- TABS HEADER ---------- */}

        <div className="bg-app border-b border-theme px-8 shrink-0">
          <div className="flex gap-8">
            {tabs.map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`py-2.5 bg-transparent border-none text-xs font-medium cursor-pointer transition-all flex items-center gap-2
                ${
                  activeTab === key
                    ? "text-primary border-b-[3px] border-primary"
                    : "text-muted border-b-[3px] border-transparent hover:text-main"
                }`}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ---------- TAB BODY ---------- */}

        <section className="flex-1 overflow-y-auto overflow-x-visible relative">

          {/* ===== DETAILS ===== */}

          {activeTab === "details" && (
            <DetailsTab
              rfqNumber={form.rfqNumber}
              requestDate={form.requestDate}
              quoteDeadline={form.quoteDeadline}
              status={form.status}
              suppliers={form.suppliers}
              items={form.items}
              onRfqNumberChange={setRfqNumber}
              onRequestDateChange={setRequestDate}
              onQuoteDeadlineChange={setQuoteDeadline}
              onStatusChange={setStatus}
              onSupplierChange={handleSupplierChange}
              onAddSupplier={addSupplier}
              onRemoveSupplier={removeSupplier}
              onItemChange={handleItemChange}
              onAddItem={addItem}
              onMarkDirty={!isViewMode ? markDirty : undefined}
              onRemoveItem={removeItem}
              isViewMode={isViewMode}
            />
          )}

          {/* ===== TERMS ===== */}

          {activeTab === "terms" && (
            <TermsAndCondition
              title="Terms & Conditions"
              terms={form.terms?.buying ?? null}
              isViewMode={isViewMode}
              setTerms={(updated) => setTermsBuying(updated)}
            />
          )}

        </section>
      </form>
    </MinimizableModal>
  );
};

export default RfqModal;