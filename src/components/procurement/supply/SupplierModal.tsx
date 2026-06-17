import React, { useEffect, useRef } from "react";
import { Building2, Users, Banknote, MapPin, FileText } from "lucide-react";
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
  { key: "payment", icon: Banknote, label: "Bank Details" },
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
  const resolvedModalId = useRef(
    modalId ||
      (isEditMode && initialData?.id
        ? `supplier-edit-${initialData.id}-${Date.now()}`
        : `supplier-create-${Date.now()}`)
  ).current;

  const {
    markDirty,
    resetDirty,
    handleCloseWithConfirm,
    activate,
    deactivate,
  } = useUnsavedChanges();

  // Activate guard after modal opens, deactivate on close
  useEffect(() => {
    if (!isOpen) return;
    const cleanup = activate();
    return () => {
      cleanup?.();
      deactivate();
      resetDirty();
    };
  }, [isOpen]);

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
        resetDirty();
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
    const didSave = await handleFormSubmit(
      new Event("submit") as unknown as React.FormEvent,
    );
    if (didSave) resetDirty();
    return didSave;
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
      onClose={handleCloseRequest}
      title={isEditMode ? "Edit Supplier" : "Add Supplier"}
      subtitle={
        isEditMode
          ? "Update supplier information"
          : "Fill in the details to add a new supplier"
      }
      icon={Users}
      footer={footer}
      maxWidth="6xl"
      height="77vh"
    >
      <form
        id="supplierForm"
        onChange={markDirty}
        onSubmit={(e) => {
          e.preventDefault();
          void handleFormSubmit(e).then((didSave) => {
            if (didSave) resetDirty();
          });
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
        <div className="gap-6 p-4 flex-1 min-h-0 overflow-y-auto">
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
