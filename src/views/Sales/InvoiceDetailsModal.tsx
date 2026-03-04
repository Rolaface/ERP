import React, { useEffect, useMemo, useState } from "react";
import {
  FileText,
  Send,
  Eye,
  ChevronDown,
  ChevronUp,
  Hash,
  User,
  CreditCard,
  Package,
  MapPin,
  ScrollText,
  Banknote,
} from "lucide-react";

import Modal from "../../components/ui/modal/modal";
import { getSalesInvoiceById } from "../../api/salesApi";

/* ─────────────────────────── Types ─────────────────────────── */

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
  invoiceStatus?: string;
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
onViewPdf?: (invoiceNumber: string) => void;
  onSend?: (invoiceNumber: string) => void;
  fetchDetails?: (id: string) => Promise<any>;
  mapDetails?: (raw: any) => InvoiceDetails;
};

/* ─────────────────────────── Helpers ─────────────────────────── */

const statusConfig = (status?: string) => {
  const s = (status ?? "").toLowerCase();
  if (s.includes("approve") || s.includes("paid") || s.includes("success"))
    return { cls: "bg-success", dot: "var(--success)" };
  if (s.includes("reject") || s.includes("cancel") || s.includes("fail"))
    return { cls: "bg-danger", dot: "var(--danger)" };
  if (s.includes("draft") || s.includes("pending"))
    return { cls: "bg-warning", dot: "#f59e0b" };
  return { cls: "bg-info", dot: "#3b82f6" };
};

const fmt = (v?: number | string | null, prefix?: string) => {
  if (v === undefined || v === null || v === "") return "—";
  const num = Number(v);
  if (isNaN(num)) return String(v);
  return prefix ? `${prefix} ${num.toFixed(2)}` : num.toFixed(2);
};

/* ─────────────────────────── Sub-components ─────────────────────────── */

/** Read-only field using theme tokens */
const Field = ({ label, value }: { label: string; value: React.ReactNode }) => {
  const isPrimitive = typeof value === "string" || typeof value === "number";
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted">
        {label}
      </span>
      <div
        className="px-3 py-2 rounded-lg text-sm text-main font-medium truncate border-theme"
        style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
      >
        {isPrimitive ? (String(value) || "—") : value}
      </div>
    </div>
  );
};

/** Collapsible section using theme bg-card / bg-app */
const Section = ({
  icon: Icon,
  title,
  children,
  defaultOpen = true,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className="rounded-2xl overflow-hidden border-theme"
      style={{ border: "1px solid var(--border)" }}
    >
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-5 py-3 bg-app transition-all row-hover"
      >
        <div className="flex items-center gap-2.5">
          <Icon size={14} className="text-muted" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-muted">
            {title}
          </span>
        </div>
        {open
          ? <ChevronUp size={13} className="text-muted" />
          : <ChevronDown size={13} className="text-muted" />}
      </button>

      {open && (
        <div className="bg-card px-5 py-4">
          {children}
        </div>
      )}
    </div>
  );
};

/** Shimmer skeleton block */
const SkeletonRow = () => (
  <div
    className="h-10 rounded-lg animate-shimmer"
    style={{
      background:
        "linear-gradient(90deg, var(--bg) 25%, var(--border) 50%, var(--bg) 75%)",
      backgroundSize: "200% 100%",
    }}
  />
);

/* ─────────────────────────── Main Component ─────────────────────────── */

const InvoiceDetailsModal: React.FC<Props> = ({
  open,
  invoiceId,
  onClose,
  onViewPdf,
  onSend,
  fetchDetails,
  mapDetails,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<InvoiceDetails | null>(null);

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
        setData(mapDetails ? mapDetails(resp.data) : (resp.data as InvoiceDetails));
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message ?? "Failed to load invoice details");
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };
    run();
    return () => { mounted = false; };
  }, [open, invoiceId, fetchDetails, mapDetails]);

  const items = data?.items ?? [];
  const currency = data?.currencyCode ?? "";

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
    return { subTotal, discount, total: Math.max(0, subTotal - discount) };
  }, [items]);

  const sc = statusConfig(data?.invoiceStatus);

  /* ── Composite title: invoice # + status badge + actions ── */
 const modalTitle = (
  <div className="flex items-center gap-3">
    <span className="font-bold text-main whitespace-nowrap">
      {data?.invoiceNumber
        ? `Invoice ${data.invoiceNumber}`
        : "Invoice Details"}
    </span>

    {data?.invoiceStatus && (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${sc.cls}`}
      >
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: sc.dot }}
        />
        {data.invoiceStatus}
      </span>
    )}
  </div>
);
  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={modalTitle}
      icon={FileText}
      maxWidth="6xl"
      height="82vh"
      footer={
  <div className="flex justify-between items-center w-full">
    {/* Left Side Empty or Future Actions */}
    <div />

    {/* Right Side Actions */}
    <div className="flex items-center gap-2">
      {data && !loading && (
        <>
          <button
            type="button"
            onClick={() =>
              data.invoiceNumber && onSend?.(data.invoiceNumber)
            }
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-main transition-all row-hover"
            style={{
              background: "var(--bg)",
              border: "1px solid var(--border)",
            }}
          >
            <Send size={13} />
            Send
          </button>

          <button
            type="button"
            onClick={() =>
  data.invoiceNumber &&
  onViewPdf?.(data.invoiceNumber)
}
            className="bg-primary inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
          >
            <Eye size={13} />
            View PDF
          </button>
        </>
      )}

      <button
        type="button"
        onClick={onClose}
        className="px-4 py-2 rounded-lg text-sm font-semibold text-main transition-all row-hover"
        style={{
          background: "var(--bg)",
          border: "1px solid var(--border)",
        }}
      >
        Close
      </button>
    </div>
  </div>
}
    >
      <div className="flex flex-col gap-4 pb-2">

        {/* Error */}
        {error && (
          <div className="bg-danger flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold">
            <span>⚠</span>
            {error}
          </div>
        )}

        {/* Skeleton */}
        {loading && (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-2xl overflow-hidden"
                style={{ border: "1px solid var(--border)" }}
              >
                <div className="h-10 bg-app animate-pulse" />
                <div className="bg-card p-5 grid grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((j) => <SkeletonRow key={j} />)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Content */}
        {!loading && data && (
          <>
            {/* KPI bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Invoice Date", value: data.dateOfInvoice ?? "—" },
                { label: "Due Date", value: data.dueDate ?? "—" },
                { label: "Currency", value: currency || "—" },
                {
                  label: "Total Amount",
                  value:
                    data.TotalAmount != null
                      ? `${currency} ${Number(data.TotalAmount).toFixed(2)}`
                      : `${currency} ${computedTotals.total.toFixed(2)}`,
                },
              ].map((kpi) => (
                <div
                  key={kpi.label}
                  className="bg-card rounded-xl px-4 py-3 flex flex-col gap-0.5"
                  style={{ border: "1px solid var(--border)" }}
                >
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-muted">
                    {kpi.label}
                  </span>
                  <span className="text-sm font-bold text-main truncate">
                    {kpi.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Basic Information */}
            <Section icon={Hash} title="Basic Information">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Invoice Number" value={data.invoiceNumber ?? "—"} />
                <Field label="Invoice Type" value={data.invoiceType ?? "—"} />
                <Field label="Origin Invoice" value={data.originInvoice ?? "—"} />
              </div>
            </Section>

            {/* Customer */}
            <Section icon={User} title="Customer">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Customer Name" value={data.customerName ?? "—"} />
                <Field label="Customer TPIN" value={data.customerTpin ?? "—"} />
                <Field label="LPO Number" value={data.lpoNumber ?? "—"} />
              </div>
            </Section>

            {/* Currency & Discounts */}
            <Section icon={Banknote} title="Currency & Discounts">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Currency" value={currency || "—"} />
                <Field label="Exchange Rate" value={data.exchangeRt ?? "—"} />
                <Field label="Destination Country" value={data.destnCountryCd ?? "—"} />
                <Field label="Discount %" value={fmt(data.discountPercentage)} />
                <Field label="Discount Amount" value={fmt(data.discountAmount, currency)} />
                <Field
                  label="Total After Discount"
                  value={
                    <span className="font-bold text-primary">
                      {data.TotalAmount != null
                        ? `${currency} ${Number(data.TotalAmount).toFixed(2)}`
                        : "—"}
                    </span>
                  }
                />
              </div>
            </Section>

            {/* Payment Information */}
            <Section icon={CreditCard} title="Payment Information">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Payment Terms" value={data.paymentInformation?.paymentTerms ?? "—"} />
                <Field label="Payment Method" value={data.paymentInformation?.paymentMethod ?? "—"} />
                <Field label="Bank Name" value={data.paymentInformation?.bankName ?? "—"} />
                <Field label="Account Number" value={data.paymentInformation?.accountNumber ?? "—"} />
                <Field label="Routing Number" value={data.paymentInformation?.routingNumber ?? "—"} />
                <Field label="SWIFT Code" value={data.paymentInformation?.swiftCode ?? "—"} />
              </div>

              {!!data.terms?.selling?.payment?.phases?.length && (
                <div className="mt-4">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted mb-3">
                    Payment Phases
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {data.terms.selling.payment.phases.map((p, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl p-4"
                        style={{
                          background: "var(--bg)",
                          border: "1px solid var(--border)",
                        }}
                      >
                        {p.name && p.name.trim() !== "-" && (
                          <p className="text-sm font-bold text-main">{p.name}</p>
                        )}
                        {p.percentage && (
                          <p className="text-xs text-primary font-semibold mt-0.5">
                            {p.percentage}
                          </p>
                        )}
                        <p className="text-sm text-muted mt-2 whitespace-pre-wrap leading-relaxed">
                          {p.condition ?? "—"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Section>

            {/* Items */}
            <Section icon={Package} title={`Items (${items.length})`}>
              {/* Totals strip */}
              <div
                className="flex items-center justify-between mb-4 px-4 py-2.5 rounded-xl text-sm bg-card"
                style={{ border: "1px solid var(--border)" }}
              >
                <span className="text-muted font-medium">
                  Subtotal{" "}
                  <span className="text-main font-bold">
                    {currency} {computedTotals.subTotal.toFixed(2)}
                  </span>
                </span>
                <span className="text-muted font-medium">
                  Discount{" "}
                  <span className="text-danger font-bold">
                    − {currency} {computedTotals.discount.toFixed(2)}
                  </span>
                </span>
                <span className="text-muted font-medium">
                  Total{" "}
                  <span className="text-primary font-bold text-base">
                    {currency} {computedTotals.total.toFixed(2)}
                  </span>
                </span>
              </div>

              {items.length ? (
                <div className="flex flex-col gap-3">
                  {items.map((it, idx) => (
                    <div
                      key={idx}
                      className="bg-card rounded-xl p-4"
                      style={{ border: "1px solid var(--border)" }}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <span className="bg-primary w-6 h-6 flex items-center justify-center rounded-full text-[11px] font-bold">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-semibold text-muted">
                          {it.itemCode ?? `Item ${idx + 1}`}
                        </span>
                        {it.description && (
                          <span className="text-xs text-muted truncate max-w-xs opacity-60">
                            {it.description}
                          </span>
                        )}
                        <span className="ml-auto text-sm font-bold text-primary">
                          {currency}{" "}
                          {(
                            Number(it.price ?? 0) *
                            Number(it.quantity ?? 0) *
                            (1 - Number(it.discount ?? 0) / 100)
                          ).toFixed(2)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <Field label="Quantity" value={String(Number(it.quantity ?? 0))} />
                        <Field label="Unit Price" value={fmt(it.price, currency)} />
                        <Field label="Discount %" value={fmt(it.discount)} />
                        <Field label="VAT Code" value={it.vatCode ?? "—"} />
                        {it.vatTaxableAmount && (
                          <div className="md:col-span-2">
                            <Field label="VAT Taxable Amount" value={it.vatTaxableAmount} />
                          </div>
                        )}
                        {it.description && (
                          <div className="md:col-span-4">
                            <Field label="Description" value={it.description} />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-sm text-muted py-6">No items found</div>
              )}
            </Section>

            {/* Addresses */}
            <Section icon={MapPin} title="Addresses">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(["Billing", "Shipping"] as const).map((type) => {
                  const addr =
                    type === "Billing" ? data.billingAddress : data.shippingAddress;
                  return (
                    <div
                      key={type}
                      className="bg-card rounded-xl p-4"
                      style={{ border: "1px solid var(--border)" }}
                    >
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted mb-3">
                        {type} Address
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Field label="Line 1" value={addr?.line1 ?? "—"} />
                        <Field label="Line 2" value={addr?.line2 ?? "—"} />
                        <Field label="Postal Code" value={addr?.postalCode ?? "—"} />
                        <Field label="City" value={addr?.city ?? "—"} />
                        <Field label="State" value={addr?.state ?? "—"} />
                        <Field label="Country" value={addr?.country ?? "—"} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Section>

            {/* Terms & Conditions */}
            {data.terms?.selling && (
              <Section icon={ScrollText} title="Terms & Conditions" defaultOpen={false}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="General" value={data.terms.selling.general ?? "—"} />
                  <Field label="Delivery" value={data.terms.selling.delivery ?? "—"} />
                  <Field label="Cancellation" value={data.terms.selling.cancellation ?? "—"} />
                  <Field label="Warranty" value={data.terms.selling.warranty ?? "—"} />
                  <Field label="Liability" value={data.terms.selling.liability ?? "—"} />
                  <Field
                    label="Payment Notes"
                    value={
                      <div className="text-sm text-main whitespace-pre-wrap leading-relaxed space-y-1">
                        {data.terms.selling.payment?.dueDates && (
                          <p>
                            <span className="font-semibold text-muted">Due Dates: </span>
                            {data.terms.selling.payment.dueDates}
                          </p>
                        )}
                        {data.terms.selling.payment?.lateCharges && (
                          <p>
                            <span className="font-semibold text-muted">Late Charges: </span>
                            {data.terms.selling.payment.lateCharges}
                          </p>
                        )}
                        {data.terms.selling.payment?.taxes && (
                          <p>
                            <span className="font-semibold text-muted">Taxes: </span>
                            {data.terms.selling.payment.taxes}
                          </p>
                        )}
                        {data.terms.selling.payment?.notes && (
                          <p>
                            <span className="font-semibold text-muted">Notes: </span>
                            {data.terms.selling.payment.notes}
                          </p>
                        )}
                      </div>
                    }
                  />
                </div>
              </Section>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};

export default InvoiceDetailsModal;