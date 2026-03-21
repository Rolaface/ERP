import React, { useState } from "react";
import { CreditCard, FileText } from "lucide-react";
import Modal from "../../components/ui/modal/modal";
import { Button } from "../../components/ui/modal/formComponent";
import PaymentDetailsTab from "../../components/Payment/PaymentDetailsTab";
import PaymentTaxesTab from "../../components/Payment/PaymentTaxesTab";
import InvoiceList from "./invoicelist";

type TabType = "details" | "invoices" | "taxes";

const tabs = [
  { key: "details", label: "Details", icon: CreditCard },
  { key: "invoices", label: "Invoices", icon: FileText },
  { key: "taxes", label: "Taxes & Charges", icon: FileText },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const PaymentEntryModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>("details");
  const [form, setForm] = useState<Record<string, any>>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormChange = (updates: Record<string, any>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  };

  // ── derived summary values ──────────────────────────────────────────────
  const paymentAmount = Number(form?.amount || 0);
  const totalAllocated = Number(form?.allocatedAmount || 0);
  const remaining = Math.max(0, paymentAmount - totalAllocated);
  const selectedCount = (form?.selectedInvoices ?? []).length;

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
      customWidth="75vw"
      height="94vh"
    >
      <div className="flex flex-col h-full">
        {/* Tabs */}
        <div className="border-b px-6 flex-shrink-0">
          <div className="flex gap-6">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key as TabType)}
                className={`py-3 text-sm font-medium flex items-center gap-2 transition-colors ${
                  activeTab === t.key
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted hover:text-main"
                }`}
              >
                <t.icon size={15} />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Body: tab content + persistent summary */}
        <div className="flex flex-1 overflow-hidden">
          {/* Tab Content */}
          <div className="flex-1 overflow-auto p-6">
            {activeTab === "details" && (
              <PaymentDetailsTab
                form={form}
                onChange={handleChange}
                onFormChange={handleFormChange}
              />
            )}
            {activeTab === "invoices" && (
              <InvoiceList form={form} onFormChange={handleFormChange} />
            )}
            {activeTab === "taxes" && (
              <PaymentTaxesTab form={form} onChange={handleChange} />
            )}
          </div>

          {/* ✅ Persistent Summary Panel — always visible on the right */}
          <div className="w-56 flex-shrink-0 border-l border-[var(--border)] bg-card p-4 flex flex-col gap-4 overflow-auto">
            <h3 className="text-sm font-semibold text-main">Summary</h3>

            {/* Party */}
            <div>
              <p className="text-[11px] text-muted">Party</p>
              <p className="text-xs font-medium text-main truncate">
                {form?.partyName || "—"}
              </p>
            </div>

            {/* Payment Type */}
            <div>
              <p className="text-[11px] text-muted">Type</p>
              <p className="text-xs font-medium text-main">
                {form?.paymentType || "—"}
              </p>
            </div>

            {/* Date */}
            <div>
              <p className="text-[11px] text-muted">Date</p>
              <p className="text-xs font-medium text-main">
                {form?.date || "—"}
              </p>
            </div>

            {/* Mode */}
            <div>
              <p className="text-[11px] text-muted">Mode</p>
              <p className="text-xs font-medium text-main">
                {form?.mode || "—"}
              </p>
            </div>

            <div className="border-t border-[var(--border)]" />

            {/* Payment Amount */}
            <div>
              <p className="text-[11px] text-muted">Payment Amount</p>
              <p className="text-sm font-semibold text-main">
                {paymentAmount > 0 ? (
                  `₹ ${paymentAmount.toLocaleString()}`
                ) : (
                  <span className="text-muted text-[11px] font-normal">
                    Not set
                  </span>
                )}
              </p>
            </div>

            {/* Invoices Selected */}
            <div>
              <p className="text-[11px] text-muted">Invoices Selected</p>
              <p className="text-xs font-medium text-main">{selectedCount}</p>
            </div>

            {/* Allocated */}
            <div>
              <p className="text-[11px] text-muted">Allocated</p>
              <p className="text-base font-bold text-primary">
                ₹ {totalAllocated.toLocaleString()}
              </p>
            </div>

            {/* Remaining */}
            <div>
              <p className="text-[11px] text-muted">Remaining</p>
              <p className="text-xs font-medium text-main">
                ₹ {remaining.toLocaleString()}
              </p>
            </div>

            <div className="border-t border-[var(--border)]" />
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default PaymentEntryModal;
