import React from "react";
import Tooltip from "../../components/Tooltip";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface QuotationDetail {
  id?: string;
  customerId?: string;
  customerName?: string;
  customerTpin?: string;
  currencyCode?: string;
  currency?: string;
  exchangeRt?: string | number;
  exchangeRate?: number;
  transactionDate?: string;
  postingDate?: string;
  validUntil?: string;
  validTill?: string;
  invoiceStatus?: string;
  status?: string;
  invoiceType?: string;
  industryBases?: string;
  destnCountryCd?: string;
  lpoNumber?: string | null;
  grandTotal?: number;
  roundingAdjustment?: number;
  roundedTotal?: number;
  netTotal?: number;
  total?: number;
  totalTax?: number;
  billingAddress?: any;
  shippingAddress?: any;
  paymentInformation?: {
    paymentTerms?: string;
    paymentMethod?: string;
    bankName?: string;
    accountNumber?: string;
    routingNumber?: string;
    swiftCode?: string;
  };
  items?: Array<{
    itemCode?: string;
    itemName?: string;
    description?: string;
    quantity?: string | number;
    rate?: string | number;
    price?: string | number;
    discountAmount?: string | number;
    discount?: string | number;
    tax?: string | number;
    amount?: string | number;
    itemTotal?: string | number;
    packingUnit?: string | number;
    packingSize?: string | number;
    batchNo?: string;
    expDate?: string;
    vatCode?: string | null;
  }>;
  terms?: {
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
        phases?: Array<{ name: string; percentage: string; condition: string }>;
      };
    };
  };
}

interface Props {
  open: boolean;
  data: QuotationDetail | null;
  loading?: boolean;
  onClose: () => void;
  pdfUrl?: string | null;
  pdfLoading?: boolean;
  onViewPdf?: () => void;
  onDownload?: () => void;
  onClosePdf?: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n?: number, currency = "USD") => {
  if (n == null) return "—";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(n);
  } catch {
    return `${currency} ${n.toFixed(2)}`;
  }
};

const fmtDate = (d?: string) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const STATUS_MAP: Record<string, string> = {
  Draft: "bg-draft",
  Sent: "bg-info",
  Approved: "bg-success",
  Paid: "bg-success",
  Overdue: "bg-danger",
};

// Compact label+value field
const F: React.FC<{ label: string; value?: string | null; mono?: boolean }> = ({
  label,
  value,
  mono,
}) => (
  <div>
    <p
      style={{
        fontSize: 9,
        color: "var(--muted)",
        textTransform: "uppercase",
        letterSpacing: "0.07em",
        fontWeight: 700,
        marginBottom: 1,
      }}
    >
      {label}
    </p>
    <p
      style={{
        fontSize: 13,
        color: value ? "var(--text)" : "var(--muted)",
        fontWeight: 500,
        fontFamily: mono ? "monospace" : undefined,
        lineHeight: 1.3,
      }}
    >
      {value || "—"}
    </p>
  </div>
);

/** Strip HTML tags from address display strings returned by the API */
const stripHtml = (html?: string | null): string[] => {
  if (!html) return [];
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
};

// Address card from display HTML string
const AddressCard: React.FC<{
  label: string;
  html?: string | null;
  name?: string;
}> = ({ label, html, name }) => {
  const lines = stripHtml(html);
  if (!lines.length && !name) return null;
  return (
    <div
      style={{
        padding: "7px 9px",
        borderRadius: 6,
        background: "var(--bg)",
        border: "1px solid var(--border)",
      }}
    >
      <p
        style={{
          fontSize: 9,
          color: "var(--muted)",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.07em",
          marginBottom: 3,
        }}
      >
        {label}
      </p>
      {name && (
        <p
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "var(--text)",
            marginBottom: 2,
          }}
        >
          {name}
        </p>
      )}
      {lines.map((l, i) => (
        <p
          key={i}
          style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.5 }}
        >
          {l}
        </p>
      ))}
    </div>
  );
};

// Section divider
const S: React.FC<{ title: string }> = ({ title }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 8,
      margin: "12px 0 7px",
    }}
  >
    <span
      style={{
        fontSize: 9,
        fontWeight: 800,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: "var(--muted)",
        whiteSpace: "nowrap",
      }}
    >
      {title}
    </span>
    <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const QuotationDetailModal: React.FC<Props> = ({
  open,
  data,
  loading,
  onClose,
  pdfUrl,
  pdfLoading,
  onViewPdf,
  onDownload,
  onClosePdf,
}) => {
  if (!open) return null;

  const hasAddresses = data?.billingAddress || data?.shippingAddress;
  const items = data?.items ?? [];

  // Safe math handling strings & missing fields
  const subtotal = items.reduce(
    (s, it) => s + Number(it.rate ?? it.price ?? 0) * Number(it.quantity ?? 0),
    0,
  );
  const totalDisc = items.reduce(
    (s, it) => s + Number(it.discountAmount ?? it.discount ?? 0),
    0,
  );
  const grandTotal = data?.grandTotal ?? data?.netTotal ?? subtotal - totalDisc;
  const taxTotal = data?.totalTax;
  const currency = data?.currency ?? data?.currencyCode ?? "USD";

  const currentStatus = data?.status ?? data?.invoiceStatus ?? "Draft";
  const statusCls = STATUS_MAP[currentStatus] ?? "bg-draft";
  const quotationDisplayId = data?.id ?? "—";

  const phases =
    data?.terms?.selling?.payment?.phases
      ?.filter((p) => p?.percentage)
      ?.slice(0, 3) ?? [];
  const exchangeRateDisplay =
    (data?.exchangeRate ?? data?.exchangeRt != null)
      ? String(data?.exchangeRate ?? data?.exchangeRt)
      : null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 999,
          background: "rgba(0,0,0,0.4)",
          backdropFilter: "blur(2px)",
          animation: "qdm-fade .15s ease",
        }}
      />

      {/* Drawer */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          zIndex: 1000,
          width: "min(620px, 100vw)",
          background: "var(--card)",
          color: "var(--text)",
          display: "flex",
          flexDirection: "column",
          boxShadow: "-6px 0 32px rgba(0,0,0,0.15)",
          animation: "qdm-slide .2s cubic-bezier(.4,0,.2,1)",
          overflow: "hidden",
        }}
      >
        <style>{`
          @keyframes qdm-fade  { from{opacity:0}to{opacity:1} }
          @keyframes qdm-slide { from{transform:translateX(48px);opacity:0}to{transform:translateX(0);opacity:1} }
          @keyframes qdm-up    { from{transform:translateY(16px);opacity:0}to{transform:translateY(0);opacity:1} }
          @keyframes qdm-spin  { to{transform:rotate(360deg)} }
          .qdm-btn {
            display:inline-flex; align-items:center; gap:5px;
            padding:5px 11px; border-radius:6px; font-size:12px; font-weight:600;
            cursor:pointer; border:none; transition:opacity .12s,transform .1s; white-space:nowrap;
          }
          .qdm-btn:hover  { opacity:.85; transform:translateY(-1px) }
          .qdm-btn:active { transform:translateY(0) }
          .qdm-irow { transition:background .1s }
          .qdm-irow:hover { background:var(--row-hover) }
          .qdm-trow:hover { background:var(--row-hover) }
        `}</style>

        {/* ── HEADER ── */}
        <div
          style={{
            padding: "10px 14px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "var(--card)",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 7,
                background: "var(--primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <div style={{ lineHeight: 1 }}>
              <p
                style={{
                  fontSize: 9,
                  color: "var(--muted)",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                  marginBottom: 2,
                }}
              >
                Quotation
              </p>
              <p
                style={{ fontSize: 15, fontWeight: 800, color: "var(--text)" }}
              >
                {quotationDisplayId}
              </p>
            </div>
            <span
              className={`qdm-btn ${statusCls}`}
              style={{
                cursor: "default",
                padding: "2px 9px",
                fontSize: 10,
                borderRadius: 20,
              }}
            >
              {currentStatus}
            </span>
          </div>

          <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
            {onViewPdf && (
              <button
                className="qdm-btn"
                onClick={onViewPdf}
                style={{ background: "var(--primary)", color: "#fff" }}
              >
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                PDF
              </button>
            )}
            {/* {onDownload && (
              <button className="qdm-btn" onClick={onDownload} style={{ background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border)" }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Download
              </button>
            )} */}
            <button
              onClick={onClose}
              style={{
                width: 26,
                height: 26,
                borderRadius: 6,
                border: "1px solid var(--border)",
                background: "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--muted)",
              }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── BODY ── */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "10px 14px",
            position: "relative",
          }}
        >
          {loading && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: 180,
                gap: 10,
                color: "var(--muted)",
              }}
            >
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--primary)"
                strokeWidth="2"
                style={{ animation: "qdm-spin 1s linear infinite" }}
              >
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              <span style={{ fontSize: 13 }}>Loading...</span>
            </div>
          )}

          {!loading && data && (
            <>
              {/* ── SUMMARY CARDS ── */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 6,
                  marginBottom: 2,
                }}
              >
                <div
                  style={{
                    padding: "9px 11px",
                    borderRadius: 7,
                    background: "var(--primary)",
                  }}
                >
                  <p
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.7)",
                      marginBottom: 2,
                    }}
                  >
                    Grand Total
                  </p>
                  <p
                    style={{
                      fontSize: 16,
                      fontWeight: 800,
                      color: "#fff",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {fmt(grandTotal, currency)}
                  </p>
                </div>
                <div
                  style={{
                    padding: "9px 11px",
                    borderRadius: 7,
                    background: "var(--bg)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <p
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "var(--muted)",
                      marginBottom: 2,
                    }}
                  >
                    Issue Date
                  </p>
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: "var(--text)",
                    }}
                  >
                    {fmtDate(data.transactionDate ?? data.postingDate)}
                  </p>
                </div>
                <div
                  style={{
                    padding: "9px 11px",
                    borderRadius: 7,
                    background: "var(--bg)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <p
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "var(--muted)",
                      marginBottom: 2,
                    }}
                  >
                    Valid Until
                  </p>
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: "var(--text)",
                    }}
                  >
                    {fmtDate(data.validUntil ?? data.validTill)}
                  </p>
                </div>
              </div>

              {/* ── CUSTOMER ── */}
              <S title="Customer & Transaction Info" />
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: 10,
                  marginBottom: 7,
                }}
              >
                <F
                  label="Customer"
                  value={data.customerName || data.customerId}
                />
                <F label="TPIN" value={data.customerTpin} mono />
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3,1fr)",
                  gap: 8,
                }}
              >
                <F label="Currency" value={currency} />
                <F label="Exchange Rate" value={exchangeRateDisplay} />
                <F
                  label="Destination"
                  value={data.destnCountryCd?.toUpperCase()}
                />
              </div>
              {(data.lpoNumber || data.invoiceType || data.industryBases) && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3,1fr)",
                    gap: 8,
                    marginTop: 7,
                  }}
                >
                  <F label="Invoice Type" value={data.invoiceType} />
                  <F label="Industry" value={data.industryBases} />
                  {data.lpoNumber && (
                    <F label="LPO Number" value={data.lpoNumber} />
                  )}
                </div>
              )}

              {/* ── ADDRESSES ── */}
              {hasAddresses && (
                <>
                  <S title="Addresses" />
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(2,1fr)",
                      gap: 6,
                    }}
                  >
                    <AddressCard
                      label="Billing Address"
                      html={data.billingAddress}
                    />
                    <AddressCard
                      label="Shipping Address"
                      html={data.shippingAddress}
                    />
                  </div>
                </>
              )}

              {/* ── LINE ITEMS ── */}
              <S title="Line Items" />
              <div
                style={{
                  borderRadius: 7,
                  overflow: "hidden",
                  border: "1px solid var(--border)",
                }}
              >
                {/* Head */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(0,2fr) 60px 90px 90px 96px",
                    padding: "6px 10px",
                    background: "var(--table-head)",
                    color: "var(--table-head-text)",
                    fontSize: 9,
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    gap: 4,
                  }}
                >
                  <span>Item</span>
                  <span style={{ textAlign: "right" }}>Qty</span>
                  <span style={{ textAlign: "right" }}>Price</span>
                  <span style={{ textAlign: "right" }}>Disc.</span>
                  <span style={{ textAlign: "right" }}>Total</span>
                </div>

                {/* Rows */}
                {items.map((it, i) => {
                  const qty = Math.abs(Number(it.quantity ?? 0));
                  const rate = Number(it.rate ?? it.price ?? 0);
                  const baseTotal = qty * rate;

                  // If API provides discount amount use it, else calculate from percentage if that's how it's sent
                  let discountAmount = Number(
                    it.discountAmount ?? it.discount ?? 0,
                  );
                  let discountPercent = 0;

                  // If it's stored as percentage in the API (like InvoiceModal does):
                  if (
                    discountAmount > 0 &&
                    discountAmount <= 100 &&
                    it.discountAmount == null &&
                    it.discount != null
                  ) {
                    discountPercent = discountAmount;
                    discountAmount = (baseTotal * discountPercent) / 100;
                  } else if (baseTotal > 0 && discountAmount > 0) {
                    discountPercent = (discountAmount / baseTotal) * 100;
                  }

                  const rowTotal =
                    it.amount != null
                      ? Number(it.amount)
                      : it.itemTotal != null
                        ? Number(it.itemTotal)
                        : baseTotal - discountAmount;

                  const displayName =
                    it.itemName || it.description || it.itemCode || "—";
                  const showCodeSubtitle =
                    it.itemCode && it.itemCode !== displayName;

                  return (
                    <div
                      key={i}
                      className="qdm-irow"
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "minmax(0,2fr) 60px 90px 90px 96px",
                        padding: "7px 10px",
                        gap: 4,
                        borderTop: "1px solid var(--border)",
                        alignItems: "start",
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <Tooltip content={displayName}>
                          <p
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              color: "var(--text)",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {displayName}
                          </p>
                        </Tooltip>
                        {showCodeSubtitle && (
                          <p
                            style={{
                              fontSize: 9,
                              color: "var(--muted)",
                              fontFamily: "monospace",
                            }}
                          >
                            {it.itemCode}
                          </p>
                        )}

                        {/* Item Badges */}
                        <div
                          style={{
                            display: "flex",
                            gap: 4,
                            flexWrap: "wrap",
                            marginTop: 3,
                          }}
                        >
                          {it.vatCode && (
                            <span
                              style={{
                                fontSize: 9,
                                background: "var(--bg)",
                                border: "1px solid var(--border)",
                                borderRadius: 4,
                                padding: "1px 5px",
                                color: "var(--muted)",
                                fontFamily: "monospace",
                              }}
                            >
                              Tax: {it.vatCode}
                            </span>
                          )}
                          {it.batchNo && (
                            <span
                              style={{
                                fontSize: 9,
                                background: "var(--bg)",
                                border: "1px solid var(--border)",
                                borderRadius: 4,
                                padding: "1px 5px",
                                color: "var(--muted)",
                                fontFamily: "monospace",
                              }}
                            >
                              Batch: {it.batchNo}
                            </span>
                          )}
                          {(it.packingSize != null ||
                            it.packingUnit != null) && (
                            <span
                              style={{
                                fontSize: 9,
                                background: "var(--bg)",
                                border: "1px solid var(--border)",
                                borderRadius: 4,
                                padding: "1px 5px",
                                color: "var(--muted)",
                              }}
                            >
                              Pack {it.packingSize}/{it.packingUnit}
                            </span>
                          )}
                          {it.expDate && (
                            <span
                              style={{
                                fontSize: 9,
                                background: "var(--bg)",
                                border: "1px solid var(--border)",
                                borderRadius: 4,
                                padding: "1px 5px",
                                color: "var(--muted)",
                              }}
                            >
                              Exp: {fmtDate(it.expDate)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Qty */}
                      <Tooltip content={`Quantity: ${qty.toLocaleString()}`}>
                        <p
                          style={{
                            fontSize: 12,
                            textAlign: "right",
                            color: "var(--text)",
                            fontVariantNumeric: "tabular-nums",
                            paddingTop: 1,
                          }}
                        >
                          {qty.toLocaleString()}
                        </p>
                      </Tooltip>

                      {/* Price */}
                      <Tooltip content={`Unit price: ${fmt(rate, currency)}`}>
                        <p
                          style={{
                            fontSize: 12,
                            textAlign: "right",
                            color: "var(--text)",
                            fontVariantNumeric: "tabular-nums",
                            paddingTop: 1,
                          }}
                        >
                          {fmt(rate, currency)}
                        </p>
                      </Tooltip>

                      {/* Disc */}
                      <Tooltip
                        content={
                          discountAmount > 0
                            ? `Discount: ${fmt(discountAmount, currency)}`
                            : "No discount"
                        }
                      >
                        <div style={{ textAlign: "right" }}>
                          {discountAmount > 0 ? (
                            <>
                              <p
                                style={{
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color: "var(--danger)",
                                  fontVariantNumeric: "tabular-nums",
                                  lineHeight: 1.3,
                                }}
                              >
                                {discountPercent > 0
                                  ? `${discountPercent.toFixed(1)}%`
                                  : "DISC."}
                              </p>
                              <p
                                style={{
                                  fontSize: 10,
                                  color: "var(--muted)",
                                  fontVariantNumeric: "tabular-nums",
                                  lineHeight: 1.3,
                                }}
                              >
                                -
                                {discountAmount.toLocaleString("en-US", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </p>
                            </>
                          ) : (
                            <p style={{ fontSize: 12, color: "var(--muted)" }}>
                              —
                            </p>
                          )}
                        </div>
                      </Tooltip>

                      {/* Row total */}
                      <Tooltip
                        content={`Row total: ${fmt(rowTotal, currency)}`}
                      >
                        <p
                          style={{
                            fontSize: 12,
                            textAlign: "right",
                            fontWeight: 700,
                            color: "var(--text)",
                            fontVariantNumeric: "tabular-nums",
                            paddingTop: 1,
                          }}
                        >
                          {fmt(rowTotal, currency)}
                        </p>
                      </Tooltip>
                    </div>
                  );
                })}

                {/* Totals footer */}
                <div
                  style={{
                    background: "var(--bg)",
                    borderTop: "2px solid var(--border)",
                    padding: "7px 10px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 3,
                  }}
                >
                  {[
                    {
                      label: "Sub Total",
                      val: fmt(subtotal, currency),
                      big: false,
                      red: false,
                    },
                    ...(totalDisc > 0
                      ? [
                          {
                            label: "Total Discount",
                            val: `- ${fmt(totalDisc, currency)}`,
                            big: false,
                            red: true,
                          },
                        ]
                      : []),
                    ...(taxTotal
                      ? [
                          {
                            label: "Tax Total",
                            val: fmt(taxTotal, currency),
                            big: false,
                            red: false,
                          },
                        ]
                      : []),
                    {
                      label: "Grand Total",
                      val: fmt(grandTotal, currency),
                      big: true,
                      red: false,
                    },
                    ...(data.roundingAdjustment
                      ? [
                          {
                            label: "Rounding Adjustment",
                            val: fmt(data.roundingAdjustment, currency),
                            big: false,
                            red: false,
                          },
                          {
                            label: "Rounded Total",
                            val: fmt(data.roundedTotal ?? grandTotal, currency),
                            big: true,
                            red: false,
                          },
                        ]
                      : []),
                  ].map(({ label, val, big, red }) => (
                    <div
                      key={label}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 9,
                          color: "var(--muted)",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.07em",
                        }}
                      >
                        {label}
                      </span>
                      <span
                        style={{
                          fontSize: big ? 14 : 12,
                          fontWeight: big ? 800 : 500,
                          color: red ? "var(--danger)" : "var(--text)",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {val}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── PAYMENT INFO ── */}
              {data.paymentInformation && (
                <>
                  <S title="Payment Information" />
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3,1fr)",
                      gap: 8,
                    }}
                  >
                    <F
                      label="Payment Terms"
                      value={
                        data.paymentInformation.paymentTerms ??
                        data.terms?.selling?.payment?.notes ??
                        null
                      }
                    />
                    <F
                      label="Method"
                      value={data.paymentInformation.paymentMethod}
                    />
                    <F label="Bank" value={data.paymentInformation.bankName} />
                    {data.paymentInformation.accountNumber && (
                      <F
                        label="Account No."
                        value={data.paymentInformation.accountNumber}
                        mono
                      />
                    )}
                    {data.paymentInformation.routingNumber && (
                      <F
                        label="Routing No."
                        value={data.paymentInformation.routingNumber}
                        mono
                      />
                    )}
                    {data.paymentInformation.swiftCode && (
                      <F
                        label="SWIFT"
                        value={data.paymentInformation.swiftCode}
                        mono
                      />
                    )}
                  </div>
                </>
              )}

              {/* ── PAYMENT SCHEDULE ── */}
              {phases.length > 0 && (
                <>
                  <S title="Payment Schedule" />
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3,1fr)",
                      gap: 6,
                    }}
                  >
                    {phases.map((phase, i) => (
                      <div
                        key={i}
                        style={{
                          padding: "7px 9px",
                          borderRadius: 6,
                          background: "var(--bg)",
                          border: "1px solid var(--border)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "baseline",
                            gap: 5,
                            marginBottom: 3,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 14,
                              fontWeight: 800,
                              color: "var(--primary)",
                            }}
                          >
                            {phase.percentage}%
                          </span>
                          {phase.name && (
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                color: "var(--text)",
                              }}
                            >
                              {phase.name}
                            </span>
                          )}
                        </div>
                        <p
                          style={{
                            fontSize: 10,
                            color: "var(--muted)",
                            lineHeight: 1.4,
                          }}
                        >
                          {phase.condition}
                        </p>
                      </div>
                    ))}
                  </div>
                  {data.terms?.selling?.payment?.notes && (
                    <p
                      style={{
                        fontSize: 10,
                        color: "var(--muted)",
                        fontStyle: "italic",
                        marginTop: 5,
                      }}
                    >
                      ※ {data.terms.selling.payment.notes}
                    </p>
                  )}
                </>
              )}

              {/* ── TERMS ── */}
              {(() => {
                const s = data.terms?.selling;
                if (!s) return null;
                const rows = [
                  { label: "Delivery", value: s.delivery },
                  { label: "Cancellation", value: s.cancellation },
                  { label: "Warranty", value: s.warranty },
                  { label: "Liability", value: s.liability },
                  { label: "Late Charges", value: s.payment?.lateCharges },
                  { label: "Due Dates", value: s.payment?.dueDates },
                  { label: "General", value: s.general },
                ].filter((r) => r.value);
                if (!rows.length) return null;
                return (
                  <>
                    <S title="Terms & Conditions" />
                    <div
                      style={{
                        borderRadius: 7,
                        overflow: "hidden",
                        border: "1px solid var(--border)",
                      }}
                    >
                      {rows.map(({ label, value }, i) => (
                        <div
                          key={label}
                          className="qdm-trow"
                          style={{
                            display: "flex",
                            borderTop:
                              i > 0 ? "1px solid var(--border)" : "none",
                          }}
                        >
                          <span
                            style={{
                              fontSize: 10,
                              color: "var(--muted)",
                              fontWeight: 700,
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                              padding: "6px 9px",
                              minWidth: 90,
                              background: "var(--bg)",
                              borderRight: "1px solid var(--border)",
                              flexShrink: 0,
                              lineHeight: 1.4,
                            }}
                          >
                            {label}
                          </span>
                          <span
                            style={{
                              fontSize: 12,
                              color: "var(--text)",
                              padding: "6px 9px",
                              lineHeight: 1.5,
                            }}
                          >
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                );
              })()}

              <div style={{ height: 12 }} />
            </>
          )}
        </div>

        {/* ── PDF OVERLAY ── */}
        {(pdfUrl || pdfLoading) && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 20,
              background: "var(--card)",
              display: "flex",
              flexDirection: "column",
              animation: "qdm-up .18s cubic-bezier(.4,0,.2,1)",
            }}
          >
            <div
              style={{
                padding: "9px 12px",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexShrink: 0,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  onClick={onClosePdf}
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 6,
                    border: "1px solid var(--border)",
                    background: "transparent",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--muted)",
                  }}
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <div style={{ lineHeight: 1 }}>
                  <p
                    style={{
                      fontSize: 9,
                      color: "var(--muted)",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.07em",
                      marginBottom: 2,
                    }}
                  >
                    PDF Preview
                  </p>
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: "var(--text)",
                    }}
                  >
                    {quotationDisplayId}
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", gap: 5 }}>
                {onDownload && pdfUrl && (
                  <button
                    className="qdm-btn"
                    onClick={onDownload}
                    style={{ background: "var(--primary)", color: "#fff" }}
                  >
                    <svg
                      width="11"
                      height="11"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Download
                  </button>
                )}
                {pdfUrl && (
                  <a
                    href={pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="qdm-btn"
                    style={{
                      background: "var(--bg)",
                      color: "var(--text)",
                      border: "1px solid var(--border)",
                      textDecoration: "none",
                    }}
                  >
                    <svg
                      width="11"
                      height="11"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                    New Tab
                  </a>
                )}
              </div>
            </div>
            <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
              {pdfLoading && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <svg
                    width="26"
                    height="26"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--primary)"
                    strokeWidth="2"
                    style={{ animation: "qdm-spin 1s linear infinite" }}
                  >
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  <p
                    style={{
                      fontSize: 12,
                      color: "var(--muted)",
                      fontWeight: 600,
                    }}
                  >
                    Generating preview...
                  </p>
                </div>
              )}
              {pdfUrl && (
                <iframe
                  src={pdfUrl}
                  style={{ width: "100%", height: "100%", border: "none" }}
                  title="Quotation PDF"
                />
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default QuotationDetailModal;
