import React, { useState, useEffect } from "react";
import TermsAndCondition from "../TermsAndCondition";
import {
  showApiError,
  showSuccess,
  showValidationError,
} from "../../utils/alert";
import { User, Mail, Phone, FileClock } from "lucide-react";
import ModalFooter from "../common/ModalFooter";
import { ModalInput, ModalSelect } from "../ui/modal/modalComponent";
import PaymentInfoBlock from "./PaymentInfoBlock";
import { MinimizableModal } from "../common/MinimizableModal";
import { getAllCustomers } from "../../api/customerApi";
import CustomerSelect from "../selects/CustomerSelect";
import {
  createProformaInvoice,
  editProformaInvoice,
} from "../../api/proformaInvoiceApi";
// import { useInvoiceForm } from "../../hooks/useInvoiceForm";
import { useProformaInvoiceForm } from "../../hooks/useProformaInvoiceForm";

import { useUnsavedChanges } from "../../hooks/useUnsavedChanges";
import DatePickerInput from "../calendar/DatePickerInput";
import ItemTable from "../common/ItemTable";
import {
  invoiceStatusOptions,
  paymentMethodOptions,
} from "../../constants/invoice.constants";
import type { ModalSubmitHandler } from "../../types/modal";
import InvoiceChargesTab from "../../views/Sales/InvoiceChargeTab";
import { InvoiceAddressTab } from "./InvoiceAddressTab";
// Add these to your existing imports
import {
  useDataRefreshStore,
  REFRESH_KEYS,
} from "../../store/dataRefreshStore";
import SearchSelect2 from "../ui/modal/SearchSelect2";
import { getAllModeOfPayment } from "../../api/BankAccountApi";
interface ProformaInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: ModalSubmitHandler;
  initialData?: any;
  mode?: "create" | "edit";
  modalId?: string;
}

const ITEMS_PER_PAGE = 5;

const ProformaInvoiceModal: React.FC<ProformaInvoiceModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode = "create",
  modalId,
}) => {
  // const resolvedModalId =
  //   modalId ||
  //   (mode === "edit" && initialData?.proformaId
  //     ? `proforma-edit-${initialData.proformaId}-${Date.now()}`
  //     : `proforma-create-${Date.now()}`);
  const [resolvedModalId] = useState(
    () =>
      modalId ||
      (mode === "edit" && initialData?.proformaId
        ? `proforma-edit-${initialData.proformaId}-${Date.now()}`
        : `proforma-create-${Date.now()}`),
  );
  const [submitting, setSubmitting] = useState(false);

  const { markDirty, resetDirty, handleCloseWithConfirm } = useUnsavedChanges();
    const [invoiceType, setInvoiceType] = useState<"Product" | "Service">("Product");
  
     useEffect(() => {
      if (mode === "edit" && initialData?.items?.length > 0) {
        // Check if the first item (or any item) is a service
        const isService = initialData.items[0]?.isServiceItem;
        setInvoiceType(isService ? "Service" : "Product");
      } else if (mode === "create") {
        // Default to Product for new invoices
        setInvoiceType("Product");
      }
    }, [initialData, mode, isOpen]);

  const {
    formData,
    customerDetails,
    customerNameDisplay,
    paginatedItems,
    totals,
    ui,
    actions,
  } = useProformaInvoiceForm(
    isOpen,
    onClose,
    undefined,
    mode === "edit" ? "edit" : "proforma",
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
    if (isOpen) {
      ui.setActiveTab("details");
    }
  }, [isOpen]);

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

  const handleNext = () => {
    const currentIndex = tabs.indexOf(ui.activeTab as any);
    if (currentIndex < tabs.length - 1) {
      ui.setActiveTab(tabs[currentIndex + 1]);
    }
  };

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
      target: { name: "payment_mode", value: option?.value || "" },
    } as any);
  };

  const handleSave = async () => {
    if (!validateDetailsOrFocus()) return;
    if (submitting) return;

    try {
      const payload = await actions.handleSubmit({
        preventDefault: () => {},
      } as React.FormEvent);

      if (!payload) return;

      const finalPayload = {
        ...payload,
        documentType: "Proforma Invoice",
      };

      let response;

      if (mode === "edit") {
        const invoiceNumber =
          formData.invoiceNumber ?? initialData?.id ?? initialData?.proformaId;
        console.log("Editing Proforma Invoice with number:", invoiceNumber);

        if (!invoiceNumber) {
          showValidationError("Invalid invoice reference");
          return;
        }

        // Use your actual edit API function
        response = await editProformaInvoice(invoiceNumber, finalPayload);
      } else {
        response = await createProformaInvoice(finalPayload);
      }

      const res = response?.message || response;

      if (!res || ![200, 201].includes(res.status_code)) {
        showApiError(res?.message || res || "Failed to save proforma invoice");
        return;
      }

      showSuccess(res.message || "Proforma invoice saved successfully");

      const canClose = await onSubmit?.(res);
      if (canClose === false) return;

      resetDirty();
      // actions.handleReset();
      onClose();

      // Refresh the table data in the background
      useDataRefreshStore.getState().triggerRefresh(REFRESH_KEYS.PROFORMA_LIST);
    } catch (error: any) {
      showApiError(error);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSave();
  };

  const handleClose = () => {
    actions.handleReset();
    onClose();
  };

  const [custLoading, setCustLoading] = useState(true);
  const symbol = "";

  useEffect(() => {
    if (!isOpen) return;

    const controller = new AbortController();

    const loadCustomers = async () => {
      try {
        setCustLoading(true);
        const response = await getAllCustomers();
        if (response.status_code !== 200)
          throw new Error("Failed to load customers");
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Error loading customers:", err);
        }
      } finally {
        setCustLoading(false);
      }
    };

    loadCustomers();

    return () => controller.abort();
  }, [isOpen]);

  const showExchangeRate =
    !!ui.baseCurrency &&
    !!formData.currencyCode &&
    formData.currencyCode.trim().toUpperCase() !==
      ui.baseCurrency.trim().toUpperCase();

  return (
    <MinimizableModal
      modalId={resolvedModalId}
      isOpen={isOpen}
      icon={FileClock}
      onClose={() => handleCloseWithConfirm(handleClose, resolvedModalId)}
      title={mode === "edit" ? "Edit Proforma Invoice" : "Add Proforma Invoice"}
      subtitle="Add and manage proforma invoice details"
      footer={
        <ModalFooter
          // onCancel={() => handleCloseWithConfirm(handleClose, resolvedModalId)}
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
        id="proforma-form"
        onSubmit={handleFormSubmit}
        onChange={() => markDirty()}
        className="h-full flex flex-col"
      >
        {/* Tabs */}
        <div className="bg-app border-b border-theme px-8 shrink-0">
          <div className="flex gap-8">
            {(["details", "address", "otherCharges", "terms"] as const).map(
              (tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => ui.setActiveTab(tab)}
                  className={`py-2.5 bg-transparent border-none text-xs font-medium cursor-pointer transition-all ${
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

        {/* Tab Content */}
        <div className="flex-1 min-h-0 overflow-y-auto px-3 py-2">
          {/* ===== DETAILS ===== */}
          {ui.activeTab === "details" && (
            <div className="flex flex-col gap-4">
              {/* ── Top fields row — flex-wrap so they flow on any width ── */}
              <div className="flex flex-wrap gap-3 items-end">

                <div className="w-full sm:w-[280px]">
                  <CustomerSelect
                    value={customerNameDisplay}
                    onChange={actions.handleCustomerSelect}
                    className="w-full"
                  />
                </div>

                <div>
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

                <div>
                  <DatePickerInput
                    label="Due Date"
                    name="validTill"
                    value={formData.validTill}
                    required
                    disabled
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
                  <SearchSelect2
                    label="Mode of Payment"
                    value={formData.payment_mode ?? ""}
                    onChange={handleModeChange}
                    fetchOptions={handleModeFetchOptions}
                    placeholder="search mode of payment"
                    // required
                  />
                </div>

                 {/* Invoice Type */}
              <div className="w-full sm:w-auto flex flex-col justify-end">
                 <label className="text-[11px] text-muted mb-1">Invoice Type</label>
                <div className="flex items-center gap-4 border border-theme rounded-md px-4 bg-card h-[27px]">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="invoiceType"
                      value="Product"
                      checked={invoiceType === "Product"}
                      onChange={(e: any) => setInvoiceType(e.target.value)}
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
                      onChange={(e: any) => setInvoiceType(e.target.value)}
                      className="w-3 h-3 accent-primary cursor-pointer border-gray-300 focus:ring-primary"
                    />
                    <span className="text-[10px] text-main whitespace-nowrap">Service</span>
                  </label>
                </div>
              </div>
              
              </div>

              {/* ITEMS + SUMMARY */}
              <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_220px] gap-4 items-start">
                {/* Reusable ItemTable Component */}
                <div className="min-w-0">
                  <ItemTable
                    paginatedItems={paginatedItems}
                    ui={ui}
                    actions={actions}
                    formData={formData}
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

                {/* RIGHT SIDE: CUSTOMER DETAILS & SUMMARY */}
                <div className="flex flex-row xl:flex-col gap-4 xl:sticky xl:top-0 h-fit">
                  <div className="bg-card rounded-lg p-2 flex-1 xl:flex-none w-full">
                    <h3 className="text-[12px] font-semibold text-main mb-2">
                      Customer Details
                    </h3>

                    <div className="flex flex-col gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-muted" />
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
                      {customerDetails && (
                        <div className="bg-card rounded-lg ">
                          <div className="flex flex-col gap-1">
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
                      )}
                    </div>
                  </div>

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

          {/* ──────────── ADDITIONAL DETAILS (Address) ──────────── */}
          {ui.activeTab === "address" && (
            <div className="space-y-6 overflow-hidden">
              {/* Payment Info */}
              <PaymentInfoBlock
                data={formData.paymentInformation}
                onChange={(e) =>
                  actions.handleInputChange(e, "paymentInformation")
                }
                paymentMethodOptions={paymentMethodOptions}
                showPaymentMethod={false}
              />

              {/* Address boxes — incoterm/shipping stripped */}
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
              onTemplateSelect={(name, taxes) => {
                actions.handleTemplateSelect(name, taxes);
              }}
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

export default ProformaInvoiceModal;
