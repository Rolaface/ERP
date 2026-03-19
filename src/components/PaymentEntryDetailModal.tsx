import React from "react";

export interface PaymentEntryDetail {
  header?: {
    payment_id?: string;
    payment_type?: string;
    status?: string;
    posting_date?: string;
    company?: string;
    naming_series?: string;
  };
  party_info?: {
    party_type?: string;
    party?: string;
    party_name?: string;
    contact_person?: string;
    contact_email?: string;
  };
  transaction_info?: {
    mode_of_payment?: string;
    paid_from?: string;
    paid_from_currency?: string;
    paid_to?: string;
    paid_to_currency?: string;
    bank?: string | null;
    bank_account_no?: string | null;
    party_bank_account?: string | null;
    reference_no?: string;
    reference_date?: string;
    clearance_date?: string | null;
    cost_center?: string | null;
    project?: string | null;
  };
  amounts?: {
    paid_amount?: number;
    received_amount?: number;
    base_paid_amount?: number;
    base_received_amount?: number;
    total_allocated_amount?: number;
    unallocated_amount?: number;
    difference_amount?: number;
    source_exchange_rate?: number;
    target_exchange_rate?: number;
    amount_in_words?: string;
  };
  allocations?: Array<{
    reference_doctype?: string;
    reference_name?: string;
    total_amount?: number;
    outstanding_amount?: number;
    allocated_amount?: number;
  }>;
  taxes?: Array<{
    account_head?: string;
    rate?: number;
    tax_amount?: number;
    total?: number;
  }>;
  deductions?: Array<{
    account?: string;
    cost_center?: string;
    amount?: number;
  }>;
  remarks?: string;
}

interface Props {
  open: boolean;
  data: PaymentEntryDetail | null;
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
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(num);
};

const fmtDate = (d?: string | null) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

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

const S: React.FC<{ title: string }> = ({ title }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 8,
      margin: "16px 0 8px",
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
const PaymentEntryDetailModal: React.FC<Props> = ({
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

  const header = data?.header;
  const party = data?.party_info;
  const txn = data?.transaction_info;
  const amounts = data?.amounts;
  const allocations = data?.allocations ?? [];
  const currency = txn?.paid_from_currency ?? "INR";
  const statusCls = STATUS_MAP[header?.status ?? "Draft"] ?? "bg-draft";

  const totalAmount = amounts?.paid_amount ?? amounts?.received_amount ?? 0;
  const isReceive = header?.payment_type === "Receive";

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
          animation: "pidm-fade .15s ease",
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
          animation: "pidm-slide .2s cubic-bezier(.4,0,.2,1)",
          overflow: "hidden",
        }}
      >
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
              {/* Receipt / Cash Icon */}
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="6" width="20" height="12" rx="2" />
                <circle cx="12" cy="12" r="2" />
                <path d="M6 12h.01M18 12h.01" />
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
                Payment Entry
              </p>
              <p
                style={{ fontSize: 15, fontWeight: 800, color: "var(--text)" }}
              >
                {header?.payment_id ?? "—"}
              </p>
            </div>
            <span
              className={`pidm-btn ${statusCls}`}
              style={{
                cursor: "default",
                padding: "2px 9px",
                fontSize: 10,
                borderRadius: 20,
              }}
            >
              {header?.status ?? "Draft"}
            </span>
          </div>

          <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
            {onViewPdf && (
              <button
                className="pidm-btn"
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
            {onDownload && (
              <button
                className="pidm-btn"
                onClick={onDownload}
                style={{
                  background: "var(--bg)",
                  color: "var(--text)",
                  border: "1px solid var(--border)",
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
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download
              </button>
            )}
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
            padding: "14px 14px",
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
                style={{ animation: "pidm-spin 1s linear infinite" }}
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
                  gridTemplateColumns: "1.2fr 0.8fr 1fr",
                  gap: 6,
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    padding: "10px 12px",
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
                    {isReceive ? "Amount Received" : "Amount Paid"}
                  </p>
                  <p
                    style={{
                      fontSize: 16,
                      fontWeight: 800,
                      color: "#fff",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {fmt(totalAmount, currency)}
                  </p>
                </div>
                <div
                  style={{
                    padding: "10px 12px",
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
                    Posting Date
                  </p>
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: "var(--text)",
                    }}
                  >
                    {fmtDate(header?.posting_date)}
                  </p>
                </div>
                <div
                  style={{
                    padding: "10px 12px",
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
                    Payment Type
                  </p>
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: "var(--text)",
                    }}
                  >
                    {header?.payment_type || "—"}
                  </p>
                </div>
              </div>

              {/* ── PARTY & TRANSACTION INFO ── */}
              <S title="Party & Transaction Info" />
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                  marginBottom: 10,
                }}
              >
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                >
                  <F label="Party Type" value={party?.party_type} />
                  <F label="Party Name" value={party?.party_name} />
                  <F label="Contact Person" value={party?.contact_person} />
                  <F label="Email" value={party?.contact_email} />
                </div>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                >
                  <F label="Mode of Payment" value={txn?.mode_of_payment} />
                  <F label="Paid From" value={txn?.paid_from} mono />
                  <F label="Paid To" value={txn?.paid_to} mono />
                  {txn?.cost_center && (
                    <F label="Cost Center" value={txn.cost_center} />
                  )}
                  {txn?.project && <F label="Project" value={txn.project} />}
                </div>
              </div>

              {/* ── BANK & REFERENCE ── */}
              {(txn?.reference_no || txn?.bank || txn?.clearance_date) && (
                <>
                  <S title="Bank & Reference Details" />
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: 12,
                      marginBottom: 10,
                      background: "var(--bg)",
                      padding: "10px 12px",
                      borderRadius: 6,
                      border: "1px solid var(--border)",
                    }}
                  >
                    <F label="Reference No" value={txn.reference_no} mono />
                    <F
                      label="Reference Date"
                      value={fmtDate(txn.reference_date)}
                    />
                    <F
                      label="Clearance Date"
                      value={fmtDate(txn.clearance_date)}
                    />
                    <F label="Bank" value={txn.bank} />
                    <F
                      label="Bank Account No"
                      value={txn.bank_account_no}
                      mono
                    />
                    <F
                      label="Party Bank Account"
                      value={txn.party_bank_account}
                      mono
                    />
                  </div>
                </>
              )}

              {/* ── ALLOCATIONS TABLE ── */}
              {allocations.length > 0 && (
                <>
                  <S title="Allocated Vouchers" />
                  <div
                    style={{
                      borderRadius: 7,
                      overflow: "hidden",
                      border: "1px solid var(--border)",
                      marginBottom: 16,
                    }}
                  >
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr 100px 100px 100px",
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
                      <span>Type</span>
                      <span>Voucher No</span>
                      <span style={{ textAlign: "right" }}>Total</span>
                      <span style={{ textAlign: "right" }}>Outstanding</span>
                      <span style={{ textAlign: "right" }}>Allocated</span>
                    </div>

                    {allocations.map((it, i) => (
                      <div
                        key={i}
                        className="pidm-irow"
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr 100px 100px 100px",
                          padding: "7px 10px",
                          gap: 4,
                          borderTop: "1px solid var(--border)",
                          alignItems: "center",
                        }}
                      >
                        <p style={{ fontSize: 12, color: "var(--text)" }}>
                          {it.reference_doctype}
                        </p>
                        <p
                          style={{
                            fontSize: 12,
                            color: "var(--text)",
                            fontFamily: "monospace",
                          }}
                        >
                          {it.reference_name}
                        </p>
                        <p
                          style={{
                            fontSize: 12,
                            textAlign: "right",
                            color: "var(--text)",
                          }}
                        >
                          {fmt(it.total_amount, currency)}
                        </p>
                        <p
                          style={{
                            fontSize: 12,
                            textAlign: "right",
                            color: "var(--danger)",
                          }}
                        >
                          {fmt(it.outstanding_amount, currency)}
                        </p>
                        <p
                          style={{
                            fontSize: 12,
                            textAlign: "right",
                            fontWeight: 700,
                            color: "var(--text)",
                          }}
                        >
                          {fmt(it.allocated_amount, currency)}
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* ── AMOUNTS SUMMARY ── */}
              <div
                style={{
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  borderRadius: 7,
                  padding: "10px 14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  marginTop: 8,
                }}
              >
                {[
                  {
                    label: isReceive ? "Amount Received" : "Amount Paid",
                    val: fmt(totalAmount, currency),
                    bold: true,
                  },
                  {
                    label: "Allocated Amount",
                    val: fmt(amounts?.total_allocated_amount, currency),
                    color: "var(--success)",
                  },
                  {
                    label: "Unallocated Amount",
                    val: fmt(amounts?.unallocated_amount, currency),
                    color: amounts?.unallocated_amount
                      ? "var(--warning)"
                      : undefined,
                  },
                  {
                    label: "Difference Amount",
                    val: fmt(amounts?.difference_amount, currency),
                  },
                ].map(({ label, val, bold, color }) => (
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
                        fontSize: 10,
                        color: "var(--muted)",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {label}
                    </span>
                    <span
                      style={{
                        fontSize: bold ? 14 : 12,
                        fontWeight: bold ? 700 : 500,
                        color: color || "var(--text)",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {val}
                    </span>
                  </div>
                ))}
              </div>

              {/* ── AMOUNT IN WORDS & REMARKS ── */}
              {amounts?.amount_in_words && (
                <p
                  style={{
                    fontSize: 11,
                    color: "var(--muted)",
                    fontStyle: "italic",
                    marginTop: 8,
                    textAlign: "right",
                  }}
                >
                  {amounts.amount_in_words}
                </p>
              )}

              {data.remarks && (
                <div style={{ marginTop: 16 }}>
                  <S title="Remarks" />
                  <p
                    style={{
                      fontSize: 12,
                      color: "var(--text)",
                      background: "var(--bg)",
                      padding: 10,
                      borderRadius: 6,
                      border: "1px solid var(--border)",
                      lineHeight: 1.5,
                    }}
                  >
                    {data.remarks}
                  </p>
                </div>
              )}

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
              animation: "pidm-up .18s cubic-bezier(.4,0,.2,1)",
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
                    {header?.payment_id}
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", gap: 5 }}>
                {onDownload && pdfUrl && (
                  <button
                    className="pidm-btn"
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
                    className="pidm-btn"
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
                    style={{ animation: "pidm-spin 1s linear infinite" }}
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
                  title="Payment Entry PDF"
                />
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default PaymentEntryDetailModal;
