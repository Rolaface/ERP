import React from "react";
import { Building2, MapPin, FileText } from "lucide-react";
import Modal from "../ui/modal/modal";
import { Button } from "../ui/modal/formComponent";
import { DetailsTab } from "./purchaseorder/DetailsTab";
import { TaxTab } from "../procurement/purchaseorder/TaxTab";
import { AddressTab } from "./purchaseinvoice/AddressTab";
import TermsAndCondition from "../TermsAndCondition";
import { usePurchaseOrderForm } from "../../hooks/usePurchaseOrderForm";
import type { POTab } from "../../types/Supply/purchaseOrder";
import { showValidationError } from "../../utils/alert";

interface PurchaseOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: any) => void;
  poId?: string | number;
}

const tabs: { key: POTab; icon: typeof Building2; label: string }[] = [
  { key: "details", icon: Building2, label: "Details" },
  // { key: "email", icon: Mail, label: "Email" },
  // { key: "tax", icon: Calculator, label: "Tax" },
  { key: "address", icon: MapPin, label: "Address" },
  { key: "terms", icon: FileText, label: "Terms" },
];

const tabOrder: POTab[] = ["details", "address", "terms"];

const PurchaseOrderModal: React.FC<PurchaseOrderModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  poId,
}) => {

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
    handleTaxRowChange,
    addTaxRow,
    removeTaxRow,
    handleSaveTemplate,
    resetTemplate,
    getCurrencySymbol,
    handleSubmit,
    validateTab,
    reset,
    customShippingRule,
    setCustomShippingRule,
    customIncoterm,
    setCustomIncoterm,
    handleBulkItemChange
  } = usePurchaseOrderForm({ isOpen, onSuccess: onSubmit, onClose, poId });

  const footer = (
    <>
      <Button variant="secondary" onClick={onClose}>
        Cancel
      </Button>
      <div className="flex gap-2">
        <Button variant="secondary" onClick={reset}>
          Reset
        </Button>
        <Button variant="primary" type="submit" form="purchaseOrderForm">
          {activeTab === "terms" ? "Save Purchase Order" : "Next"}
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={poId ? "Edit Purchase Order" : "New Purchase Order"}
      subtitle="Create and manage purchase order"
      icon={Building2}
      customWidth="95vw"
      height="90vh"
      footer={footer}
    >
      <form
        id="purchaseOrderForm"
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

          handleSubmit(e);
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

        <section className="flex-1 overflow-y-auto p-4 space-y-6 ">
          {activeTab === "details" && (
            <DetailsTab
              form={form}
              items={form.items}
              onFormChange={handleFormChange}
              onSupplierChange={handleSupplierChange}
              onItemChange={handleItemChange}
              onAddItem={addItem}
              onRemoveItem={removeItem}
              getCurrencySymbol={getCurrencySymbol}
              onItemSelect={handleItemSelect}
              onBulkItemChange={handleBulkItemChange}

            />
          )}



          {activeTab === "tax" && (
            <TaxTab
              form={form}
              taxRows={form.taxRows}
              onFormChange={handleFormChange}
              onTaxRowChange={handleTaxRowChange}
              onAddTaxRow={addTaxRow}
              onRemoveTaxRow={removeTaxRow}
            />
          )}

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
    </Modal>
  );
};

export default PurchaseOrderModal;
