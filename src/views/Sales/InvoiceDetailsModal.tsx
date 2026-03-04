import React, { useEffect, useMemo, useState } from "react";

import { FileText, ExternalLink } from "lucide-react";

import Modal from "../../components/ui/modal/modal";
import { Button } from "../../components/ui/modal/formComponent";
import { getSalesInvoiceById } from "../../api/salesApi";
import { getCountryList } from "../../api/lookupApi";
import { getPaymentMethodLabel } from "../../constants/invoice.constants";

type Address = {
  line1?: string;
  line2?: string;
  postalCode?: string;
  city?: string;
  state?: string;
  country?: string;
};

type PaymentInformation = {
  paymentTerms?: string;
  paymentMethod?: string;
  bankName?: string;
  accountNumber?: string;
  routingNumber?: string;
  swiftCode?: string;
};

type InvoiceItem = {
  itemCode?: string;
  itemName?: string;
  quantity?: number;
  description?: string;
  discount?: number;
  price?: number;
  vatCode?: string;
  vatTaxableAmount?: string;
};

type TermsPaymentPhase = {
  name?: string;
  percentage?: string;
  condition?: string;
};

type InvoiceTerms = {
  selling?: {
    general?: string;
    delivery?: string;
    cancellation?: string;
    warranty?: string;
    liability?: string;
    payment?: {
      dueDates?: string;
      lateCharges?: string;
      taxes?: string;
      notes?: string;
      phases?: TermsPaymentPhase[];
    };
  };
};

export type InvoiceDetails = {
  invoiceNumber?: string;
  invoiceType?: string;
  originInvoice?: string | null;
  customerName?: string;
  customerTpin?: string;
  currencyCode?: string;
  exchangeRt?: string;
  dateOfInvoice?: string;
  dueDate?: string;
  Receipt?: string;
  ReceiptNo?: string;
  TotalAmount?: number;
  discountPercentage?: number;
  discountAmount?: number;
  lpoNumber?: string | null;
  destnCountryCd?: string | null;
  billingAddress?: Address;
  shippingAddress?: Address;
  paymentInformation?: PaymentInformation;
  items?: InvoiceItem[];
  terms?: InvoiceTerms;
};

type Props = {
  open: boolean;
  invoiceId: string | null;
  onClose: () => void;
  onOpenReceiptPdf?: (receiptUrl: string) => void;
  fetchDetails?: (id: string) => Promise<any>;
  mapDetails?: (raw: any) => InvoiceDetails;
};

const InvoiceDetailsModal: React.FC<Props> = ({
  open,
  invoiceId,
  onClose,
  onOpenReceiptPdf,
  fetchDetails,
  mapDetails,
}) => {
  const Field = ({
    label,
    value,
  }: {
    label: string;
    value: React.ReactNode;
  }) => {
    const isPrimitive = typeof value === "string" || typeof value === "number";

    return (
      <div className="flex flex-col gap-1">
        <div className="text-[11px] font-semibold text-muted uppercase tracking-wide">
          {label}
        </div>
        {isPrimitive ? (
          <input
            readOnly
            value={String(value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-main"
          />
        ) : (
          <div className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-main">
            {value}
          </div>
        )}
      </div>
    );
  };

  const SectionTitle = ({ title }: { title: string }) => (
    <div className="text-xs font-bold text-main uppercase tracking-wide">
      {title}
    </div>
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<InvoiceDetails | null>(null);
  const [countryNameMap, setCountryNameMap] = useState<Record<string, string>>(
    {},
  );

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      if (!open || !invoiceId) return;
      try {
        setLoading(true);
        setError(null);
        setData(null);

        const resp = fetchDetails
          ? await fetchDetails(invoiceId)
          : await getSalesInvoiceById(invoiceId);
        if (!mounted) return;

        if (!resp || resp.status_code !== 200) {
          setError(resp?.message ?? "Failed to load invoice details");
          return;
        }

        const next = mapDetails
          ? mapDetails(resp.data)
          : (resp.data as InvoiceDetails);
        setData(next);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message ?? "Failed to load invoice details");
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };

    run();
    return () => {
      mounted = false;
    };
  }, [open, invoiceId, fetchDetails, mapDetails]);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      if (!open) return;
      const code = String(data?.destnCountryCd ?? "")
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
        // ignore lookup failures; we will fall back to showing the code
      }
    };

    run();
    return () => {
      mounted = false;
    };
  }, [open, data?.destnCountryCd, countryNameMap]);

  const items = data?.items ?? [];

  const currency = data?.currencyCode ?? "";

  const docNo = String(data?.invoiceNumber ?? "");
  const docNoUpper = docNo.trim().toUpperCase();
  const invoiceTypeUpper = String(data?.invoiceType ?? "")
    .trim()
    .toUpperCase();
  const isQuoteOrProforma =
    docNoUpper.startsWith("QUO-") || docNoUpper.startsWith("PRO-");
  const isLpoType =
    invoiceTypeUpper === "LPO" || invoiceTypeUpper.includes("LPO");
  const isExportType =
    invoiceTypeUpper.includes("EXPORT") && !invoiceTypeUpper.includes("NON");

  const computedTotals = useMemo(() => {
    const subTotal = items.reduce(
      (sum, it) => sum + Number(it.price ?? 0) * Number(it.quantity ?? 0),
      0,
    );
    const discount = items.reduce((sum, it) => {
      const pct = Number(it.discount ?? 0);
      const row = Number(it.price ?? 0) * Number(it.quantity ?? 0);
      return sum + row * (pct / 100);
    }, 0);

    return {
      subTotal,
      discount,
      total: subTotal - discount,
    };
  }, [items]);

  const totalForDisplay =
    data?.TotalAmount !== undefined && data?.TotalAmount !== null
      ? Number(data.TotalAmount)
      : computedTotals.total;

  const discountPctForDisplay =
    data?.discountPercentage !== undefined && data?.discountPercentage !== null
      ? Number(data.discountPercentage)
      : undefined;
  const discountAmountForDisplay =
    data?.discountAmount !== undefined && data?.discountAmount !== null
      ? Number(data.discountAmount)
      : undefined;

  const paymentPhases = useMemo(() => {
    const phases = data?.terms?.selling?.payment?.phases;
    if (!Array.isArray(phases)) return [];

    const seen = new Set<string>();
    const out: typeof phases = [];

    for (const p of phases) {
      const key = `${String(p?.name ?? "")
        .trim()
        .toLowerCase()}|${String(p?.percentage ?? "")
        .trim()
        .toLowerCase()}|${String(p?.condition ?? "")
        .trim()
        .toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(p);
    }

    return out;
  }, [data?.terms?.selling?.payment?.phases]);

  const footer = (
    <div className="w-full flex items-center justify-end gap-2">
      <Button variant="secondary" type="button" onClick={onClose}>
        Close
      </Button>
    </div>
  );

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={
        data?.invoiceNumber
          ? `Invoice ${data.invoiceNumber}`
          : "Invoice Details"
      }
      subtitle={loading ? "Loading invoice details" : undefined}
      icon={FileText}
      maxWidth="6xl"
      height="82vh"
      footer={footer}
    >
      {error && (
        <div className="mb-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-semibold">
          {error}
        </div>
      )}

      {loading && (
        <div className="animate-pulse">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="h-3 w-32 bg-gray-300 rounded" />
              <div className="h-6 w-40 bg-gray-300 rounded mt-2" />
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="h-3 w-32 bg-gray-300 rounded" />
              <div className="h-6 w-40 bg-gray-300 rounded mt-2" />
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="h-3 w-32 bg-gray-300 rounded" />
              <div className="h-6 w-40 bg-gray-300 rounded mt-2" />
            </div>
          </div>

          <div className="mt-3 bg-white border border-gray-200 rounded-xl p-4">
            <div className="h-3 w-32 bg-gray-300 rounded" />
            <div className="h-24 w-full bg-gray-300 rounded mt-2" />
          </div>
        </div>
      )}

      {!loading && data && (
        <div className="bg-[#fbf7f2] border border-gray-200 rounded-2xl p-5">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-3">
              <SectionTitle title="Basic Information" />
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Field
                  label="Invoice Number"
                  value={data.invoiceNumber ?? "—"}
                />
                <Field label="Invoice Type" value={data.invoiceType ?? "—"} />
                <Field label="Invoice Date" value={data.dateOfInvoice ?? "—"} />
              </div>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Field label="Customer" value={data.customerName ?? "—"} />
                <Field label="TPIN" value={data.customerTpin ?? "—"} />
                <Field label="Due Date" value={data.dueDate ?? "—"} />
              </div>
              {isLpoType ? (
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Field label="LPO Number" value={data.lpoNumber ?? "—"} />
                </div>
              ) : null}
            </div>

            <div className="lg:col-span-3">
              <SectionTitle title="Currency & Discounts" />
              <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Currency" value={currency || "—"} />
                <Field label="Exchange Rate" value={data.exchangeRt ?? "—"} />
                {isExportType ? (
                  <Field
                    label="Destination Country"
                    value={
                      data.destnCountryCd
                        ? (countryNameMap[
                            String(data.destnCountryCd).trim().toUpperCase()
                          ] ?? data.destnCountryCd)
                        : "—"
                    }
                  />
                ) : null}

                <Field
                  label="Discount %"
                  value={
                    discountPctForDisplay !== undefined &&
                    !Number.isNaN(discountPctForDisplay)
                      ? `${discountPctForDisplay}%`
                      : "—"
                  }
                />
                <Field
                  label="Discount Amount"
                  value={
                    discountAmountForDisplay !== undefined &&
                    !Number.isNaN(discountAmountForDisplay)
                      ? `${currency} ${discountAmountForDisplay.toFixed(2)}`.trim()
                      : "—"
                  }
                />
                <Field
                  label="Total After Discount"
                  value={`${currency || ""} ${Number(totalForDisplay).toFixed(2)}`.trim()}
                />

                {!isQuoteOrProforma ? (
                  <Field label="Receipt No" value={data.ReceiptNo ?? "—"} />
                ) : null}
                <Field
                  label="Receipt"
                  value={
                    <button
                      type="button"
                      onClick={() => {
                        if (data.Receipt) {
                          if (onOpenReceiptPdf) {
                            onOpenReceiptPdf(data.Receipt);
                          } else {
                            window.open(
                              data.Receipt,
                              "_blank",
                              "noopener,noreferrer",
                            );
                          }
                          return;
                        }

                        window.open(
                          "about:blank",
                          "_blank",
                          "noopener,noreferrer",
                        );
                      }}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
                    >
                      {data.Receipt ? "Open Receipt" : "Receipt Not Available"}{" "}
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  }
                />
              </div>
            </div>

            <div className="lg:col-span-3">
              <SectionTitle title="Payment Information" />
              <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field
                  label="Payment Terms"
                  value={data.paymentInformation?.paymentTerms ?? "—"}
                />
                <Field
                  label="Payment Method"
                  value={
                    data.paymentInformation?.paymentMethod
                      ? getPaymentMethodLabel(
                          String(data.paymentInformation.paymentMethod),
                        )
                      : "—"
                  }
                />
                <Field
                  label="Bank Name"
                  value={data.paymentInformation?.bankName ?? "—"}
                />
                <Field
                  label="Account Number"
                  value={data.paymentInformation?.accountNumber ?? "—"}
                />
                <Field
                  label="Routing Number / IBAN"
                  value={data.paymentInformation?.routingNumber ?? "—"}
                />
                <Field
                  label="SWIFT / BIC"
                  value={data.paymentInformation?.swiftCode ?? "—"}
                />
              </div>

              {!!paymentPhases.length && (
                <div className="mt-4 bg-white border border-gray-200 rounded-xl p-4">
                  <div className="text-[11px] font-semibold text-muted uppercase tracking-wide">
                    Payment Phases
                  </div>
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {paymentPhases.map((p, idx) => (
                      <div
                        key={`${String(p?.name ?? "").trim()}-${String(
                          p?.percentage ?? "",
                        ).trim()}-${String(p?.condition ?? "").trim()}-${idx}`}
                        className="border border-gray-200 rounded-xl p-4 bg-[#fbf7f2]"
                      >
                        {p.name && p.name.trim() !== "-" ? (
                          <div className="text-sm font-bold text-main">
                            {p.name}
                          </div>
                        ) : null}
                        {p.percentage ? (
                          <div className="text-xs text-muted font-semibold">
                            {p.percentage}
                          </div>
                        ) : null}
                        <div className="text-sm text-main mt-2 whitespace-pre-wrap">
                          {p.condition ?? "—"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-3">
              <SectionTitle title="Items" />
              <div className="mt-3 bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-[11px] font-semibold text-muted uppercase tracking-wide">
                    Items Count: {items.length}
                  </div>
                  <div className="text-[11px] font-bold text-main uppercase tracking-wide">
                    Total: {currency} {Number(totalForDisplay).toFixed(2)}
                  </div>
                </div>

                <div className="space-y-3">
                  {items.length ? (
                    items.map((it, idx) => {
                      const qty = Number(it.quantity ?? 0);
                      const unitPrice = Number(it.price ?? 0);
                      const discountPct = Number(it.discount ?? 0);
                      const lineSubTotal = qty * unitPrice;
                      const lineDiscount = lineSubTotal * (discountPct / 100);
                      const lineTotal = lineSubTotal - lineDiscount;

                      const vatTaxableAmountNum =
                        it.vatTaxableAmount === undefined ||
                        it.vatTaxableAmount === null
                          ? undefined
                          : Number(it.vatTaxableAmount);

                      return (
                        <div
                          key={idx}
                          className="border border-gray-200 rounded-xl p-4 bg-[#fbf7f2]"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Field
                              label="Item Code"
                              value={it.itemCode ?? "—"}
                            />
                            <Field label="Quantity" value={String(qty)} />
                            <Field
                              label="Unit Price"
                              value={`${currency} ${unitPrice.toFixed(2)}`}
                            />
                            <Field
                              label="Discount %"
                              value={String(discountPct)}
                            />
                            <Field
                              label="Line Total"
                              value={`${currency} ${lineTotal.toFixed(2)}`}
                            />
                            <Field label="VAT Code" value={it.vatCode ?? "—"} />
                            <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                              <Field
                                label="VAT Taxable Amount"
                                value={
                                  vatTaxableAmountNum !== undefined &&
                                  !Number.isNaN(vatTaxableAmountNum)
                                    ? `${currency} ${vatTaxableAmountNum.toFixed(2)}`
                                    : (it.vatTaxableAmount ?? "—")
                                }
                              />
                              <Field
                                label="Item Name"
                                value={it.itemName ?? it.description ?? "—"}
                              />
                              <Field
                                label="Description"
                                value={it.description ?? it.itemName ?? "—"}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-sm text-muted">No items</div>
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-3">
              <SectionTitle title="Addresses" />
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="text-[11px] font-semibold text-muted uppercase tracking-wide">
                    Billing Address
                  </div>
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field
                      label="Line 1"
                      value={data.billingAddress?.line1 ?? "—"}
                    />
                    <Field
                      label="Line 2"
                      value={data.billingAddress?.line2 ?? "—"}
                    />
                    <Field
                      label="Postal Code"
                      value={data.billingAddress?.postalCode ?? "—"}
                    />
                    <Field
                      label="City"
                      value={data.billingAddress?.city ?? "—"}
                    />
                    <Field
                      label="State"
                      value={data.billingAddress?.state ?? "—"}
                    />
                    <Field
                      label="Country"
                      value={data.billingAddress?.country ?? "—"}
                    />
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="text-[11px] font-semibold text-muted uppercase tracking-wide">
                    Shipping Address
                  </div>
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field
                      label="Line 1"
                      value={data.shippingAddress?.line1 ?? "—"}
                    />
                    <Field
                      label="Line 2"
                      value={data.shippingAddress?.line2 ?? "—"}
                    />
                    <Field
                      label="Postal Code"
                      value={data.shippingAddress?.postalCode ?? "—"}
                    />
                    <Field
                      label="City"
                      value={data.shippingAddress?.city ?? "—"}
                    />
                    <Field
                      label="State"
                      value={data.shippingAddress?.state ?? "—"}
                    />
                    <Field
                      label="Country"
                      value={data.shippingAddress?.country ?? "—"}
                    />
                  </div>
                </div>
              </div>
            </div>

            {data.terms?.selling && (
              <div className="lg:col-span-3">
                <SectionTitle title="Terms & Conditions" />
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field
                    label="General"
                    value={data.terms.selling.general ?? "—"}
                  />
                  <Field
                    label="Delivery"
                    value={data.terms.selling.delivery ?? "—"}
                  />
                  <Field
                    label="Cancellation"
                    value={data.terms.selling.cancellation ?? "—"}
                  />
                  <Field
                    label="Warranty"
                    value={data.terms.selling.warranty ?? "—"}
                  />
                  <Field
                    label="Liability"
                    value={data.terms.selling.liability ?? "—"}
                  />
                  <Field
                    label="Payment"
                    value={
                      <div className="text-sm text-main whitespace-pre-wrap">
                        {data.terms.selling.payment?.dueDates
                          ? `Due Dates: ${data.terms.selling.payment.dueDates}\n`
                          : ""}
                        {data.terms.selling.payment?.lateCharges
                          ? `Late Charges: ${data.terms.selling.payment.lateCharges}\n`
                          : ""}
                        {data.terms.selling.payment?.taxes
                          ? `Taxes: ${data.terms.selling.payment.taxes}\n`
                          : ""}
                        {data.terms.selling.payment?.notes
                          ? `Notes: ${data.terms.selling.payment.notes}`
                          : ""}
                      </div>
                    }
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};

export default InvoiceDetailsModal;
