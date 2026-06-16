import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Building2, MapPin, FileText, Receipt } from "lucide-react";
import { MinimizableModal } from "../common/MinimizableModal";
import { AttachmentsTab } from "../procurement/purchaseinvoice/AttachmentsTab";
import { DetailsTab } from "../procurement/purchaseinvoice/DetailsTab";
import { AddressTab } from "../procurement/purchaseinvoice/AddressTab";
import TermsAndCondition from "../TermsAndCondition";
import { usePurchaseInvoiceForm } from "../../hooks/usePurchaseInvoiceForm";
import { useUnsavedChanges } from "../../hooks/useUnsavedChanges";
import type { POTab } from "../../types/Supply/purchaseInvoice";
import ModalFooter from "../common/ModalFooter";
import { showApiError, showValidationError } from "../../utils/alert";

interface PurchaseInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: any) => void;
  pId?: string | number;
  poLoading?: boolean;
  modalId?: string;
}

const tabs: { key: POTab; icon: typeof Building2; label: string }[] = [
  { key: "details", icon: Building2, label: "Details" },
  { key: "address", icon: MapPin, label: "Address" },
  { key: "attachments", icon: FileText, label: "Attachments" },
  { key: "terms", icon: Receipt, label: "Terms" },
];

const tabOrder: POTab[] = ["details", "address", "attachments", "terms"];
const PurchaseInvoiceModal: React.FC<PurchaseInvoiceModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  pId,
  modalId,
}) => {
  const resolvedModalId =
    modalId ||
    (pId ? `purchase-invoice-edit-${pId}` : `purchase-invoice-create`);

  const { markDirty, resetDirty, handleCloseWithConfirm, activate, deactivate } =
    useUnsavedChanges();

  const [internalSaving, setInternalSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      deactivate();
      resetDirty();
    } else {
      return activate();
    }
  }, [isOpen]);

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
    getCurrencySymbol,
    handleSubmit,
    reset,
    poList,
    poLoading,
    handleTogglePO,
    usePO,
    validateTab,
    handlePOSelect,
    customShippingRule,
    setCustomShippingRule,
    customIncoterm,
    setCustomIncoterm,
    handleBulkItemChange,
    selected,
    setSelected,
    selectedIds,
    setSelectedIds,
    addresses,
    setAddresses,
    loading,
    setLoading,
    handleAddressSelect,
    handleAddressRemove,
  } = usePurchaseInvoiceForm({ isOpen, onSuccess: onSubmit, onClose, pId });

  // ── Wrapped handlers so select/dropdown changes also mark dirty ──
  const handleFormChangeWithDirty = useCallback(
    (e: any) => { markDirty(); handleFormChange(e); },
    [markDirty, handleFormChange],
  );

  const handleSupplierChangeWithDirty = useCallback(
    (val: any) => { markDirty(); handleSupplierChange(val); },
    [markDirty, handleSupplierChange],
  );

  const handlePOSelectWithDirty = useCallback(
    (val: any) => { markDirty(); handlePOSelect(val); },
    [markDirty, handlePOSelect],
  );
const handleItemChangeWithDirty = useCallback(
  (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    markDirty();
    handleItemChange(e, idx);
  },
  [markDirty, handleItemChange],
);
  // ────────────────────────────────────────────────────────────────

  const handleSubmitForm = useCallback(async () => {
    if (internalSaving) return;
    setInternalSaving(true);
    try {
      resetDirty();
      await handleSubmit();
    } catch (err: any) {
      showApiError(err);
    } finally {
      setInternalSaving(false);
    }
  }, [internalSaving, resetDirty, handleSubmit]);

  const handleNextClick = useCallback(() => {
    const error = validateTab(activeTab);
    if (error) {
      showValidationError(error);
      return;
    }
    const currentIndex = tabOrder.indexOf(activeTab);
    if (currentIndex < tabOrder.length - 1) {
      setActiveTab(tabOrder[currentIndex + 1]);
    }
  }, [activeTab, validateTab, setActiveTab]);

  const handleTabClick = useCallback(
    (tabKey: POTab) => {
      setActiveTab(tabKey);
    },
    [setActiveTab],
  );

  const footer = (
    <ModalFooter
      onCancel={() => handleCloseWithConfirm(onClose, resolvedModalId)}
      onReset={() => {
        resetDirty();
        reset();
      }}
      onSubmit={handleSubmitForm}
      onNext={handleNextClick}
      currentTab={tabOrder.indexOf(activeTab)}
      totalTabs={tabOrder.length}
      saving={internalSaving}
    />
  );

  const tabContent = useMemo(
    () => (
      <>
        <div style={{ display: activeTab === "details" ? "block" : "none" }}>
          <DetailsTab
            form={form}
            items={form.items}
            onFormChange={handleFormChangeWithDirty}
            onSupplierChange={handleSupplierChangeWithDirty}
            onItemChange={handleItemChangeWithDirty}
            onAddItem={addItem}
            onRemoveItem={removeItem}
            isEditMode={!!pId}
            onDuplicateItem={duplicateItem}
            getCurrencySymbol={getCurrencySymbol}
            onItemSelect={handleItemSelect}
            poList={poList}
            poLoading={poLoading}
            onPOSelect={handlePOSelectWithDirty}
            usePO={usePO}
            onTogglePO={handleTogglePO}
            onBulkItemChange={handleBulkItemChange}
          />
        </div>
        <div style={{ display: activeTab === "attachments" ? "block" : "none" }}>
          <AttachmentsTab
            form={form}
            onFormChange={handleFormChangeWithDirty}
          />
        </div>
        <div style={{ display: activeTab === "address" ? "block" : "none" }}>
          <AddressTab
            form={form}
            onFormChange={(e: any) => handleFormChangeWithDirty(e)}
            customShippingRule={customShippingRule}
            isEditMode={!!pId}
            setCustomShippingRule={setCustomShippingRule}
            customIncoterm={customIncoterm}
            setCustomIncoterm={setCustomIncoterm}
            supplierId={form.supplierId}
            removedBoxes={new Set()}
            selected={selected}
            setSelected={setSelected}
            selectedIds={selectedIds}
            setSelectedIds={setSelectedIds}
            addresses={addresses}
            setAddresses={setAddresses}
            loading={loading}
            setLoading={setLoading}
            handleAddressRemove={handleAddressRemove}
            handleAddressSelect={handleAddressSelect}
            handleCopyBillingToShipping={() => {}}
            handleCopySupplierToDispatch={() => {}}
          />
        </div>

        <div style={{ display: activeTab === "terms" ? "block" : "none" }}>
          <TermsAndCondition
            terms={form.terms?.buying ?? null}
            setTerms={(buying) =>
              setForm((p) => ({ ...p, terms: { buying } }))
            }
            type="buying"
            compact={true}
          />
        </div>
      </>
    ),
    [
      activeTab,
      form,
      handleFormChangeWithDirty,
      handleSupplierChangeWithDirty,
      handleItemChangeWithDirty,
      addItem,
      removeItem,
      duplicateItem,
      getCurrencySymbol,
      handleItemSelect,
      poList,
      poLoading,
      handlePOSelectWithDirty,
      usePO,
      handleTogglePO,
      handleBulkItemChange,
      customShippingRule,
      setCustomShippingRule,
      customIncoterm,
      setCustomIncoterm,
      selected,
      setSelected,
      selectedIds,
      setSelectedIds,
      addresses,
      setAddresses,
      loading,
      setLoading,
      handleAddressRemove,
      handleAddressSelect,
    ],
  );

  return (
    <MinimizableModal
      modalId={resolvedModalId}
      isOpen={isOpen}
      onClose={() => handleCloseWithConfirm(onClose, resolvedModalId)}
      title={pId ? "Edit Purchase Invoice" : "Add Purchase Invoice"}
      subtitle="Add and manage purchase invoice"
      icon={Receipt}
      maxWidth="full"
      height="88vh"
      footer={footer}
    >
      <form
        id="purchaseInvoiceForm"
        noValidate
        onChange={() => markDirty()}
        className="h-full flex flex-col"
      >
        <div className="bg-app border-b border-theme px-8 shrink-0">
          <div className="flex gap-8">
            {tabs.map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => handleTabClick(key)}
                className={`py-2.5 bg-transparent border-none text-xs font-medium cursor-pointer transition-all flex items-center gap-2 ${
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

        <section className="overflow-y-auto px-2 py-2">
          {tabContent}
        </section>
      </form>
    </MinimizableModal>
  );
};

export default PurchaseInvoiceModal;