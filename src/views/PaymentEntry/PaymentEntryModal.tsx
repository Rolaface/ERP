import React, { useState } from "react";
import { CreditCard, FileText } from "lucide-react";
import Modal from "../../components/ui/modal/modal";
import { Button } from "../../components/ui/modal/formComponent";
import PaymentDetailsTab from "../../components/Payment/PaymentDetailsTab";
import PaymentTaxesTab from "../../components/Payment/PaymentTaxesTab";

type TabType = "details" | "taxes";

const tabs = [
  { key: "details", label: "Details", icon: CreditCard },
  { key: "taxes", label: "Taxes & Charges", icon: FileText },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const PaymentEntryModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>("details");
  const [form, setForm] = useState<Record<string, any>>({});

  // Handles native input/select change events
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Handles programmatic/bulk updates (e.g. auto-fill from mode of payment)
  const handleFormChange = (updates: Record<string, any>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  };

  const footer = (
    <>
      <Button variant="secondary" onClick={onClose}>
        Cancel
      </Button>
      <Button variant="primary">Save</Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Payment Entry"
      subtitle="Create payment"
      icon={CreditCard}
      footer={footer}
      customWidth="55vw"
      height="87vh"
    >
      <div className="flex flex-col h-full">

        {/* Tabs */}
        <div className="border-b px-6">
          <div className="flex gap-6">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key as TabType)}
                className={`py-3 text-sm font-medium flex items-center gap-2 ${
                  activeTab === t.key
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted"
                }`}
              >
                <t.icon size={16} />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-auto p-6">
          {activeTab === "details" && (
            <PaymentDetailsTab
              form={form}
              onChange={handleChange}
              onFormChange={handleFormChange}
            />
          )}
          {activeTab === "taxes" && (
            <PaymentTaxesTab form={form} onChange={handleChange} />
          )}
        </div>

      </div>
    </Modal>
  );
};

export default PaymentEntryModal;