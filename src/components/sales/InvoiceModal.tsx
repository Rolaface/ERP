import React, { useState, useEffect, useMemo } from "react";
import { File, User, Mail, Phone } from "lucide-react";
import TermsAndCondition from "../TermsAndCondition";
import { showApiError, showSuccess } from "../../utils/alert";
import {
  useDataRefreshStore,
  REFRESH_KEYS,
} from "../../store/dataRefreshStore";
import { createSalesInvoice, editSalesInvoice } from "../../api/salesApi";
import { selectPrincipals } from "../../api/customerApi";
import CustomerSelect from "../selects/CustomerSelect";
import SearchSelect2 from "../ui/modal/SearchSelect2";
import { MinimizableModal } from "../../components/common/MinimizableModal";
import ModalFooter from "../common/ModalFooter";
import { ModalInput, ToggleSwitch } from "../ui/modal/modalComponent";
import { useInvoiceForm } from "../../hooks/useInvoiceForm";
import InvoiceChargesTab from "../../views/Sales/InvoiceChargeTab";
import DatePickerInput from "../calendar/DatePickerInput";
import { InvoiceAddressTab } from "./InvoiceAddressTab";

import ItemTable from "../common/ItemTable";
import type { ModalSubmitHandler } from "../../types/modal";
import { useDefault } from "../../hooks/usedefaultdata";
import ModeOfPaymentSelect from "../selects/defaults/Modeofpaymentselect";
import { useCompanyStore } from "../../store/companyStore";

// ─── Types ────────────────────────────────────────────────────────────────────

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: ModalSubmitHandler;
  initialData?: any;
  mode?: "create" | "edit";
  modalId?: string;
}

const ITEMS_PER_PAGE = 5;

// ─── Component ────────────────────────────────────────────────────────────────

const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  onClose,
  initialData,
  mode = "create",
  modalId,
}) => {
  const resolvedModalId = useMemo(
    () =>
      modalId ||
      (mode === "edit" && initialData?.invoiceNumber
        ? `invoice-edit-${initialData.invoiceNumber}-${Date.now()}`
        : `invoice-create-${Date.now()}`),
    [modalId, mode, initialData?.invoiceNumber],
  );

  const [submitting, setSubmitting] = useState(false);

  const [principalOptions, setPrincipalOptions] = useState<any[]>([]);
  const [principalsFetched, setPrincipalsFetched] = useState(false);

  const [invoiceType, setInvoiceType] = useState<
    "Product" | "Service" | "RVAT"
  >("Product");
  const domain = useDefault("primary_business_domain");
  const isRvatAgent = useDefault("is_rvat_agent");
  const isZraEnabled = useCompanyStore((s) => s.isZraEnabled);

  // RVAT tab sirf tab dikhega jab dono conditions true ho
  const showRvatOption = !!isZraEnabled && Number(isRvatAgent) === 1;

  const invoiceTypeOptions = [
    { label: "Product", value: "Product" },
    { label: "Service", value: "Service" },
    ...(showRvatOption ? [{ label: "RVAT", value: "RVAT" }] : []),
  ];

  useEffect(() => {
    if (mode === "edit" && initialData?.items?.length > 0) {
      if (initialData.invoiceType === "RVAT") {
        setInvoiceType("RVAT");
        return;
      }
      // Check if the first item (or any item) is a service
      const isService = initialData.items[0]?.isServiceItem;
      setInvoiceType(isService ? "Service" : "Product");
    } else if (mode === "create") {
      // Default to company domain for new invoices (fallback to Product)
      setInvoiceType(domain === "Service" ? "Service" : "Product");
    }
  }, [initialData, mode, isOpen, domain]);

  useEffect(() => {
    if (invoiceType === "RVAT" && !showRvatOption) {
      setInvoiceType("Product");
    }
  }, [invoiceType, showRvatOption]);

  useEffect(() => {
    actions.handleInputChange({
      target: { name: "invoiceType", value: invoiceType },
    } as any);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceType]);

  const {
    formData,
    customerDetails,
    customerNameDisplay,
    paginatedItems,
    totals,
    ui,
    actions,
    resetDirty,
    handleCloseWithConfirm,
  } = useInvoiceForm(
    isOpen,
    onClose,
    undefined,
    mode === "edit" ? "edit" : "invoice",
    initialData,
  );

  const primaryContact =
    customerDetails?.contacts?.find((c: any) => c.isPrimary) || {};
  const billingAddress =
    customerDetails?.addresses?.find((a: any) => a.type === "Billing") || {};

  const tabs: Array<"details" | "address" | "otherCharges" | "terms"> = [
    "details",
    "address",
    "otherCharges",
    "terms",
  ];

  useEffect(() => {
    if (isOpen && mode === "create" && initialData?.customerName) {
      actions.handleCustomerSelect({
        name: initialData.customerName,
        id: initialData.customerId,
      });
    }
  }, [isOpen, mode, initialData]);

 const showExchangeRate =
    !!ui.baseCurrency &&
    !!formData.currencyCode &&
    formData.currencyCode.trim().toUpperCase() !==
      ui.baseCurrency.trim().toUpperCase();

const mapPrincipalsToOptions = (list: any[], query: string) => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? list.filter((p: any) =>
          [p.principalNm, p.tpin, p.tin, p.principalEmail, p.accountNo]
            .filter(Boolean)
            .some((field: any) => String(field).toLowerCase().includes(q)),
        )
      : list;
    return filtered.map((p: any) => ({
      value: p.principalNm,
      label: `${p.principalNm} (${p.tpin})`,
    }));
  };

  const fetchPrincipalOptions = async (query: string) => {
    try {
      if (!principalsFetched) {
        const res = await selectPrincipals();
        const list =
          res?.data?.taxpayerPrincipalList ??
          res?.taxpayerPrincipalList ??
          res?.message?.data?.taxpayerPrincipalList ??
          [];
        setPrincipalOptions(list);
        setPrincipalsFetched(true);
        return mapPrincipalsToOptions(list, query);
      }
      return mapPrincipalsToOptions(principalOptions, query);
    } catch (error) {
      showApiError(error);
      return [];
    }
  };

const handlePrincipalSelect = (value: string) => {
    const selected = principalOptions.find(
      (p: any) => p.principalNm === value,
    );
    if (selected) actions.setPrincipal(selected);
  };

  const handleSubmitForm = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const payload = await actions.handleSubmit({
        preventDefault: () => {},
      } as React.FormEvent);

      if (!payload) return;
      payload.updateStock = true;
      payload.invoiceType = invoiceType;

      if (mode === "edit") {
        const invoiceNumber =
          formData.invoiceNumber ??
          initialData?.id ??
          initialData?.invoiceNumber;
        if (!invoiceNumber) {
          showApiError("Invoice number missing — cannot update");
          return;
        }
        const response = await editSalesInvoice(invoiceNumber, payload);
        const res = response?.message;
        if (res?.status_code === 200) {
          showSuccess(res?.message || "Invoice updated successfully");
          resetDirty();
          onClose();
          useDataRefreshStore
            .getState()
            .triggerRefresh(REFRESH_KEYS.INVOICE_LIST);
        } else {
          showApiError(res?.message || "Failed to update invoice");
        }
      } else {
        const response = await createSalesInvoice(payload);
        if (!response) return;
        const res = response?.message;
        if (res?.status_code === 201) {
          showSuccess(`${res?.message} (ID: ${res?.data?.invoiceId})`);
          resetDirty();
          onClose();
          useDataRefreshStore
            .getState()
            .triggerRefresh(REFRESH_KEYS.INVOICE_LIST);
        } else {
          showApiError(res?.message || "Something went wrong");
        }
      }
    } catch (err) {
      showApiError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    const currentIndex = tabs.indexOf(ui.activeTab as any);
    if (currentIndex < tabs.length - 1) {
      ui.setActiveTab(tabs[currentIndex + 1]);
    }
  };

  // ─── Footer ──────────────────────────────────────────────────────────────────

  const footerContent = (
    <ModalFooter
      onCancel={() => handleCloseWithConfirm(onClose, resolvedModalId)}
      onReset={async () => {
        resetDirty();
        await actions.handleReset();
      }}
      onSubmit={handleSubmitForm}
      onNext={handleNext}
      currentTab={tabs.indexOf(ui.activeTab)}
      totalTabs={tabs.length}
      saving={submitting}
    />
  );

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <MinimizableModal
      modalId={resolvedModalId}
      isOpen={isOpen}
      onClose={() => handleCloseWithConfirm(onClose, resolvedModalId)}
      title={mode === "edit" ? "Edit Invoice" : "Add Invoice"}
      subtitle={
        mode === "edit"
          ? "Edit and manage invoice details"
          : "Add and manage invoices"
      }
      icon={File}
      footer={footerContent}
      maxWidth="full"
      height="700px"
    >
      <form
        id="invoiceForm"
        className="h-full flex flex-col"
        autoComplete="off"
      >
        {/* ── Tabs ── */}
        <div className="bg-app border-b border-theme px-4 sm:px-8 shrink-0">
          <div className="flex gap-4 sm:gap-8 overflow-x-auto scrollbar-none">
            {(["details", "address", "otherCharges", "terms"] as const).map(
              (tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => ui.setActiveTab(tab)}
                  className={`py-2.5 bg-transparent border-none text-xs font-medium cursor-pointer transition-all whitespace-nowrap shrink-0 ${
                    ui.activeTab === tab
                      ? "text-primary border-b-[3px] border-primary"
                      : "text-muted border-b-[3px] border-transparent hover:text-main"
                  }`}
                >
                  {tab === "details" && "Details"}
                  {tab === "address" && "Additional Details"}
                  {tab === "otherCharges" && "Shipping & Other Charges"}
                  {tab === "terms" && "Terms & Conditions"}
                </button>
              ),
            )}
          </div>
        </div>

        {/* ── Tab Content ── */}
        <div className="flex-1 min-h-0 overflow-y-auto px-3 py-2">
          {/* ──────────── DETAILS ──────────── */}
          {ui.activeTab === "details" && (
            <div className="flex flex-col gap-4">
              {/* ── Top fields row — flex-wrap so they flow on any width ── */}
              <div className="flex flex-wrap gap-3 items-end">
                {/* Customer — full width on mobile, fixed on sm+ */}
                <div className="w-full sm:w-[280px]">
                  <CustomerSelect
                    value={customerNameDisplay}
                    selectedId={formData.customerId}
                    onChange={actions.handleCustomerSelect}
                    onClear={actions.handleCustomerClear}
                    className="w-full"
                  />
                </div>

                {/* Date of Invoice */}
                <div className="w-full sm:w-[130px]">
                  <DatePickerInput
                    label="Date of Invoice"
                    name="dateOfInvoice"
                    value={formData.dateOfInvoice}
                    required
                    onChange={(name, value) =>
                      actions.handleInputChange({
                        target: { name, value },
                      } as any)
                    }
                  />
                </div>

                {/* Due Date */}
                <div className="w-full sm:w-[130px]">
                  <DatePickerInput
                    label="Due Date"
                    name="dueDate"
                    value={formData.dueDate}
                    required
                    // disabled
                    onChange={(name, value) =>
                      actions.handleInputChange({
                        target: { name, value },
                      } as any)
                    }
                  />
                </div>

                {/* Exchange Rate — only when foreign currency selected */}
                {showExchangeRate && (
                  <div className="w-full sm:w-[110px] relative">
                    <ModalInput
                      label="Exchange Rate"
                      name="exchangeRt"
                      value={
                        ui.exchangeRateLoading ? "" : formData.exchangeRt || "1"
                      }
                      placeholder={ui.exchangeRateLoading ? "Loading..." : ""}
                      onChange={actions.handleInputChange}
                      className="w-full py-1 px-2 border border-theme rounded text-[11px] text-main bg-card"
                      disabled
                    />
                    {!!ui.exchangeRateError && (
                      <div
                        className="absolute left-0 top-full mt-0.5 text-[9px] text-danger whitespace-nowrap z-10"
                        title={ui.exchangeRateError}
                      >
                        Rate not found
                      </div>
                    )}
                  </div>
                )}
                {/* Mode of Payment */}
                <div className="w-full sm:w-[200px]">
                  <ModeOfPaymentSelect
                    value={formData.mode ?? ""}
                    onChange={(val) => {
                      actions.handleInputChange({
                        target: { name: "mode", value: val },
                      } as any);
                    }}
                    required
                  />
                </div>

                {/* PO Number */}
                <div className="w-full sm:w-[160px]">
                  <ModalInput
                    label="PO Number"
                    name="lpoNumber"
                    value={formData.lpoNumber}
                    onChange={actions.handleInputChange}
                    inputMode="numeric"
                    pattern="\d{10}"
                    placeholder="Enter Purchase Order No"
                    className="w-full py-1 px-2 border border-theme rounded text-[11px] text-main bg-card"
                  />
                </div>

                {/* Invoice Type — Product / Service / RVAT */}
                <ToggleSwitch
                  name="invoiceType"
                  label="Invoice Type"
                  checked={invoiceType === "Service"}
                  onLabel="Service"
                  offLabel="Product"
                  onChange={() => {}}
                  options={invoiceTypeOptions}
                  value={invoiceType}
                  onValueChange={(val) =>
                    setInvoiceType(val as "Product" | "Service" | "RVAT")
                  }
                />

                {invoiceType === "RVAT" && (
                  <div className="w-full sm:w-[240px]">
                    <SearchSelect2
                      label="Principal"
                      value={formData.principal?.principalNm ?? ""}
                      onChange={handlePrincipalSelect}
                      fetchOptions={fetchPrincipalOptions}
                      placeholder="Search principal..."
                      required
                    />
                  </div>
                )}
              </div>

              {/* ── Items table + sidebar ──
                  - Mobile/tablet (< xl): single column, sidebar stacks below table
                  - Desktop (xl+): table takes remaining space, sidebar is 220px
                  - minmax(0, 1fr) prevents the table from pushing the grid wider
                    than the modal container                                       ── */}
              <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_220px] gap-4 items-start">
                {/* Table column — min-w-0 so it can shrink below natural content width */}
                <div className="min-w-0">
                  <ItemTable
                    paginatedItems={paginatedItems}
                    ui={ui}
                    actions={actions}
                    formData={formData}
                    symbol=""
                    ITEMS_PER_PAGE={ITEMS_PER_PAGE}
                    invoiceType={invoiceType}
                    isSalesInvoice={true}
                    taxCategory={
                      formData.taxCategory ||
                      customerDetails?.customerTaxCategory
                    }
                  />
                </div>

                {/* Sidebar — full width on mobile, 220px column on xl+ */}
                <div className="flex flex-row xl:flex-col gap-4 xl:sticky xl:top-0 h-fit">
                  {/* Customer Details card */}
                  <div className="bg-card rounded-lg p-2 flex-1 xl:flex-none w-full">
                    <h3 className="text-[12px] font-semibold text-main mb-2">
                      Customer Details
                    </h3>
                    <div className="flex flex-col gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-muted shrink-0" />
                        <span className="break-words">
                          {customerDetails?.name ?? "Customer Name"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted">
                        <Mail size={12} className="shrink-0" />
                        <span className="truncate">
                          {primaryContact?.email ||
                            customerDetails?.email ||
                            "—"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted">
                        <Phone size={12} className="shrink-0" />
                        <span className="truncate">
                          {primaryContact?.mobile ||
                            customerDetails?.mobile ||
                            "—"}
                        </span>
                      </div>
                      <div className="flex justify-between text-[10px] mt-1">
                        <span className="text-muted">Tax</span>
                        <span className="text-main font-medium">
                          {customerDetails?.customerTaxCategory || "—"}
                        </span>
                      </div>
                      <div className="flex justify-between text-[10px] mt-1">
                        <span className="text-muted">Currency</span>
                        <span className="text-main font-medium">
                          {formData.currencyCode || "—"}
                        </span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-muted">Country</span>
                        <span className="text-main font-medium">
                          {billingAddress?.country || "—"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Summary card */}
                  <div className="bg-card rounded-lg p-3 flex-1 xl:flex-none w-full">
                    <h3 className="text-[13px] font-semibold text-main mb-2">
                      Summary
                    </h3>
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted">Total Items</span>
                        <span className="font-medium text-main tabular-nums">
                          {formData.items.length}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted">Total Qty</span>
                        <span className="font-medium text-main tabular-nums">
                          {totals.totalQuantity.toFixed(0)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted">Total Amount</span>
                        <span className="font-medium text-main tabular-nums">
                          {totals.totalAmount.toFixed(2)}
                        </span>
                      </div>

 <div className="flex justify-between items-center text-xs">
                        <span className="text-muted">Item Discount</span>
                        <span className="font-medium text-main tabular-nums">
                          {totals.totalDiscount.toFixed(2)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted">Subtotal</span>
                        <span className="font-medium text-main tabular-nums">
                          {totals.subTotal.toFixed(2)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted">Tax</span>
                        <span className="font-medium text-main tabular-nums">
                          {totals.totalTax.toFixed(2)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted">Grand Total</span>
                        <span className="font-medium text-main tabular-nums">
                          {(totals.subTotal + totals.totalTax).toFixed(2)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-xs gap-2">
                        <span className="text-muted whitespace-nowrap">
                          Discount %
                        </span>
                       <input
                          type="number"
                          value={formData.additionalDiscountPercentage ?? ""}
                          onChange={(e) =>
                            actions.handleDiscountPercentChange(e.target.value)
                          }
                          className="w-16 text-right text-xs bg-transparent border border-theme rounded px-1 py-0.5 tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          placeholder="0"
                        />
                      </div>

                      <div className="flex justify-between items-center text-xs gap-2">
                        <span className="text-muted whitespace-nowrap">
                          Discount Amt
                        </span>
                        <input
                          type="number"
                          value={formData.discountAmount ?? ""}
                          onChange={(e) =>
                            actions.handleDiscountAmountChange(e.target.value)
                          }
                          className="w-20 text-right text-xs bg-transparent border border-theme rounded px-1 py-0.5 tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          placeholder="0.00"
                        />
                      </div>

                      <div className="border-t border-theme mt-1 pt-2">
                        <div className="flex justify-between items-center bg-primary rounded-lg px-2 py-1.5">
                          <span className="text-xs font-semibold text-white">
                            Net Payable
                          </span>
                          <span className="text-xs font-bold text-white tabular-nums">
                            {totals.grandTotal.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ──────────── ADDITIONAL DETAILS ──────────── */}
          {ui.activeTab === "address" && (
            <div className="space-y-6">
              <InvoiceAddressTab
                customerId={formData.customerId}
                formData={formData}
                onFormChange={actions.handleInputChange}
              />
            </div>
          )}

          {/* ──────────── SHIPPING & OTHER CHARGES ──────────── */}
          {ui.activeTab === "otherCharges" && (
            <InvoiceChargesTab
              taxes={formData.taxes || []}
              charges={formData.invoiceCharges || []}
              currency={formData.currencyCode}
              totals={totals}
              onAdd={actions.addOtherCharge}
              onChange={actions.handleOtherChargeChange}
              onRemove={actions.removeOtherCharge}
              selectedTemplate={formData.salesTaxTemplate}
              onTemplateSelect={(name, taxes) =>
                actions.handleTemplateSelect(name, taxes)
              }
              onTaxChange={actions.handleTaxChange}
            />
          )}

          {/* ──────────── TERMS & CONDITIONS ──────────── */}
          {ui.activeTab === "terms" && (
            <div className="h-full w-full">
              <TermsAndCondition
                terms={formData.terms?.selling}
                setTerms={actions.setTerms}
                type="selling"
                compact={true}
              />
            </div>
          )}
        </div>
      </form>
    </MinimizableModal>
  );
};

export default InvoiceModal;