/* eslint-disable react-hooks/rules-of-hooks */

/* eslint-disable @typescript-eslint/no-misused-promises */

/* eslint-disable react/jsx-handler-names */
import { Plus, Trash2, FileText } from "lucide-react";
import TermsAndCondition from "../TermsAndCondition";
import { useQuotationForm } from "../../hooks/useQuotationForm";
import { Button } from "../../components/ui/modal/formComponent";
import { ModalSelect, ModalInput } from "../ui/modal/modalComponent";
import CustomerSelect from "../selects/CustomerSelect";
import ItemSelect from "../selects/ItemSelect";
import Modal from "../../components/ui/modal/modal";
import { User, Mail, Phone } from "lucide-react";
import AddressBlock from "../ui/modal/AddressBlock";
import PaymentInfoBlock from "./PaymentInfoBlock";
import React, { useState } from "react";
import CountrySelect from "../selects/CountrySelect";
import {
  currencySymbols,
  paymentMethodOptions,
  currencyOptions,
} from "../../constants/invoice.constants";

interface QuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: any) => void;
}

const QuotationModal: React.FC<QuotationModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  if (!isOpen) return null;

  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    formData,
    customerDetails,
    customerNameDisplay,
    paginatedItems,
    totals,
    ui,
    actions,
  } = useQuotationForm(isOpen, onClose, onSubmit);

  const symbol = currencySymbols[formData.currencyCode] ?? "ZK";
  const currencyCode = String(formData.currencyCode ?? "")
    .trim()
    .toUpperCase();
  const showExchangeRate = !!currencyCode && currencyCode !== "ZMW";

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await actions.handleSubmit(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const footerContent = (
    <>
      <Button
        variant="secondary"
        onClick={onClose}
        type="button"
        disabled={isSubmitting}
      >
        Cancel
      </Button>
      <div className="flex gap-2">
        <Button
          variant="ghost"
          onClick={actions.handleReset}
          type="button"
          disabled={isSubmitting}
        >
          Reset
        </Button>
        <Button
          variant="primary"
          type="submit"
          onClick={handleFormSubmit}
          loading={isSubmitting}
        >
          {isSubmitting ? "Submitting..." : "Submit"}
        </Button>
      </div>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Quotation"
      subtitle="Create and manage quotation details"
      icon={FileText}
      footer={footerContent}
      maxWidth="wide"
      height="79vh"
    >
      <form onSubmit={handleFormSubmit} className="h-full flex flex-col">
        {/* Tabs */}
        <div className="bg-app border-b border-theme px-8 shrink-0">
          <div className="flex gap-8">
            {[
              { key: "details", label: "Details" },
              { key: "address", label: "Additional Details" },
              { key: "terms", label: "Terms & Conditions" },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => ui.setActiveTab(tab.key as any)}
                className={`py-2.5 bg-transparent border-none text-xs font-medium cursor-pointer transition-all ${
                  ui.activeTab === tab.key
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
                  className={`grid ${showExchangeRate ? "grid-cols-6" : "grid-cols-5"} gap-3 items-end`}
                >
                  {/* Customer */}

                  <CustomerSelect
                    value={customerNameDisplay}
                    onChange={actions.handleCustomerSelect}
                    className="w-full"
                    taxCategory="Non-Export"
                  />

                  {/* Valid Until */}
                  <div>
                    <ModalInput
                      label="Valid Until"
                      type="date"
                      name="dueDate"
                      value={formData.dueDate}
                      onChange={actions.handleInputChange}
                      required
                    />
                  </div>

                  {/* Currency */}
                  <div>
                    <ModalSelect
                      label="Currency "
                      required
                      name="currencyCode"
                      value={formData.currencyCode}
                      onChange={actions.handleInputChange}
                      options={[...currencyOptions]}
                      className="w-full py-1 px-2 border border-theme rounded text-[11px] text-main bg-card"
                    ></ModalSelect>
                  </div>

                  {showExchangeRate && (
                    <div>
                      <ModalInput
                        label={
                          ui.exchangeRateLoading
                            ? "Exchange Rate (Loading...)"
                            : "Exchange Rate"
                        }
                        name="exchangeRt"
                        value={formData.exchangeRt}
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

                  <div>
                    <ModalSelect
                      label="Payment Method"
                      required
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

                  {(ui.isExport || ui.hasC1) && (
                    <CountrySelect
                      value={formData.destnCountryCd}
                      required
                      onChange={(c) =>
                        actions.handleInputChange({
                          target: {
                            name: "destnCountryCd",
                            value: c.code,
                          },
                        } as any)
                      }
                    />
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

              {/* ================= MAIN BODY (TABLE LEFT + RIGHT SIDEBAR) ================= */}
              <div className="grid grid-cols-[4fr_1fr] gap-4">
                {/* LEFT: QUOTED ITEMS TABLE  */}
                <div className="bg-card rounded-lg p-2 shadow-sm flex-1">
                  <div className="flex items-center gap-1 ">
                    <h3 className="text-sm font-semibold text-main">
                      Quoted Items
                    </h3>
                  </div>
                  <div className="mt-2 overflow-x-hidden">
                    <table className="w-full border-collapse table-fixed text-[10px]">
                      <thead>
                        <tr className="border-b border-theme">
                          <th className="px-2 py-3 text-left text-muted font-medium text-[11px] w-[24px] whitespace-nowrap">
                            #
                          </th>
                          <th className="px-2 py-3 text-left text-muted font-medium text-[11px] w-[140px] whitespace-nowrap">
                            Item
                          </th>
                          <th className="px-2 py-3 text-left text-muted font-medium text-[11px] whitespace-nowrap">
                            Description
                          </th>
                          <th className="px-2 py-3 text-left text-muted font-medium text-[11px] w-[56px] whitespace-nowrap">
                            Qty
                          </th>
                          <th className="px-2 py-3 text-left text-muted font-medium text-[11px] w-[96px] whitespace-nowrap">
                            Unit Price
                          </th>
                          <th className="px-2 py-3 text-left text-muted font-medium text-[11px] w-[90px] whitespace-nowrap">
                            Discount (%)
                          </th>
                          <th className="px-2 py-3 text-left text-muted font-medium text-[11px] w-[56px] whitespace-nowrap">
                            Tax
                          </th>
                          <th className="px-2 py-3 text-left text-muted font-medium text-[11px] w-[84px] whitespace-nowrap">
                            Tax Code
                          </th>
                          <th className="px-2 py-3 text-right text-muted font-medium text-[11px] w-[92px] whitespace-nowrap">
                            Amount
                          </th>
                          <th className="px-2 py-3 text-center text-muted font-medium text-[11px] w-[32px] whitespace-nowrap">
                            -
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedItems.map((it, idx) => {
                          const i = ui.page * 5 + idx;
                          const qty = Number(it.quantity) || 0;
                          const price = Number(it.price) || 0;
                          const discount = Number(it.discount) || 0;
                          const discountAmount = qty * price * (discount / 100);
                          const amount = qty * price - discountAmount;
                          return (
                            <tr
                              key={i}
                              className="border-b border-theme bg-card row-hover"
                            >
                              <td className="px-3 py-2 text-[10px]">{i + 1}</td>
                              <td className="px-0.5 py-1">
                                <ItemSelect
                                  taxCategory={ui.taxCategory}
                                  value={it.itemCode}
                                  excludeItemCodes={formData.items
                                    .map((x, j) => (j === i ? "" : x?.itemCode))
                                    .filter(Boolean)}
                                  onChange={(item) => {
                                    actions.handleItemSelect(i, item.id);
                                  }}
                                />
                              </td>
                              <td className="px-0.5 py-1">
                                <input
                                  type="text"
                                  name="description"
                                  value={it.description}
                                  onChange={(e) =>
                                    actions.handleItemChange(i, e)
                                  }
                                  placeholder="Description"
                                  className="w-full py-1 px-2 border border-theme rounded text-[10px] bg-card text-main focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                              </td>
                              <td className="px-0.5 py-1">
                                <input
                                  type="number"
                                  name="quantity"
                                  value={it.quantity}
                                  onChange={(e) =>
                                    actions.handleItemChange(i, e)
                                  }
                                  min="1"
                                  className="w-full min-w-0 py-1 px-2 border border-theme rounded text-[11px] bg-card text-main focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                              </td>
                              <td className="px-0.5 py-1">
                                <input
                                  type="number"
                                  name="price"
                                  value={it.price}
                                  onChange={(e) =>
                                    actions.handleItemChange(i, e)
                                  }
                                  min="0"
                                  step="0.01"
                                  disabled
                                  className="w-full min-w-0 py-1 px-2 border border-theme rounded text-[11px] bg-card text-main focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                              </td>
                              <td className="px-0.5 py-1">
                                <input
                                  type="number"
                                  name="discount"
                                  value={it.discount}
                                  onChange={(e) =>
                                    actions.handleItemChange(i, e)
                                  }
                                  min="0"
                                  placeholder="0"
                                  className="w-full min-w-0 py-1 px-2 border border-theme rounded text-[11px] bg-card text-main focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                              </td>
                              <td className="px-0.5 py-1">
                                <input
                                  type="number"
                                  name="vatRate"
                                  value={it.vatRate}
                                  onChange={(e) =>
                                    actions.handleItemChange(i, e)
                                  }
                                  min="0"
                                  placeholder="0"
                                  disabled
                                  className="w-full min-w-0 py-1 px-2 border border-theme rounded text-[11px] bg-card text-main focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                              </td>
                              <td className="px-0.5 py-1">
                                <input
                                  type="text"
                                  name="vatCode"
                                  value={it.vatCode}
                                  onChange={(e) =>
                                    actions.handleItemChange(i, e)
                                  }
                                  disabled
                                  className="w-full min-w-0 py-1 px-2 border border-theme rounded text-[11px] bg-card text-main focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                              </td>
                              <td className="px-1 py-1.5 text-right">
                                <span className="text-[10px] font-medium text-main">
                                  {symbol} {amount.toFixed(2)}
                                </span>
                              </td>
                              <td className="px-1 py-1.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => actions.removeItem(i)}
                                  className="p-0.5 rounded bg-danger/10 text-danger hover:bg-danger/20 transition text-[10px]"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-3 flex justify-between items-center gap-3">
                    {/* Add Item Button */}
                    <button
                      type="button"
                      onClick={actions.addItem}
                      className="px-4 py-1.5 bg-primary hover:bg-[var(--primary-600)] text-white rounded text-xs font-medium flex items-center gap-1.5 transition-colors"
                    >
                      <Plus size={14} />
                      Add Item
                    </button>

                    {/* Pagination Controls */}
                    {(ui.itemCount > 5 || ui.page > 0) && (
                      <div className="flex items-center gap-3 py-1 px-2 bg-app rounded">
                        <div className="text-[11px] text-muted whitespace-nowrap">
                          Showing {ui.page * 5 + 1} to{" "}
                          {Math.min((ui.page + 1) * 5, ui.itemCount)} of{" "}
                          {ui.itemCount} items
                        </div>

                        <div className="flex gap-1.5 items-center">
                          <button
                            type="button"
                            onClick={() => ui.setPage(Math.max(0, ui.page - 1))}
                            disabled={ui.page === 0}
                            className="px-2.5 py-1 bg-card text-main border border-theme rounded text-[11px]"
                          >
                            Previous
                          </button>

                          <button
                            type="button"
                            onClick={() => ui.setPage(ui.page + 1)}
                            disabled={(ui.page + 1) * 5 >= ui.itemCount}
                            className="px-2.5 py-1 bg-card text-main border border-theme rounded text-[11px]"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

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
                            <h3 className="text-[11px] font-semibold text-main mb-1">
                              Invoice Information
                            </h3>

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

          {/* TERMS TAB */}
          {ui.activeTab === "terms" && (
            <div className="w-full mt-3">
              <TermsAndCondition
                terms={formData.terms?.selling}
                setTerms={actions.setTerms}
              />
            </div>
          )}

          {ui.activeTab === "address" && (
            <div className="space-y-6 overflow-hidden">
              {/* PAYMENT INFO */}
              <PaymentInfoBlock
                data={formData.paymentInformation}
                onChange={(e) =>
                  actions.handleInputChange(e, "paymentInformation")
                }
                paymentMethodOptions={paymentMethodOptions}
                showPaymentMethod={false}
                showPaymentTerms={false}
              />

              {/* BILLING + SHIPPING */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Billing */}
                <AddressBlock
                  type="billing"
                  title="Billing Address"
                  subtitle="Invoice and payment details"
                  data={formData.billingAddress}
                  onChange={(e) =>
                    actions.handleInputChange(e, "billingAddress")
                  }
                />

                {/* Shipping */}
                <AddressBlock
                  type="shipping"
                  title="Shipping Address"
                  subtitle="Delivery location"
                  data={formData.shippingAddress}
                  sameAsBilling={ui.sameAsBilling}
                  onSameAsBillingChange={actions.handleSameAsBillingChange}
                  onChange={(e) =>
                    actions.handleInputChange(e, "shippingAddress")
                  }
                />
              </div>
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
};

export default QuotationModal;
