import React, { useState, useCallback ,useEffect} from "react";
import { CreditCard, FileText, AlertCircle, X } from "lucide-react";
import Modal from "../../components/ui/modal/modal";
import { Button } from "../../components/ui/modal/formComponent";
import PaymentDetailsTab from "../../components/Payment/PaymentDetailsTab";
import PaymentTaxesTab from "../../components/Payment/PaymentTaxesTab";
import InvoiceList from "./invoicelist";
import type { AllocationResult } from "../../types/paymententryrecord.types";
 
type TabType = "details" | "invoices" | "taxes";
 
const ALL_TABS = [
  { key: "details" as TabType, label: "Details", icon: CreditCard },
  { key: "invoices" as TabType, label: "Invoices", icon: FileText },
  { key: "taxes" as TabType, label: "Taxes & Charges", icon: FileText },
];
 
interface Props {
  isOpen: boolean;
  onClose: () => void;
  defaultValues?: {
    paymentType?: "Pay" | "Receive" | "Internal Transfer";
    partyType?: string;
    partyName?: string;
    partyId?: string;
  };
}
 
const PaymentEntryModal: React.FC<Props> = ({ isOpen, onClose , defaultValues}) => {
  const [activeTab, setActiveTab] = useState<TabType>("details");
  const [form, setForm] = useState<Record<string, any>>({});
  const [error, setError] = useState<string | null>(null);
  // InvoiceList lazy-mounts on first visit, then stays alive
  const [invoicesMounted, setInvoicesMounted] = useState(false);

useEffect(() => {
  if (isOpen) {
    setForm({});

    setTimeout(() => {
      setForm({
        ...(defaultValues || {}),
      });
    }, 0);
  }
}, [isOpen, defaultValues]);
 
  const paymentAmount = Number(form?.amount || 0);
  const totalAllocated = Number(form?.allocatedAmount || 0);
  const remaining = Math.max(0, paymentAmount - totalAllocated);
  const selectedCount: number = (form?.selectedInvoices ?? []).length;
 
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setForm((prev) => ({ ...prev, [name]: value }));
      setError(null);
    },
    []
  );
 
 const handleFormChange = useCallback(
  (updates: Record<string, unknown> | AllocationResult) => {
    setForm((prev) => ({ ...prev, ...updates }));
    setError(null);
  },
  []
);
 
  const goToTab = useCallback((tab: TabType) => {
    setActiveTab(tab);
    if (tab === "invoices") setInvoicesMounted(true);
  }, []);
 
  // Called from Details tab "Allocate →" link — switches to invoices tab
  // FIFO allocation is computed inside InvoiceList when it receives `fifoTrigger`
  const handleAllocateLink = useCallback(() => {
    goToTab("invoices");
    // Signal InvoiceList to run FIFO allocation
    setForm((prev) => ({ ...prev, fifoTrigger: Date.now() }));
  }, [goToTab]);
 
  const handleSave = useCallback(() => {
    if (!paymentAmount || paymentAmount <= 0) {
      setError("Please enter a payment amount in the Details tab.");
      setActiveTab("details");
      return;
    }
    setError(null);
    // TODO: call save API with form data
  }, [paymentAmount]);
 
  const footer = (
    <>
      <Button variant="secondary" onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={handleSave}>Save</Button>
    </>
  );
 
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Payment Entry"
      subtitle="Pay or receive payment from Customer / Supplier / Employee / Shareholder"
      icon={CreditCard}
      footer={footer}
      customWidth="62vw"
      height="95vh"
    >
      <div className="flex flex-col h-full">
 
        {/* Tabs — all always visible, no restrictions */}
        <div className="border-b px-6 flex-shrink-0">
          <div className="flex gap-6">
            {ALL_TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => goToTab(t.key)}
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
 
        {/* Error banner */}
        {error && (
          <div className="mx-6 mt-4 flex items-start gap-2.5 px-4 py-3 bg-red-50 border border-red-200 rounded-lg flex-shrink-0">
            <AlertCircle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-700 flex-1 leading-relaxed">{error}</p>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
              <X size={13} />
            </button>
          </div>
        )}
 
        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
 
          <div className="flex-1 overflow-auto p-6">
            {activeTab === "details" && (
              <PaymentDetailsTab
                form={form}
                onChange={handleChange}
                onFormChange={handleFormChange}
                onAllocate={handleAllocateLink}
              />
            )}
 
            {/* Lazy mount, keep alive */}
            {invoicesMounted && (
              <div className={activeTab === "invoices" ? "block" : "hidden"}>
                <InvoiceList form={form} onFormChange={handleFormChange} />
              </div>
            )}
 
            {activeTab === "taxes" && (
              <PaymentTaxesTab form={form} onChange={handleChange} />
            )}
          </div>
 
          {/* Persistent summary */}
          <div className="w-56 flex-shrink-0 border-l border-[var(--border)] bg-card p-4 flex flex-col gap-3 overflow-auto">
            <h3 className="text-sm font-semibold text-main">Summary</h3>
 
            <div>
              <p className="text-[11px] text-muted">Party Name</p>
              <p className="text-xs font-medium text-main truncate">{form?.partyName || "—"}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted">Party Type</p>
              <p className="text-xs font-medium text-main truncate">{form?.partyType || "—"}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted">Payment Type</p>
              <p className="text-xs font-medium text-main">{form?.paymentType || "—"}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted">Date</p>
              <p className="text-xs font-medium text-main">{form?.date || "—"}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted">Mode</p>
              <p className="text-xs font-medium text-main">{form?.mode || "—"}</p>
            </div>
 
            <div className="border-t border-[var(--border)]" />
 
            <div>
              <p className="text-[11px] text-muted">Payment Amount</p>
              <p className="text-sm font-semibold text-main">
                {paymentAmount > 0
                  ? `₹ ${paymentAmount.toLocaleString()}`
                  : <span className="text-[11px] font-normal text-muted">Not set</span>}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-muted">Invoices Settled</p>
              <p className="text-xs font-medium text-main">{selectedCount}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted">Allocated</p>
              <p className="text-base font-bold text-primary">₹ {totalAllocated.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted">Remaining</p>
              <p className={`text-xs font-semibold ${remaining > 0 && paymentAmount > 0 ? "text-red-500" : "text-emerald-600"}`}>
                ₹ {remaining.toLocaleString()}
              </p>
              {remaining > 0 && paymentAmount > 0 && (
                <p className="text-[10px] text-red-400 mt-0.5 leading-relaxed">
                  ₹ {remaining.toLocaleString()} unallocated
                </p>
              )}
            </div>
 
            <div className="border-t border-[var(--border)]" />
 
            <p className="text-[10px] text-muted leading-relaxed">
              Use "Allocate →" on the amount field to auto-settle invoices in FIFO order.
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
};
 
export default PaymentEntryModal;