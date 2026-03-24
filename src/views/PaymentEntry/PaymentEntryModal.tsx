import React, { useState, useCallback, useEffect } from "react";
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
    amount?: number;
    referenceInvoice?: string;
    date?: string;
  };
}

const PaymentEntryModal: React.FC<Props> = ({ isOpen, onClose, defaultValues }) => {
  const [activeTab, setActiveTab]             = useState<TabType>("details");
  const [form, setForm]                       = useState<Record<string, any>>({});
  const [error, setError]                     = useState<string | null>(null);
  const [invoicesMounted, setInvoicesMounted] = useState(false);

  const isAdvanceFromPO = Boolean(defaultValues?.referenceInvoice);

  const visibleTabs = isAdvanceFromPO
    ? ALL_TABS.filter((t) => t.key !== "invoices")
    : ALL_TABS;

  useEffect(() => {
    if (isOpen) {
      const base = { ...(defaultValues ?? {}) };

      if (!base.date) {
        base.date = new Date().toISOString().split("T")[0];
      }

      if (base.amount != null && (base as any).amountTo == null) {
        (base as any).amountTo = base.amount;
      }

      setForm(base);
      setActiveTab("details");
      setError(null);
      setInvoicesMounted(false);

      if (!isAdvanceFromPO && defaultValues?.referenceInvoice) {
        setInvoicesMounted(true);
        setTimeout(() => {
          setForm((prev) => ({ ...prev, fifoTrigger: Date.now() }));
        }, 200);
      }
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const paymentAmount  = Number(form?.amount ?? 0);
  const totalAllocated = Number(form?.allocatedAmount ?? 0);
  // ── CHANGE 1: renamed from `remaining` → `advance` ──────────────────────
  const advance        = Math.max(0, paymentAmount - totalAllocated);
  const selectedCount: number = (form?.selectedInvoices ?? []).length;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;

      if (name === "partyType" || name === "partyName") {
        setForm((prev) => ({
          ...prev,
          [name]: value,
          allocatedAmount: 0,
          selectedInvoices: [],
          allocations: {},
        }));
      } else {
        setForm((prev) => ({ ...prev, [name]: value }));
      }

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

  const handleAllocateLink = useCallback(() => {
    goToTab("invoices");
    setTimeout(() => {
      setForm((prev) => ({ ...prev, fifoTrigger: Date.now() }));
    }, 50);
  }, [goToTab]);

  const handleSave = useCallback(() => {
    if (!paymentAmount || paymentAmount <= 0) {
      setError("Please enter a payment amount in the Details tab.");
      setActiveTab("details");
      return;
    }
    setError(null);

    const referenceDoctype =
      form?.paymentType === "Pay" ? "Purchase Invoice" : "Sales Invoice";

    const allocations: Record<string, number> = form?.allocations ?? {};
    const references = Object.entries(allocations)
      .filter(([, amount]) => amount > 0)
      .map(([invoiceNumber, allocatedAmount]) => ({
        reference_doctype: referenceDoctype,
        reference_name:    invoiceNumber,
        allocated_amount:  allocatedAmount,
      }));

    const payload = {
      doctype:        "Payment Entry",
      payment_type:   form?.paymentType ?? "",
      posting_date:   form?.date        ?? new Date().toISOString().split("T")[0],
      company:        form?.company     ?? "",

      party_type:     form?.partyType  ?? "",
      party:          form?.partyName  ?? "",

      mode_of_payment:      form?.mode              ?? "",
      paid_from:            form?.companyBankAccount ?? "",
      paid_to:              form?.partyBankAccount   ?? "",

      paid_amount:          paymentAmount,
      received_amount:      Number(form?.amountTo    ?? paymentAmount),
      source_exchange_rate: Number(form?.exchangeRate ?? 1),
      target_exchange_rate: Number(form?.exchangeRate ?? 1),

      reference_no:   form?.referenceNo  ?? "",
      reference_date: form?.referenceDate ?? "",

      ...(isAdvanceFromPO && {
        purchase_order: form?.referenceInvoice ?? "",
      }),

      references,
      total_allocated_amount: isAdvanceFromPO ? 0 : totalAllocated,

      // ── CHANGE 2: advance added to payload ───────────────────────────────
      unallocated_amount: advance,

      taxes:   form?.taxes   ?? [],
      remarks: form?.remarks ?? "",
    };

    console.log("Payment Entry payload:", payload);
    // TODO: await submitPaymentEntry(payload);
  }, [paymentAmount, totalAllocated, advance, isAdvanceFromPO, form]);

  const invoiceListForm = {
    partyType:        form?.partyType,
    partyName:        form?.partyName,
    amount:           form?.amount,
    fifoTrigger:      form?.fifoTrigger,
    referenceInvoice: form?.referenceInvoice,
  };

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
      subtitle={
        isAdvanceFromPO
          ? `Advance payment against PO: ${defaultValues?.referenceInvoice}`
          : "Pay or receive payment from Customer / Supplier / Employee / Shareholder"
      }
      icon={CreditCard}
      footer={footer}
      customWidth="62vw"
      height="95vh"
    >
      <div className="flex flex-col h-full">

        {/* ── Tabs ── */}
        <div className="border-b px-6 flex-shrink-0">
          <div className="flex gap-6">
            {visibleTabs.map((t) => (
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

        {/* ── Error banner ── */}
        {error && (
          <div className="mx-6 mt-4 flex items-start gap-2.5 px-4 py-3 bg-red-50 border border-red-200 rounded-lg flex-shrink-0">
            <AlertCircle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-700 flex-1 leading-relaxed">{error}</p>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
              <X size={13} />
            </button>
          </div>
        )}

        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 overflow-auto p-6">

            {activeTab === "details" && (
              <PaymentDetailsTab
                form={form}
                onChange={handleChange}
                onFormChange={handleFormChange}
                onAllocate={isAdvanceFromPO ? undefined : handleAllocateLink}
                islocked={Boolean(form?.referenceInvoice)}
                isPartyLocked={Boolean(form?.referenceInvoice && form?.partyName && form?.partyType)}
              />
            )}

            {invoicesMounted && !isAdvanceFromPO && (
              <div className={activeTab === "invoices" ? "block" : "hidden"}>
                <InvoiceList form={invoiceListForm} onFormChange={handleFormChange} />
              </div>
            )}

            {activeTab === "taxes" && (
              <PaymentTaxesTab form={form} onChange={handleChange} />
            )}
          </div>

          {/* ── Persistent summary ── */}
          <div className="w-56 flex-shrink-0 border-l border-[var(--border)] bg-card p-4 flex flex-col gap-3 overflow-auto rounded-lg mt-4">
            <h3 className="text-sm font-semibold text-main">Summary</h3>

            <div>
              <p className="text-[11px] text-muted">Party Name</p>
              <p className="text-xs font-medium text-main break-words">
                {form?.partyName
                  ? `${form.partyName}${form?.partyType ? ` (${form.partyType})` : ""}`
                  : "—"}
              </p>
            </div>

            <div>
              <p className="text-[11px] text-muted">Payment</p>
              <p className="text-xs font-medium text-main break-words">
                {form?.paymentType
                  ? `${form.paymentType} via ${form?.mode || "—"}`
                  : "—"}
              </p>
            </div>

            {isAdvanceFromPO && (
              <div>
                <p className="text-[11px] text-muted">Against</p>
                <p className="text-xs font-medium text-primary">{form?.referenceInvoice}</p>
              </div>
            )}

            <div className="border-t border-[var(--border)]" />

            <div>
              <p className="text-[11px] text-muted">Payment Amount</p>
              <p className="text-sm font-semibold text-main">
                {paymentAmount > 0
                  ? `${paymentAmount.toLocaleString()}`
                  : <span className="text-[11px] font-normal text-muted">Not set</span>}
              </p>
            </div>

            {!isAdvanceFromPO && (
              <>
                <div>
                  <p className="text-[11px] text-muted">Invoices Settled</p>
                  <p className="text-xs font-medium text-main">{selectedCount}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted">Allocated</p>
                  <p className="text-base font-bold text-primary">{totalAllocated.toLocaleString()}</p>
                </div>

                {/* ── CHANGE 3: renamed label + logic from remaining → advance ── */}
                <div>
                  <p className="text-[11px] text-muted">Advance</p>
                  <p className={`text-xs font-semibold ${
                    advance > 0 && paymentAmount > 0 ? "text-amber-500" : "text-emerald-600"
                  }`}>
                    {advance.toLocaleString()}
                  </p>
                  {advance > 0 && paymentAmount > 0 && (
                    <p className="text-[10px] text-amber-400 mt-0.5 leading-relaxed">
                      {advance.toLocaleString()} will be treated as advance
                    </p>
                  )}
                </div>
              </>
            )}

            <div className="border-t border-[var(--border)]" />

            <p className="text-[10px] text-muted leading-relaxed">
              {isAdvanceFromPO
                ? "This is an advance payment against the selected Purchase Order."
                : `Use "Allocate →" on the amount field to auto-settle invoices in FIFO order.`}
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default PaymentEntryModal;