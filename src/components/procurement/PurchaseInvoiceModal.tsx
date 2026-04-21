import React, { useState, useMemo, useCallback } from "react";
import { Building2, MapPin, FileText, Receipt } from "lucide-react";
import { MinimizableModal } from "../common/MinimizableModal";
import { Button } from "../ui/modal/formComponent";
import { DetailsTab } from "../procurement/purchaseinvoice/DetailsTab";
import { AddressTab } from "../procurement/purchaseinvoice/AddressTab";
import TermsAndCondition from "../TermsAndCondition";
import { usePurchaseInvoiceForm } from "../../hooks/usePurchaseInvoiceForm";
import { useUnsavedChanges } from "../../hooks/useUnsavedChanges";
import type { POTab } from "../../types/Supply/purchaseInvoice";
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
  { key: "terms", icon: FileText, label: "Terms" },
];

const tabOrder: POTab[] = ["details", "address", "terms"];

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
  const { markDirty, resetDirty, handleCloseWithConfirm } = useUnsavedChanges();
  const [internalSaving, setInternalSaving] = useState(false);

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
  } = usePurchaseInvoiceForm({ isOpen, onSuccess: onSubmit, onClose, pId });

  // ── Submit: runs full validatePI via handleSubmit ──────────
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

  // ── Next: validates CURRENT tab before advancing ───────────
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

  // ── Tab click: freely navigable — NO validation ────────────
  const handleTabClick = useCallback(
    (tabKey: POTab) => {
      setActiveTab(tabKey);
    },
    [setActiveTab],
  );

  const isLastTab = activeTab === "terms";

  const footer = useMemo(
    () => (
      <>
        <Button
          variant="secondary"
          onClick={() => handleCloseWithConfirm(onClose, resolvedModalId)}
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
          {!isLastTab && (
            <Button variant="secondary" onClick={handleNextClick}>
              Next
            </Button>
          )}
          <Button
            variant="primary"
            onClick={handleSubmitForm}
            disabled={internalSaving}
          >
            {internalSaving ? "Saving..." : "Submit"}
          </Button>
        </div>
      </>
    ),
    [
      handleCloseWithConfirm,
      onClose,
      resolvedModalId,
      resetDirty,
      reset,
      isLastTab,
      handleNextClick,
      handleSubmitForm,
      internalSaving,
    ],
  );

  // Memoized tab content — stays mounted but hidden for perf
  const tabContent = useMemo(
    () => (
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
            poList={poList}
            poLoading={poLoading}
            onPOSelect={handlePOSelect}
            usePO={usePO}
            onTogglePO={handleTogglePO}
            onBulkItemChange={handleBulkItemChange}
          />
        </div>

        <div style={{ display: activeTab === "address" ? "block" : "none" }}>
          <AddressTab
            form={form}
            onFormChange={(e: any) => handleFormChange(e)}
            customShippingRule={customShippingRule}
            setCustomShippingRule={setCustomShippingRule}
            customIncoterm={customIncoterm}
            setCustomIncoterm={setCustomIncoterm}
            supplierId={form.supplierId}
            selected={selected}
            setSelected={setSelected}
            selectedIds={selectedIds}
            setSelectedIds={setSelectedIds}
            addresses={addresses}
            setAddresses={setAddresses}
            loading={loading}
            setLoading={setLoading}
            handleAddressSelect={handleAddressSelect}
            handleCopyBillingToShipping={() => { }}
            handleCopySupplierToDispatch={() => { }}
          />
        </div>

        <div style={{ display: activeTab === "terms" ? "block" : "none" }}>
          <TermsAndCondition
            terms={form.terms?.buying ?? null}
            setTerms={(buying) =>
              setForm((p) => ({ ...p, terms: { buying } }))
            }
            type="buying"
          />
        </div>
      </>
    ),
    [
      activeTab,
      form,
      handleFormChange,
      handleSupplierChange,
      handleItemChange,
      addItem,
      removeItem,
      duplicateItem,
      getCurrencySymbol,
      handleItemSelect,
      poList,
      poLoading,
      handlePOSelect,
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
    ],
  );

  return (
    <MinimizableModal
      modalId={resolvedModalId}
      isOpen={isOpen}
      onClose={() => handleCloseWithConfirm(onClose, resolvedModalId)}
      title={pId ? "Edit Purchase Invoice" : "New Purchase Invoice"}
      subtitle="Create and manage purchase invoice"
      icon={Receipt}
      customWidth="99vw"
      height="93vh"
      footer={footer}
    >
      <form
        id="purchaseInvoiceForm"
        noValidate
        onChange={() => markDirty()}
        className="h-full flex flex-col"
      >
        {/* ── Tabs — freely navigable, NO validation on click ── */}
        <div className="bg-app border-b border-theme px-8 shrink-0">
          <div className="flex gap-8">
            {tabs.map(({ key, icon: Icon, label }) => (
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

        <section className=" overflow-y-auto p-1 ">
          {tabContent}
        </section>
      </form>
    </MinimizableModal>
  );
};

export default PurchaseInvoiceModal;