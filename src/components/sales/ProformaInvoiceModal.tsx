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
import { createProformaInvoice, editProformaInvoice } from "../../api/proformaInvoiceApi";
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
import { useDataRefreshStore, REFRESH_KEYS } from "../../store/dataRefreshStore";
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
        : `proforma-create-${Date.now()}`)
  );
      
  const { markDirty, resetDirty, handleCloseWithConfirm } = useUnsavedChanges();
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

 const handleSave = async () => {
    if (!validateDetailsOrFocus()) return;

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
        const invoiceNumber = formData.invoiceNumber ?? initialData?.id ?? initialData?.proformaId;
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

  return (
    <MinimizableModal
      modalId={resolvedModalId}
      isOpen={isOpen}
      icon={FileClock}
      onClose={() => handleCloseWithConfirm(handleClose, resolvedModalId)}
      title={
        mode === "edit" ? "Edit Proforma Invoice" : "Create Proforma Invoice"
      }
      subtitle="Create and manage proforma invoice details"
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
        />
      }
      customWidth="83vw"
      height="82vh"
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
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto px-8 py-4">
          {/* ===== DETAILS ===== */}
          {ui.activeTab === "details" && (
            <div className="flex flex-col gap-6 max-w-[1600px] mx-auto">
              <div className="">
                <div
                  className={`grid ${
                    ui.isExport
                      ? "grid-cols-[minmax(120px,0.6fr)_100px_100px_90px_110px_120px_100px]"
                      : "grid-cols-[220px_130px_130px_110px_120px_120px]"
                  } gap-x-2 items-start`}
                >
                  <div>
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
                      onChange={(name, value) =>
                        actions.handleInputChange({
                          target: { name, value },
                        } as any)
                      }
                    />
                  </div>

                  {/* <div>
                    <ModalSelect
                      label="Invoice Status"
                      name="invoiceStatus"
                      value={formData.invoiceStatus}
                      onChange={actions.handleInputChange}
                      options={[...invoiceStatusOptions]}
                      disabled={mode === "edit"}
                      className="w-full py-1 px-2 border border-theme rounded text-[11px] text-main bg-card"
                    />
                  </div> */}

                  <div>
                    <ModalSelect
                      label="Payment Method"
                      name="paymentMethod"
                      value={formData.paymentInformation?.paymentMethod}
                      onChange={(
                        e: React.ChangeEvent<
                          HTMLInputElement | HTMLSelectElement
                        >,
                      ) => actions.handleInputChange(e, "paymentInformation")}
                      options={[...paymentMethodOptions]}
                      className="w-full py-1 px-2 border border-theme rounded text-[11px] text-main bg-card"
                    />
                  </div>

                  {ui.isExport && (
                    <div>
                      <ModalInput
                        label="Export To Country"
                        name="destnCountryCd"
                        type="text"
                        disabled
                        value={formData.destnCountryCd}
                        onChange={actions.handleInputChange}
                        className="w-full py-1 px-2 border border-theme rounded text-[11px] text-main bg-card"
                      />
                    </div>
                  )}

                  {ui.isLocal && (
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
                  )}
                </div>
              </div>

              {/* ITEMS + SUMMARY */}
              <div className="grid grid-cols-[4fr_1fr] gap-4 items-start">
                
                {/* Reusable ItemTable Component */}
                <ItemTable
                  paginatedItems={paginatedItems}
                  ui={ui}
                  actions={actions}
                  formData={formData}
                  symbol={symbol}
                  ITEMS_PER_PAGE={ITEMS_PER_PAGE}
                  isSalesInvoice={false}
                  taxCategory={formData.taxCategory || customerDetails?.customerTaxCategory}
                />

                {/* RIGHT SIDE: CUSTOMER DETAILS & SUMMARY */}
                <div className="col-span-1 sticky top-0 flex flex-col items-center gap-6 px-4 lg:px-6 h-fit">
                  <div className="bg-card rounded-lg p-2 w-[220px]">
                    <h3 className="text-[12px] font-semibold text-main mb-2">
                      Customer Details
                    </h3>

                    <div className="flex flex-col gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-muted" />
                        {customerDetails?.name ?? "Customer Name"}
                      </div>

                      <div className="flex items-center gap-2 text-[10px] text-muted">
                        <Mail size={12} />
                        {customerDetails?.email ?? "customer@gmail.com"}
                      </div>

                      <div className="flex items-center gap-2 text-[10px] text-muted">
                        <Phone size={12} />
                        {customerDetails?.mobile_no ?? "+123 4567890"}
                      </div>
                      {customerDetails && (
                        <div className="bg-card rounded-lg ">
                          <div className="flex flex-col gap-1">
                            {/* Invoice Type */}
                            <div className="flex items-center gap-19 text-xs">
                              <span className="text-muted">Invoice Type</span>
                              <span className="font-medium text-main">
                                {formData.invoiceType}
                              </span>
                            </div>

                            {/* Destination Country – only for Export */}
                            {formData.invoiceType === "Export" && (
                              <div className="flex items-center gap-15 text-xs">
                                <span className="text-muted">
                                  Destination Country
                                </span>
                                <span className="font-medium text-main">
                                  {formData.destnCountryCd || "-"}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-card rounded-lg p-3 w-[220px]">
                    <h3 className="text-[13px] font-semibold text-main mb-2">
                      Summary
                    </h3>

                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted">Total Items</span>
                        <span className="font-medium text-main">
                          {formData.items.length}
                        </span>
                      </div>

                      <div className="flex justify-between text-xs">
                        <span className="text-muted">Subtotal</span>
                        <span className="font-medium text-main">
                          {symbol} {totals.subTotal.toFixed(2)}
                        </span>
                      </div>

                      <div className="flex justify-between text-xs">
                        <span className="text-muted">Total Tax</span>
                        <span className="font-medium text-main">
                          {symbol} {totals.totalTax.toFixed(2)}
                        </span>
                      </div>

                      <div className="mt-2 p-2 bg-primary rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-semibold text-white">
                            Grand Total
                          </span>
                          <span className="text-sm font-bold text-white">
                            {symbol} {totals.grandTotal.toFixed(2)}
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