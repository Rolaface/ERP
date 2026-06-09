import React, { useState, useEffect } from "react";
import { Plus, Trash2, FileSignature} from "lucide-react";
import TermsAndCondition from "../TermsAndCondition";
import { useQuotationForm } from "../../hooks/useQuotationForm";
import { ModalSelect, ModalInput } from "../ui/modal/modalComponent";
import CustomerSelect from "../selects/CustomerSelect";
import ItemSelect from "../selects/ItemSelect";
import { MinimizableModal } from "../common/MinimizableModal";
import { useUnsavedChanges } from "../../hooks/useUnsavedChanges";
import { User, Mail, Phone } from "lucide-react";
import AddressBlock from "../ui/modal/AddressBlock";
import PaymentInfoBlock from "./PaymentInfoBlock";
import { quotationStatusOptions } from "../../types/quotation";
import DatePickerInput from "../calendar/DatePickerInput";
import {
  currencySymbols,
  paymentMethodOptions,
  currencyOptions,
  ITEMS_PER_PAGE,
} from "../../constants/invoice.constants";
import ModalFooter from "../common/ModalFooter";
import type { ModalSubmitHandler } from "../../types/modal";
import ItemTable from "../common/ItemTable";
import InvoiceChargesTab from "../../views/Sales/InvoiceChargeTab";
import { InvoiceAddressTab } from "./InvoiceAddressTab";
import { showApiError, showSuccess, showValidationError } from "../../utils/alert";
import { useDataRefreshStore, REFRESH_KEYS } from "../../store/dataRefreshStore";
import { createProformaInvoice, editProformaInvoice } from "../../api/proformaInvoiceApi";
import { parseFrappeError } from "../../views/hr/tabs/leave-config/hooks/parseFrappeError";
interface QuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: ModalSubmitHandler;
  initialData?: any;
  mode?: "create" | "edit";
  modalId?: string;
}
const QuotationModal: React.FC<QuotationModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode = "create",
  modalId,
}) => {
  // const resolvedModalId = modalId || (mode === "edit" && initialData?.id
  //   ? `quotation-edit-${initialData.id}-${Date.now()}`
  //   : `quotation-create-${Date.now()}`);
  const [resolvedModalId] = useState(
  () =>
    modalId ||
    (mode === "edit" && initialData?.id
      ? `quotation-edit-${initialData.id}-${Date.now()}`
      : `quotation-create-${Date.now()}`)
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
  } = useQuotationForm(
    isOpen, 
    onClose, 
    onSubmit,
    mode === "edit" ? "edit" : "proforma",
    initialData,
  );

  const tabs: Array<"details" | "address" | "otherCharges" | "terms" 
  // | "otherDetails"
  > = [
    "details",
    "address",
    "otherCharges",
    "terms",
    // "otherDetails",
  ];

    useEffect(() => {
      if (isOpen) {
        ui.setActiveTab("details");
      }
    }, [isOpen]);
    // useEffect(() => {
    //   if (isOpen) {
    //     if (initialData?._initialTab) {
    //       ui.setActiveTab(initialData._initialTab);
    //     } else {
    //       ui.setActiveTab("details");
    //     }
    //   }
    // }, [isOpen, initialData, ui]); // Added dependencies to satisfy React
 
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

  const symbol = currencySymbols[formData.currencyCode] || "";

   const handleSave = async () => {
      if (!validateDetailsOrFocus()) return;
  
      try {
        const payload = await actions.handleSubmit({
          preventDefault: () => {},
        } as React.FormEvent);
        
        if (!payload) return;
        
        const finalPayload = {
          ...payload,
          documentType: "Quotation",
        };
        
        let response;
  
        if (mode === "edit") {
          const quotationNumber = formData.invoiceNumber ?? initialData?.id ?? initialData?.proformaId;
          console.log("Editing Proforma Invoice with number:", quotationNumber);
          
          if (!quotationNumber) {
            showValidationError("Invalid quotation reference");
            return;
          }
  
          // Use your actual edit API function
          response = await editProformaInvoice(quotationNumber, finalPayload);
        } else {
          response = await createProformaInvoice(finalPayload);
        }
  
         const res = response?.message || response;
  
        if (!res || ![200, 201].includes(res.status_code)) {
          showApiError(parseFrappeError || res?.message || res || "Failed to save Quotation");
          return;
        }
  
        showSuccess(res.message || "Quotation saved successfully");
  
        const canClose = await onSubmit?.(res);
        if (canClose === false) return;
  
        resetDirty();
        // actions.handleReset();
        onClose();
        
        useDataRefreshStore.getState().triggerRefresh(REFRESH_KEYS.QUOTATION_LIST);
        
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

  const footerContent = (
    <ModalFooter
      onCancel={() => handleCloseWithConfirm(onClose, resolvedModalId)}
      onReset={() => {
        resetDirty();
        actions.handleReset();
      }}
      onSave={() => void handleSave()}
      onNext={ui.activeTab === "terms" ? undefined : handleNext}
    />
  );

  return (
    <MinimizableModal
      modalId={resolvedModalId}
      isOpen={isOpen}
      // onClose={() => handleCloseWithConfirm(handleClose, resolvedModalId)}
      onClose={() => handleCloseWithConfirm(onClose, resolvedModalId)}
      title={
        mode === "edit" ? "Edit Quotation" : "Create Quotation"
      }
      subtitle="Create and manage quotation details"
      icon={FileSignature}
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
      customWidth="82vw"
      height="82vh"
    >
      <form
        id="quotationForm"
        onSubmit={handleFormSubmit}
        onChange={() => markDirty()}
        className="h-full flex flex-col"
      >
        {/* Tabs */}
        <div className="bg-app border-b border-theme px-8 shrink-0">
          <div className="flex gap-8">
            {[
              { key: "details", label: "Details" },
              { key: "address", label: "Additional Details" },
              { key: "otherCharges", label: "Shipping & Other Charges" },
              { key: "terms", label: "Terms & Conditions" },
              // { key: "otherDetails", label: "More Info" },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => ui.setActiveTab(tab.key as any)}
                className={`py-2.5 bg-transparent border-none text-xs font-medium cursor-pointer transition-all ${ui.activeTab === tab.key
                  ? "text-primary border-b-[3px] border-primary"
                  : "text-muted border-b-[3px] border-transparent hover:text-main"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-8 py-4">
          {/* DETAILS TAB */}
          {ui.activeTab === "details" && (
            <div className="flex flex-col gap-6 max-w-[1600px] mx-auto">
              <div className="">
                <div
                  className={`
    grid
    ${ui.isExport
                      ? "grid-cols-[minmax(220px,1.5fr)_repeat(6,minmax(100px,1fr))]"
                      : "grid-cols-[220px_130px_130px_120px_120px_120px]"
                    }
    gap-x-2
    items-start
  `}
                >
                  {/* Customer */}

                  <div className="w-[220px]">
                    <CustomerSelect
                      value={customerNameDisplay}
                      onChange={actions.handleCustomerSelect}
                      className="w-full"
                      required
                    />
                  </div>


                  {/* Date of Quotation */}
                  <div>
                    <DatePickerInput
                      label="Date of Quotation"
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

                  {/* Valid Until */}
                  <div>
                    <DatePickerInput
                      label="Valid Until"
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

                  {/* Currency */}
                  <div className="min-w-[120px]">
                    <ModalSelect
                      label="Currency "
                      name="currencyCode"
                      value={formData.currencyCode}
                      onChange={actions.handleInputChange}
                      options={[...currencyOptions]}
                      disabled
                      className="w-full py-1 px-2 border border-theme rounded text-[11px] text-main bg-card"
                    ></ModalSelect>
                  </div>

                  {/* Status */}
                  {/* <div>
                    <ModalSelect
                      label="Status"
                      name="invoiceStatus"
                      value={formData.invoiceStatus}
                      options={[...quotationStatusOptions]}
                      onChange={actions.handleInputChange}
                      disabled={mode === "edit"}
                      className="w-full py-1 px-2 border border-theme rounded text-[11px] text-main bg-card"
                    />
                  </div> */}

                  {/* <div className="max-w-[140px]">
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
                  </div> */}

                  {ui.isExport && (
                    <div >
                      <ModalInput
                        label="Export To Country"
                        name="destnCountryCd"
                        type="text"
                        value={formData.destnCountryCd}
                        onChange={actions.handleInputChange}
                        className="w-full py-1 px-2 border border-theme rounded text-[11px] text-main bg-card"
                      />
                    </div>
                  )}


                  {/* LPO Number */}
                  {ui.isLocal && (
                    <div>
                      <label className="block text-[10px] font-medium text-main mb-1">
                        LPO Number
                      </label>
                      <input
                        type="text"
                        name="lpoNumber"
                        value={formData.lpoNumber}
                        onChange={actions.handleInputChange}
                        className="w-full py-1 px-2 border border-theme rounded text-[11px] text-main bg-card"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/*  MAIN BODY (TABLE LEFT + RIGHT SIDEBAR)  */}
              <div className="grid grid-cols-[4fr_1fr] gap-4">
                {/* LEFT: QUOTED ITEMS TABLE  */}
                  {/* Reusable ItemTable Component */}
                <ItemTable
                  paginatedItems={paginatedItems}
                  ui={ui}
                  actions={actions}
                  formData={formData}
                  isQuotation={true}
                  symbol={symbol}
                  ITEMS_PER_PAGE={ITEMS_PER_PAGE}
                  isSalesInvoice={false}
                  taxCategory={formData.taxCategory || customerDetails?.customerTaxCategory}
                />

                {/* RIGHT: CUSTOMER DETAILS + SUMMARY (STACKED) */}
                <div className="flex flex-col gap-2">
                  <div className="flex flex-col gap-2">
                    {/* Customer Details */}
                    <div className="bg-card rounded-lg p-2 w-[220px]">
                      <h3 className="text-[12px] font-semibold text-main mb-2">
                        Customer Details
                      </h3>

                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-1.5 text-xs text-main">
                          <span className="flex items-center gap-2">
                            <User size={16} className="text-muted" />
                            <span className="text-xs text-main">
                              {customerDetails?.name ?? "Customer Name"}
                            </span>
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[10px] text-muted">
                          <Mail size={14} className="text-muted" />
                          <span>
                            {customerDetails?.email ?? "customer@gmail.com"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[10px] text-muted">
                          <Phone size={14} className="text-muted" />
                          <span>
                            {customerDetails?.mobile_no ?? "+123 4567890"}
                          </span>
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

                    {/* Summary */}
                    <div className="bg-card rounded-lg p-3  w-[220px]">
                      <h3 className="text-[13px] font-semibold text-main mb-2">
                        Summary
                      </h3>

                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-19 text-xs">
                          <span className="text-muted">Total Items</span>
                          <span className="font-medium text-main">
                            {formData.items.length}
                          </span>
                        </div>

                        <div className="flex items-center gap-19 text-xs">
                          <span className="text-muted">Subtotal</span>
                          <span className="font-medium text-main">
                            {symbol} {totals.subTotal.toFixed(2)}
                          </span>
                        </div>

                        <div className="flex items-center gap-19 text-xs">
                          <span className="text-muted">Total Tax</span>
                          <span className="font-medium text-main">
                            {symbol} {totals.totalTax.toFixed(2)}
                          </span>
                        </div>

                        <div className="mt-2 p-2 bg-primary rounded-lg w-full">
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
           {/* {ui.activeTab === "otherDetails" && (
            <div className="h-full w-full">
             <p>Lost Reason</p>
            </div>
          )} */}
        </div>
      </form>
    </MinimizableModal>
  );
};

export default QuotationModal;
