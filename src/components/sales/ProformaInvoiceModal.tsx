import React, { useState, useEffect } from "react";
import TermsAndCondition from "../TermsAndCondition";
import { showApiError, showSuccess } from "../../utils/alert";
import { User, Mail, Phone , Plus, Trash2 } from "lucide-react";
import { Button } from "../../components/ui/modal/formComponent";
import { ModalInput, ModalSelect } from "../ui/modal/modalComponent";
interface ProformaInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: () => void;
}
import PaymentInfoBlock from "./PaymentInfoBlock";
import Modal from "../ui/modal/modal";
import AddressBlock from "../ui/modal/AddressBlock";
import { getAllCustomers } from "../../api/customerApi";
import CustomerSelect from "../selects/CustomerSelect";
import ItemSelect from "../selects/ItemSelect";
import { createProformaInvoice } from "../../api/proformaInvoiceApi";
import { useInvoiceForm } from "../../hooks/useInvoiceForm";
import {
  invoiceStatusOptions,
  currencySymbols,
  paymentMethodOptions,
  currencyOptions,
} from "../../constants/invoice.constants";

const ProformaInvoiceModal: React.FC<ProformaInvoiceModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const {
    formData,
    customerDetails,
    customerNameDisplay,
    paginatedItems,
    totals,
    ui,
    actions,
  } = useInvoiceForm(isOpen, onClose, undefined, "proforma");


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

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (ui.activeTab !== "terms") {
      handleNext();
      return;
    }



    try {
      const payload = await actions.handleSubmit(e);
      if (!payload) return;

      const res = await createProformaInvoice(payload);

      if (!res || ![200, 201].includes(res.status_code)) {
        showApiError(res);
        return;
      }

      showSuccess(res.message || "Proforma invoice created successfully");

      actions.handleReset();
      onSubmit?.();
      onClose();
    } catch (error: any) {
      showApiError(error);
    }
  };

  const handleClose = () => {
    actions.handleReset();
    onClose();
  };

  const [custLoading, setCustLoading] = useState(true);
  const symbol = currencySymbols[formData.currencyCode] || "";
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

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create Proforma Invoice"
      subtitle="Create and manage proforma invoice details"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>

          <div className="flex gap-2">
            <Button variant="secondary" onClick={actions.handleReset}>
              Reset
            </Button>
            <Button
              variant="primary"
              type={ui.activeTab === "terms" ? "submit" : "button"}
              form={ui.activeTab === "terms" ? "proforma-form" : undefined}
              onClick={ui.activeTab !== "terms" ? handleNext : undefined}
            >
              {ui.activeTab === "terms" ? "Submit" : "Next"}
            </Button>
          </div>
        </>
      }
      customWidth="83vw"
      height="82vh"
    >
      <form id="proforma-form" onSubmit={handleFormSubmit}>
        {/* Tabs */}
        <div className="bg-app border-b border-theme px-8 shrink-0">
          <div className="flex gap-8">
            {(["details", "address", "terms"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => ui.setActiveTab(tab)}
                className={`py-2.5 bg-transparent border-none text-xs font-medium cursor-pointer transition-all ${ui.activeTab === tab
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
        <div className="flex-1 overflow-y-auto px-8 py-4">
          {/* ===== DETAILS ===== */}
          {ui.activeTab === "details" && (
            <div className="flex flex-col gap-6 max-w-[1600px] mx-auto">
              <div className="">
                <div
                  className={`
                    grid
${ui.isExport
                      ? "grid-cols-[minmax(120px,0.6fr)_100px_100px_90px_110px_120px_100px]"
                      : "grid-cols-[minmax(120px,0.7fr)_105px_105px_100px_115px_115px]"
                    }
                  gap-x-2 items-end`}
                >

                  <div>
                    <CustomerSelect
                      value={customerNameDisplay}
                      onChange={actions.handleCustomerSelect}
                      className="w-full min-w-0"
                    />
                  </div>


                  <div>
                    <ModalInput
                      label="Date of Invoice"
                      name="dateOfInvoice"
                      type="date"
                      value={formData.dateOfInvoice}
                      onChange={actions.handleInputChange}
                      className="w-full py-1 px-2 border border-theme rounded text-[11px] text-main bg-card"
                    />
                  </div>

                  <div>
                    <ModalInput
                      label="Due Date"
                      name="dueDate"
                      type="date"
                      value={formData.dueDate}
                      onChange={actions.handleInputChange}
                      className="w-full py-1 px-2 border border-theme rounded text-[11px] text-main bg-card"
                    />
                  </div>

                  <div>
                    <ModalSelect
                      label="Currency"
                      name="currencyCode"
                      value={formData.currencyCode}
                      options={[...currencyOptions]}
                      disabled
                      className="w-full py-1 px-2 border border-theme rounded text-[11px] text-main bg-card"
                    />
                  </div>

                  <div>
                    <ModalSelect
                      label="Invoice Status"
                      name="invoiceStatus"
                      value={formData.invoiceStatus}
                      onChange={actions.handleInputChange}
                      options={[...invoiceStatusOptions]}
                      className="w-full py-1 px-2 border border-theme rounded text-[11px] text-main bg-card"
                    />
                  </div>

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

                  {/* <div >
                                            <ModalSelect
                                              label="Invoice Type"
                                              name="invoiceType"
                                              value={formData.invoiceType}
                                              onChange={actions.handleInputChange}
                                              options={invoiceTypeOptions}
                                            />
                                          </div> */}

                  {/* <div >
                    <ModalInput
                      label="Invoice Type"
                      name="invoiceType"
                      type="text"
                      disabled
                      value={formData.invoiceType}
                      onChange={actions.handleInputChange}
                      className="w-full py-1 px-2 border border-theme rounded text-[11px] text-main bg-card"
                    />
                  </div> */}

                  {ui.isExport && (
                    // <CountrySelect
                    //   value={formData.destnCountryCd}
                    //   onChange={(c) =>
                    //     actions.handleInputChange({
                    //       target: {
                    //         name: "destnCountryCd",
                    //         value: c.code,
                    //       },
                    //     } as any)
                    //   }
                    // />

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

              {/* ITEMS */}
              <div className="grid grid-cols-[4fr_1fr] gap-4">
                <div className="bg-card rounded-lg p-2 shadow-sm flex-1">
                  <div className="flex items-center gap-1 ">
                    <h3 className="text-sm font-semibold text-main">
                      Invoiced Items
                    </h3>
                  </div>
                  <div className="mt-2 overflow-x-auto">
                    <table className="w-full min-w-[760px] border-collapse text-[10px]">
                      <thead>
                        <tr className="border-b border-theme">
                          <th className="px-2 py-3 text-left text-muted font-medium text-[11px] w-[25px] whitespace-nowrap">#</th>
                          <th className="px-2 py-3 text-left text-muted font-medium text-[11px] w-[130px] whitespace-nowrap">Item</th>
                          <th className="px-2 py-3 text-left text-muted font-medium text-[11px] w-[110px] whitespace-nowrap">Description</th>
                          <th className="px-2 py-3 text-left text-muted font-medium text-[11px] w-[100px] whitespace-nowrap">Packing
                            <span className="ml-1 text-[9px] text-muted/60 font-normal">(unit × size)</span>
                          </th>
                          <th className="px-2 py-3 text-left text-muted font-medium text-[11px] w-[50px] whitespace-nowrap">Quantity</th>
                          <th className="px-2 py-3 text-left text-muted font-medium text-[11px] w-[55px]  whitespace-nowrap">Unit Price</th>
                          <th className="px-2 py-3 text-left text-muted font-medium text-[11px] w-[60px]  whitespace-nowrap">Dis(%)</th>
                          <th className="px-2 py-3 text-left text-muted font-medium text-[11px] w-[50px] whitespace-nowrap">Tax(%)</th>
                          <th className="px-2 py-3 text-left text-muted font-medium text-[11px] w-[45px]  whitespace-nowrap">Tax Code</th>
                          <th className="px-2 py-3 text-left text-muted font-medium text-[11px] w-[70px] whitespace-nowrap">Amount</th>
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
                              <td className="px-3 py-2 text-center">{i + 1}</td>
                              <td className="px-0.5 py-1">
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
                              {/* Description */}
                              <td className="px-0.5 py-1">
                                <input
                                  className="w-full py-1 px-2 border border-theme rounded text-[10px] bg-card text-main focus:outline-none focus:ring-1 focus:ring-primary"
                                  name="description"
                                  value={it.description ?? ""}
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
                                    className="w-[38px] py-1 px-1 border border-theme rounded text-[10px] bg-card text-main text-center"
                                    placeholder="0"
                                  />

                                  <span className="text-[10px] text-muted font-semibold">×</span>

                                  {/* PACKING SIZE */}
                                  <input
                                    type="number"
                                    name="packingSize"
                                    value={it.packingSize || ""}
                                    onChange={(e) => actions.handleItemChange(i, e)}
                                    className="w-[38px] py-1 px-1 border border-theme rounded text-[10px] bg-card text-main text-center"
                                    placeholder="0"
                                  />

                                </div>
                              </td>
                              <td className="px-0.5 py-1">
                                <input
                                  type="number"
                                  className="w-[76px] py-1 px-2 border border-theme rounded text-[11px] bg-card text-main focus:outline-none focus:ring-1 focus:ring-primary no-spinner"
                                  name="quantity"
                                  value={it.quantity ?? ""}
                                  onChange={(e) =>
                                    actions.handleItemChange(i, e)
                                  }
                                />
                              </td>
                              <td className="px-0.5 py-1">
                                <input
                                  type="number"
                                  className="w-[66px]  py-1 px-2 border border-theme rounded text-[11px] bg-card text-main focus:outline-none focus:ring-1 focus:ring-primary no-spinner"
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
                                  className="w-[53px]  py-1 px-2 border border-theme rounded text-[11px] bg-card text-main focus:outline-none focus:ring-1 focus:ring-primary"
                                  name="discount"
                                  value={it.discount ?? ""}
                                  min="0"
                                  onChange={(e) =>
                                    actions.handleItemChange(i, e)
                                  }
                                />
                              </td>
                              <td className="px-0.5 py-1">
                                <input
                                  type="number"
                                  className="w-[55px] py-1 px-2 border border-theme rounded text-[11px] bg-card text-main focus:outline-none focus:ring-1 focus:ring-primary"
                                  name="vatRate"
                                  value={it.vatRate ?? ""}
                                  min="0"
                                  onChange={(e) =>
                                    actions.handleItemChange(i, e)
                                  }
                                />
                              </td>
                              <td className="px-0.5 py-1">
                                <input
                                  type="text"
                                  className="w-[45px]  py-1 px-2 border border-theme rounded text-[11px] bg-card text-main focus:outline-none focus:ring-1 focus:ring-primary"
                                  name="vatCode"
                                  value={it.vatCode}
                                  onChange={(e) =>
                                    actions.handleItemChange(i, e)
                                  }
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

                  {/* ---------- ADD ITEM + SUBTOTAL ---------- */}
                  <div className="flex justify-between mt-3">
                    <button
                      type="button"
                      onClick={actions.addItem}
                      className="px-4 py-1.5 bg-primary hover:bg-[var(--primary-600)] text-white rounded text-xs font-medium flex items-center gap-1.5 transition-colors"
                    >
                      <Plus className="w-4 h-4" /> Add Item
                    </button>

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
                {/* RIGHT SIDE */}
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

          {/* === TAB: Terms & Conditions === */}
          {ui.activeTab === "terms" && (
            <TermsAndCondition
              terms={formData.terms.selling}
              setTerms={actions.setTerms}
              type="selling"
            />
          )}

          {ui.activeTab === "address" && (
            <div className="space-y-6 overflow-hidden">
              {/*  PAYMENT INFO  */}
              <PaymentInfoBlock
                data={formData.paymentInformation}
                onChange={(
                  e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
                ) => actions.handleInputChange(e, "paymentInformation")}
                paymentMethodOptions={paymentMethodOptions}
                showPaymentMethod={false}
              />

              {/*  BILLING + SHIPPING  */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Billing */}
                <AddressBlock
                  type="billing"
                  title="Billing Address"
                  subtitle="Invoice and payment details"
                  data={formData.billingAddress}
                  onChange={(
                    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
                  ) =>
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
                  onChange={(
                    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
                  ) =>
                    actions.handleInputChange(e, "shippingAddress")
                  }
                />
              </div>
            </div>
          )}
        </div>
        {/* <div className="flex justify-end gap-2 mt-6">
          <Button variant="ghost" onClick={actions.handleReset}>
            Reset
          </Button>

          <Button variant="primary" type="submit">
            Submit
          </Button>
        </div> */}
      </form>
    </Modal>
  );
};

export default ProformaInvoiceModal;
