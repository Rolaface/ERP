import React, { useCallback, useMemo } from "react";
import { Building2, MapPin, FileText ,ClipboardList} from "lucide-react";
import { Button } from "../ui/modal/formComponent";
import { DetailsTab } from "./purchaseorder/DetailsTab";
import { TaxTab } from "../procurement/purchaseorder/TaxTab";
import { AddressTab } from "./purchaseinvoice/AddressTab";
import TermsAndCondition from "../TermsAndCondition";
import { usePurchaseOrderForm } from "../../hooks/usePurchaseOrderForm";
import { useUnsavedChanges } from "../../hooks/useUnsavedChanges";
import type { POTab } from "../../types/Supply/purchaseOrder";
import { showValidationError } from "../../utils/alert";
import { MinimizableModal } from "../common/MinimizableModal";
import ModalFooter from "../common/ModalFooter";

interface PurchaseOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: any) => void;
  poId?: string | number;
  modalId?: string;
}

const tabs: { key: POTab; icon: typeof Building2; label: string }[] = [
  { key: "details", icon: Building2, label: "Details" },
  { key: "address", icon: MapPin, label: "Address" },
  { key: "terms", icon: FileText, label: "Terms" },
];

const tabOrder: POTab[] = ["details", "address", "terms"];

const PurchaseOrderModal: React.FC<PurchaseOrderModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  poId,
  modalId,
}) => {
  const resolvedModalId =
    modalId ||
    (poId ? `po-edit-${poId}-${Date.now()}` : `po-create-${Date.now()}`);
  const { markDirty, resetDirty, handleCloseWithConfirm } = useUnsavedChanges();

  const {
    form,
    setForm,
    activeTab,
    setActiveTab,
    handleItemSelect,
    handleFormChange,
    handleSupplierChange,
    handleItemChange,
    addItem,
    removeItem,
    duplicateItem,
    handleTaxRowChange,
    addTaxRow,
    removeTaxRow,
    getCurrencySymbol,
    handleSubmit,
    validateTab,
    reset,
    customShippingRule,
    setCustomShippingRule,
    customIncoterm,
    setCustomIncoterm,
    handleBulkItemChange,
    saving,
    addressSelected,
    setAddressSelected,
    addressSelectedIds,
    setAddressSelectedIds,
    addressList,
    setAddressList,
    addressLoading,
    setAddressLoading,
    handleAddressSelect,
    handleCopyBillingToShipping,
    handleCopySupplierToDispatch,
    handleAddressRemove,
      removedBoxes,
  } = usePurchaseOrderForm({ isOpen, onSuccess: onSubmit, onClose, poId });

  const handleNext = useCallback(() => {
    const currentIndex = tabOrder.indexOf(activeTab);
    if (currentIndex < tabOrder.length - 1) {
      setActiveTab(tabOrder[currentIndex + 1]);
    }
  }, [activeTab, setActiveTab]);

  const handleTabClick = useCallback((tabKey: POTab) => {
    const error = validateTab(activeTab);
    if (error) {
      showValidationError(error);
      return;
    }
    setActiveTab(tabKey);
  }, [activeTab, validateTab, setActiveTab]);

const footer = (
  <ModalFooter
    onCancel={() =>
      handleCloseWithConfirm(onClose, resolvedModalId)
    }
    onReset={() => {
      resetDirty();
      reset();
    }}
    onNext={() => {
      const error = validateTab(activeTab);
      if (error) {
        showValidationError(error);
        return;
      }
      handleNext();
    }}
    onSubmit={async () => {
      const error = validateTab(activeTab);
      if (error) {
        showValidationError(error);
        return;
      }

      resetDirty();

      const formEl = document.getElementById(
        "purchaseOrderForm"
      ) as HTMLFormElement | null;

      if (formEl) {
        formEl.requestSubmit();
      }
    }}
    currentTab={tabOrder.indexOf(activeTab)}
    totalTabs={tabOrder.length}
    isSubmitting={saving}
    submitLabel="Save Purchase Order"
  />
);

  // Memoized tab components - they stay mounted but hidden
  const tabContent = useMemo(() => (
    <>
      <div style={{ display: activeTab === "details" ? "block" : "none" }}>
        <DetailsTab
          form={form}
          items={form.items}
          onFormChange={handleFormChange}
          onSupplierChange={handleSupplierChange}
          onItemChange={handleItemChange}
          onAddItem={addItem}
          onRemoveItem={removeItem}
          onDuplicateItem={duplicateItem}
          getCurrencySymbol={getCurrencySymbol}
          onItemSelect={handleItemSelect}
          onBulkItemChange={handleBulkItemChange}
        />
      </div>

      <div style={{ display: activeTab === "tax" ? "block" : "none" }}>
        <TaxTab
          form={form}
          taxRows={form.taxRows}
          onFormChange={handleFormChange}
          onTaxRowChange={handleTaxRowChange}
          onAddTaxRow={addTaxRow}
          onRemoveTaxRow={removeTaxRow}
        />
      </div>

      <div style={{ display: activeTab === "address" ? "block" : "none" }}>
        <AddressTab
          form={form}
          onFormChange={handleFormChange}
          supplierId={form.supplierId}
          companyId={form.company}
           isEditMode={!!poId}   
           removedBoxes={removedBoxes}
            handleAddressRemove={handleAddressRemove}   
          customShippingRule={customShippingRule}
          setCustomShippingRule={setCustomShippingRule}
          customIncoterm={customIncoterm}
          setCustomIncoterm={setCustomIncoterm}
          selected={addressSelected}
          setSelected={setAddressSelected}
          selectedIds={addressSelectedIds}
          setSelectedIds={setAddressSelectedIds}
          addresses={addressList}
          setAddresses={setAddressList}
          loading={addressLoading}
          setLoading={setAddressLoading}
          handleAddressSelect={handleAddressSelect}
          handleCopyBillingToShipping={handleCopyBillingToShipping}
          handleCopySupplierToDispatch={handleCopySupplierToDispatch}
        />
      </div>

      <div style={{ display: activeTab === "terms" ? "block" : "none" }}>
      <TermsAndCondition
  terms={form.terms?.buying ?? null}
  setTerms={(buying) =>
    setForm((p) => ({
      ...p,
      terms: { buying },
    }))
  }
  type="buying"
  compact={true}
/>
      </div>
    </>
  ), [
    activeTab, form, handleFormChange, handleSupplierChange, handleItemChange,
    addItem, removeItem, duplicateItem, getCurrencySymbol, handleItemSelect,
    handleBulkItemChange, handleTaxRowChange, addTaxRow, removeTaxRow,
    customShippingRule, setCustomShippingRule, customIncoterm, setCustomIncoterm,
    addressSelected, setAddressSelected, addressSelectedIds, setAddressSelectedIds,
    addressList, setAddressList, addressLoading, setAddressLoading
  ]);

  return (
    <MinimizableModal
      modalId={resolvedModalId}
      isOpen={isOpen}
      onClose={() => handleCloseWithConfirm(onClose, resolvedModalId)}
      title={poId ? "Edit Purchase Order" : "Create Purchase Order"}
      subtitle="Create and manage purchase order"
      icon={ClipboardList}
      customWidth="95vw"
      height="88vh"
      footer={footer}
    >
      <form
        id="purchaseOrderForm"
        onChange={() => markDirty()}
      onSubmit={(e) => {
  e.preventDefault();

  const error = validateTab(activeTab);
  if (error) {
    showValidationError(error);
    return;
  }
  const handleFormSubmit = async () => {
    resetDirty();
    await handleSubmit(e);
  };

  handleFormSubmit();
}}
        className="h-full flex flex-col"
      >
        {/* Tab bar */}
        <div className="bg-app border-b border-theme px-8 shrink-0">
          <div className="flex gap-8">
            {tabs.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => handleTabClick(key)}
                className={`py-2.5 bg-transparent border-none text-xs font-medium cursor-pointer transition-all flex items-center gap-2 ${activeTab === key
                    ? "text-primary border-b-[3px] border-primary"
                    : "text-muted border-b-[3px] border-transparent hover:text-main"
                  }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <section className="overflow-y-auto p-2">
          {tabContent}
        </section>
      </form>
    </MinimizableModal>
  );
};

export default PurchaseOrderModal;
