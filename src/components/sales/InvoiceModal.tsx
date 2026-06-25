import React, { useState, useEffect } from "react";
import { Receipt, User, Mail, Phone } from "lucide-react";
import TermsAndCondition from "../TermsAndCondition";
import { showApiError, showSuccess } from "../../utils/alert";
import {
  useDataRefreshStore,
  REFRESH_KEYS,
} from "../../store/dataRefreshStore";
import { createSalesInvoice, editSalesInvoice } from "../../api/salesApi";
import CustomerSelect from "../selects/CustomerSelect";
import { MinimizableModal } from "../../components/common/MinimizableModal";
import ModalFooter from "../common/ModalFooter";
import { ModalInput, ModalSelect } from "../ui/modal/modalComponent";
import { useInvoiceForm } from "../../hooks/useInvoiceForm";
import { useUnsavedChanges } from "../../hooks/useUnsavedChanges";
import InvoiceChargesTab from "../../views/Sales/InvoiceChargeTab";
import DatePickerInput from "../calendar/DatePickerInput";
import { InvoiceAddressTab } from "./InvoiceAddressTab";
import { getAllModeOfPayment } from "../../api/BankAccountApi";
import SearchSelect2 from "../../components/ui/modal/SearchSelect2";
import { paymentMethodOptions } from "../../constants/invoice.constants";
import PaymentInfoBlock from "./PaymentInfoBlock";
import ItemTable from "../common/ItemTable";
import type { ModalSubmitHandler } from "../../types/modal";

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
  const resolvedModalId =
    modalId ||
    (mode === "edit" && initialData?.invoiceNumber
      ? `invoice-edit-${initialData.invoiceNumber}-${Date.now()}`
      : `invoice-create-${Date.now()}`);

  const { markDirty, resetDirty, handleCloseWithConfirm } = useUnsavedChanges();
  const [submitting, setSubmitting] = useState(false);

  const {
    formData,
    customerDetails,
    customerNameDisplay,
    paginatedItems,
    totals,
    ui,
    actions,
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
    if (isOpen) ui.setActiveTab("details");
  }, [isOpen]);

  const showExchangeRate =
    !!ui.baseCurrency &&
    !!formData.currencyCode &&
    formData.currencyCode.trim().toUpperCase() !==
      ui.baseCurrency.trim().toUpperCase();

  const handleModeFetchOptions = async (q: string) => {
    const res = await getAllModeOfPayment(1, 10, q || "", 1);
    return res.data.map((item: any) => ({
      label: item.name,
      value: item.name,
      meta: item,
    }));
  };

  const handleModeChange = (_: string, option: any) => {
    actions.handleInputChange({
      target: { name: "mode", value: option?.value || "" },
    } as any);
  };

  const handleSubmitForm = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const payload = await actions.handleSubmit({
        preventDefault: () => {},
      } as React.FormEvent);

      if (!payload) return;

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
      subtitle="Add and manage invoice details"
      icon={Receipt}
      footer={footerContent}
      maxWidth="full"
      height="650px"
    >
      <form
        id="invoiceForm"
        className="h-full flex flex-col"
        autoComplete="off"
        onChange={() => markDirty()}
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
                <div className="w-full sm:w-[220px]">
                  <CustomerSelect
                    value={customerNameDisplay}
                    onChange={actions.handleCustomerSelect}
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
                    disabled
                    onChange={(name, value) =>
                      actions.handleInputChange({
                        target: { name, value },
                      } as any)
                    }
                  />
                </div>

                {/* Currency */}
                <div className="w-full sm:w-[100px]">
                  <ModalSelect
                    label="Currency"
                    name="currencyCode"
                    value={formData.currencyCode}
                    onChange={actions.handleInputChange}
                    options={
                      formData.currencyCode
                        ? [
                            {
                              value: formData.currencyCode,
                              label: formData.currencyCode,
                            },
                          ]
                        : []
                    }
                    disabled
                    className="w-full border border-theme rounded text-[11px] text-main bg-card"
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
                  <SearchSelect2
                    label="Mode of Payment"
                    value={formData.mode ?? ""}
                    onChange={handleModeChange}
                    fetchOptions={handleModeFetchOptions}
                    placeholder="search mode of payment"
                    required
                  />
                </div>

                {/* Update Stock */}
                <div className="w-full sm:w-auto flex flex-col justify-end">
                  <label className="text-[11px] text-transparent select-none">
                    ‎
                  </label>
                  <label className="flex items-center gap-2 h-[30px]">
                    <input
                      type="checkbox"
                      name="updateStock"
                      checked={formData.updateStock ?? true}
                      onChange={actions.handleInputChange}
                      className="w-3.5 h-3.5 accent-primary"
                    />
                    <span className="text-xs text-main whitespace-nowrap">
                      Update Stock
                    </span>
                  </label>
                </div>

                {/* LPO Number — only when LPO tax category */}
                {ui.isLocal && (
                  <div className="w-full sm:w-[120px]">
                    <ModalInput
                      label="LPO Number"
                      name="lpoNumber"
                      value={formData.lpoNumber}
                      onChange={actions.handleInputChange}
                      inputMode="numeric"
                      pattern="\d{10}"
                      placeholder="Enter 10 digits"
                      className="w-full py-1 px-2 border border-theme rounded text-[11px] text-main bg-card"
                    />
                  </div>
                )}
              </div>

              {/* ── Items table + sidebar ──
                  - Mobile/tablet (< xl): single column, sidebar stacks below table
                  - Desktop (xl+): table takes remaining space, sidebar is 220px
                  - minmax(0, 1fr) prevents the table from pushing the grid wider
                    than the modal container                                       ── */}
              <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_160px] gap-4 items-start">
                {/* Table column — min-w-0 so it can shrink below natural content width */}
                <div className="min-w-0">
                  <ItemTable
                    paginatedItems={paginatedItems}
                    ui={ui}
                    actions={actions}
                    formData={formData}
                    symbol=""
                    ITEMS_PER_PAGE={ITEMS_PER_PAGE}
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
                        <span className="truncate">
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
                      <div className="flex justify-between text-[10px]">
                        <span className="text-muted">Country</span>
                        <span className="text-main font-medium">
                          {billingAddress?.country || "—"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Summary card */}
                  {/* Summary card */}
                  <div className="bg-card rounded-lg p-3 flex-1 xl:flex-none w-full">
                    <h3 className="text-[13px] font-semibold text-main mb-2">
                      Summary
                    </h3>
                    <div className="flex flex-col gap-1.5">
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
                        <span className="text-muted">Discount</span>
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

                      <div className="border-t border-theme mt-1 pt-2">
                        <div className="flex justify-between items-center bg-primary rounded-lg px-2 py-1.5">
                          <span className="text-xs font-semibold text-white">
                            Grand Total
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
              <PaymentInfoBlock
                data={formData.paymentInformation}
                onChange={(e) =>
                  actions.handleInputChange(e, "paymentInformation")
                }
                paymentMethodOptions={paymentMethodOptions}
                showPaymentMethod={false}
              />
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
