import React from "react";
import { Building2, MapPin, FileText, Receipt } from "lucide-react";
import { MinimizableModal } from "../common/ModalManagerContext";
import { Button } from "../ui/modal/formComponent";
import { DetailsTab } from "../procurement/purchaseinvoice/DetailsTab";
// import { EmailTab } from "../procurement/purchaseorder/EmailTab";
// import { TaxTab } from "../procurement/purchaseorder/TaxTab";
import { AddressTab } from "../procurement/purchaseinvoice/AddressTab";
import TermsAndCondition from "../TermsAndCondition";
import { usePurchaseInvoiceForm } from "../../hooks/usePurchaseInvoiceForm";
import { useUnsavedChanges } from "../../hooks/useUnsavedChanges";
import type { POTab } from "../../types/Supply/purchaseInvoice";
import { showValidationError } from "../../utils/alert";

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
  // { key: "email", icon: Mail, label: "Email" },
  // { key: "tax", icon: Calculator, label: "Tax" },
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
  const resolvedModalId = modalId || (pId ? `purchase-invoice-edit-${pId}` : `purchase-invoice-create`);
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
    saving
  } = usePurchaseInvoiceForm({ isOpen, onSuccess: onSubmit, onClose, pId });

  const footer = (
    <>
      <Button variant="secondary" onClick={() => handleCloseWithConfirm(onClose, resolvedModalId)}>
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
          form="purchaseInvoiceForm"
          disabled={saving}
        >
          {saving
            ? "Saving..."
            : activeTab === "terms"
              ? "Save Purchase Invoice"
              : "Next"}
        </Button>
      </div>
    </>
  );

  const handleNext = () => {
    const currentIndex = tabOrder.indexOf(activeTab);

    if (currentIndex < tabOrder.length - 1) {
      setActiveTab(tabOrder[currentIndex + 1]);
    }
  };

  return (
    <MinimizableModal
      modalId={resolvedModalId}
      isOpen={isOpen}
      onClose={() => handleCloseWithConfirm(onClose, resolvedModalId)}
      title={pId ? "Edit Purchase Invoice" : "New Purchase Invoice"}
      subtitle="Create and manage purchase invoice"
      icon={Receipt}
      customWidth="95vw"
      height="90vh"
      footer={footer}
    >
      <form
        id="purchaseInvoiceForm"
        noValidate
        onChange={() => markDirty()}
        onSubmit={(e) => {
          e.preventDefault();

          const error = validateTab(activeTab);

          if (error) {
            showValidationError(error);
            return;
          }

          if (activeTab !== "terms") {
            handleNext();
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
        <div className="bg-app border-b border-theme px-8 shrink-0">
          <div className="flex gap-8">
            {tabs.map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
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

        <section className="flex-1 overflow-y-auto p-4 space-y-6">
          {activeTab === "details" && (
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
          )}

          {/* {activeTab === "email" && (
            <EmailTab
              templateName={form.templateName}
              templateType={form.templateType}
              subject={form.subject}
              sendAttachedFiles={form.sendAttachedFiles}
              sendPrint={form.sendPrint}
              onTemplateNameChange={(v) =>
                setForm((p: any) => ({ ...p, templateName: v }))
              }
              onTemplateTypeChange={(v) =>
                setForm((p: any) => ({ ...p, templateType: v }))
              }
              onSubjectChange={(v) =>
                setForm((p: any) => ({ ...p, subject: v }))
              }
              onSendAttachedFilesChange={(v) =>
                setForm((p: any) => ({ ...p, sendAttachedFiles: v }))
              }
              onSendPrintChange={(v) =>
                setForm((p: any) => ({ ...p, sendPrint: v }))
              }
              onSaveTemplate={handleSaveTemplate}
              onResetTemplate={resetTemplate}
            />
        )}

          {/* {activeTab === "tax" && (
            <TaxTab
              form={form}
              taxRows={form.taxRows}
              onFormChange={handleFormChange}
              onTaxRowChange={handleTaxRowChange}
              onAddTaxRow={addTaxRow}
              onRemoveTaxRow={removeTaxRow}
            />
          )} */}

          {activeTab === "address" && (
            <AddressTab
              form={form}
              onFormChange={handleFormChange}
              customShippingRule={customShippingRule}
              setCustomShippingRule={setCustomShippingRule}
              customIncoterm={customIncoterm}
              setCustomIncoterm={setCustomIncoterm}
            />
          )}

          {activeTab === "terms" && (
            <TermsAndCondition
              terms={form.terms?.buying ?? null}
              setTerms={(buying) =>
                setForm((p) => ({ ...p, terms: { buying } }))
              }
              type="buying"
            />
          )}
        </section>
      </form>
    </MinimizableModal>
  );
};

export default PurchaseInvoiceModal;
