import React from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface PurchaseInvoiceDetail {
  pId: string;
  supplierName: string;
  spplrInvcNo?: string;
  pDate: string;
  requiredBy?: string;
  currency: string;
  status: string;
  grandTotal?: number;
  taxCategory?: string;
  placeOfSupply?: string | null;
  incoterm?: string;
  project?: string;
  registrationType?: string;
  syncStatus?: string | null;
  paymentMethod?: string;
  transactionProgress?: string;
  destnCountryCd?: string | null;
  lpoNumber?: string;
  costCenter?: string;
  addresses?: {
    supplierAddress?: {
      addressId?: string;
      addressTitle?: string;
      addressType?: string;
      addressLine1?: string;
      addressLine2?: string;
      city?: string;
      state?: string;
      country?: string;
      postalCode?: string;
      phone?: string;
      email?: string;
    } | null;
    dispatchAddress?: {
      addressLine1?: string;
      addressLine2?: string;
      city?: string;
      state?: string;
      country?: string;
      postalCode?: string;
    } | null;
    shippingAddress?: {
      addressLine1?: string;
      addressLine2?: string;
      city?: string;
      state?: string;
      country?: string;
      postalCode?: string;
    } | null;
  };
  items?: Array<{
    item_code?: string;
    item_name?: string;
    qty?: number;
    packing?: string;
    rate?: number;
    amount?: number;
    VatCd?: string;
    batchNo?: string | null;
    packingUnit?: string;
    packingSize?: string;
    mfgDate?: string | null;
  schedule_date?: string;
  }>;
  tax?: {
    type?: string;
    taxRate?: string;
    taxableAmount?: string;
    taxAmount?: string;
  };
  summary?: {
    totalQuantity?: number;
    subTotal?: number;
    taxTotal?: string;
    grandTotal?: number;
    roundingAdjustment?: number;
    roundedTotal?: number;
  };
  terms?: {
    terms?: {
      buying?: {
        general?: string;
        delivery?: string;
        cancellation?: string;
        warranty?: string;
        liability?: string;
        payment?: {
          type?: string | null;
          dueDates?: string;
          lateCharges?: string;
          taxes?: string;
          notes?: string;
          phases?: Array<{ id?: string; name?: string; percentage?: string; condition?: string }>;
        };
      };
    };
  };
  metadata?: {
    createdBy?: string;
    remarks?: string;
    createdAt?: string;
    updatedAt?: string;
  };
}

interface Props {
  open: boolean;
  data: PurchaseInvoiceDetail | null;
  loading?: boolean;
  onClose: () => void;
  pdfUrl?: string | null;
  pdfLoading?: boolean;
  onViewPdf?: () => void;
  onDownload?: () => void;
  onClosePdf?: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n?: number | string, currency = "INR") => {
  const num = typeof n === "string" ? parseFloat(n) : (n ?? 0);
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, minimumFractionDigits: 2 }).format(num);
};

const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const STATUS_MAP: Record<string, string> = {
  Draft: "bg-draft",
  Submitted: "bg-info",
  Paid: "bg-success",
  "Party Paid": "bg-success",
  Cancelled: "bg-danger",
  Return: "bg-danger",
  "Debit Note Issued": "bg-danger",
  "Internal Transfer": "bg-info",
};

const F: React.FC<{ label: string; value?: string | null; mono?: boolean }> = ({ label, value, mono }) => (
  <div>
    <p style={{ fontSize: 9, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 700, marginBottom: 1 }}>{label}</p>
    <p style={{ fontSize: 13, color: value ? "var(--text)" : "var(--muted)", fontWeight: 500, fontFamily: mono ? "monospace" : undefined, lineHeight: 1.3 }}>
      {value || "—"}
    </p>
  </div>
);

const S: React.FC<{ title: string }> = ({ title }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "12px 0 7px" }}>
    <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", whiteSpace: "nowrap" }}>{title}</span>
    <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const PurchaseInvoiceDetailModal: React.FC<Props> = ({
  open, data, loading, onClose,
  pdfUrl, pdfLoading, onViewPdf, onDownload, onClosePdf,
}) => {
  if (!open) return null;

  const items      = data?.items ?? [];
  const currency   = data?.currency ?? "INR";
  const statusCls  = STATUS_MAP[data?.status ?? "Draft"] ?? "bg-draft";
  const phases     = data?.terms?.terms?.buying?.payment?.phases?.filter(p => p?.percentage)?.slice(0, 3) ?? [];
  const grandTotal = data?.summary?.grandTotal ?? data?.grandTotal ?? 0;
  const subTotal   = data?.summary?.subTotal ?? 0;
  const taxTotal   = parseFloat(data?.summary?.taxTotal ?? "0");

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(2px)", animation: "pidm-fade .15s ease" }} />

      {/* Drawer */}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 1000,
        width: "min(620px, 100vw)",
        background: "var(--card)", color: "var(--text)",
        display: "flex", flexDirection: "column",
        boxShadow: "-6px 0 32px rgba(0,0,0,0.15)",
        animation: "pidm-slide .2s cubic-bezier(.4,0,.2,1)",
        overflow: "hidden",
      }}>
        <style>{`
          @keyframes pidm-fade  { from{opacity:0}to{opacity:1} }
          @keyframes pidm-slide { from{transform:translateX(48px);opacity:0}to{transform:translateX(0);opacity:1} }
          @keyframes pidm-up    { from{transform:translateY(16px);opacity:0}to{transform:translateY(0);opacity:1} }
          @keyframes pidm-spin  { to{transform:rotate(360deg)} }
          .pidm-btn {
            display:inline-flex; align-items:center; gap:5px;
            padding:5px 11px; border-radius:6px; font-size:12px; font-weight:600;
            cursor:pointer; border:none; transition:opacity .12s,transform .1s; white-space:nowrap;
          }
          .pidm-btn:hover  { opacity:.85; transform:translateY(-1px) }
          .pidm-btn:active { transform:translateY(0) }
          .pidm-irow { transition: background .1s }
          .pidm-irow:hover { background: var(--row-hover) }
          .pidm-trow:hover { background: var(--row-hover) }
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
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
            </div>
            <div style={{ lineHeight: 1 }}>
              <p style={{ fontSize: 9, color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2 }}>Purchase Invoice</p>
              <p style={{ fontSize: 15, fontWeight: 800, color: "var(--text)" }}>{data?.pId ?? "—"}</p>
            </div>
            <span className={`pidm-btn ${statusCls}`} style={{ cursor: "default", padding: "2px 9px", fontSize: 10, borderRadius: 20 }}>
              {data?.status ?? "Draft"}
            </span>
          </div>

          <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
            {onViewPdf && (
              <button className="pidm-btn" onClick={onViewPdf} style={{ background: "var(--primary)", color: "#fff" }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                PDF
              </button>
            )}
            {onDownload && (
              <button className="pidm-btn" onClick={onDownload} style={{ background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border)" }}>
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
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" style={{ animation: "pidm-spin 1s linear infinite" }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
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
                <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{fmtDate(data.pDate)}</p>
              </div>

            </div>

            {/* ── SUPPLIER & TRANSACTION ── */}
            <S title="Supplier & Transaction" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 7 }}>
              <F label="Supplier"           value={data.supplierName} />
              <F label="Supplier Invoice No" value={data.spplrInvcNo} mono />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
              <F label="Currency"      value={data.currency} />
              <F label="Tax Category"  value={data.taxCategory} />
              <F label="Incoterm"      value={data.incoterm} />
              <F label="Payment Method" value={data.paymentMethod} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginTop: 7 }}>
              <F label="Reg. Type"      value={data.registrationType} />
              <F label="Project"        value={data.project} />
              <F label="Cost Center"    value={data.costCenter} />
              {data.lpoNumber && <F label="LPO Number" value={data.lpoNumber} mono />}
            </div>
            {(data.transactionProgress || data.destnCountryCd) && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginTop: 7 }}>
                {data.transactionProgress && <F label="Txn Progress"   value={data.transactionProgress} />}
                {data.destnCountryCd      && <F label="Destination"    value={data.destnCountryCd?.toUpperCase()} />}
              </div>
            )}
            {/* {data.metadata && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginTop: 7 }}>
                <F label="Created By" value={data.metadata.createdBy} />
                <F label="Created At" value={fmtDate(data.metadata.createdAt)} />
                {data.metadata.remarks && <F label="Remarks" value={data.metadata.remarks} />}
              </div>
            )} */}

            {/* ── ADDRESSES ── */}
            {data.addresses &&
              (data.addresses.supplierAddress || data.addresses.dispatchAddress || data.addresses.shippingAddress) && (<>
              <S title="Addresses" />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6 }}>
                {[
                  { label: "Supplier", addr: data.addresses.supplierAddress },
                  { label: "Dispatch", addr: data.addresses.dispatchAddress },
                  { label: "Shipping", addr: data.addresses.shippingAddress },
                ].map(({ label, addr }) =>
                  addr ? (
                    <div key={label} style={{ padding: "7px 9px", borderRadius: 6, background: "var(--bg)", border: "1px solid var(--border)" }}>
                      <p style={{ fontSize: 9, color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3 }}>{label}</p>
                      {[
                        addr.addressLine1,
                        addr.city,
                        [addr.state, addr.postalCode].filter(Boolean).join(", "),
                        addr.country?.toUpperCase(),
                      ].filter(Boolean).map((l, i) => (
                        <p key={i} style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.5 }}>{l}</p>
                      ))}
                      
                      {"phone" in addr && addr.phone && (
                        <p style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>{addr.phone}</p>
                      )}
                    </div>
                  ) : <div key={label} />
                )}
              </div>
            </>)}

            {/* ── LINE ITEMS ── */}
            <S title="Line Items" />
            <div style={{ borderRadius: 7, overflow: "hidden", border: "1px solid var(--border)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "minmax(0,2fr) 60px 60px 88px 88px", padding: "6px 10px", background: "var(--table-head)", color: "var(--table-head-text)", fontSize: 9, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", gap: 4 }}>
                <span>Item</span>
                <span style={{ textAlign: "right" }}>Qty</span>
                <span style={{ textAlign: "center" }}>Packing</span>
                <span style={{ textAlign: "right" }}>Rate</span>
                

                <span style={{ textAlign: "right" }}>Amount</span>
              </div>

              {items.map((it, i) => (
                <div key={i} className="pidm-irow" style={{ display: "grid", gridTemplateColumns: "minmax(0,2fr) 60px 60px 88px 88px", padding: "7px 10px", gap: 4, borderTop: "1px solid var(--border)", alignItems: "center" }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {it.item_name || it.item_code}
                    </p>
                    {it.item_name && it.item_code && (
                      <p style={{ fontSize: 9, color: "var(--muted)", fontFamily: "monospace" }}>{it.item_code}</p>
                    )}
                    {/* Badges */}
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 2 }}>
                      {it.VatCd && (
                        <span style={{ fontSize: 9, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 4, padding: "1px 5px", color: "var(--muted)", fontFamily: "monospace" }}>
                          VAT: {it.VatCd}
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
                      {it.schedule_date && (
                        <span style={{ fontSize: 9, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 4, padding: "1px 5px", color: "var(--muted)" }}>
                          Sched: {fmtDate(it.schedule_date)}
                        </span>
                      )}
                    </div>
                  </div>
                  <p style={{ fontSize: 12, textAlign: "right", color: "var(--text)", fontVariantNumeric: "tabular-nums" }}>{(it.qty ?? 0).toLocaleString()}</p>
                  <p style={{ fontSize: 11, textAlign: "center", color: "var(--muted)" }}>{it.packing || "—"}</p>
                  <p style={{ fontSize: 12, textAlign: "right", color: "var(--text)", fontVariantNumeric: "tabular-nums" }}>{fmt(it.rate, currency)}</p>
                  <p style={{ fontSize: 12, textAlign: "right", fontWeight: 700, color: "var(--text)", fontVariantNumeric: "tabular-nums" }}>{fmt(it.amount, currency)}</p>
                </div>
              ))}

              {/* Totals */}
              <div style={{ background: "var(--bg)", borderTop: "2px solid var(--border)", padding: "7px 10px", display: "flex", flexDirection: "column", gap: 3 }}>
                {[
                  { label: "Subtotal",                          val: fmt(subTotal, currency),   big: false },
                  { label: `Tax (${data.tax?.taxRate ?? ""})`,  val: fmt(taxTotal, currency),   big: false },
                  { label: "Grand Total",                       val: fmt(grandTotal, currency), big: true  },
                ].map(({ label, val, big }) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 9, color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</span>
                    <span style={{ fontSize: big ? 14 : 12, fontWeight: big ? 800 : 500, color: "var(--text)", fontVariantNumeric: "tabular-nums" }}>{val}</span>
                  </div>
                ))}
                {data.summary?.roundingAdjustment !== 0 && data.summary?.roundingAdjustment != null && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 9, color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em" }}>Rounding</span>
                    <span style={{ fontSize: 12, color: "var(--muted)", fontVariantNumeric: "tabular-nums" }}>{fmt(data.summary.roundingAdjustment, currency)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* ── PAYMENT SCHEDULE ── */}
            {phases.length > 0 && (<>
              <S title="Payment Schedule" />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6 }}>
                {phases.map((phase, i) => (
                  <div key={i} style={{ padding: "7px 9px", borderRadius: 6, background: "var(--bg)", border: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 5, marginBottom: 3 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: "var(--primary)" }}>{phase.percentage}%</span>
                      {phase.name && <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text)" }}>{phase.name}</span>}
                    </div>
                    <p style={{ fontSize: 10, color: "var(--muted)", lineHeight: 1.4 }}>{phase.condition}</p>
                  </div>
                ))}
              </div>
              {data.terms?.terms?.buying?.payment?.notes && (
                <p style={{ fontSize: 10, color: "var(--muted)", fontStyle: "italic", marginTop: 5 }}>※ {data.terms.terms.buying.payment.notes}</p>
              )}
            </>)}

            {/* ── TERMS & CONDITIONS ── */}
            {(() => {
              const b = data.terms?.terms?.buying;
              if (!b) return null;
              const rows = [
                { label: "Delivery",     value: b.delivery },
                { label: "Cancellation", value: b.cancellation },
                { label: "Warranty",     value: b.warranty },
                { label: "Liability",    value: b.liability },
                { label: "Late Charges", value: b.payment?.lateCharges },
                { label: "Due Dates",    value: b.payment?.dueDates },
                { label: "General",      value: b.general },
              ].filter(r => r.value);
              if (!rows.length) return null;
              return (<>
                <S title="Terms & Conditions" />
                <div style={{ borderRadius: 7, overflow: "hidden", border: "1px solid var(--border)" }}>
                  {rows.map(({ label, value }, i) => (
                    <div key={label} className="pidm-trow" style={{ display: "flex", borderTop: i > 0 ? "1px solid var(--border)" : "none" }}>
                      <span style={{ fontSize: 10, color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", padding: "6px 9px", minWidth: 100, background: "var(--bg)", borderRight: "1px solid var(--border)", flexShrink: 0, lineHeight: 1.4 }}>{label}</span>
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
          <div style={{ position: "absolute", inset: 0, zIndex: 20, background: "var(--card)", display: "flex", flexDirection: "column", animation: "pidm-up .18s cubic-bezier(.4,0,.2,1)" }}>
            <div style={{ padding: "9px 12px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button onClick={onClosePdf} style={{ width: 26, height: 26, borderRadius: 6, border: "1px solid var(--border)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <div style={{ lineHeight: 1 }}>
                  <p style={{ fontSize: 9, color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2 }}>PDF Preview</p>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{data?.pId}</p>
                </div>
              </div>
              <div style={{ display: "flex", gap: 5 }}>
                {onDownload && pdfUrl && (
                  <button className="pidm-btn" onClick={onDownload} style={{ background: "var(--primary)", color: "#fff" }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    Download
                  </button>
                )}
                {pdfUrl && (
                  <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="pidm-btn" style={{ background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border)", textDecoration: "none" }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                    New Tab
                  </a>
                )}
              </div>
            </div>
            <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
              {pdfLoading && (
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" style={{ animation: "pidm-spin 1s linear infinite" }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                  <p style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>Generating preview...</p>
                </div>
              )}
              {pdfUrl && <iframe src={pdfUrl} style={{ width: "100%", height: "100%", border: "none" }} title="Purchase Invoice PDF" />}
            </div>
          </div>
        )}

      </div>
    </>
  );
};

export default PurchaseInvoiceDetailModal;