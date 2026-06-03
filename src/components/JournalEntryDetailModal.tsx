import React from "react";

export interface JournalEntryAccount {
  name: string;
  account: string;
  account_type?: string;
  party_type?: string;
  party?: string;
  cost_center?: string;
  account_currency?: string;
  exchange_rate?: number;
  debit_in_account_currency?: number;
  debit?: number;
  credit_in_account_currency?: number;
  credit?: number;
  is_advance?: string;
  user_remark?: string;
}

export interface JournalEntryDetail {
  name: string;
  company?: string;
  voucher_type?: string;
  posting_date?: string;
  docstatus?: number;
  total_debit?: number;
  total_credit?: number;
  difference?: number;
  total_amount_currency?: string;
  total_amount_in_words?: string;
  is_opening?: string;
  title?: string;
  user_remark?: string;
  remark?: string;
  accounts?: JournalEntryAccount[];
}

interface Props {
  open: boolean;
  data: JournalEntryDetail | null;
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

// Map ERPNext docstatus to standard text and colors
const getStatusMap = (docstatus?: number) => {
  switch (docstatus) {
    case 0:
      return { label: "Draft", cls: "bg-draft" };
    case 1:
      return { label: "Submitted", cls: "bg-success" };
    case 2:
      return { label: "Cancelled", cls: "bg-danger" };
    default:
      return { label: "Draft", cls: "bg-draft" };
  }
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
const JournalEntryDetailModal: React.FC<Props> = ({
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

  const currency = data?.total_amount_currency ?? "INR";
  const statusInfo = getStatusMap(data?.docstatus);
  const accounts = data?.accounts ?? [];

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
          width: "min(680px, 100vw)", // Slightly wider for the accounts table
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
              {/* Journal / Book Icon */}
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
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
                {data?.voucher_type || "Journal Entry"}
              </p>
              <p
                style={{ fontSize: 15, fontWeight: 800, color: "var(--text)" }}
              >
                {data?.name ?? "—"}
              </p>
            </div>
            <span
              className={`pidm-btn ${statusInfo.cls}`}
              style={{
                cursor: "default",
                padding: "2px 9px",
                fontSize: 10,
                borderRadius: 20,
              }}
            >
              {statusInfo.label}
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
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 6,
                  marginBottom: 10,
                }}
              >
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
                    Total Debit
                  </p>
                  <p
                    style={{
                      fontSize: 16,
                      fontWeight: 800,
                      color: "var(--text)",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {fmt(data.total_debit, currency)}
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
                    Total Credit
                  </p>
                  <p
                    style={{
                      fontSize: 16,
                      fontWeight: 800,
                      color: "var(--text)",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {fmt(data.total_credit, currency)}
                  </p>
                </div>
                <div
                  style={{
                    padding: "10px 12px",
                    borderRadius: 7,
                    background: data.difference === 0 ? "var(--bg)" : "rgba(239, 68, 68, 0.1)",
                    border: `1px solid ${data.difference === 0 ? "var(--border)" : "var(--danger)"}`,
                  }}
                >
                  <p
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: data.difference === 0 ? "var(--muted)" : "var(--danger)",
                      marginBottom: 2,
                    }}
                  >
                    Difference
                  </p>
                  <p
                    style={{
                      fontSize: 16,
                      fontWeight: 800,
                      color: data.difference === 0 ? "var(--success)" : "var(--danger)",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {fmt(data.difference, currency)}
                  </p>
                </div>
              </div>

              {/* ── GENERAL INFO ── */}
              <S title="General Information" />
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                  marginBottom: 10,
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <F label="Company" value={data.company} />
                  <F label="Posting Date" value={fmtDate(data.posting_date)} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <F label="Title / Reference" value={data.title} />
                  <F label="Is Opening Entry" value={data.is_opening} />
                </div>
              </div>

              {/* ── ACCOUNTS TABLE ── */}
              <S title="Accounting Entries" />
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
                    gridTemplateColumns: "2fr 1.5fr 100px 100px",
                    padding: "8px 10px",
                    background: "var(--table-head)",
                    color: "var(--table-head-text)",
                    fontSize: 9,
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    gap: 8,
                  }}
                >
                  <span>Account Details</span>
                  <span>Remarks</span>
                  <span style={{ textAlign: "right" }}>Debit</span>
                  <span style={{ textAlign: "right" }}>Credit</span>
                </div>

                {accounts.length === 0 ? (
                  <div style={{ padding: "16px", textAlign: "center", color: "var(--muted)", fontSize: 12 }}>
                    No accounting entries found.
                  </div>
                ) : (
                  accounts.map((row, i) => (
                    <div
                      key={row.name || i}
                      className="pidm-irow"
                      style={{
                        display: "grid",
                        gridTemplateColumns: "2fr 1.5fr 100px 100px",
                        padding: "8px 10px",
                        gap: 8,
                        borderTop: "1px solid var(--border)",
                        alignItems: "start",
                      }}
                    >
                      {/* Account Info Column */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
                          {row.account}
                        </span>
                        {(row.party || row.cost_center) && (
                          <div style={{ display: "flex", flexDirection: "column", gap: 1, marginTop: 2 }}>
                            {row.party && (
                              <span style={{ fontSize: 11, color: "var(--muted)" }}>
                                <strong>Party:</strong> {row.party}
                              </span>
                            )}
                            {row.cost_center && (
                              <span style={{ fontSize: 11, color: "var(--muted)" }}>
                                <strong>Cost Center:</strong> {row.cost_center}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Remarks Column */}
                      <div style={{ fontSize: 12, color: "var(--muted)", paddingTop: 1 }}>
                        {row.user_remark || "—"}
                      </div>

                      {/* Debit Column */}
                      <div
                        style={{
                          fontSize: 13,
                          textAlign: "right",
                          color: (row.debit || 0) > 0 ? "var(--text)" : "var(--muted)",
                          fontWeight: (row.debit || 0) > 0 ? 600 : 400,
                          paddingTop: 1,
                        }}
                      >
                        {fmt(row.debit, row.account_currency || currency)}
                      </div>

                      {/* Credit Column */}
                      <div
                        style={{
                          fontSize: 13,
                          textAlign: "right",
                          color: (row.credit || 0) > 0 ? "var(--text)" : "var(--muted)",
                          fontWeight: (row.credit || 0) > 0 ? 600 : 400,
                          paddingTop: 1,
                        }}
                      >
                        {fmt(row.credit, row.account_currency || currency)}
                      </div>
                    </div>
                  ))
                )}
                
                {/* Table Footer / Totals */}
                {accounts.length > 0 && (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "3.5fr 100px 100px",
                      padding: "10px 10px",
                      background: "var(--bg)",
                      borderTop: "2px solid var(--border)",
                      gap: 8,
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", textAlign: "right", color: "var(--muted)" }}>
                      Totals
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700, textAlign: "right", color: "var(--text)" }}>
                      {fmt(data.total_debit, currency)}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700, textAlign: "right", color: "var(--text)" }}>
                      {fmt(data.total_credit, currency)}
                    </span>
                  </div>
                )}
              </div>

              {/* ── AMOUNT IN WORDS & REMARKS ── */}
              {data.total_amount_in_words && (
                <p
                  style={{
                    fontSize: 11,
                    color: "var(--muted)",
                    fontStyle: "italic",
                    marginTop: 8,
                    textAlign: "right",
                  }}
                >
                  {data.total_amount_in_words}
                </p>
              )}

              {(data.user_remark || data.remark) && (
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
                    {data.user_remark || data.remark}
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
                    {data?.name}
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
                  title="Journal Entry PDF"
                />
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default JournalEntryDetailModal;