import React from "react";
import { Building2, Users, DollarSign, MapPin, FileText } from "lucide-react";
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
import ModalFooter from "../../common/ModalFooter";

interface SupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: SupplierFormData) => Promise<boolean>;
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
    handleSubmit: handleFormSubmit,
    reset,
    handleNext,
    errors,
    handleTermsChange,
  } = useSupplierForm({
    initialData,
    isEditMode,
    onSuccess: async (data) => {
      const result = await onSubmit?.(data);
      if (result) {
        onClose();
      }
      return result ?? false;
    },
    isOpen,
    existingSupplierCodes,
  });

  const currentTabIndex = tabs.findIndex((t) => t.key === activeTab);

  const handleCloseRequest = () => {
    handleCloseWithConfirm(onClose, resolvedModalId);
  };

  const handleResetTab = () => {
    resetDirty();
    reset();
  };

  const handleSubmitForm = async () => {
    await handleFormSubmit(new Event("submit") as unknown as React.FormEvent);
    return true;
  };

  const footer = (
    <ModalFooter
      onCancel={handleCloseRequest}
      onReset={handleResetTab}
      onSubmit={handleSubmitForm}
      onNext={activeTab !== "terms" ? handleNext : undefined}
      currentTab={currentTabIndex}
      totalTabs={tabs.length}
      isSubmitting={loading}
    />
  );

  return (
    <MinimizableModal
      modalId={resolvedModalId}
      isOpen={isOpen}
      onClose={() => handleCloseWithConfirm(onClose, resolvedModalId)}
      title={isEditMode ? "Edit Supplier" : "Create Supplier"}
      subtitle={
        isEditMode
          ? "Update supplier information"
          : "Fill in the details to create a new supplier"
      }
      icon={Users}
      footer={footer}
      maxWidth="6xl"
      height="77vh"
    >
      <form
        id="supplierForm"
        onChange={() => markDirty()}
        onSubmit={(e) => {
          e.preventDefault();
          resetDirty();
          handleFormSubmit(e);
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
          ${activeTab === key
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
              partyId={initialData?.id ? String(initialData.id) : undefined}
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