import React, { useState, useEffect } from "react";
import { Receipt, User, Mail, Phone } from "lucide-react";
import TermsAndCondition from "../TermsAndCondition";
import { showApiError, showSuccess } from "../../utils/alert";
import { useDataRefreshStore, REFRESH_KEYS } from "../../store/dataRefreshStore";
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
          formData.invoiceNumber ?? initialData?.id ?? initialData?.invoiceNumber;
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
          useDataRefreshStore.getState().triggerRefresh(REFRESH_KEYS.INVOICE_LIST);
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
          useDataRefreshStore.getState().triggerRefresh(REFRESH_KEYS.INVOICE_LIST);
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
      title={mode === "edit" ? "Edit Invoice" : "Create Invoice"}
      subtitle="Create and manage invoice details"
      icon={Receipt}
      footer={footerContent}
      customWidth="125vw"
      height="81vh"
    >
      <form
        id="invoiceForm"
        className="h-full flex flex-col"
        autoComplete="off"
        onChange={() => markDirty()}
      >
        {/* ── Tabs ── */}
        <div className="bg-app border-b border-theme px-8 shrink-0">
          <div className="flex gap-8">
            {(["details", "address", "otherCharges", "terms"] as const).map((tab) => (
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

        {/* ── Tab Content ── */}
        <div className="overflow-y-auto px-3 py-2">

          {/* ──────────── DETAILS ──────────── */}
          {ui.activeTab === "details" && (
            <div className="flex flex-col gap-6 max-w-[1600px] mx-auto">

              {/* ── Top fields — fixed 8-column grid, columns never shift ── */}
              {/* Col order: Customer | Invoice Date | Due Date | Currency | Exchange Rate | Mode of Payment | Update Stock | LPO Number */}
              <div className="grid gap-3 items-start grid-cols-[220px_130px_130px_100px_110px_200px_120px_120px]">

                {/* 1 — Customer */}
                <CustomerSelect
                  value={customerNameDisplay}
                  onChange={actions.handleCustomerSelect}
                  className="w-full"
                />

                {/* 2 — Date of Invoice */}
                <DatePickerInput
                  label="Date of Invoice"
                  name="dateOfInvoice"
                  value={formData.dateOfInvoice}
                  required
                  onChange={(name, value) =>
                    actions.handleInputChange({ target: { name, value } } as any)
                  }
                />

                {/* 3 — Due Date */}
                <DatePickerInput
                  label="Due Date"
                  name="dueDate"
                  value={formData.dueDate}
                  required
                  disabled
                  onChange={(name, value) =>
                    actions.handleInputChange({ target: { name, value } } as any)
                  }
                />

                {/* 4 — Currency */}
                <ModalSelect
                  label="Currency"
                  name="currencyCode"
                  value={formData.currencyCode}
                  onChange={actions.handleInputChange}
                  options={
                    formData.currencyCode
                      ? [{ value: formData.currencyCode, label: formData.currencyCode }]
                      : []
                  }
                  disabled
                  className="w-full border border-theme rounded text-[11px] text-main bg-card"
                />

                {/* 5 — Exchange Rate (always occupies column, invisible when not needed) */}
                <div className={!showExchangeRate ? "invisible pointer-events-none" : ""}>
                  <ModalInput
                    label={ui.exchangeRateLoading ? "Exchange Rate (Loading...)" : "Exchange Rate"}
                    name="exchangeRt"
                    value={formData.exchangeRt || "1"}
                    onChange={actions.handleInputChange}
                    className="w-full py-1 px-2 border border-theme rounded text-[11px] text-main bg-card"
                    disabled
                  />
                  {!!ui.exchangeRateError && (
                    <div className="mt-1 text-[10px] text-danger">{ui.exchangeRateError}</div>
                  )}
                </div>

                {/* 6 — Mode of Payment */}
                <SearchSelect2
                  label="Mode of Payment"
                  value={formData.mode ?? ""}
                  onChange={handleModeChange}
                  fetchOptions={handleModeFetchOptions}
                  placeholder="search.."
                />

                {/* 7 — Update Stock */}
                <div className="flex flex-col justify-end">
                  <label className="text-[11px] text-transparent select-none">‎</label>
                  <label className="flex items-center gap-2 h-[30px]">
                    <input
                      type="checkbox"
                      name="updateStock"
                      checked={formData.updateStock ?? true}
                      onChange={actions.handleInputChange}
                      className="w-3.5 h-3.5 accent-primary"
                    />
                    <span className="text-xs text-main whitespace-nowrap">Update Stock</span>
                  </label>
                </div>

                {/* 8 — LPO Number (always occupies column, invisible when not needed) */}
                <div className={!ui.isLocal ? "invisible pointer-events-none" : ""}>
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

              </div>

              {/* ── Items + Summary ── */}
              <div className="grid grid-cols-[4fr_1fr] gap-4 items-start">
                <ItemTable
                  paginatedItems={paginatedItems}
                  ui={ui}
                  actions={actions}
                  formData={formData}
                  symbol=""
                  ITEMS_PER_PAGE={ITEMS_PER_PAGE}
                  isSalesInvoice={true}
                  taxCategory={formData.taxCategory || customerDetails?.customerTaxCategory}
                />

                {/* Right panel */}
                <div className="col-span-1 sticky top-0 flex flex-col items-center gap-4 px-3 lg:px-4 h-fit">

                  {/* Customer Details */}
                  <div className="bg-card rounded-lg p-2 w-[220px]">
                    <h3 className="text-[12px] font-semibold text-main mb-2">Customer Details</h3>
                    <div className="flex flex-col gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-muted" />
                        {customerDetails?.name ?? "Customer Name"}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted">
                        <Mail size={12} />
                        {primaryContact?.email || customerDetails?.email || ""}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted">
                        <Phone size={12} />
                        {primaryContact?.mobile || customerDetails?.mobile || ""}
                      </div>
                      <div className="flex justify-between text-[10px] mt-1">
                        <span className="text-muted">Tax</span>
                        <span className="text-main font-medium">
                          {customerDetails?.customerTaxCategory || "-"}
                        </span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-muted">Country</span>
                        <span className="text-main font-medium">
                          {billingAddress?.country || "-"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="bg-card rounded-lg p-3 w-[220px]">
                    <h3 className="text-[13px] font-semibold text-main mb-2">Summary</h3>
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted">Total Items</span>
                        <span className="font-medium text-main">{formData.items.length}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted">Subtotal</span>
                        <span className="font-medium text-main">{totals.subTotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted">Total Tax</span>
                        <span className="font-medium text-main">{totals.totalTax.toFixed(2)}</span>
                      </div>
                      <div className="mt-2 p-2 bg-primary rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-semibold text-white">Grand Total</span>
                          <span className="text-sm font-bold text-white">
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
            <div className="space-y-6 overflow-hidden">
              <PaymentInfoBlock
                data={formData.paymentInformation}
                onChange={(e) => actions.handleInputChange(e, "paymentInformation")}
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
              onTemplateSelect={(name, taxes) => actions.handleTemplateSelect(name, taxes)}
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