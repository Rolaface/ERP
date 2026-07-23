import React, { useState, useEffect, useMemo } from "react";
import { File, User, Mail, Phone } from "lucide-react";
import TermsAndCondition from "../TermsAndCondition";
import {
  showApiError,
  showSuccess,
} from "../../utils/alert";
import {
  useDataRefreshStore,
  REFRESH_KEYS,
} from "../../store/dataRefreshStore";
import { createSalesInvoice, editSalesInvoice } from "../../api/salesApi";
import CustomerSelect from "../selects/CustomerSelect";
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

  const [invoiceType, setInvoiceType] = useState<"Product" | "Service">(
    "Product",
  );
  const domain = useDefault("primary_business_domain");
 

  useEffect(() => {
    if (mode === "edit" && initialData?.items?.length > 0) {
      // Check if the first item (or any item) is a service
      const isService = initialData.items[0]?.isServiceItem;
      setInvoiceType(isService ? "Service" : "Product");
    } else if (mode === "create") {
      // Default to company domain for new invoices (fallback to Product)
      setInvoiceType(domain === "Service" ? "Service" : "Product");
    }
  }, [initialData, mode, isOpen, domain]);

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
                {/* Invoice Type  */}
                {/* <div className="w-full sm:w-[130px]">
                  <ModalSelect
                    label="Invoice Type"
                    name="invoiceType"
                    value={invoiceType} // Use local state
                    onChange={(e: any) => setInvoiceType(e.target.value)} // Update local state
                    options={[
                      { value: "Product", label: "Product" },
                      { value: "Service", label: "Service" },
                    ]}
                    className="w-full border border-theme rounded text-[11px] text-main bg-card"
                  />
                </div> */}

                {/* Customer — full width on mobile, fixed on sm+ */}
                <div className="w-full sm:w-[280px]">
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
                  {/* <ModeOfPaymentSelect
                    value={formData.mode ?? ""}
                    onChange={(val) =>
                      actions.handleInputChange({
                        target: { name: "mode", value: val },
                      } as any)
                    }
                    required
                  /> */}
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

                {/* Invoice Type */}
                {/* <div className="w-full sm:w-auto flex flex-col justify-end">
                 <label className="text-[11px] text-muted mb-1">Invoice Type</label>
                <div className="flex items-center gap-4 border border-theme rounded-md px-4 bg-card h-[27px]">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="invoiceType"
                      value="Product"
                      checked={invoiceType === "Product"}
                      onChange={(e: any) => {
                        setInvoiceType(e.target.value);
                        actions.handleInputChange({
                          target: { name: "updateStock", type: "checkbox", checked: true }
                        } as any);
                      }}
                      className="w-3 h-3 accent-primary cursor-pointer border-gray-300 focus:ring-primary"
                    />
                    <span className="text-[10px] text-main whitespace-nowrap">Product</span>
                  </label>
                  
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="invoiceType"
                      value="Service"
                      checked={invoiceType === "Service"}
                      onChange={(e: any) => {
                        setInvoiceType(e.target.value);
                        actions.handleInputChange({
                          target: { name: "updateStock", type: "checkbox", checked: false }
                        } as any);
                      }}
                      className="w-3 h-3 accent-primary cursor-pointer border-gray-300 focus:ring-primary"
                    />
                    <span className="text-[10px] text-main whitespace-nowrap">Service</span>
                  </label>
                </div>
              </div> */}
                {/* Invoice Type */}
                <ToggleSwitch
                  name="invoiceType"
                  label="Invoice Type"
                  checked={invoiceType === "Service"}
                  onLabel="Service"
                  offLabel="Product"
                  onChange={(e) => {
                    const isService = e.target.checked;
                    setInvoiceType(isService ? "Service" : "Product");
                    // Service select hote hi updateStock false karo
                    actions.handleInputChange({
                      target: {
                        name: "updateStock",
                        type: "checkbox",
                        checked: !isService,
                      },
                    } as any);
                  }}
                />

                {/* Update Stock */}
                {invoiceType === "Product" && (
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
              {/* <PaymentInfoBlock
                data={formData.paymentInformation}
                onChange={(e) =>
                  actions.handleInputChange(e, "paymentInformation")
                }
                paymentMethodOptions={paymentMethodOptions}
                showPaymentMethod={false}
              /> */}
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
