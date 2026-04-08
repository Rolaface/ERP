import React from "react";
import { Building2, DollarSign, MapPin, FileText } from "lucide-react";
import { Button } from "../../ui/modal/formComponent";
import { SupplierInfoTab } from "./SupplierInfoTab";
import { useSupplierForm } from "../../../hooks/useSupplierForm";
import { useUnsavedChanges } from "../../../hooks/useUnsavedChanges";
import type {
  SupplierTab,
  SupplierFormData,
  Supplier,
} from "../../../types/Supply/supplier";
import { AddressTab } from "./AddressTab";
import TermsAndCondition from "../../TermsAndCondition";
import type { TermSection } from "../../../types/termsAndCondition";
import { PaymentInfoTab } from "./PaymentInfoTab";
import { MinimizableModal } from "../../common/MinimizableModal";

interface SupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: SupplierFormData) => void;
  initialData?: Supplier | null;
  isEditMode?: boolean;
  existingSupplierCodes?: string[];
  modalId?: string;
}

const tabs: { key: SupplierTab; icon: typeof Building2; label: string }[] = [
  { key: "supplier", icon: Building2, label: "Supplier" },
  { key: "payment", icon: DollarSign, label: "Bank Details" },
  { key: "address", icon: MapPin, label: "Address" },
  { key: "terms", icon: FileText, label: "Terms" },
];

const SupplierModal: React.FC<SupplierModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isEditMode = false,
  existingSupplierCodes = [],
  modalId,
}) => {
  const resolvedModalId = modalId || (isEditMode && initialData?.id
    ? `supplier-edit-${initialData.id}-${Date.now()}`
    : `supplier-create-${Date.now()}`);
  const { markDirty, resetDirty, handleCloseWithConfirm } = useUnsavedChanges();
  const {
    form,
    loading,
    activeTab,
    setActiveTab,
    handleChange,
    handleSubmit,
    reset,
    handleNext,
    errors,
    handleTermsChange,
  } = useSupplierForm({
    initialData,
    isEditMode,
    onSuccess: onSubmit,
    isOpen,
    existingSupplierCodes,
  });

  const footer = (
    <>
      <Button variant="secondary" onClick={() => handleCloseWithConfirm(onClose, resolvedModalId)} type="button">
        Cancel
      </Button>

      <div className="flex gap-3">
        <Button
          variant="secondary"
          onClick={() => {
            resetDirty();
            reset();
          }}
          type="button"
        >
          Reset
        </Button>
        {activeTab !== "terms" ? (
          <Button
            variant="primary"
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleNext();
            }}
          >
            Next →
          </Button>
        ) : (
          <Button
            variant="primary"
            loading={loading}
            type="submit"
            form="supplierForm"
          >
            {isEditMode ? "Update Supplier" : "Save Supplier"}
          </Button>
        )}
      </div>
    </>
  );

  return (
    <MinimizableModal
      modalId={resolvedModalId}
      isOpen={isOpen}
      onClose={() => handleCloseWithConfirm(onClose, resolvedModalId)}
      title={isEditMode ? "Edit Supplier" : "Add New Supplier"}
      subtitle={
        isEditMode
          ? "Update supplier information"
          : "Fill in the details to create a new supplier"
      }
      icon={Building2}
      footer={footer}
      maxWidth="6xl"
      height="77vh"
    >
      <form
        id="supplierForm"
        onChange={() => markDirty()}
        onSubmit={(e) => {
          const wrappedSubmit = async () => {
            resetDirty();
            await handleSubmit(e);
          };
          wrappedSubmit();
        }}
        noValidate
        className="h-full flex flex-col"
      >
        {/* Tabs */}
        <div className="bg-app border-b border-theme px-8 shrink-0">
          <div className="flex gap-8">
            {tabs.map(({ key, label }) => (
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
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="gap-6 p-4 flex-1 min-h-0 overflow-hidden">
          {activeTab === "supplier" && (
            <SupplierInfoTab
              form={form}
              onChange={handleChange}
              errors={errors}
            />
          )}
          {activeTab === "payment" && (
            <PaymentInfoTab
              form={form}
              onChange={handleChange}
              errors={errors}
              isEditMode={isEditMode}
              partyType="Supplier"
              partyName={form.supplierName || initialData?.supplierName || ""}
              currency={form.currency}
            />
          )}
          {activeTab === "address" && (
            <AddressTab form={form} onChange={handleChange} errors={errors} />
          )}
          {activeTab === "terms" && (
            <TermsAndCondition
              terms={form.terms?.buying as TermSection}
              setTerms={(updated) => handleTermsChange("buying", updated)}
              type="buying"
            />
          )}
        </div>
      </form>
    </MinimizableModal>
  );
};

export default SupplierModal;