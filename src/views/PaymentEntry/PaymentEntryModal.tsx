import React, { useState, useCallback, useEffect } from "react";
import { CreditCard, FileText, AlertCircle, X } from "lucide-react";
import Modal from "../../components/ui/modal/modal";
import { Button } from "../../components/ui/modal/formComponent";
import PaymentDetailsTab from "../../components/Payment/PaymentDetailsTab";
import PaymentTaxesTab from "../../components/Payment/PaymentTaxesTab";
import InvoiceList from "./invoicelist";
import {
  createPaymentEntry,
  type CreatePaymentEntryPayload,
  type PaymentReference,
  type PaymentTax,
} from "../../api/BankAccountApi";
import { showLoading,closeSwal,showSuccess,showApiError } from "../../utils/alert";
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
  onSuccess?: (paymentEntryName: string) => void;
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


function buildPayload(
  form: Record<string, any>,
  isAdvanceFromPO: boolean
): CreatePaymentEntryPayload {
  const paymentAmount = Number(form?.amountFrom ?? form?.amount ?? 0);
  const receivedAmount = Number(form?.amountTo ?? paymentAmount);

  // References (invoice allocations)
const getReferenceDoctype = (partyType: string): string => {
  switch (partyType) {
    case "Supplier":   return "Purchase Invoice";
    case "Customer":   return "Sales Invoice";
    case "Employee":   return "Journal Entry";
    case "Shareholder": return "Journal Entry";
    default:           return "Journal Entry";
  }
};

const referenceDoctype = getReferenceDoctype(form?.partyType ?? "");
  const allocations: Record<string, number> = form?.allocations ?? {};
  const invoiceDueDates: Record<string, string> = form?.invoiceDueDates ?? {}; 

  const references: PaymentReference[] = Object.entries(allocations)
    .filter(([, amount]) => Number(amount) > 0)
    .map(([invoiceName, allocatedAmount]) => ({
      reference_doctype: referenceDoctype,
      reference_name: invoiceName,
      allocated_amount: Number(allocatedAmount),
      ...(invoiceDueDates[invoiceName]
        ? { due_date: invoiceDueDates[invoiceName] }
        : {}),
    }));

  // Taxes
  const taxes: PaymentTax[] = (form?.taxes ?? []).map((t: any) => ({
    type: t.type ?? "",
    account_head: t.account_head ?? "",
    tax_rate: Number(t.tax_rate ?? 0),
    amount: Number(t.amount ?? 0),
    total: Number(t.total ?? 0),
  }));

  const payload: CreatePaymentEntryPayload = {
    payment_type: form?.paymentType ?? "Pay",
    party_type: form?.partyType ?? "",
    party_id: form?.partyName ?? "",
    mode_of_payment: form?.mode ?? "",
    payment_date: form?.date ?? new Date().toISOString().split("T")[0],
    reference_no: form?.referenceNo ?? "",
    reference_date: form?.referenceDate ?? "",
    project: form?.project ?? "",
    cost_center: form?.costCenter ?? "",
    exchange_rate: Number(form?.exchangeRate ?? 1),

    // Paid From (left side)
    paid_from: form?.glFrom ?? "",
    paid_from_bank_account: form?.companyBankAccount ?? "",
    paid_from_account_currency: form?.currencyFrom ?? "",
    paid_from_amount: paymentAmount,

    // Paid To (right side)
    paid_to: form?.glTo ?? "",
    paid_to_bank_account: form?.partyBankAccount ?? "",
    paid_to_account_currency: form?.currencyTo ?? "",
    paid_to_amount: receivedAmount,

    references,
    taxes,
  };

  return payload;
}


// Validation — returns first error string or null

function validateForm(form: Record<string, any>): string | null {
  if (!form?.paymentType) return "Payment Type is required.";
  if (!form?.partyType) return "Party Type is required.";
  if (!form?.partyName) return "Party Name is required.";
  if (!form?.date) return "Payment Date is required.";
  if (!form?.mode) return "Mode of Payment is required.";
  if (!form?.glFrom) return "Account (GL) — Paid From is required.";
  if (!form?.glTo) return "Account (GL) — Paid To is required.";

  const amount = Number(form?.amountFrom ?? form?.amount ?? 0);
  if (!amount || amount <= 0) return "Please enter a valid payment amount.";

  return null;
}


// Component

const PaymentEntryModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultValues,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>("details");
  const [form, setForm] = useState<Record<string, any>>({});
  const [error, setError] = useState<string | null>(null);
  const [invoicesMounted, setInvoicesMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

 const isAdvanceFromPO = false;

  const visibleTabs = isAdvanceFromPO
    ? ALL_TABS.filter((t) => t.key !== "invoices")
    : ALL_TABS;

  // ── Reset on open 
  useEffect(() => {
    if (!isOpen) return;

    const base: Record<string, any> = { ...(defaultValues ?? {}) };

    if (!base.date) {
      base.date = new Date().toISOString().split("T")[0];
    }

    // Mirror `amount` → `amountFrom` + `amountTo` if provided
    if (base.amount != null) {
      base.amountFrom ??= base.amount;
      base.amountTo ??= base.amount;
    }

    setForm(base);
    setActiveTab("details");
    setError(null);
    setInvoicesMounted(false);
    setIsSaving(false);

// Auto-allocate reference invoice if opened from invoice table
if (defaultValues?.referenceInvoice && base.amount) {
  base.allocations = {
    [defaultValues.referenceInvoice]: Number(base.amount),
  };
  base.allocatedAmount = Number(base.amount);
  base.selectedInvoices = [defaultValues.referenceInvoice];
}
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived values 
  const paymentAmount = Number(form?.amountFrom ?? form?.amount ?? 0);
  const totalAllocated = Number(form?.allocatedAmount ?? 0);
  const advance = Math.max(0, paymentAmount - totalAllocated);
  const selectedCount: number = (form?.selectedInvoices ?? []).length;

  // ── Handlers 
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

  // ── Save 
  const handleSave = useCallback(async () => {
    const validationError = validateForm(form);
    if (validationError) {
      setError(validationError);
      setActiveTab("details");
      return;
    }

    setError(null);
    setIsSaving(true);
    showLoading("Creating Payment Entry…");

    try {
      const payload = buildPayload(form, isAdvanceFromPO);
      const response = await createPaymentEntry(payload);

      closeSwal();

      showSuccess(response.message ?? "Payment Entry created successfully.");

      onSuccess?.(response.data?.modeOfPaymentId ?? "");
      onClose();
    } catch (err: any) {
      closeSwal();
      showApiError(err);
    } finally {
      setIsSaving(false);
    }
  }, [form, isAdvanceFromPO, onClose, onSuccess]);


  const invoiceListForm = {
    partyType: form?.partyType,
    partyName: form?.partyName,
    amount: form?.amountFrom ?? form?.amount,
    fifoTrigger: form?.fifoTrigger,
    referenceInvoice: form?.referenceInvoice,
  };

  const footer = (
    <>
      <Button variant="secondary" onClick={onClose} disabled={isSaving}>
        Cancel
      </Button>
      <Button variant="primary" onClick={handleSave} disabled={isSaving}>
        {isSaving ? "Saving…" : "Save"}
      </Button>
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

        {/* ── Validation error banner ── */}
        {error && (
          <div className="mx-6 mt-4 flex items-start gap-2.5 px-4 py-3 bg-red-50 border border-red-200 rounded-lg flex-shrink-0">
            <AlertCircle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-700 flex-1 leading-relaxed">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600"
            >
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
                isPartyLocked={Boolean(
                  form?.referenceInvoice && form?.partyName && form?.partyType
                )}
              />
            )}

            {invoicesMounted && !isAdvanceFromPO && (
              <div className={activeTab === "invoices" ? "block" : "hidden"}>
                <InvoiceList
                  form={invoiceListForm}
                  onFormChange={handleFormChange}
                />
              </div>
            )}

            {activeTab === "taxes" && (
              <PaymentTaxesTab form={form} onFormChange={handleFormChange} />
            )}
          </div>

          {/* ── Persistent summary sidebar ── */}
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
                <p className="text-xs font-medium text-primary">
                  {form?.referenceInvoice}
                </p>
              </div>
            )}

            <div className="border-t border-[var(--border)]" />

            <div>
              <p className="text-[11px] text-muted">Payment Amount</p>
              <p className="text-sm font-semibold text-main">
                {paymentAmount > 0 ? (
                  paymentAmount.toLocaleString()
                ) : (
                  <span className="text-[11px] font-normal text-muted">
                    Not set
                  </span>
                )}
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
                  <p className="text-base font-bold text-primary">
                    {totalAllocated.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-muted">Advance</p>
                  <p
                    className={`text-xs font-semibold ${
                      advance > 0 && paymentAmount > 0
                        ? "text-amber-500"
                        : "text-emerald-600"
                    }`}
                  >
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