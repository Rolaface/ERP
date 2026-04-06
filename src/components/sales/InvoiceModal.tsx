import React, { useState, useEffect } from "react";
import { ToolCase } from "lucide-react";
import { FileText } from "lucide-react";
import TermsAndCondition from "../TermsAndCondition";
import { showApiError, showValidationError } from "../../utils/alert";
import { User, Mail, Phone } from "lucide-react";
import CustomerSelect from "../selects/CustomerSelect";
import { MinimizableModal } from "../../components/common/ModalManagerContext";
import { Button } from "../../components/ui/modal/formComponent";
import { ModalInput, ModalSelect } from "../ui/modal/modalComponent";
import { useInvoiceForm } from "../../hooks/useInvoiceForm";
import WarehouseSelect from "../selects/WarehouseSelect";
import InvoiceChargesTab from "../../views/Sales/InvoiceChargeTab";
import DatePickerInput from "../calendar/DatePickerInput";
import {
  invoiceStatusOptions,
  currencySymbols,
  paymentMethodOptions,
  currencyOptions,
} from "../../constants/invoice.constants";
import PaymentInfoBlock from "./PaymentInfoBlock";
import AddressBlock from "../ui/modal/AddressBlock";
import { formatDate } from "../../utils/dateFormatter";
import Tooltip from "../Tooltip";
import ItemTable from "../common/ItemTable";

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: any) => void;
  initialData?: any;
  mode?: "create" | "edit";
  modalId?: string;
}
const ITEMS_PER_PAGE = 5;

const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode = "create",
  modalId,
}) => {
  const resolvedModalId = modalId || (mode === "edit" && initialData?.invoiceNumber
    ? `invoice-edit-${initialData.invoiceNumber}-${Date.now()}`
    : `invoice-create-${Date.now()}`);

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
  // Removed allowSubmit state, no longer needed.
  const tabs: Array<"details" | "address" | "otherCharges" | "terms"> = [
    "details",
    "address",
    "otherCharges",
    "terms",
  ];

  const handleNext = () => {
    try {
      actions.validateForm();

      const currentIndex = tabs.indexOf(ui.activeTab as any);

      if (currentIndex < tabs.length - 1) {
        ui.setActiveTab(tabs[currentIndex + 1]);
      }
    } catch (err: any) {
      showValidationError(err.message);
    }
  };

  useEffect(() => {
    if (isOpen) {
      ui.setActiveTab("details");
    }
  }, [isOpen]);

  const symbol = currencySymbols[formData.currencyCode] || "";
  const showExchangeRate =
    !!ui.baseCurrency &&
    !!formData.currencyCode &&
    formData.currencyCode.trim().toUpperCase() !==
      ui.baseCurrency.trim().toUpperCase();
  const showExportField = ui.isExport;
  // Remove internal handleFormSubmit. Let parent handle submit.

  // Removed unused invoiceModalOpen state.

  const footerContent = (
    <>
      <Button
        variant="secondary"
        onClick={onClose}
        type="button"
        disabled={submitting}
      >
        Cancel
      </Button>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          onClick={actions.handleReset}
          type="button"
          disabled={submitting}
        >
          Reset
        </Button>
        <Button
          variant="primary"
          type="button"
          onClick={
            ui.activeTab !== "terms"
              ? handleNext
              : async () => {
                  if (submitting) return;
                  setSubmitting(true);
                  try {
                   
                    const dummyEvent = {
                      preventDefault: () => {},
                    } as React.FormEvent;
                    const payload = await actions.handleSubmit(dummyEvent);
                  payload.invoiceCharges = (payload.invoiceCharges || [])
  .filter(ch => ch.charge_type?.trim() && Number(ch.amount) > 0);
                    if (!payload) {
                      showValidationError(
                        "Please fill all required fields correctly.",
                      );
                      setSubmitting(false);
                      return;
                    }
                    await onSubmit?.(payload);
                  } catch (err: any) {
                    showApiError(err);
                  } finally {
                    setSubmitting(false);
                  }
                }
          }
          disabled={submitting}
        >
          {ui.activeTab === "terms"
            ? submitting
              ? "Submitting..."
              : "Submit"
            : "Next"}
        </Button>
      </div>
    </>
  );

  return (
   <MinimizableModal
      modalId={resolvedModalId}
      isOpen={isOpen}
      onClose={onClose}
      title={mode === "edit" ? "Edit Invoice" : "Create Invoice"}
      subtitle="Create and manage invoice details"
      icon={FileText}
      footer={footerContent}
      customWidth="125vw"
      height="81vh"
    >
      <form
        id="invoiceForm"
        className="h-full flex flex-col"
        autoComplete="off"
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
                  className={`py-2.5 bg-transparent border-none text-xs font-medium cursor-pointer transition-all 
              ${
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
        <div className="flex-1 overflow-y-auto px-5 py-3 ">
          {/* DETAILS */}
          {ui.activeTab === "details" && (
            <div className="flex flex-col gap-6 max-w-[1600px] mx-auto">
              <div className="">
                <div
                  className={`grid ${
                    showExchangeRate
                      ? showExportField
                        ? "grid-cols-[220px_130px_130px_100px_80px_100px_90px_250px_100px]"
                        : "grid-cols-[220px_130px_130px_100px_100px_120px_120px_100px]"
                      : showExportField
                        ? "grid-cols-[220px_130px_130px_100px_80px_120px_140px_100px]"
                        : "grid-cols-[220px_130px_130px_100px_100px_120px_100px]"
                  } gap-3 items-start`}
                >
                  <CustomerSelect
                    value={customerNameDisplay}
                    onChange={actions.handleCustomerSelect}
                    className="w-full"
                  />

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

                  <DatePickerInput
                    label="Due Date"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={(name, value) =>
                      actions.handleInputChange({
                        target: { name, value },
                      } as any)
                    }
                    required
                  />

                  <ModalSelect
                    label="Currency"
                    name="currencyCode"
                    value={formData.currencyCode}
                    onChange={actions.handleInputChange}
                    options={[...currencyOptions]}
                    disabled
                    className="w-full  border border-theme rounded text-[11px] text-main bg-card"
                  />

                  {showExchangeRate && (
                    <div>
                      <ModalInput
                        label={
                          ui.exchangeRateLoading
                            ? "Exchange Rate (Loading...)"
                            : "Exchange Rate"
                        }
                        name="exchangeRt"
                        value={formData.exchangeRt || "1"}
                        onChange={actions.handleInputChange}
                        className="w-full py-1 px-2 border border-theme rounded text-[11px] text-main bg-card"
                      />
                      {!!ui.exchangeRateError && (
                        <div className="mt-1 text-[10px] text-danger">
                          {ui.exchangeRateError}
                        </div>
                      )}
                    </div>
                  )}

                  <ModalSelect
                    label="Invoice Status"
                    name="invoiceStatus"
                    value={formData.invoiceStatus}
                    onChange={actions.handleInputChange}
                    options={[...invoiceStatusOptions]}
                    required
                    className="w-full py-1 px-2 border border-theme rounded text-[11px] text-main bg-card"
                  />

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
                    required
                    className="w-full py-1 px-2 border border-theme rounded text-[11px] text-main bg-card"
                  />
                  <div className="flex items-end gap-4 min-w-[120px]">
                    <Tooltip content={`Select Warehouse for the Invoice. Current selection: ${formData.warehouse || "N/A"}`}>
                 <WarehouseSelect
  className="w-[150px]"
  name="warehouse"
  value={formData.warehouse || ""}
  onChange={(e) => {
    actions.handleBulkItemChange("warehouse", e.target.value);
  }}
  label="Warehouse"

  onDefaultLoad={(firstWarehouse) => {
    if (!formData.warehouse) {
      actions.handleBulkItemChange("warehouse", firstWarehouse);
    }
  }}
/>
                    </Tooltip>

                    <label className="flex items-center gap-2 pb-1">
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
                     {/* {ui.isExport && (
                    <ModalInput
                      label="Customer Country"
                      name="destnCountryCd"
                      type="text"
                      value={formData.destnCountryCd}
                      onChange={actions.handleInputChange}
                      className="w-full py-1 px-2 border border-theme rounded text-[11px] text-main bg-card"
                    />
                  )} */}
                  {/* <ModalInput
                  label="Shipping Charges"
                  name="shippingCharges"
                  value={formData.shippingCharges}
                  onChange={actions.handleInputChange}
                  placeholder="2000-"
                  inputMode="numeric"
                  className="w-full py-1 px-2 border border-theme rounded text-[11px] text-main bg-card"
                  />
                    <ModalInput
                  label="Insurance Charges"
                  name="insuranceCharges"
                  value={formData.insuranceCharges}
                  onChange={actions.handleInputChange}
                  placeholder="2000-"
                  inputMode="numeric"
                  className="w-full py-1 px-2 border border-theme rounded text-[11px] text-main bg-card"
                  /> */}
                </div>
              </div>

              {/* ITEMS */}
              <div className="grid grid-cols-[4fr_1fr] gap-4 items-start">
                <ItemTable
                  paginatedItems={paginatedItems}
                  ui={ui}
                  
                  actions={actions}
                  formData={formData}
                  symbol={symbol}
                  ITEMS_PER_PAGE={ITEMS_PER_PAGE}
                />

                {/* RIGHT SIDE */}
                <div className="col-span-1 sticky top-0 flex flex-col items-center gap-4 px-3 lg:px-4 h-fit">
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
                        {customerDetails?.mobile_no ?? ""}
                      </div>
                      {customerDetails && (
                        <div className="bg-card rounded-lg ">
                          <div className="flex items-center gap-10 text-xs">
                            <span className="text-muted">Invoice Date</span>
                            <span className="font-medium text-main">
                              {formatDate(formData.dateOfInvoice)}
                            </span>
                          </div>

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
                      {/* <div className="flex justify-between text-xs">
                        <span className="text-muted">Shipping Charges</span>
                        <span className="font-medium text-main">
                          {symbol} {formData.shippingCharges}
                        </span>
                      </div> */}

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

          {/* TERMS */}
          {ui.activeTab === "terms" && (
            <div className="h-full w-full">
              <TermsAndCondition
                terms={formData.terms?.selling}
                setTerms={actions.setTerms}
                type="selling"
              />
            </div>
          )}
          {ui.activeTab === "otherCharges" && (
            <InvoiceChargesTab
              charges={formData.invoiceCharges || []}
              currency={formData.currencyCode}
              totals={totals}
              onAdd={actions.addOtherCharge}
              onChange={actions.handleOtherChargeChange}
              onRemove={actions.removeOtherCharge}
            />
          )}

          {/* ADDRESS */}
          {ui.activeTab === "address" && (
            <div className="space-y-6 overflow-hidden">
              {/* PAYMENT INFO */}
              <PaymentInfoBlock
                data={formData.paymentInformation}
                onChange={(
                  e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
                ) => actions.handleInputChange(e, "paymentInformation")}
                paymentMethodOptions={paymentMethodOptions}
                showPaymentMethod={false}
              />

              {/* BILLING + SHIPPING */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Billing */}
                <AddressBlock
                  type="billing"
                  title="Billing Address"
                  subtitle="Invoice and payment details"
                  data={formData.billingAddress}
                  onChange={(
                    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
                  ) => actions.handleInputChange(e, "billingAddress")}
                />

                {/* Shipping */}
                <AddressBlock
                  type="shipping"
                  title="Shipping Address"
                  subtitle="Delivery location"
                  data={formData.shippingAddress}
                  sameAsBilling={ui.sameAsBilling}
                  onSameAsBillingChange={actions.handleSameAsBillingChange}
                  onChange={(
                    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
                  ) => actions.handleInputChange(e, "shippingAddress")}
                />
              </div>
            </div>
          )}
        </div>
      </form>
   </MinimizableModal>
  );
};

export default InvoiceModal;
