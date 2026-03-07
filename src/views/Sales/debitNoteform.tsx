import React, { useState } from "react";

import { Trash2, User, Mail, Phone } from "lucide-react";

import TermsAndCondition from "../../components/TermsAndCondition";
import { useEffect } from "react";
import { getSalesInvoiceById } from "../../api/salesApi";
import { getAllSalesInvoices } from "../../api/salesApi";
import { showApiError, showSuccess } from "../../utils/alert";
import { getCountryList } from "../../api/lookupApi";

import { createDebitNoteFromInvoice } from "../../api/salesApi";
import {
  ModalInput,
  ModalSelect,
  ModalTextarea,
} from "../../components/ui/modal/modalComponent";
import SearchSelect from "../../components/ui/modal/SearchSelect";

import ItemSelect from "../../components/selects/ItemSelect";
import { useInvoiceForm } from "../../hooks/useInvoiceForm";
import {
  currencySymbols,
  paymentMethodOptions,
} from "../../constants/invoice.constants";
import PaymentInfoBlock from "../../components/sales/PaymentInfoBlock";
import AddressBlock from "../../components/ui/modal/AddressBlock";

interface DebitNoteFormProps {
  onSubmit?: (data: any) => void;
  invoiceId: string;
  saving: boolean;
  setSaving: React.Dispatch<React.SetStateAction<boolean>>;
}
const DEBIT_NOTE_REASONS = [
  { value: "01", label: "Wrong quantity invoiced" },
  { value: "02", label: "Wrong invoice amount" },
  { value: "03", label: "omitted items" },
  { value: "04", label: "other(s)" },
];

const TRANSACTION_PROGRESS = [
  { value: "02", label: "Approved" },
  { value: "04", label: "Rejected" },
  { value: "05", label: "Refunded" },
  { value: "06", label: "Transferred" },
];

const DebitNoteForm: React.FC<DebitNoteFormProps> = ({
  onSubmit,
  invoiceId: _invoiceId,
  saving,
  setSaving,
}) => {
  const { formData, customerDetails, paginatedItems, totals, ui, actions } =
    useInvoiceForm(true, () => {}, onSubmit);
  const [debitMeta, setDebitMeta] = useState({
    debitNoteReasonCode: "",
    invcAdjustReason: "",
    transactionProgress: "",
  });

  const [countryNameMap, setCountryNameMap] = useState<Record<string, string>>(
    {},
  );

  const fetchInvoiceOptions = async (q: string) => {
    try {
      const res = await getAllSalesInvoices(1, 100, "", "desc", q);
      const invoices = res?.data || [];

      return invoices.map((inv: any) => ({
        value: inv.invoiceNumber,
        label: inv.invoiceNumber,
      }));
    } catch (err) {
      console.error("Failed to load invoices", err);
      return [];
    }
  };

  useEffect(() => {
    if (!formData.invoiceNumber) return;

    const invoiceNumber = formData.invoiceNumber;

    const fetchInvoice = async () => {
      try {
        const res = await getSalesInvoiceById(invoiceNumber);

        if (res?.status_code === 200) {
          actions.setFormDataFromInvoice(res.data);
        }
      } catch (err: any) {
        console.error("Failed to fetch invoice", err);
        showApiError(err);
      }
    };

    fetchInvoice();
  }, [formData.invoiceNumber]);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      const code = String(formData.destnCountryCd ?? "")
        .trim()
        .toUpperCase();
      if (!code) return;
      if (countryNameMap[code]) return;

      try {
        const resp = await getCountryList();
        const list = Array.isArray(resp) ? resp : (resp?.data ?? []);
        const next: Record<string, string> = {};
        (list ?? []).forEach((c: any) => {
          const cc = String(c?.code ?? "")
            .trim()
            .toUpperCase();
          const name = String(c?.name ?? "").trim();
          if (cc) next[cc] = name || cc;
        });
        if (!mounted) return;
        setCountryNameMap((prev) => ({ ...next, ...prev }));
      } catch {
        // ignore lookup failures
      }
    };

    run();
    return () => {
      mounted = false;
    };
  }, [formData.destnCountryCd, countryNameMap]);

  const getInvoiceAdjustReason = () => {
    if (debitMeta.debitNoteReasonCode === "04") {
      return debitMeta.invcAdjustReason?.trim();
    }

    return DEBIT_NOTE_REASONS.find(
      (r) => r.value === debitMeta.debitNoteReasonCode,
    )?.label;
  };

  const handleCreateDebitNote = async () => {
    if (saving) return;

    try {
      // Invoice validation
      if (!formData.invoiceNumber) {
        showApiError("Invoice number missing");
        return;
      }

      // Reason validation
      if (!debitMeta.debitNoteReasonCode) {
        showApiError("Debit note reason missing");
        return;
      }

      const invcAdjustReason = getInvoiceAdjustReason();

      if (!invcAdjustReason) {
        showApiError("Adjustment reason required");
        return;
      }

      const normalizeAddress = (addr: any) => {
        if (addr && typeof addr === "object" && !Array.isArray(addr))
          return addr;
        return {
          line1: "",
          line2: "",
          postalCode: "",
          city: "",
          state: "",
          country: "",
        };
      };

      const billingAddress = normalizeAddress(formData.billingAddress);
      const shippingAddress = normalizeAddress(formData.shippingAddress);

      const payload = {
        originalSalesInvoiceNumber: formData.invoiceNumber,
        DebitNoteReasonCode: debitMeta.debitNoteReasonCode,
        invcAdjustReason,
        transactionProgress: debitMeta.transactionProgress,
        billingAddress,
        shippingAddress,
        paymentInformation: formData.paymentInformation,
        terms: formData.terms,
        items: formData.items.map((it: any) => ({
          itemCode: it.itemCode,
          quantity: Number(it.quantity),
          price: Number(it.price),
        })),
      };

      setSaving(true);
      const res = await createDebitNoteFromInvoice(payload);

      if (!res || ![200, 201].includes(res.status_code)) {
        showApiError(res);
        return;
      }

      showSuccess(res.message || "Debit note created successfully");

      onSubmit?.(res);
    } catch (err: any) {
      console.error(err);

      //  Backend error message
      showApiError(err);
    } finally {
      setSaving(false);
    }
  };

  const symbol = currencySymbols[formData.currencyCode] ?? "ZK";

  return (
    <form
      id="debit-note-form"
      onSubmit={(e) => {
        e.preventDefault();
        handleCreateDebitNote();
      }}
      className="flex flex-col"
    >
      {/* Tabs */}
      <div className="bg-app border-b border-theme px-8 shrink-0">
        <div className="flex gap-8">
          {(["details", "address", "terms"] as const).map((tab) => (
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
              {tab === "terms" && "Terms & Conditions"}
              {tab === "address" && "Additional Details"}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto px-8 py-4">
        {/* DETAILS */}
        {ui.activeTab === "details" && (
          <div className="flex flex-col gap-6 max-w-[1600px] mx-auto">
            <div className="">
              <div className="grid grid-cols-6 gap-3 items-end">
                <SearchSelect
                  label="Invoice Number"
                  value={formData.invoiceNumber ?? ""}
                  onChange={(value) =>
                    actions.handleInputChange({
                      target: {
                        name: "invoiceNumber",
                        value,
                      },
                    } as any)
                  }
                  fetchOptions={fetchInvoiceOptions}
                  placeholder="Search invoice..."
                  required
                />

                <ModalSelect
                  label="Debit Note Reason Code"
                  required
                  options={DEBIT_NOTE_REASONS}
                  value={debitMeta.debitNoteReasonCode}
                  onChange={(e) =>
                    setDebitMeta({
                      ...debitMeta,
                      debitNoteReasonCode: e.target.value,
                    })
                  }
                />

                <ModalSelect
                  label="Transaction Progress"
                  required
                  options={TRANSACTION_PROGRESS}
                  value={debitMeta.transactionProgress}
                  onChange={(e) =>
                    setDebitMeta({
                      ...debitMeta,
                      transactionProgress: e.target.value,
                    })
                  }
                />

                {debitMeta.debitNoteReasonCode === "04" && (
                  <ModalTextarea
                    label="Reason / Remark"
                    required
                    placeholder="Provide reason in brief"
                    value={debitMeta.invcAdjustReason}
                    onChange={(e) =>
                      setDebitMeta({
                        ...debitMeta,
                        invcAdjustReason: e.target.value,
                      })
                    }
                  />
                )}

                <div>
                  <ModalInput
                    label="Currency"
                    required
                    name="currencyCode"
                    value={formData.currencyCode || ""}
                    disabled
                    placeholder="Select"
                  />
                </div>

                <ModalSelect
                  label="Payment Method"
                  required
                  options={[...paymentMethodOptions]}
                  name="paymentMethod"
                  value={formData.paymentInformation?.paymentMethod || ""}
                  onChange={(e) =>
                    actions.handleInputChange(e, "paymentInformation")
                  }
                />

                {/* <div className="flex flex-col gap-1">
                          <ModalSelect
                            label="Invoice Type"
                            name="invoiceType"
                            value={formData.invoiceType}
                            onChange={actions.handleInputChange}
                            options={invoiceTypeOptions}
                          />
                        </div> */}

                {/* <div>
                    <ModalInput
                      label="Invoice Type"
                      name="invoiceType"
                      type="text"
                      disabled
                      value={formData.invoiceType}
                      onChange={actions.handleInputChange}
                      className="w-full col-span-3"
                    />
                  </div> */}

                {/* {ui.isExport && (
                    <CountrySelect
                      value={formData.destnCountryCd}
                      onChange={(c) =>
                        actions.handleInputChange({
                          target: {
                            name: "destnCountryCd",
                            value: c.code,
                          },
                        } as any)
                      }
                    />

                    <div>
                      <ModalInput
                        label="Export To Country"
                        name="destnCountryCd"
                        type="text"
                        disabled
                        value={formData.destnCountryCd}
                        onChange={actions.handleInputChange}
                        className="w-full col-span-3"
                      />
                    </div>
                  )} */}

                {ui.isLocal && (
                  <ModalInput
                    label="LPO Number"
                    name="lpoNumber"
                    value={formData.lpoNumber}
                    onChange={(e) => actions.handleInputChange(e)}
                    placeholder="local purchase order number"
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

                <div>
                  <table className="w-full border-collapse text-[10px]">
                    <thead>
                      <tr className="border-b border-theme">
                        <th className="px-2 py-3 text-left text-muted font-medium text-[11px] w-[25px]">
                          #
                        </th>
                        <th className="px-2 py-3 text-left text-muted font-medium text-[11px] w-[130px]">
                          Item
                        </th>
                        <th className="px-2 py-3 text-left text-muted font-medium text-[11px] w-[140px]">
                          Description
                        </th>
                        <th className="px-2 py-3 text-left text-muted font-medium text-[11px] w-[50px]">
                          Quantity
                        </th>
                        <th className="px-2 py-3 text-left text-muted font-medium text-[11px] w-[70px]">
                          Unit Price
                        </th>
                        <th className="px-2 py-3 text-left text-muted font-medium text-[11px] w-[70px]">
                          Discount
                        </th>
                        <th className="px-2 py-3 text-left text-muted font-medium text-[11px] w-[70px]">
                          Tax
                        </th>
                        <th className="px-2 py-3 text-left text-muted font-medium text-[11px] w-[70px]">
                          Tax Code
                        </th>
                        <th className="px-2 py-3 text-right text-muted font-medium text-[11px] w-[70px]">
                          Amount
                        </th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedItems.map((it, i) => {
                        const qty = Number(it.quantity) || 0;
                        const price = Number(it.price) || 0;
                        const discount = Number(it.discount) || 0;
                        const discountAmount = qty * price * (discount / 100);
                        const totalInclusive = qty * price - discountAmount;
                        const amount = totalInclusive;
                        return (
                          <tr
                            key={i}
                            className={"border-b border-theme hover:bg-muted"}
                          >
                            <td className="px-3 py-2 text-center">{i + 1}</td>
                            <td className="px-2 py-2">
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
                              <ItemSelect
                                taxCategory={ui.taxCategory}
                                value={it.itemCode}
                                onChange={(item) => {
                                  actions.handleItemSelect(i, item.id);
                                }}
                              />
                            </td>

                            <td className="px-2 py-2">
                              <input
                                className="w-full py-1 px-2 border border-theme rounded text-[10px] bg-card text-main focus:outline-none focus:ring-1 focus:ring-primary"
                                name="description"
                                value={it.description}
                                onChange={(e) => actions.handleItemChange(i, e)}
                              />
                            </td>
                            <td className="px-2 py-2">
                              <input
                                type="number"
                                className="w-[50px] py-1 px-2 border border-theme rounded text-[11px] bg-card text-main focus:outline-none focus:ring-1 focus:ring-primary"
                                name="quantity"
                                value={it.quantity}
                                onChange={(e) => actions.handleItemChange(i, e)}
                              />
                            </td>
                            <td className="px-2 py-2">
                              <input
                                type="number"
                                className="w-[70px] py-1 px-2 border border-theme rounded text-[11px] bg-card text-main focus:outline-none focus:ring-1 focus:ring-primary"
                                name="price"
                                value={it.price}
                                disabled
                                onChange={(e) => actions.handleItemChange(i, e)}
                              />
                            </td>
                            <td className="px-2 py-2">
                              <input
                                type="number"
                                className="w-[50px] py-1 px-2 border border-theme rounded text-[11px] bg-card text-main focus:outline-none focus:ring-1 focus:ring-primary"
                                name="discount"
                                value={it.discount}
                                onChange={(e) => actions.handleItemChange(i, e)}
                              />
                            </td>
                            <td className="px-2 py-2">
                              <input
                                type="number" // Assuming input is number for entry, stored as string in Type
                                className="w-[50px] py-1 px-2 border border-theme rounded text-[11px] bg-card text-main focus:outline-none focus:ring-1 focus:ring-primary"
                                name="vatRate"
                                value={it.vatRate}
                                disabled
                                onChange={(e) => actions.handleItemChange(i, e)}
                              />
                            </td>
                            <td className="px-2 py-2">
                              <input
                                type="string"
                                className="w-[50px] py-1 px-2 border border-theme rounded text-[11px] bg-card text-main focus:outline-none focus:ring-1 focus:ring-primary"
                                name="vatCode"
                                value={it.vatCode}
                                disabled
                                onChange={(e) => actions.handleItemChange(i, e)}
                              />
                            </td>
                            <td className="px-2 py-2 text-right font-semibold text-gray-900 whitespace-nowrap">
                              {symbol} {amount.toFixed(2)}
                            </td>

                            <td className="px-1 py-1 text-center">
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
                                {formData.destnCountryCd
                                  ? (countryNameMap[
                                      String(formData.destnCountryCd)
                                        .trim()
                                        .toUpperCase()
                                    ] ?? formData.destnCountryCd)
                                  : "-"}
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

        {ui.activeTab === "terms" && (
          <div className="h-full w-full">
            <TermsAndCondition
              terms={formData.terms?.selling}
              setTerms={actions.setTerms}
            />
          </div>
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
              showPaymentTerms={false}
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
                ) => actions.handleInputChange(e, "billingAddress")}
              />

              {/* Shipping */}
              <AddressBlock
                type="shipping"
                title="Shipping Address"
                subtitle="Delivery location"
                data={formData.shippingAddress}
                sameAsBilling={ui.sameAsBilling}
                onSameAsBillingChange={(v) =>
                  actions.handleSameAsBillingChange(v)
                }
                onChange={(
                  e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
                ) => actions.handleInputChange(e, "shippingAddress")}
              />
            </div>
          </div>
        )}
      </div>
    </form>
  );
};

export default DebitNoteForm;
