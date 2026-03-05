import React, { useState, useEffect } from "react";
import { Plus, Trash2, FileText } from "lucide-react";
import TermsAndCondition from "../TermsAndCondition";
import { useQuotationForm } from "../../hooks/useQuotationForm";
import { Button } from "../../components/ui/modal/formComponent";
import { ModalSelect, ModalInput } from "../ui/modal/modalComponent";
import CustomerSelect from "../selects/CustomerSelect";
import ItemSelect from "../selects/ItemSelect";
import Modal from "../../components/ui/modal/modal";
import { showSuccess } from "../../utils/alert";
import { User, Mail, Phone } from "lucide-react";
import AddressBlock from "../ui/modal/AddressBlock";
import PaymentInfoBlock from "./PaymentInfoBlock";
import { quotationStatusOptions } from "../../types/quotation";
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

  const {
    formData,
    customerDetails,
    customerNameDisplay,
    paginatedItems,
    totals,
    ui,
    actions,
  } = useQuotationForm(isOpen, onClose, onSubmit);

  const tabs: Array<"details" | "address" | "terms"> = [
    "details",
    "address",
    "terms",
  ];
  const handleNext = () => {
    const currentIndex = tabs.indexOf(ui.activeTab as any);
    if (currentIndex < tabs.length - 1) {
      ui.setActiveTab(tabs[currentIndex + 1]);
    }
  };

  const symbol = currencySymbols[formData.currencyCode] || "";

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (ui.activeTab !== "terms") {
      handleNext();
      return;
    }

    await actions.handleSubmit(e);
  };

  const handlePrint = () => {
    showSuccess("Print functionality - Opens print dialog");
  };

  const footerContent = (
    <>
      <Button variant="secondary" onClick={onClose} type="button">
        Cancel
      </Button>
      <div className="flex gap-2">
        <Button variant="secondary" onClick={actions.handleReset} type="button">
          Reset
        </Button>
        <Button
          variant="primary"
          type={ui.activeTab !== "terms" ? "button" : "submit"}
          form={ui.activeTab !== "terms" ? undefined : "quotationForm"}
          onClick={ui.activeTab !== "terms" ? handleNext : undefined}
        >
          {ui.activeTab === "terms" ? "Submit" : "Next"}
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
      customWidth="82vw"
      height="82vh"
    >
      <form id="quotationForm" onSubmit={handleFormSubmit} className="h-full flex flex-col">
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
                      ? "grid-cols-[minmax(150px,1fr)_100px_100px_100px_100px_90px_110px_110px]"
                      : "grid-cols-[minmax(180px,1fr)_110px_110px_110px_110px_110px_110px]"
                    }
                    gap-x-2
                      items-end
                       `}
                >
                  {/* Customer */}

                  <CustomerSelect
                    value={customerNameDisplay}
                    onChange={actions.handleCustomerSelect}
                    className="w-full"
                  />


                  {/* Date of Quotation */}
                  <div>
                    <ModalInput
                      label="Date of Quotation"
                      type="date"
                      name="dateOfInvoice"
                      value={formData.dateOfInvoice}
                      onChange={actions.handleInputChange}
                      required
                      
                    />
                  </div>

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
                  <div>
                    <ModalSelect
                      label="Status"
                      name="invoiceStatus"
                      value={formData.invoiceStatus}
                      options={[...quotationStatusOptions]}
                      onChange={actions.handleInputChange}
                      className="w-full py-1 px-2 border border-theme rounded text-[11px] text-main bg-card"
                    ></ModalSelect>
                  </div>

                  <div className="max-w-[140px]">
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
                    <div className="mt-2">
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
                <div className="bg-card rounded-lg p-2 shadow-sm flex-1">
                  <div className="flex items-center gap-1 ">
                    <h3 className="text-sm font-semibold text-main">
                      Quoted Items
                    </h3>
                  </div>
                  <div className="mt-2 overflow-x-auto">
                    <table className="w-full min-w-[760px] border-collapse text-[10px]">
                      <thead>
                        <tr className="border-b border-theme">
                          <th className="px-2 py-3 text-left text-muted font-medium text-[11px] w-[25px] whitespace-nowrap">
                            #
                          </th>
                          <th className="px-2 py-3 text-left text-muted font-medium text-[11px] w-[130px] whitespace-nowrap">
                            Item
                          </th>
                          <th className="px-2 py-3 text-left text-muted font-medium text-[11px] w-[110px] whitespace-nowrap">
                            Description
                          </th>
                          <th className="px-2 py-3 text-left text-muted font-medium text-[11px] w-[90px] whitespace-nowrap">
                            Packing
                            <span className="ml-1 text-[9px] text-muted/60 font-normal">(unit × size)</span>
                          </th>
                          <th className="px-2 py-3 text-left text-muted font-medium text-[11px] w-[50px] whitespace-nowrap">
                            Qty
                          </th>
                          <th className="px-2 py-3 text-left text-muted font-medium text-[11px] w-[60px] whitespace-nowrap">
                            Unit Price
                          </th>
                          <th className="px-2 py-3 text-left text-muted font-medium text-[11px] w-[60px] whitespace-nowrap">
                            Dis(%)
                          </th>
                          <th className="px-2 py-3 text-left text-muted font-medium text-[11px] w-[50px] whitespace-nowrap">
                            Tax (%)
                          </th>
                          <th className="px-2 py-3 text-left text-muted font-medium text-[11px] w-[70px]  whitespace-nowrap">
                            Tax Code
                          </th>
                          <th className="px-2 py-3 text-left text-muted font-medium text-[11px] w-[70px] whitespace-nowrap">
                            Amount
                          </th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedItems.map((it, idx) => {
                          const i = ui.page * 5 + idx;
                          const qty = Number(it.quantity) || 0;
                          const price = Number(it.price) || 0;
                          const discount = Number(it.discount) || 0;
                          const vatRate = Number(it.vatRate) || 0;
                          const discountAmount = qty * price * (discount / 100);
                          const amount = qty * price - discountAmount;
                          return (
                            <tr
                              key={i}
                              className="border-b border-theme bg-card row-hover"
                            >
                              <td className="px-3 py-2 text-[10px]">{i + 1}</td>
                              <td className="px-0.5 py-1">
                                <div className="w-[180px]">
                                  <ItemSelect
                                    taxCategory={ui.taxCategory}
                                    value={it.itemCode}
                                    onChange={(item) => {
                                      actions.handleItemSelect(i, item.id);
                                    }}
                                  />
                                </div>
                              </td>
                              <td className="px-0.5 py-1">

                                <input
                                  type="text"
                                  name="description"
                                  value={it.description ?? ""}
                                  onChange={(e) =>
                                    actions.handleItemChange(i, e)
                                  }
                                  placeholder="Description"
                                  className="w-full py-1 px-2 border border-theme rounded text-[10px] bg-card text-main focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                              </td>
                              <td className="px-0.5 py-1">
                                <div className="flex items-center gap-1">

                                  {/* PACKING UNIT */}
                                  <input
                                    type="number"
                                    name="packingUnit"
                                    value={it.packingUnit || ""}
                                    onChange={(e) => actions.handleItemChange(i, e)}
                                    className="w-[40px] py-1 px-1 border border-theme rounded text-[10px] bg-card text-main text-center"
                                    placeholder="0"
                                  />

                                  <span className="text-[10px] text-muted font-semibold">×</span>

                                  {/* PACKING SIZE */}
                                  <input
                                    type="number"
                                    name="packingSize"
                                    value={it.packingSize || ""}
                                    onChange={(e) => actions.handleItemChange(i, e)}
                                    className="w-[40px] py-1 px-1 border border-theme rounded text-[10px] bg-card text-main text-center"
                                    placeholder="0"
                                  />

                                </div>
                              </td>

                              <td className="px-0.5 py-1">
                                <input
                                  type="number"
                                  name="quantity"
                                  value={it.quantity ?? ""}
                                  onChange={(e) =>
                                    actions.handleItemChange(i, e)
                                  }
                                  className="w-[80px] py-1 px-2 border border-theme rounded text-[11px] bg-card text-main focus:outline-none focus:ring-1 focus:ring-primary no-spinner"
                                />
                              </td>
                              <td className="px-0.5 py-1">
                                <input
                                  type="number"
                                  name="price"
                                  value={it.price ?? ""}
                                  onChange={(e) =>
                                    actions.handleItemChange(i, e)
                                  }
                                  className="w-[66px]  py-1 px-2 border border-theme rounded text-[11px] bg-card text-main focus:outline-none focus:ring-1 focus:ring-primary no-spinner"
                                />
                              </td>
                              <td className="px-0.5 py-1">
                                <input
                                  type="number"
                                  name="discount"
                                 value={it.discount ?? ""}
                                  onChange={(e) =>
                                    actions.handleItemChange(i, e)
                                  }
                                  min="0"
                                  placeholder="0"
                                  className="w-[53px]  py-1 px-2 border border-theme rounded text-[11px] bg-card text-main focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                              </td>
                              <td className="px-0.5 py-1">
                                <input
                                  type="number"
                                  name="vatRate"
                                  value={it.vatRate ?? ""}
                                  onChange={(e) =>
                                    actions.handleItemChange(i, e)
                                  }
                                  min="0"
                                  placeholder="0"
                                  className="w-[55px] py-1 px-2 border border-theme rounded text-[11px] bg-card text-main focus:outline-none focus:ring-1 focus:ring-primary"
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
                                  className="w-[48px]  py-1 px-2 border border-theme rounded text-[11px] bg-card text-main focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                              </td>
                              <td className="px-0.5 py-1">
                                <span className="text-[10px] font-medium text-main">
                                  {symbol} {amount.toFixed(2)}
                                </span>
                              </td>
                              <td className="px-0.5 py-1">
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
                type="selling"
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