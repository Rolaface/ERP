import React, { useState } from "react";
import { CreditCard, FileText, AlertCircle, X } from "lucide-react";
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
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleFormChange = (updates: Record<string, any>) => {
    setForm((prev) => ({ ...prev, ...updates }));
    setError(null);
  };

  const handleSettleInvoice = () => {
    setActiveTab("invoices");
  };

  const settleInvoice = !!form.settleInvoice;

  const paymentAmount = Number(form?.amount || 0);
  const totalAllocated = Number(form?.allocatedAmount || 0);
  const remaining = Math.max(0, paymentAmount - totalAllocated);
  const selectedCount = (form?.selectedInvoices ?? []).length;

  const handleSave = () => {
    if (!paymentAmount || paymentAmount <= 0) {
      setError("Please enter a payment amount in the Details tab.");
      setActiveTab("details");
      return;
    }
    if (settleInvoice && selectedCount === 0) {
      setError("Please allocate the payment to at least one invoice.");
      setActiveTab("invoices");
      return;
    }
    if (settleInvoice && remaining > 0) {
      setError(
        `₹ ${remaining.toLocaleString()} is still unallocated. Please reduce the payment amount to ₹ ${totalAllocated.toLocaleString()}, or allocate the remaining balance to an invoice.`,
      );
      setActiveTab("invoices");
      return;
    }
    setError(null);
    // TODO: call save API
  };

  const footer = (
    <>
      <Button variant="secondary" onClick={onClose}>
        Cancel
      </Button>
      <Button variant="primary" onClick={handleSave}>
        Save
      </Button>
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
      customWidth="70vw"
      height="96vh"
    >
      <div className="flex flex-col h-full">
        {/* Tabs */}
        <div className="border-b px-6 flex-shrink-0">
          <div className="flex gap-6">
            {tabs.map((t) => {
              const isDisabled = t.key === "invoices" && !settleInvoice;
              return (
                <button
                  key={t.key}
                  disabled={isDisabled}
                  onClick={() => !isDisabled && setActiveTab(t.key as TabType)}
                  className={`py-3 text-sm font-medium flex items-center gap-2 transition-colors
                    ${activeTab === t.key ? "text-primary border-b-2 border-primary" : ""}
                    ${isDisabled ? "text-muted/40 cursor-not-allowed" : activeTab !== t.key ? "text-muted hover:text-main" : ""}
                  `}
                >
                  <t.icon size={15} />
                  {t.label}
                  {isDisabled && (
                    <span className="text-[10px] text-muted/50 font-normal">
                      (disabled)
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mx-6 mt-4 flex items-start gap-2.5 px-4 py-3 bg-red-50 border border-red-200 rounded-lg flex-shrink-0">
            <AlertCircle
              size={15}
              className="text-red-500 flex-shrink-0 mt-0.5"
            />
            <p className="text-xs text-red-700 flex-1 leading-relaxed">
              {error}
            </p>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600"
            >
              <X size={13} />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Tab Content */}
          <div className="flex-1 overflow-auto p-6">
            {activeTab === "details" && (
              <PaymentDetailsTab
                form={form}
                onChange={handleChange}
                onFormChange={handleFormChange}
                onSettleInvoice={handleSettleInvoice}
              />
            )}
            {activeTab === "invoices" && (
              <InvoiceList form={form} onFormChange={handleFormChange} />
            )}
            {activeTab === "taxes" && (
              <PaymentTaxesTab form={form} onChange={handleChange} />
            )}
          </div>

          {/* Persistent Summary */}
          <div className="w-56 flex-shrink-0 border-l border-[var(--border)] bg-card p-4 flex flex-col gap-4 overflow-auto">
            <h3 className="text-sm font-semibold text-main">Summary</h3>

            <div>
              <p className="text-[11px] text-muted">Party</p>
              <p className="text-xs font-medium text-main truncate">
                {form?.partyName || "—"}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-muted">Type</p>
              <p className="text-xs font-medium text-main">
                {form?.paymentType || "—"}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-muted">Date</p>
              <p className="text-xs font-medium text-main">
                {form?.date || "—"}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-muted">Mode</p>
              <p className="text-xs font-medium text-main">
                {form?.mode || "—"}
              </p>
            </div>

            <div className="border-t border-[var(--border)]" />

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

            {settleInvoice && (
              <>
                <div>
                  <p className="text-[11px] text-muted">Invoices Selected</p>
                  <p className="text-xs font-medium text-main">
                    {selectedCount}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-muted">Allocated</p>
                  <p className="text-base font-bold text-primary">
                    ₹ {totalAllocated.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-muted">Remaining</p>
                  <p
                    className={`text-xs font-semibold ${remaining > 0 ? "text-red-500" : "text-main"}`}
                  >
                    ₹ {remaining.toLocaleString()}
                  </p>
                  {remaining > 0 && paymentAmount > 0 && (
                    <p className="text-[10px] text-red-400 mt-0.5 leading-relaxed">
                      Reduce to ₹ {totalAllocated.toLocaleString()} or allocate
                      remaining
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default PaymentEntryModal;
