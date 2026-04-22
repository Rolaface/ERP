import React, { useState, useCallback, useEffect, useRef } from "react";
import { CreditCard, FileText, AlertCircle, X, Loader2 } from "lucide-react";
import { MinimizableModal } from "../../components/common/MinimizableModal";
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
import {
  showLoading,
  closeSwal,
  showSuccess,
  showApiError,
} from "../../utils/alert";
import type { AllocationResult } from "../../types/paymententryrecord.types";
import { fetchCostCenters, fetchProjects } from "../../api/getAllApi";

type TabType = "details" | "invoices" | "taxes";

const ALL_TABS = [
  { key: "details" as TabType, label: "Details", icon: CreditCard },
  { key: "invoices" as TabType, label: "Invoices", icon: FileText },
  { key: "taxes" as TabType, label: "Taxes & Charges", icon: FileText },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data?: any) => void; 
  onSuccess?: (paymentEntryName: string) => void;
  modalId: string; 

  customerId?: string; 
  defaultValues?: {
    paymentType?: "Pay" | "Receive" | "Internal Transfer";
    partyType?: string;
    partyName?: string;
    partyId?: string;
    amount?: number;
    referenceName?: string;
    referenceType?: "Purchase Order" | "Purchase Invoice"|"Sales Invoice";
    date?: string;
  };
}

const inferReferenceType = (
  partyType?: string,
): "Purchase Order" | "Purchase Invoice" | "Sales Invoice" | undefined => {
  if (partyType === "Supplier") return "Purchase Invoice";
  if (partyType === "Customer") return "Sales Invoice";
  return undefined;
};

function buildPayload(
  form: Record<string, any>,
): CreatePaymentEntryPayload {
  const paymentAmount = Number(form?.amountFrom ?? form?.amount ?? 0);
  const receivedAmount = Number(form?.amountTo ?? paymentAmount);
  const parsedExchangeRate = Number(form?.exchangeRate);
  const exchangeRate =
    Number.isFinite(parsedExchangeRate) && parsedExchangeRate > 0
      ? parsedExchangeRate
      : 1;

  const getReferenceDoctype = (partyType: string): string => {
    if (form?.referenceType === "Purchase Order") return "Purchase Order";
    if (form?.referenceType === "Purchase Invoice") return "Purchase Invoice";
    if (form?.referenceType === "Sales Invoice") return "Sales Invoice";

    switch (partyType) {
      case "Supplier":
        return "Purchase Invoice";
      case "Customer":
        return "Sales Invoice";
      default:
        return "Journal Entry";
    }
  };

  const referenceDoctype = getReferenceDoctype(form?.partyType ?? "");
  const allocations: Record<string, number> = form?.allocations ?? {};
  const invoiceDueDates: Record<string, string> = form?.invoiceDueDates ?? {};

  let references: PaymentReference[] = Object.entries(allocations)
    .filter(([, amount]) => Number(amount) > 0)
    .map(([invoiceName, allocatedAmount]) => ({
      reference_doctype: referenceDoctype,
      reference_name: invoiceName,
      allocated_amount: Number(allocatedAmount),
      ...(invoiceDueDates[invoiceName]
        ? { due_date: invoiceDueDates[invoiceName] }
        : {}),
    }));

  if (references.length === 0 && form?.referenceName && paymentAmount > 0) {
    references = [
      {
        reference_doctype: referenceDoctype,
        reference_name: form.referenceName,
        allocated_amount: paymentAmount,
        ...(invoiceDueDates[form.referenceName]
          ? { due_date: invoiceDueDates[form.referenceName] }
          : {}),
      },
    ];
  }

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
   party_id: form?.partyId || "",
    mode_of_payment: form?.mode ?? "",
    payment_date: form?.date ?? new Date().toISOString().split("T")[0],
    reference_no: form?.referenceNo ?? "",
    reference_date: form?.referenceDate ?? "",
    project: form?.project ?? "",
    cost_center: form?.costCenter ?? "",
    exchange_rate: exchangeRate,

    paid_from: form?.glFrom ?? "",
    paid_from_bank_account: form?.companyBankAccount ?? "",
    paid_from_account_currency: form?.currencyFrom ?? "",
    paid_from_amount: paymentAmount,

    paid_to: form?.glTo ?? "",
    paid_to_bank_account: form?.partyBankAccount ?? "",
    paid_to_account_currency: form?.currencyTo ?? "",
    paid_to_amount: receivedAmount,

    references,
    taxes,
  };

  return payload;
}

function validateForm(form: Record<string, any>): string | null {
  if (!form?.paymentType) return "Payment Type is required.";

  const isInternalTransfer = form.paymentType === "Internal Transfer";

  if (!isInternalTransfer && !form?.partyType) return "Party Type is required.";
  if (!isInternalTransfer && !(form?.partyId || form?.partyName)) {
    return "Party Name is required.";
  }

  if (!form?.date) return "Payment Date is required.";
  if (!form?.mode) return "Mode of Payment is required.";
  if (!form?.glFrom) return "Account (GL) — Paid From is required.";
  if (!form?.glTo) return "Account (GL) — Paid To is required.";

  const fromCurrency = String(form?.currencyFrom ?? "").trim();
  const toCurrency = String(form?.currencyTo ?? "").trim();
  if (fromCurrency && toCurrency && fromCurrency !== toCurrency) {
    const rate = Number(form?.exchangeRate ?? 0);
    if (!rate || rate <= 0) {
      return "Exchange Rate is required for cross-currency payments.";
    }
  }

  const amount = Number(form?.amountFrom ?? form?.amount ?? 0);
  if (!amount || amount <= 0) return "Please enter a valid payment amount.";

  return null;
}

const getInitialForm = () => ({
  paymentType: "Pay",
  partyType: "",
  partyName: "",
  partyId: "",
  mode: "",
  glFrom: "",
  glTo: "",
  currencyFrom: "",
  currencyTo: "",
  companyBankAccount: "",
  partyBankAccount: "",
  amount: "",
 
  amountTo: "",
  referenceNo: "",
  referenceDate: "",
  project: "",
  costCenter: "",
  exchangeRate: 1,
  allocations: {},
  selectedInvoices: [],
  allocatedAmount: 0,
});
const PaymentEntryModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSuccess,
  onSubmit,
  customerId,
  defaultValues,
  modalId,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>("details");
  const [form, setForm] = useState<Record<string, any>>({});
  const [error, setError] = useState<string | null>(null);
  const [taxesMounted, setTaxesMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAllocating, setIsAllocating] = useState(false);
  const lastFetchedPartyKeyRef = useRef<string>("");

  // ── Track previous amountFrom to detect user-driven changes ──────────────
  const prevAmountRef = useRef<number>(0);

  const isAdvanceFromPO =
  defaultValues?.referenceType === "Purchase Order";
  const isInternalTransfer = form?.paymentType === "Internal Transfer";
  const resetModalState = useCallback(() => {
    setForm(getInitialForm());
    setActiveTab("details");
    setError(null);
    setTaxesMounted(false);
    setIsSaving(false);
    setIsAllocating(false);
    lastFetchedPartyKeyRef.current = "";
    prevAmountRef.current = 0;
  }, []);

  const visibleTabs =
    isAdvanceFromPO || isInternalTransfer
      ? ALL_TABS.filter((t) => t.key !== "invoices")
      : ALL_TABS;

  useEffect(() => {
    if (isOpen) return;
    resetModalState();
  }, [isOpen, resetModalState]);

  // ── Reset on open ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;

    const base: Record<string, any> = {
  ...getInitialForm(),   
  ...(defaultValues ?? {}) 
};

if (customerId) {
  base.partyId = customerId;
  base.partyType = "Customer"; 
}
    if (defaultValues?.referenceType) {
      base.referenceType = defaultValues.referenceType;
    } else if (base.referenceName && !base.referenceType) {
      base.referenceType = inferReferenceType(base.partyType);
    }
    lastFetchedPartyKeyRef.current = "";
    const today = new Date().toISOString().split("T")[0];

    if (!base.date) base.date = today;
    if (!base.referenceDate) base.referenceDate = today;

    if (base.amount != null) {
      base.amountFrom ??= base.amount;
      base.amountTo ??= base.amount;
    }

    if (defaultValues?.partyId) {
      base.partyId = defaultValues.partyId;
    }

    if (defaultValues?.referenceName) {
      const lockedAmount = Math.max(
        0,
        Number(base.amountFrom ?? base.amount ?? 0),
      );
      base.allocations = {
        [defaultValues.referenceName]: lockedAmount,
      };
      base.allocatedAmount = lockedAmount;
      base.selectedInvoices = [defaultValues.referenceName];
    }

    const hasPartyAndAmount =
      Boolean(base.partyName) &&
      Boolean(base.partyType) &&
      Number(base.amountFrom ?? base.amount ?? 0) > 0;

    prevAmountRef.current = Number(base.amountFrom ?? base.amount ?? 0);

    setForm(base);
    setActiveTab("details");
    setError(null);
    setTaxesMounted(false);
    setIsSaving(false);
    // If party + amount pre-filled, start in allocating state so sidebar
    // never flashes wrong Advance value
    setIsAllocating(hasPartyAndAmount && !isAdvanceFromPO);
  }, [isOpen,defaultValues]);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    const applyDefault = async (
      fetcher: () => Promise<{ value: string }[]>,
      field: string
    ) => {
      try {
        const options = await fetcher();
        if (cancelled) return;
        if (options.length > 0) {
          setForm((prev) => {
            if (prev[field]?.trim()) return prev;
            return { ...prev, [field]: options[0].value };
          });
        }
      } catch {
        // silent fail
      }
    };

    applyDefault(fetchCostCenters, "costCenter");
    applyDefault(fetchProjects, "project");

    return () => { cancelled = true; };
  }, [isOpen]);

    // ── Watch amountFrom — set isAllocating=true immediately when amount
  //    changes AND party is selected, BEFORE InvoiceList has a chance to react
  // ──────────────────────────────────────────────────────────────────────────
  const amountFrom = Number(form?.amountFrom ?? form?.amount ?? 0);

  useEffect(() => {
    if (!isOpen || isAdvanceFromPO) return;

    const hasParty = Boolean(form?.partyName) && Boolean(form?.partyType);
    const amountChanged = amountFrom !== prevAmountRef.current;

    if (hasParty && amountChanged && amountFrom > 0) {
      // Amount just changed with party selected → allocation will run → show spinner NOW
      setIsAllocating(true);
    }

    prevAmountRef.current = amountFrom;
  }, [amountFrom]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived values ─────────────────────────────────────────────────────────
  const paymentAmount = amountFrom;
  const totalAllocated = Number(form?.allocatedAmount ?? 0);
  // While allocating, never show stale advance — hide it
  const advance = isAllocating ? 0 : Math.max(0, paymentAmount - totalAllocated);
  const selectedCount: number = (form?.selectedInvoices ?? []).length;

const getResetPartyState = (prev: any, name: string, value: string) => ({
  ...prev,
  [name]: value,
  partyId: name === "partyName" ? prev.partyId : "",
  allocatedAmount: 0,
  selectedInvoices: [],
  allocations: {},
});

const getOptimisticAmountState = (prev: Record<string, any>, name: string, value: string) => {
  const numericValue = Number(value) || 0;
  
  if (numericValue === 0) {
    const isRef = Boolean(prev.referenceName);
    return { 
      [name]: value, 
      fifoTrigger: Date.now(), 
      allocatedAmount: 0, 
      allocations: isRef ? { [prev.referenceName]: 0 } : {}, 
      selectedInvoices: isRef ? [prev.referenceName] : [] 
    };
  }
const isRef = Boolean(prev.referenceName);
  const outstanding = Number(prev.totalOutstanding || 0);

  return {
    [name]: value,
    allocatedAmount: isRef ? numericValue : Math.min(numericValue, outstanding),
    ...(isRef && {
      allocations: { ...prev.allocations, [prev.referenceName]: numericValue },
      selectedInvoices: Array.from(new Set([...(prev.selectedInvoices || []), prev.referenceName])),
    }),
  };
};

useEffect(() => {
    const amount = Number(form?.amountFrom ?? form?.amount ?? 0);
    
    if (amount === 0 || form?.referenceName) return;

    const timeoutId = setTimeout(() => {
      setForm((prev) => ({ ...prev, fifoTrigger: Date.now() }));
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [form?.amount, form?.amountFrom, form?.referenceName]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setError(null);

      if (name === "amount" || name === "amountFrom") {
        setIsAllocating(true);
      }

      setForm((prev) => {
       if (name === "partyType" || name === "partyName") {
  return getResetPartyState(prev, name, value);
}
        if (name === "amount" || name === "amountFrom") {
          return { ...prev, ...getOptimisticAmountState(prev, name, value) };
        }
        return { ...prev, [name]: value };
      });
    },
    []
  );

  const handleFormChange = useCallback(
    (updates: Record<string, any>) => {
      setForm((prev) => {
        if (prev.referenceName) {
          const referenceName = prev.referenceName;
          const next = { ...prev, ...updates };
          const lockedAmount = Math.max(
            0,
            Number(next.amountFrom ?? next.amount ?? 0),
          );

          return {
            ...next,
            referenceType:
              next.referenceType ??
              prev.referenceType ??
              inferReferenceType(next.partyType),
            allocations: { [referenceName]: lockedAmount },
            selectedInvoices: [referenceName],
            allocatedAmount: lockedAmount,
          };
        }
        const currentAmount = Number(prev.amountFrom ?? prev.amount ?? 0);
        
    if (
  !prev.referenceName &&
  currentAmount > 0 &&
  updates.allocatedAmount === 0 &&
  (!updates.allocations || Object.keys(updates.allocations).length === 0)
)
         {
          const { allocatedAmount, allocations, selectedInvoices, ...safeUpdates } = updates;
          return Object.keys(safeUpdates).length ? { ...prev, ...safeUpdates } : prev;
        }

        if (
          currentAmount === 0 &&
          (updates.allocatedAmount !== undefined || updates.allocations !== undefined)
        ) {
          return prev;
        }

        if (
          updates.allocatedAmount !== undefined && 
          Number(updates.allocatedAmount) > currentAmount
        ) {
          return prev;
        }

        return { ...prev, ...updates };
      });
      setError((prev) => (prev ? null : prev));
    },
    [],
  );

  const goToTab = useCallback((tab: TabType) => {
    setActiveTab(tab);
    if (tab === "taxes") setTaxesMounted(true);
  }, []);

  const handleAllocateLink = useCallback(() => {
    goToTab("invoices");
    setTimeout(() => {
      setForm((prev) => ({ ...prev, fifoTrigger: Date.now() }));
    }, 50);
  }, [goToTab]);

  const handleAllocationLoadingChange = useCallback((loading: boolean) => {
    setIsAllocating(loading);
  }, []);

  // ── Save ───────────────────────────────────────────────────────────────────
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
    const payload = buildPayload(form);
    const response = await createPaymentEntry(payload);

    closeSwal();


    if (response?.status === "success") {
      showSuccess(response.message || "Payment created successfully");

     
      onSuccess?.(response.data?.paymentId || "");

      resetModalState();
      onClose();
    } else {
      // fallback if backend sends unexpected structure
      showApiError(response);
    }

  } catch (err: any) {
    closeSwal();
    showApiError(err);
  } finally {
    setIsSaving(false);
  }
}, [form, onClose, onSuccess, resetModalState]);

  const invoiceListForm = {
    partyType: form?.partyType,
    partyName: form?.partyName,
    partyId: form?.partyId,
    amount: form?.amountFrom ?? form?.amount,
    fifoTrigger: form?.fifoTrigger,
    referenceInvoice: form?.referenceName,
    allocations: form?.allocations ?? {},
  };

  const requiresExchangeRate =
    Boolean(form?.currencyFrom) &&
    Boolean(form?.currencyTo) &&
    form?.currencyFrom !== form?.currencyTo;
  const hasExchangeRate =
    !requiresExchangeRate || Number(form?.exchangeRate ?? 0) > 0;
  const hasPartySelection =
    isInternalTransfer || Boolean(form?.partyId || form?.partyName);
  const hasAccounts = Boolean(form?.glFrom && form?.glTo);
  const hasAmount = Number(form?.amountFrom ?? form?.amount ?? 0) > 0;
  const isSubmitDisabled =
    isSaving || !hasExchangeRate || !hasPartySelection || !hasAccounts || !hasAmount;

  const footer = (
    <>
      <Button
        variant="secondary"
        onClick={() => {
          resetModalState();
          onClose();
        }}
        disabled={isSaving}
      >
        Cancel
      </Button>
      <Button variant="primary" onClick={handleSave} disabled={isSubmitDisabled}>
        {isSaving ? "Saving…" : "Save"}
      </Button>
    </>
  );

  return (
    <MinimizableModal
     modalId={modalId}
      isOpen={isOpen}
      onClose={() => {
        resetModalState();
        onClose();
      }}
      title="Payment Entry"
      subtitle={
        isAdvanceFromPO
          ? `Advance payment against PO: ${defaultValues?.referenceName}`
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
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
              <X size={13} />
            </button>
          </div>
        )}

        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 overflow-auto p-6">
            {/* ── Details tab ── */}
            <div className={activeTab === "details" ? "block" : "hidden"}>
              <PaymentDetailsTab
                form={form}
                onChange={handleChange}
                onFormChange={handleFormChange}
                onAllocate={isAdvanceFromPO ? undefined : handleAllocateLink}
                islocked={Boolean(form?.referenceName)}
                isPartyLocked={Boolean(
                  form?.referenceName && form?.partyName && form?.partyType,
                )}
                partyFetchKeyRef={lastFetchedPartyKeyRef}
              />
            </div>

            {/* ── Invoices tab — always mounted once party is selected so
                   onLoadingChange fires even when tab is hidden ── */}
            {!isAdvanceFromPO && !isInternalTransfer && form?.partyName && (
              <div className={activeTab === "invoices" ? "block" : "hidden"}>
                <InvoiceList
                  form={invoiceListForm}
                  onFormChange={handleFormChange}
                  onLoadingChange={handleAllocationLoadingChange}
                />
              </div>
            )}

            {/* ── Taxes tab ── */}
            {taxesMounted && (
              <div className={activeTab === "taxes" ? "block" : "hidden"}>
                <PaymentTaxesTab form={form} onFormChange={handleFormChange} />
              </div>
            )}
          </div>

          {/* ── Summary sidebar ── */}
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

            {form?.partyName && (
              <div>
                <p className="text-[11px] text-muted">Total Outstanding</p>
                {form?.totalOutstanding == null ? (
                  <p className="text-[11px] text-muted animate-pulse">Loading…</p>
                ) : (
                  <p className={`text-sm font-semibold ${
                    Number(form.totalOutstanding) > 0 ? "text-amber-500" : "text-emerald-600"
                  }`}>
                    {Number(form.totalOutstanding).toLocaleString()}
                  </p>
                )}
              </div>
            )}

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
                <p className="text-xs font-medium text-primary">{form?.referenceName}</p>
              </div>
            )}

            <div className="border-t border-[var(--border)]" />

            <div>
              <p className="text-[11px] text-muted">Payment Amount</p>
              <p className="text-sm font-semibold text-main">
                {paymentAmount > 0 ? (
                  paymentAmount.toLocaleString()
                ) : (
                  <span className="text-[11px] font-normal text-muted">Not set</span>
                )}
              </p>
            </div>

            {/* Spinner — shown while allocating */}
            {isAllocating && !isAdvanceFromPO && !isInternalTransfer && (
              <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded-lg mt-2">
                <Loader2 size={14} className="animate-spin text-primary flex-shrink-0" />
                <p className="text-[11px] text-primary font-medium">Calculating allocation…</p>
              </div>
            )}

            {!isAllocating && !isAdvanceFromPO && !isInternalTransfer && (
              <>
                <div>
                  <p className="text-[11px] text-muted">Invoices Settled</p>
                  <p className="text-xs font-medium text-main">
                    {isAllocating
                      ? <span className="text-muted animate-pulse">—</span>
                      : selectedCount}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] text-muted">Allocated</p>
                  <p className="text-base font-bold text-primary">
                    {isAllocating
                      ? <span className="text-sm font-normal text-muted animate-pulse">—</span>
                      : totalAllocated.toLocaleString()}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] text-muted">Advance</p>
                  {isAllocating ? (
                    <p className="text-[11px] text-muted animate-pulse">Calculating…</p>
                  ) : (
                    <>
                      <p className={`text-xs font-semibold ${
                        advance > 0 && paymentAmount > 0 ? "text-amber-500" : "text-emerald-600"
                      }`}>
                        {paymentAmount > 0 ? advance.toLocaleString() : "—"}
                      </p>
                      {advance > 0 && paymentAmount > 0 && (
                        <p className="text-[10px] text-amber-400 mt-0.5 leading-relaxed">
                          {advance.toLocaleString()} will be treated as advance
                        </p>
                      )}
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </MinimizableModal>
  );
};

export default PaymentEntryModal;
