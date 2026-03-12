import React from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface InvoiceDetail {
  invoiceNumber: string;
  invoiceType?: string;
  originInvoice?: string | null;
  customerName: string;
  customerTpin?: string;
  currencyCode: string;
  exchangeRt?: string;
  dateOfInvoice: string;
  dueDate: string;
  invoiceStatus: string;
  Receipt?: string | null;
  ReceiptNo?: string | null;
  lpoNumber?: string | null;
  destnCountryCd?: string;
  billingAddress?: { line1?: string; line2?: string; postalCode?: string; city?: string; state?: string; country?: string };
  shippingAddress?: { line1?: string; line2?: string; postalCode?: string; city?: string; state?: string; country?: string };
  paymentInformation?: { paymentTerms?: string; paymentMethod?: string; bankName?: string; accountNumber?: string; routingNumber?: string; swiftCode?: string };
  items?: Array<{
    itemCode?: string;
    description?: string;
    quantity?: number;
    price?: number;
    discount?: number;
    vatCode?: string | null;
    vatTaxableAmount?: string;
    batchNo?: string;
    boxStart?: string;
    boxEnd?: string;
    expDate?: string;
    mfgDate?: string;
    packingSize?: string;
    packingUnit?: string;
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
        taxes?: string | null;
        notes?: string;
        phases?: Array<{ name?: string | null; percentage: string; condition: string }>;
      };
    };
  };
}

interface Props {
  open: boolean;
  data: InvoiceDetail | null;
  loading?: boolean;
  onClose: () => void;
  pdfUrl?: string | null;
  pdfLoading?: boolean;
  onViewPdf?: () => void;
  onDownload?: () => void;
  onClosePdf?: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n?: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 2 }).format(n ?? 0);

const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const STATUS_MAP: Record<string, string> = {
  Draft: "bg-draft", Sent: "bg-info", Paid: "bg-success", Overdue: "bg-danger",
};

// Compact label+value field
const F: React.FC<{ label: string; value?: string | null; mono?: boolean }> = ({ label, value, mono }) => (
  <div>
    <p style={{ fontSize: 9, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 700, marginBottom: 1 }}>{label}</p>
    <p style={{ fontSize: 13, color: value ? "var(--text)" : "var(--muted)", fontWeight: 500, fontFamily: mono ? "monospace" : undefined, lineHeight: 1.3 }}>
      {value || "—"}
    </p>
  </div>
);

// Section divider with inline title
const S: React.FC<{ title: string }> = ({ title }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "12px 0 7px" }}>
    <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", whiteSpace: "nowrap" }}>{title}</span>
    <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const InvoiceDetailModal: React.FC<Props> = ({
  open, data, loading, onClose,
  pdfUrl, pdfLoading, onViewPdf, onDownload, onClosePdf,
}) => {
  if (!open) return null;

  const items      = data?.items ?? [];
  const subtotal   = items.reduce((s, it) => s + (it.price ?? 0) * (it.quantity ?? 0), 0);
  const totalDisc  = items.reduce((s, it) => s + (it.discount ?? 0), 0);
  const grandTotal = subtotal - totalDisc;
  const currency   = data?.currencyCode ?? "USD";
  const statusCls  = STATUS_MAP[data?.invoiceStatus ?? "Draft"] ?? "bg-draft";
  const phases =
    data?.terms?.selling?.payment?.phases
      ?.filter(p => p?.percentage)
      ?.slice(0, 3) ?? [];

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(2px)", animation: "idm-fade .15s ease" }} />

      {/* Drawer */}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 1000,
        width: "min(620px, 100vw)",
        background: "var(--card)", color: "var(--text)",
        display: "flex", flexDirection: "column",
        boxShadow: "-6px 0 32px rgba(0,0,0,0.15)",
        animation: "idm-slide .2s cubic-bezier(.4,0,.2,1)",
        overflow: "hidden",
      }}>
        <style>{`
          @keyframes idm-fade  { from{opacity:0}to{opacity:1} }
          @keyframes idm-slide { from{transform:translateX(48px);opacity:0}to{transform:translateX(0);opacity:1} }
          @keyframes idm-up    { from{transform:translateY(16px);opacity:0}to{transform:translateY(0);opacity:1} }
          @keyframes idm-spin  { to{transform:rotate(360deg)} }
          .idm-btn {
            display:inline-flex; align-items:center; gap:5px;
            padding:5px 11px; border-radius:6px; font-size:12px; font-weight:600;
            cursor:pointer; border:none; transition:opacity .12s,transform .1s; white-space:nowrap;
          }
          .idm-btn:hover  { opacity:.85; transform:translateY(-1px) }
          .idm-btn:active { transform:translateY(0) }
          .idm-irow { transition: background .1s }
          .idm-irow:hover { background: var(--row-hover) }
          .idm-trow:hover { background: var(--row-hover) }
        `}</style>

        {/* ── HEADER ── */}
        <div style={{
          padding: "10px 14px",
          borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "var(--card)", flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: 7, background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {/* Invoice icon */}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2"/>
                <path d="M8 21h8M12 17v4"/>
              </svg>
            </div>
            <div style={{ lineHeight: 1 }}>
              <p style={{ fontSize: 9, color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2 }}>Invoice</p>
              <p style={{ fontSize: 15, fontWeight: 800, color: "var(--text)" }}>{data?.invoiceNumber ?? "—"}</p>
            </div>
            <span className={`idm-btn ${statusCls}`} style={{ cursor: "default", padding: "2px 9px", fontSize: 10, borderRadius: 20 }}>
              {data?.invoiceStatus ?? "Draft"}
            </span>
          </div>

          <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
            {onViewPdf && (
              <button className="idm-btn" onClick={onViewPdf} style={{ background: "var(--primary)", color: "#fff" }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                PDF
              </button>
            )}
            {onDownload && (
              <button className="idm-btn" onClick={onDownload} style={{ background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border)" }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Download
              </button>
            )}
            <button onClick={onClose} style={{ width: 26, height: 26, borderRadius: 6, border: "1px solid var(--border)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        {/* ── BODY ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "10px 14px", position: "relative" }}>

          {loading && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 180, gap: 10, color: "var(--muted)" }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" style={{ animation: "idm-spin 1s linear infinite" }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              <span style={{ fontSize: 13 }}>Loading...</span>
            </div>
          )}

          {!loading && data && (<>

            {/* ── SUMMARY CARDS ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 2 }}>
              <div style={{ padding: "9px 11px", borderRadius: 7, background: "var(--primary)" }}>
                <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.7)", marginBottom: 2 }}>Grand Total</p>
                <p style={{ fontSize: 16, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>{fmt(grandTotal, currency)}</p>
              </div>
              <div style={{ padding: "9px 11px", borderRadius: 7, background: "var(--bg)", border: "1px solid var(--border)" }}>
                <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 2 }}>Invoice Date</p>
                <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{fmtDate(data.dateOfInvoice)}</p>
              </div>
              <div style={{ padding: "9px 11px", borderRadius: 7, background: "var(--bg)", border: "1px solid var(--border)" }}>
                <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 2 }}>Due Date</p>
                <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{fmtDate(data.dueDate)}</p>
              </div>
            </div>

            {/* ── CUSTOMER ── */}
            <S title="Customer & Transaction" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, marginBottom: 7 }}>
              <F label="Customer"   value={data.customerName} />
              <F label="TPIN"       value={data.customerTpin} mono />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
              <F label="Invoice Type"  value={data.invoiceType} />
              <F label="Currency"      value={data.currencyCode} />
              <F label="Exchange Rate" value={data.exchangeRt} />
              <F label="Destination"   value={data.destnCountryCd?.toUpperCase()} />
            </div>
            {(data.lpoNumber || data.originInvoice || data.ReceiptNo) && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginTop: 7 }}>
                {data.lpoNumber    && <F label="LPO Number"      value={data.lpoNumber} />}
                {data.originInvoice && <F label="Origin Invoice"  value={data.originInvoice} />}
                {data.ReceiptNo    && <F label="Receipt No."      value={data.ReceiptNo} mono />}
              </div>
            )}

            {/* ── ADDRESSES ── */}
            {(data.billingAddress || data.shippingAddress) && (<>
              <S title="Addresses" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {[{ label: "Billing", addr: data.billingAddress }, { label: "Shipping", addr: data.shippingAddress }].map(({ label, addr }) =>
                  addr ? (
                    <div key={label} style={{ padding: "7px 9px", borderRadius: 6, background: "var(--bg)", border: "1px solid var(--border)" }}>
                      <p style={{ fontSize: 9, color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3 }}>{label}</p>
                      {[addr.line1, addr.city, [addr.state, addr.postalCode].filter(Boolean).join(", "), addr.country?.toUpperCase()]
                        .filter(Boolean)
                        .map((l, i) => <p key={i} style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.5 }}>{l}</p>)}
                    </div>
                  ) : <div key={label} />
                )}
              </div>
            </>)}

            {/* ── LINE ITEMS ── */}
            <S title="Line Items" />
            <div style={{ borderRadius: 7, overflow: "hidden", border: "1px solid var(--border)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "minmax(0,2fr) 60px 88px 72px 96px", padding: "6px 10px", background: "var(--table-head)", color: "var(--table-head-text)", fontSize: 9, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", gap: 4 }}>
                <span>Item</span>
                <span style={{ textAlign: "right" }}>Qty</span>
                <span style={{ textAlign: "right" }}>Price</span>
                <span style={{ textAlign: "right" }}>Disc.</span>
                <span style={{ textAlign: "right" }}>Total</span>
              </div>
              {items.map((it, i) => {
                const rowTotal = (it.price ?? 0) * (it.quantity ?? 0) - (it.discount ?? 0);
                return (
                  <div key={i} className="idm-irow" style={{ display: "grid", gridTemplateColumns: "minmax(0,2fr) 60px 88px 72px 96px", padding: "7px 10px", gap: 4, borderTop: "1px solid var(--border)", alignItems: "center" }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {it.description || it.itemCode}
                      </p>
                      {it.description && it.itemCode && (
                        <p style={{ fontSize: 9, color: "var(--muted)", fontFamily: "monospace" }}>{it.itemCode}</p>
                      )}
                      {/* Batch / Pack / Exp info */}
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 2 }}>
                        {it.vatCode && (
                          <span style={{ fontSize: 9, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 4, padding: "1px 5px", color: "var(--muted)", fontFamily: "monospace" }}>
                           Tax code: {it.vatCode}
                          </span>
                        )}
                        {it.batchNo && (
                          <span style={{ fontSize: 9, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 4, padding: "1px 5px", color: "var(--muted)", fontFamily: "monospace" }}>
                            Batch: {it.batchNo}
                          </span>
                        )}
                        {(it.packingSize || it.packingUnit) && (
                          <span style={{ fontSize: 9, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 4, padding: "1px 5px", color: "var(--muted)" }}>
                            Pack {it.packingSize}/{it.packingUnit}
                          </span>
                        )}
                        {it.expDate && (
                          <span style={{ fontSize: 9, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 4, padding: "1px 5px", color: "var(--muted)" }}>
                            Exp: {fmtDate(it.expDate)}
                          </span>
                        )}
                      </div>
                    </div>
                    <p style={{ fontSize: 12, textAlign: "right", color: "var(--text)", fontVariantNumeric: "tabular-nums" }}>{(it.quantity ?? 0).toLocaleString()}</p>
                    <p style={{ fontSize: 12, textAlign: "right", color: "var(--text)", fontVariantNumeric: "tabular-nums" }}>{fmt(it.price, currency)}</p>
                    <p style={{ fontSize: 12, textAlign: "right", color: "var(--muted)", fontVariantNumeric: "tabular-nums" }}>{it.discount ? fmt(it.discount, currency) : "—"}</p>
                    <p style={{ fontSize: 12, textAlign: "right", fontWeight: 700, color: "var(--text)", fontVariantNumeric: "tabular-nums" }}>{fmt(rowTotal, currency)}</p>
                  </div>
                );
              })}
              {/* Totals */}
              <div style={{ background: "var(--bg)", borderTop: "2px solid var(--border)", padding: "7px 10px", display: "flex", flexDirection: "column", gap: 3 }}>
                {[
                  { label: "Subtotal",    val: fmt(subtotal, currency),     big: false, red: false },
                  ...(totalDisc > 0 ? [{ label: "Discount", val: `- ${fmt(totalDisc, currency)}`, big: false, red: true }] : []),
                  { label: "Grand Total", val: fmt(grandTotal, currency),   big: true,  red: false },
                ].map(({ label, val, big, red }) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 9, color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</span>
                    <span style={{ fontSize: big ? 14 : 12, fontWeight: big ? 800 : 500, color: red ? "var(--danger)" : "var(--text)", fontVariantNumeric: "tabular-nums" }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── PAYMENT INFO ── */}
            {data.paymentInformation && (<>
              <S title="Payment Information" />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
                <F label="Payment Terms"  value={data.paymentInformation.paymentTerms} />
                <F label="Method"         value={data.paymentInformation.paymentMethod} />
                <F label="Bank"           value={data.paymentInformation.bankName} />
                {data.paymentInformation.accountNumber && <F label="Account No." value={data.paymentInformation.accountNumber} mono />}
                {data.paymentInformation.routingNumber  && <F label="Routing No." value={data.paymentInformation.routingNumber} mono />}
                {data.paymentInformation.swiftCode      && <F label="SWIFT"       value={data.paymentInformation.swiftCode} mono />}
              </div>
            </>)}

            {/* ── PAYMENT SCHEDULE ── */}
            {phases.length > 0 && (<>
              <S title="Payment Schedule" />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6 }}>
                {phases.map((phase, i) => (
                  <div key={i} style={{ padding: "7px 9px", borderRadius: 6, background: "var(--bg)", border: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 5, marginBottom: 3 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: "var(--primary)" }}>{phase.percentage}</span>
                      {phase.name && <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text)" }}>{phase.name}</span>}
                    </div>
                    <p style={{ fontSize: 10, color: "var(--muted)", lineHeight: 1.4 }}>{phase.condition}</p>
                  </div>
                ))}
              </div>
              {data.terms?.selling?.payment?.notes && (
                <p style={{ fontSize: 10, color: "var(--muted)", fontStyle: "italic", marginTop: 5 }}>※ {data.terms.selling.payment.notes}</p>
              )}
            </>)}

            {/* ── TERMS ── */}
            {(() => {
              const s = data.terms?.selling;
              if (!s) return null;
              const rows = [
                { label: "Delivery",     value: s.delivery },
                { label: "Cancellation", value: s.cancellation },
                { label: "Warranty",     value: s.warranty },
                { label: "Liability",    value: s.liability },
                { label: "Late Charges", value: s.payment?.lateCharges },
                { label: "Due Dates",    value: s.payment?.dueDates },
                { label: "General",      value: s.general },
              ].filter(r => r.value);
              if (!rows.length) return null;
              return (<>
                <S title="Terms & Conditions" />
                <div style={{ borderRadius: 7, overflow: "hidden", border: "1px solid var(--border)" }}>
                  {rows.map(({ label, value }, i) => (
                    <div key={label} className="idm-trow" style={{ display: "flex", borderTop: i > 0 ? "1px solid var(--border)" : "none" }}>
                      <span style={{ fontSize: 10, color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", padding: "6px 9px", minWidth: 90, background: "var(--bg)", borderRight: "1px solid var(--border)", flexShrink: 0, lineHeight: 1.4 }}>{label}</span>
                      <span style={{ fontSize: 12, color: "var(--text)", padding: "6px 9px", lineHeight: 1.5 }}>{value}</span>
                    </div>
                  ))}
                </div>
              </>);
            })()}

            <div style={{ height: 12 }} />
          </>)}
        </div>

        {/* ── PDF OVERLAY ── */}
        {(pdfUrl || pdfLoading) && (
          <div style={{ position: "absolute", inset: 0, zIndex: 20, background: "var(--card)", display: "flex", flexDirection: "column", animation: "idm-up .18s cubic-bezier(.4,0,.2,1)" }}>
            <div style={{ padding: "9px 12px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button onClick={onClosePdf} style={{ width: 26, height: 26, borderRadius: 6, border: "1px solid var(--border)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <div style={{ lineHeight: 1 }}>
                  <p style={{ fontSize: 9, color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2 }}>PDF Preview</p>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{data?.invoiceNumber}</p>
                </div>
              </div>
              <div style={{ display: "flex", gap: 5 }}>
                {onDownload && pdfUrl && (
                  <button className="idm-btn" onClick={onDownload} style={{ background: "var(--primary)", color: "#fff" }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    Download
                  </button>
                )}
                {pdfUrl && (
                  <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="idm-btn" style={{ background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border)", textDecoration: "none" }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                    New Tab
                  </a>
                )}
              </div>
            </div>
            <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
              {pdfLoading && (
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" style={{ animation: "idm-spin 1s linear infinite" }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                  <p style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>Generating preview...</p>
                </div>
              )}
              {pdfUrl && <iframe src={pdfUrl} style={{ width: "100%", height: "100%", border: "none" }} title="Invoice PDF" />}
            </div>
          </div>
        )}

      </div>
    </>
  );
};

export default InvoiceDetailModal;