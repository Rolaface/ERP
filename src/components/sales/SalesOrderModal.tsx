import React, { useState, useEffect } from "react";
import { FileText } from "lucide-react";
import TermsAndCondition from "../TermsAndCondition";
import { useSalesOrderForm } from "../../hooks/useSalesOrderForm";
import CustomerSelect from "../selects/CustomerSelect";
import { MinimizableModal } from "../common/MinimizableModal";
import { User, Mail, Phone } from "lucide-react";
import PaymentInfoBlock from "./PaymentInfoBlock";
import DatePickerInput from "../calendar/DatePickerInput";
import {
  paymentMethodOptions,
  ITEMS_PER_PAGE,
} from "../../constants/invoice.constants";
import ModalFooter from "../common/ModalFooter";
import type { ModalSubmitHandler } from "../../types/modal";
import InvoiceChargesTab from "../../views/Sales/InvoiceChargeTab";
import { InvoiceAddressTab } from "./InvoiceAddressTab";
import {
  showApiError,
  showSuccess,
  showValidationError,
} from "../../utils/alert";
import {
  useDataRefreshStore,
  REFRESH_KEYS,
} from "../../store/dataRefreshStore";
import {
  createSalesOrder,
  editSalesOrder,
} from "../../api/SalesOrder/salesOrderAPi";
import { parseFrappeError } from "../../views/hr/tabs/leave-config/hooks/parseFrappeError";
import QuotationItemTable from "../common/QuotationItemTable";
import { useDefault } from "../../hooks/usedefaultdata";
import ModeOfPaymentSelect from "../selects/defaults/Modeofpaymentselect";
import { ModalInput } from "../ui/modal/modalComponent";

interface SalesOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: ModalSubmitHandler;
  initialData?: any;
  mode?: "create" | "edit";
  modalId?: string;
}

const SalesOrderModal: React.FC<SalesOrderModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode = "create",
  modalId,
}) => {
  const [resolvedModalId] = useState(
    () =>
      modalId ||
      (mode === "edit" && initialData?.id
        ? `sales-order-edit-${initialData.id}-${Date.now()}`
        : `sales-order-create-${Date.now()}`),
  );
  const [submitting, setSubmitting] = useState(false);

  const [invoiceType, setInvoiceType] = useState<"Product" | "Service">(
    "Product",
  );
  const domain = useDefault("primary_business_domain");

  useEffect(() => {
    if (mode === "edit" && initialData?.items?.length > 0) {
      const isService = initialData.items[0]?.isServiceItem;
      setInvoiceType(isService ? "Service" : "Product");
    } else if (mode === "create") {
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
  } = useSalesOrderForm(isOpen, onClose, onSubmit, mode, initialData);

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

  const handleNext = () => {
    const currentIndex = tabs.indexOf(ui.activeTab as any);
    if (currentIndex < tabs.length - 1) {
      ui.setActiveTab(tabs[currentIndex + 1]);
    }
  };

  const validateDetailsOrFocus = () => {
    try {
      actions.validateForm();
      return true;
    } catch (err: any) {
      ui.setActiveTab("details");
      showValidationError(err.message);
      return false;
    }
  };

  const symbol = "";

  const handleSave = async () => {
    if (!validateDetailsOrFocus()) return;
    if (submitting) return;

    try {
      setSubmitting(true);
      const payload = await actions.handleSubmit({
        preventDefault: () => {},
      } as React.FormEvent);

      if (!payload) return;

      const finalPayload = { ...payload, documentType: "Sales Order" };

      let response;
      if (mode === "edit") {
        const orderNumber =
          formData.orderNumber ?? initialData?.id ?? initialData?.orderNumber;
        if (!orderNumber) {
          showValidationError("Invalid sales order reference");
          return;
        }
        response = await editSalesOrder(orderNumber, finalPayload);
      } else {
        response = await createSalesOrder(finalPayload);
      }

      const res = response?.message || response;
      if (!res || ![200, 201].includes(res.status_code)) {
        showApiError(
          parseFrappeError ||
            res?.message ||
            res ||
            "Failed to save Sales Order",
        );
        return;
      }

      showSuccess(res.message || "Sales Order saved successfully");
      const canClose = await onSubmit?.(res);
      if (canClose === false) return;

      resetDirty();
      onClose();
      useDataRefreshStore
        .getState()
        .triggerRefresh(REFRESH_KEYS.SALES_ORDER_LIST);
    } catch (error: any) {
      showApiError(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSave();
  };

  const showExchangeRate =
    !!ui.baseCurrency &&
    !!formData.currencyCode &&
    formData.currencyCode.trim().toUpperCase() !==
      ui.baseCurrency.trim().toUpperCase();
  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <MinimizableModal
      modalId={resolvedModalId}
      isOpen={isOpen}
      onClose={() => handleCloseWithConfirm(onClose, resolvedModalId)}
      title={mode === "edit" ? "Edit Sales Order" : "Add Sales Order"}
      subtitle={
        mode === "edit"
          ? "Edit and manage sales order details"
          : "Add and manage sales order details"
      }
      icon={FileText}
      footer={
        <ModalFooter
          onCancel={() => handleCloseWithConfirm(onClose, resolvedModalId)}
          onReset={async () => {
            resetDirty();
            await actions.handleReset();
          }}
          onSave={handleSave}
          onNext={ui.activeTab === "terms" ? undefined : handleNext}
          currentTab={tabs.indexOf(ui.activeTab as any)}
          totalTabs={tabs.length}
          saving={submitting}
        />
      }
      maxWidth="full"
      height="700px"
    >
      <form
        id="salesOrderForm"
        onSubmit={handleFormSubmit}
        className="h-full flex flex-col"
        autoComplete="off"
      >
        {/* ── Tabs ── */}
        <div className="bg-app border-b border-theme px-3 sm:px-8 shrink-0">
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
              <div className="flex flex-wrap gap-3 items-end">
                {/* Customer */}
                <div className="w-full sm:w-[280px]">
                  <CustomerSelect
                    value={customerNameDisplay}
                    selectedId={formData.customerId}
                    onChange={actions.handleCustomerSelect}
                    onClear={actions.handleCustomerClear}
                    className="w-full"
                    required
                  />
                </div>

                {/* Date of Sales Order */}
                <div className="w-full sm:w-[130px]">
                  <DatePickerInput
                    label="Order Date"
                    name="postingDate"
                    value={formData.postingDate}
                    required
                    onChange={(name, value) =>
                      actions.handleInputChange({
                        target: { name, value },
                      } as any)
                    }
                  />
                </div>

                {/* Delivery Date */}
                <div className="w-full sm:w-[130px]">
                  <DatePickerInput
                    label="Delivery Date"
                    name="deliveryDate"
                    value={formData.deliveryDate}
                    required
                    onChange={(name, value) =>
                      actions.handleInputChange({
                        target: { name, value },
                      } as any)
                    }
                  />
                </div>

                {/* Customer PO No */}
                <div className="w-full sm:w-[150px]">
                  <label className="text-[11px] text-muted mb-1 block">
                    Customer PO No.
                  </label>
                  <input
                    type="text"
                    name="customerPoNo"
                    value={formData.customerPoNo ?? ""}
                    onChange={(e) => actions.handleInputChange(e as any)}
                    className="w-full h-[27px] text-[11px] px-2 border border-theme rounded-md bg-card"
                    placeholder="PO Number"
                  />
                </div>

                {/* Customer PO Date */}
                <div className="w-full sm:w-[130px]">
                  <DatePickerInput
                    label="Customer PO Date"
                    name="customerPoDate"
                    value={formData.customerPoDate ?? ""}
                    onChange={(name, value) =>
                      actions.handleInputChange({
                        target: { name, value },
                      } as any)
                    }
                  />
                </div>
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
                <div className="w-full sm:w-[200px]">
                  {/* <ModeOfPaymentSelect
                    value={formData.payment_mode ?? ""}
                    onChange={(val) =>
                      actions.handleInputChange({
                        target: { name: "payment_mode", value: val },
                      } as any)
                    }
                  /> */}
                  <ModeOfPaymentSelect
                    value={formData.payment_mode ?? ""}
                    required
                    onChange={(val) => {
                      actions.handleInputChange({
                        target: { name: "payment_mode", value: val },
                      } as any);
                    }}
                  />
                </div>

                {/* Order Type */}
                <div className="w-full sm:w-auto flex flex-col justify-end">
                  <label className="text-[11px] text-muted mb-1">
                    Order Type
                  </label>
                  <div className="flex items-center p-0.5 border border-theme rounded-md bg-card/50 h-[27px] w-max">
                    <label
                      className={`flex items-center justify-center px-3 h-full rounded-sm cursor-pointer transition-all text-[10px] font-medium ${
                        invoiceType === "Product"
                          ? "bg-primary text-white shadow-sm"
                          : "text-muted hover:text-main bg-transparent"
                      }`}
                    >
                      <input
                        type="radio"
                        name="invoiceType"
                        value="Product"
                        checked={invoiceType === "Product"}
                        onChange={(e: any) => setInvoiceType(e.target.value)}
                        className="hidden"
                      />
                      Product
                    </label>

                    <label
                      className={`flex items-center justify-center px-3 h-full rounded-sm cursor-pointer transition-all text-[10px] font-medium ${
                        invoiceType === "Service"
                          ? "bg-primary text-white shadow-sm"
                          : "text-muted hover:text-main bg-transparent"
                      }`}
                    >
                      <input
                        type="radio"
                        name="invoiceType"
                        value="Service"
                        checked={invoiceType === "Service"}
                        onChange={(e: any) => setInvoiceType(e.target.value)}
                        className="hidden"
                      />
                      Service
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_220px] gap-4 items-start">
                {/* Table column */}
                <div className="min-w-0">
                  <QuotationItemTable
                    paginatedItems={paginatedItems}
                    ui={ui}
                    actions={actions}
                    formData={formData}
                    isQuotation={false}
                    symbol={symbol}
                    ITEMS_PER_PAGE={ITEMS_PER_PAGE}
                    invoiceType={invoiceType}
                    isSalesInvoice={false}
                    taxCategory={
                      formData.taxCategory ||
                      customerDetails?.customerTaxCategory
                    }
                  />
                </div>

                {/* Sidebar */}
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
                      <div className="flex justify-between text-[10px]">
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

export default SalesOrderModal;
