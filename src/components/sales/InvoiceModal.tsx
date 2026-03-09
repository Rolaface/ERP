import React, { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { FileText } from "lucide-react";
import TermsAndCondition from "../TermsAndCondition";
import { showApiError } from "../../utils/alert";
import { User, Mail, Phone } from "lucide-react";
import CustomerSelect from "../selects/CustomerSelect";
import Modal from "../../components/ui/modal/modal";
import { Button } from "../../components/ui/modal/formComponent";
import { ModalInput, ModalSelect } from "../ui/modal/modalComponent";
import ItemSelect from "../selects/ItemSelect";
import { useInvoiceForm } from "../../hooks/useInvoiceForm";
import {
  invoiceStatusOptions,
  currencySymbols,
  paymentMethodOptions,
  currencyOptions,
} from "../../constants/invoice.constants";
import PaymentInfoBlock from "./PaymentInfoBlock";
import AddressBlock from "../ui/modal/AddressBlock";
import { formatDate } from "../../utils/dateFormatter";
import "react-datepicker/dist/react-datepicker.css";


// import ModalInput from "../ui/ModalInput";
// import ModalSelect from "../ui/ModalSelect";

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: any) => void;
  initialData?: any;
  mode?: "create" | "edit";
}
const ITEMS_PER_PAGE = 5;

const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode = "create",
}) => {
  if (!isOpen) return null;
  const [submitting, setSubmitting] = useState(false);
  const {
    formData,
    customerDetails,
    customerNameDisplay,
    paginatedItems,
    totals,
    ui,
    actions,
  } = useInvoiceForm(isOpen, onClose);
  // Removed allowSubmit state, no longer needed.
  const tabs: Array<"details" | "address" | "terms"> = [
    "details",
    "address",
    "terms",
  ];
  // Removed allowSubmit effect, no longer needed.
  const handleNext = () => {
  try {
    actions.validateForm();

    const currentIndex = tabs.indexOf(ui.activeTab as any);

    if (currentIndex < tabs.length - 1) {
      ui.setActiveTab(tabs[currentIndex + 1]);
    }

  } catch (err: any) {
    showApiError(err.message);
  }
};

  const symbol = currencySymbols[formData.currencyCode] || "";
  const showExchangeRate =
    String(formData.currencyCode ?? "").trim().toUpperCase() !== "INR";
  const showExportField = ui.isExport;
  // Remove internal handleFormSubmit. Let parent handle submit.

  // Removed unused invoiceModalOpen state.

  const footerContent = (
    <>
      <Button variant="secondary" onClick={onClose} type="button" disabled={submitting}>
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
          onClick={ui.activeTab !== "terms" ? handleNext : async () => {
            if (submitting) return;
            setSubmitting(true);
            try {
              // Create a dummy event to satisfy handleSubmit's required argument
              const dummyEvent = { preventDefault: () => { } } as React.FormEvent;
              const payload = await actions.handleSubmit(dummyEvent);
              if (!payload) {
                showApiError("Please fill all required fields correctly.");
                setSubmitting(false);
                return;
              }
              await onSubmit?.(payload);
            } catch (err: any) {
              showApiError(err);
            } finally {
              setSubmitting(false);
            }
          }}
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
    <Modal
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
            {(["details", "address", "terms"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => ui.setActiveTab(tab)}
                className={`py-2.5 bg-transparent border-none text-xs font-medium cursor-pointer transition-all 
              ${ui.activeTab === tab
                    ? "text-primary border-b-[3px] border-primary"
                    : "text-muted border-b-[3px] border-transparent hover:text-main"
                  }`}
              >
                {tab === "details" && "Details"}
                {tab === "address" && "Additional Details"}
                {tab === "terms" && "Terms & Conditions"}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto px-3 py-1 ">
          {/* DETAILS */}
          {ui.activeTab === "details" && (
            <div className="flex flex-col gap-6 max-w-[1600px] mx-auto">
              <div className="">

                <div
                  className={`grid ${showExchangeRate
                    ? showExportField
                      ? "grid-cols-[220px_150px_150px_100px_100px_120px_120px_140px]"
                      : "grid-cols-[220px_150px_150px_100px_100px_120px_120px]"
                    : showExportField
                      ? "grid-cols-[220px_150px_150px_100px_120px_120px_140px]"
                      : "grid-cols-[220px_150px_150px_100px_120px_120px]"
                    } gap-3 items-start`}
                >
                  <CustomerSelect
                    value={customerNameDisplay}
                    onChange={actions.handleCustomerSelect}
                    className="w-full"
                  />

                  <ModalInput
                    label="Date of Invoice"
                    name="dateOfInvoice"
                    type="date"
                    value={formData.dateOfInvoice}
                    onChange={actions.handleInputChange}
                    lang="en-IN"
                    required
                    className="w-full py-1 px-2 border border-theme rounded text-[11px] text-main bg-card"
                  />


                  <ModalInput
                    label="Due Date"
                    name="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={actions.handleInputChange}
                    lang="en-IN"
                    required
                    className="w-full py-1 px-2 border border-theme rounded text-[11px] text-main bg-card"
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


                  {ui.isExport && (

                    <ModalInput
                      label="Export To Country"
                      name="destnCountryCd"
                      type="text"
                      value={formData.destnCountryCd}
                      onChange={actions.handleInputChange}
                      className="w-full py-1 px-2 border border-theme rounded text-[11px] text-main bg-card"
                    />

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

              {/* ITEMS */}
              <div className="grid grid-cols-[4fr_1fr] gap-4 items-start">
                <div className="bg-card rounded-lg p-1 shadow-sm ">
                  <div className="flex items-center gap-1 ">
                    <h3 className="text-sm font-semibold text-main">
                      Invoiced Items
                    </h3>
                  </div>

                  <div className="mt-2 overflow-x-auto">
                    <table className="w-full min-w-[760px] border-collapse text-[10px] leading-tight">
                      <thead>
                        <tr className="border-b border-theme">
                          <th className="px-2 py-1 text-left text-muted font-medium text-[11px] w-[25px] whitespace-nowrap">
                            #
                          </th>
                          <th className="px-2 py-1 text-left text-muted font-medium text-[11px] w-[130px] whitespace-nowrap">
                            Item
                          </th>
                          <th className="px-2 py-1 text-left text-muted font-medium text-[11px] w-[140px] whitespace-nowrap">
                            Description
                          </th>
                          <th className="px-2 py-1 text-left text-muted font-medium text-[11px] w-[130px] whitespace-nowrap">
                            Packing
                            <span className="ml-1 text-[9px] text-muted/60 font-normal">(unit × size)</span>
                          </th>
                          <th className="px-2 py-1 text-left text-muted font-medium text-[11px] w-[130px] whitespace-nowrap">
                            Box
                          </th>
                          <th className="px-2 py-1 text-left text-muted font-medium text-[11px] w-[130px] whitespace-nowrap">
                            Batch No
                          </th>
                          <th className="px-2 py-1 text-left text-muted font-medium text-[11px] w-[50px] whitespace-nowrap">
                            Qty
                          </th>
                          <th className="px-2 py-1 text-left text-muted font-medium text-[11px] w-[50px] whitespace-nowrap">
                            Mfg Date
                          </th>
                          <th className="px-2 py-1 text-left text-muted font-medium text-[11px] w-[50px] whitespace-nowrap">
                            Expiry Date
                          </th>
                          <th className="px-2 py-1 text-left text-muted font-medium text-[11px] w-[60px]  whitespace-nowrap">
                            Unit Price
                          </th>
                          <th className="px-2 py-1 text-left text-muted font-medium text-[11px] w-[60px] whitespace-nowrap">
                            Dis(%)
                          </th>
                          <th className="px-2 py-1 text-left text-muted font-medium text-[11px] w-[70px] whitespace-nowrap">
                            Tax(%)
                          </th>
                          <th className="px-2 py-1 text-left text-muted font-medium text-[11px] w-[60px]  whitespace-nowrap">
                            Tax Code
                          </th>
                          <th className="px-2 py-1 text-left text-muted font-medium text-[11px] w-[60px]  whitespace-nowrap">
                            Amount
                          </th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedItems.map((it, idx) => {
                          const i = ui.page * ITEMS_PER_PAGE + idx;
                          const discountAmount =
                            it.quantity *
                            it.price *
                            (Number(it.discount || 0) / 100);
                          const amount =
                            it.quantity * it.price - discountAmount;

                          return (
                            <tr
                              key={i}
                              className="border-b border-theme bg-card row-hover"
                            >
                              <td className="px-2 py-1 text-center">{i + 1}</td>
                              {/* <ItemSelect
                                    taxCategory={ui.taxCategory}
                                    value={it.itemCode}
                                    onChange={(item) => {
                                      actions.updateItemDirectly(i, {
                                        itemCode: item.id,
                                        price: item.sellingPrice ?? it.price,
                                      });
                                    }}
                                  /> */}


                              {/* ITEM COLUMN */}
                              <td className="px-0.5 py-1 min-w-[135px]">
                                <ItemSelect
                                  taxCategory={ui.taxCategory}
                                  value={it.itemCode}
                                  onChange={(item) => {
                                    if (!item?.id) return;
                                    actions.handleItemSelect(i, item.id);
                                  }}
                                />
                              </td>


                              <td className="px-0.5 py-1">
                                <input
                                  className="w-full py-1 px-2 border border-theme rounded text-[10px] bg-card text-main focus:outline-none focus:ring-1 focus:ring-primary"
                                  name="description"
                                  value={it.description}
                                  onChange={(e) =>
                                    actions.handleItemChange(i, e)
                                  }
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
                                    className="w-[38px] py-1 px-1 border border-theme rounded text-[10px] bg-card text-main text-center no-spinner"
                                  />

                                  <span className="text-[10px] text-muted font-semibold">×</span>

                                  {/* PACKING SIZE */}
                                  <input
                                    type="number"
                                    name="packingSize"
                                    value={it.packingSize || ""}
                                    onChange={(e) => actions.handleItemChange(i, e)}
                                    className="w-[38px] py-1 px-1 border border-theme rounded text-[10px] bg-card text-main text-center no-spinner"
                                  />

                                </div>
                              </td>


                              {/* BOX COLUMN */}
                              <td className="px-0.5 py-1">
                                <div className="flex items-center gap-1">
                                  <input
                                    name="boxStart"
                                    value={it.boxStart || ""}
                                    onChange={(e) => actions.handleItemChange(i, e)}
                                    placeholder="Start"
                                    className="w-[38px] py-1 px-1 border border-theme rounded text-[10px] bg-card text-main"
                                  />
                                  <span className="text-[10px] text-muted">-</span>
                                  <input
                                    name="boxEnd"
                                    value={it.boxEnd || ""}
                                    onChange={(e) => actions.handleItemChange(i, e)}
                                    placeholder="End"
                                    className="w-[38px] py-1 px-1 border border-theme rounded text-[10px] bg-card text-main"
                                  />
                                </div>
                              </td>

                              <td className="px-0.5 py-1">
                                <input
                                  type="string"
                                  className="w-full py-1 px-2 border border-theme rounded text-[10px] bg-card text-main focus:outline-none focus:ring-1 focus:ring-primary"
                                  name="batchNo"
                                  value={it.batchNo}
                                  onChange={(e) =>
                                    actions.handleItemChange(i, e)
                                  }
                                />
                              </td>

                              <td className="px-0.5 py-1">
                                <input
                                  type="number"
                                  className="w-[75px] py-1 px-2 border border-theme rounded text-[11px] bg-card text-main focus:outline-none focus:ring-1 focus:ring-primary no-spinner"
                                  name="quantity"
                                  value={it.quantity ?? ""}
                                  onChange={(e) => actions.handleItemChange(i, e)}
                                />
                              </td>
                              <td className="px-0.5 py-1">
                                <div style={{ width: "103px" }}>
                                  <ModalInput
                                    label=""
                                    type="date"
                                    name="mfgDate"
                                    id={`mfgDate-${i}`}
                                    value={it.mfgDate || ""}
                                    onChange={(e) => actions.handleItemChange(i, e)}
                                    className="w-full"
                                  />
                                </div>
                              </td>

                              <td className="px-0.5 py-1">
                                <div style={{ width: "103px" }}>
                                  <ModalInput
                                    label=""
                                    type="date"
                                    name="expDate"
                                    id={`expDate-${i}`}
                                    value={it.expDate || ""}
                                    onChange={(e) => actions.handleItemChange(i, e)}
                                    className="w-full"
                                  />
                                </div>
                              </td>

                              <td className="px-0.5 py-1">
                                <input
                                  type="number"
                                  className="w-[60px]  py-1 px-2 border border-theme rounded text-[11px] bg-card text-main focus:outline-none focus:ring-1 focus:ring-primary no-spinner"
                                  name="price"
                                  value={it.price ?? ""}
                                  onChange={(e) =>
                                    actions.handleItemChange(i, e)
                                  }
                                />
                              </td>
                              <td className="px-0.5 py-1">
                                <input
                                  type="number"
                                  className="w-[55px]  py-1 px-2 border border-theme rounded text-[11px] bg-card text-main focus:outline-none focus:ring-1 focus:ring-primary no-spinner"
                                  name="discount"
                                  value={it.discount ?? ""}
                                  onChange={(e) =>
                                    actions.handleItemChange(i, e)
                                  }
                                />
                              </td>
                              <td className="px-0.5 py-1">
                                <input
                                  type="number" // Assuming input is number for entry, stored as string in Type
                                  className="w-[55px] py-1 px-2 border border-theme rounded text-[11px] bg-card text-main focus:outline-none focus:ring-1 focus:ring-primary no-spinner"
                                  name="vatRate"
                                  value={it.vatRate ?? ""}
                                  onChange={(e) =>
                                    actions.handleItemChange(i, e)
                                  }
                                />
                              </td>
                              <td className="px-0.5 py-1">
                                <input
                                  type="string"
                                  className="w-[45px] py-1 px-2 border border-theme rounded text-[11px] bg-card text-main focus:outline-none focus:ring-1 focus:ring-primary"
                                  name="vatCode"
                                  value={it.vatCode}
                                  onChange={(e) =>
                                    actions.handleItemChange(i, e)
                                  }
                                />
                              </td>
                              <td className="px-0.5 py-1">
                                <span className="w-[110px] text-[10px] font-medium text-main">
                                  {symbol} {amount.toFixed(2)}
                                </span>
                              </td>

                              <td className="px-0.5 py-1">
                                <button
                                  type="button"
                                  onClick={() => actions.removeItem(i)}
                                  className="p-0.5 rounded bg-danger/10 text-danger hover:bg-danger/20 transition text-[10px]"
                                  title="Remove item"
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

                  <div className="flex justify-between mt-3">
                    <button
                      type="button"
                      onClick={actions.addItem}
                      className="px-4 py-1.5 bg-primary hover:bg-[var(--primary-600)] text-white rounded text-xs font-medium flex items-center gap-1.5 transition-colors"
                    >
                      <Plus className="w-4 h-4" /> Add Item
                    </button>

                    {(ui.itemCount > ITEMS_PER_PAGE || ui.page > 0) && (
                      <div className="flex items-center gap-3 py-1 px-2 bg-app rounded">
                        <div className="text-[11px] text-muted whitespace-nowrap">
                          Showing {ui.page * ITEMS_PER_PAGE + 1} to{" "}
                          {Math.min((ui.page + 1) * ITEMS_PER_PAGE, ui.itemCount)} of{" "}
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
                            disabled={(ui.page + 1) * ITEMS_PER_PAGE >= ui.itemCount}
                            className="px-2.5 py-1 bg-card text-main border border-theme rounded text-[11px]"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

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
                        {customerDetails?.mobile_no ?? "+123 4567890"}
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
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
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
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
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

export default InvoiceModal;
