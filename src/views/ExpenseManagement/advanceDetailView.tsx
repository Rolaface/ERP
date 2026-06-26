import React, { useState } from "react";

export interface ExpenseClaimEntry {
  name: string;
  parent: string;
  posting_date: string;
  expense_posting_date: string,
  advance_paid: number;
  allocated_amount: number;
  unclaimed_amount: number;
  return_amount: number;
  advance_account: string;
  exchange_rate: number;
  docstatus: number;
  claim_title?: string;
  description?: string;
}

export interface EmployeeAdvanceDetail {
  name: string;
  employee: string;
  employee_name: string;
  posting_date: string;
  expense_posting_date: string
  company: string;
  department: string;
  currency: string;
  purpose: string;
  advance_amount: number;
  paid_amount: number;
  pending_amount: number;
  claimed_amount: number;
  return_amount: number;
  advance_account: string;
  mode_of_payment: string;
  repay_unclaimed_amount_from_salary: number;
  status: string;
  amended_from: string | null;
  expense_claims?: ExpenseClaimEntry[];
}

interface Props {
  data: EmployeeAdvanceDetail | null;
  loading?: boolean;
  onBack: () => void;
}

/* ── helpers ── */
const fmtDate = (d?: string) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const fmt = (n?: number, currency = "INR") => {
  if (n == null) return "—";
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(n);
  } catch {
    return `${currency} ${n.toFixed(2)}`;
  }
};

const initials = (name?: string) =>
  (name ?? "?")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  draft:     { bg: "#f3f4f6", color: "#6b7280" },
  unpaid:    { bg: "#fef3c7", color: "#d97706" },
  paid:      { bg: "#d1fae5", color: "#059669" },
  claimed:   { bg: "#dbeafe", color: "#2563eb" },
  cancelled: { bg: "#fee2e2", color: "#dc2626" },
};

const CLAIMS_PREVIEW = 5;

/* ── small reusable presentational pieces ── */

const Field: React.FC<{ label: string; value: React.ReactNode; mono?: boolean }> = ({ label, value, mono }) => (
  <div style={{ minWidth: 0 }}>
    <p style={{
      fontSize: 9, fontWeight: 700, textTransform: "uppercase",
      letterSpacing: "0.07em", color: "var(--muted)", marginBottom: 3,
    }}>
      {label}
    </p>
    <p
      title={typeof value === "string" ? value : undefined}
      style={{
        fontSize: 12, fontWeight: 500, color: "var(--text)",
        fontFamily: mono ? "monospace" : undefined,
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}
    >
      {value}
    </p>
  </div>
);

const Metric: React.FC<{ label: string; value: React.ReactNode; variant?: "primary" | "danger" }> = ({ label, value, variant }) => {
  const isPrimary = variant === "primary";
  const isDanger = variant === "danger";
  return (
    <div style={{ padding: "10px 14px", background: isPrimary ? "var(--primary)" : "var(--card)" }}>
      <p style={{
        fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em",
        color: isPrimary ? "rgba(255,255,255,0.65)" : "var(--muted)", marginBottom: 4,
      }}>
        {label}
      </p>
      <p style={{
        fontSize: 15, fontWeight: 800, lineHeight: 1.1, fontVariantNumeric: "tabular-nums",
        color: isPrimary ? "#fff" : isDanger ? "#dc2626" : "var(--text)",
      }}>
        {value}
      </p>
    </div>
  );
};

const EmployeeAdvanceDetailView: React.FC<Props> = ({ data, loading, onBack }) => {
  const [showAllClaims, setShowAllClaims] = useState(false);

  const statusKey   = data?.status?.toLowerCase() ?? "draft";
  const statusStyle = STATUS_COLORS[statusKey] ?? STATUS_COLORS.draft;
  const currency    = data?.currency ?? "";
  const claims      = data?.expense_claims ?? [];
  const visibleClaims = showAllClaims ? claims : claims.slice(0, CLAIMS_PREVIEW);
  const hasMore     = claims.length > CLAIMS_PREVIEW;

  const COLS = ["Claim ID", "Description", "Date", "Claimed", "Remaining"];

  return (
    <div className="eadv" style={{
      display: "flex", flexDirection: "column",
      height: "100%", minHeight: 0,
      background: "var(--card)", color: "var(--text)",
    }}>
      <style>{`
        .eadv, .eadv * { box-sizing: border-box; }
        @keyframes adv-spin { to { transform: rotate(360deg); } }

        .eadv .adv-claim-row { transition: background .12s; }
        .eadv .adv-claim-row:hover { background: var(--bg) !important; }
        .eadv .adv-viewmore-btn { transition: background .12s; }
        .eadv .adv-viewmore-btn:hover { background: var(--bg) !important; }
        .eadv button { font: inherit; }
        .eadv button:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }

        /* Attributes: fluid grid, wraps cleanly from many columns down to one */
        .eadv-attrs {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 11px 18px;
          padding: 12px 14px;
          background: var(--card);
        }

        /* Metrics: 4 tiles -> 2x2 on small screens; hairlines via 1px gap */
        .eadv-metrics {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1px;
          background: var(--border);
        }
        @media (max-width: 560px) { .eadv-metrics { grid-template-columns: repeat(2, 1fr); } }

        /* Claims table: shared grid for header + rows, horizontal scroll when tight */
        .eadv-claims-scroll { overflow-x: auto; scrollbar-width: thin; -webkit-overflow-scrolling: touch; }
        .eadv-claim-grid {
          display: grid;
          grid-template-columns: 150px minmax(170px, 1fr) 110px 120px 130px;
          align-items: center;
        }
        @media (max-width: 480px) {
          .eadv-claim-grid { grid-template-columns: 128px minmax(140px, 1fr) 96px 104px 112px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .eadv .adv-claim-row, .eadv .adv-viewmore-btn { transition: none; }
        }
      `}</style>

      {/* ── HEADER ── */}
      <div style={{
        padding: "10px 16px",
        borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "var(--card)", flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          {/* Back button */}
          <button
            onClick={onBack}
            aria-label="Go back"
            style={{
              width: 28, height: 28, borderRadius: 7,
              border: "1px solid var(--border)", background: "transparent",
              cursor: "pointer", display: "flex", alignItems: "center",
              justifyContent: "center", color: "var(--muted)", flexShrink: 0,
            }}
            title="Back"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          {/* Icon */}
          <div style={{
            width: 30, height: 30, borderRadius: 7,
            background: "var(--primary)", display: "flex",
            alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"
              stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <path d="M8 21h8M12 17v4" />
            </svg>
          </div>

          <div style={{ lineHeight: 1.1, minWidth: 0 }}>
            <p style={{
              fontSize: 9, color: "var(--muted)", fontWeight: 700,
              textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2,
            }}>
              Employee Advance
            </p>
            <p style={{
              fontSize: 15, fontWeight: 800, color: "var(--text)",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {data?.name ?? "—"}
            </p>
          </div>

          {data?.status && (
            <span style={{
              display: "inline-flex", alignItems: "center",
              padding: "2px 9px", borderRadius: 20, fontSize: 10, fontWeight: 700,
              background: statusStyle.bg, color: statusStyle.color, flexShrink: 0,
            }}>
              {data.status}
            </span>
          )}
        </div>
      </div>

      {/* ── BODY ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px" }}>

        {/* Loading */}
        {loading && (
          <div role="status" aria-live="polite" style={{
            display: "flex", alignItems: "center",
            justifyContent: "center", height: 200, gap: 10, color: "var(--muted)",
          }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true"
              stroke="var(--primary)" strokeWidth="2"
              style={{ animation: "adv-spin 1s linear infinite" }}>
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            <span style={{ fontSize: 13 }}>Loading advance details…</span>
          </div>
        )}

        {!loading && data && (
          <>
            {/* ── EMPLOYEE CARD: identity + attributes ── */}
            <div style={{
              border: "1px solid var(--border)", borderRadius: 10,
              overflow: "hidden", marginBottom: 12,
            }}>
              {/* Identity */}
              <div style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "11px 14px", background: "var(--bg)",
                borderBottom: "1px solid var(--border)",
              }}>
                <div style={{
                  width: 34, height: 34, borderRadius: "50%",
                  background: "var(--primary)", display: "flex",
                  alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0,
                }}>
                  {initials(data.employee_name)}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{
                    fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 1,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {data.employee_name}
                  </p>
                  <p style={{
                    fontSize: 11, color: "var(--muted)",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {data.employee} · {data.department}
                  </p>
                </div>
              </div>

              {/* Attributes */}
              <div className="eadv-attrs">
                <Field label="Advance Date"    value={fmtDate(data.posting_date)} />
                <Field label="Currency"        value={data.currency} />
                <Field label="Mode of Payment" value={data.mode_of_payment || "—"} />
                <Field label="Purpose / Reason" value={data.purpose || "—"} />
                <Field label="Advance Account"  value={data.advance_account} mono />
              </div>
            </div>

            {/* ── METRIC STRIP ── */}
            <div style={{
              border: "1px solid var(--border)", borderRadius: 10,
              overflow: "hidden", marginBottom: 12,
            }}>
              <div className="eadv-metrics">
                <Metric label="Total Advance" value={fmt(data.advance_amount, currency)} variant="primary" />
                <Metric label="Total Claimed" value={fmt(data.claimed_amount, currency)} />
                <Metric
                  label="Unclaimed"
                  value={fmt(data.pending_amount, currency)}
                  variant={(data.pending_amount ?? 0) > 0 ? "danger" : undefined}
                />
                <Metric label="No. of Claims" value={claims.length} />
              </div>
            </div>

            {/* ── EXPENSE CLAIMS ── */}
            {claims.length > 0 ? (
              <div style={{
                border: "1px solid var(--border)", borderRadius: 10,
                overflow: "hidden", marginBottom: 16,
              }}>
                {/* Section label */}
                <div style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "8px 14px", borderBottom: "1px solid var(--border)",
                  background: "var(--bg)",
                }}>
                  <span style={{
                    fontSize: 9, fontWeight: 800, letterSpacing: "0.1em",
                    textTransform: "uppercase", color: "var(--muted)",
                  }}>
                    Expense Claims Against This Advance
                  </span>
                  <span style={{
                    fontSize: 9, fontWeight: 700, color: "var(--muted)",
                    background: "var(--card)", border: "1px solid var(--border)",
                    borderRadius: 20, padding: "1px 7px", flexShrink: 0,
                  }}>
                    {claims.length}
                  </span>
                </div>

                {/* Scrollable table region */}
                <div className="eadv-claims-scroll">
                  <div role="table" aria-label="Expense claims against this advance">
                    {/* Column headers */}
                    <div
                      className="eadv-claim-grid"
                      role="row"
                      style={{ padding: "6px 14px", borderBottom: "1px solid var(--border)", background: "var(--bg)" }}
                    >
                      {COLS.map((col, i) => (
                        <span key={col} role="columnheader" style={{
                          fontSize: 9, fontWeight: 700,
                          textTransform: "uppercase", letterSpacing: "0.07em",
                          color: "var(--muted)",
                          textAlign: i >= 3 ? "right" : "left",
                        }}>
                          {col}
                        </span>
                      ))}
                    </div>

                    {/* Rows */}
                    {visibleClaims.map((ec, i) => {
                      const remaining = (ec.advance_paid ?? 0) - (ec.allocated_amount ?? 0);
                      const reason    = ec.claim_title || ec.description || "—";
                      const isLast    = i === visibleClaims.length - 1 && !hasMore;

                      return (
                        <div
                          key={ec.name}
                          className="eadv-claim-grid adv-claim-row"
                          role="row"
                          style={{
                            padding: "9px 14px",
                            borderBottom: isLast ? "none" : "1px solid var(--border)",
                            background: "var(--card)",
                          }}
                        >
                          <span role="cell" style={{
                            fontSize: 11, fontWeight: 700,
                            color: "var(--primary)", fontFamily: "monospace",
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          }}>
                            {ec.parent}
                          </span>
                          <span
                            role="cell"
                            title={reason}
                            style={{
                              fontSize: 11, color: "var(--muted)",
                              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                              paddingRight: 8,
                            }}
                          >
                            {reason}
                          </span>
                          <span role="cell" style={{ fontSize: 11, color: "var(--muted)", whiteSpace: "nowrap" }}>
                            {fmtDate(ec.expense_posting_date)}
                          </span>
                          <span role="cell" style={{
                            fontSize: 12, fontWeight: 700, color: "#059669",
                            textAlign: "right", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap",
                          }}>
                            {fmt(ec.allocated_amount, currency)}
                          </span>
                          <span role="cell" style={{
                            fontSize: 12, fontWeight: 700,
                            color: remaining > 0 ? "#dc2626" : "var(--muted)",
                            textAlign: "right", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap",
                          }}>
                            {fmt(remaining, currency)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* View More / Less */}
                {hasMore && (
                  <div style={{ borderTop: "1px solid var(--border)" }}>
                    <button
                      className="adv-viewmore-btn"
                      onClick={() => setShowAllClaims((v) => !v)}
                      aria-expanded={showAllClaims}
                      aria-label={showAllClaims ? "Show fewer claims" : `Show all ${claims.length} claims`}
                      style={{
                        width: "100%", padding: "8px 14px",
                        background: "var(--bg)", border: "none",
                        cursor: "pointer", display: "flex",
                        alignItems: "center", justifyContent: "center",
                        gap: 5, color: "var(--primary)",
                        fontSize: 11, fontWeight: 700, transition: "background .12s",
                      }}
                    >
                      {showAllClaims ? (
                        <>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden="true"
                            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <polyline points="18 15 12 9 6 15" />
                          </svg>
                          Show Less
                        </>
                      ) : (
                        <>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden="true"
                            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                          View {claims.length - CLAIMS_PREVIEW} More
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div style={{
                textAlign: "center", padding: "28px 14px",
                border: "1px dashed var(--border)", borderRadius: 10,
                color: "var(--muted)", marginBottom: 16,
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true"
                  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
                  style={{ marginBottom: 8, opacity: 0.5 }}>
                  <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                  <rect x="9" y="3" width="6" height="4" rx="1" />
                  <line x1="9" y1="12" x2="15" y2="12" />
                  <line x1="9" y1="16" x2="13" y2="16" />
                </svg>
                <p style={{ fontSize: 12, fontWeight: 500 }}>No expense claims yet</p>
                <p style={{ fontSize: 11, marginTop: 3 }}>No claims have been made against this advance</p>
              </div>
            )}
          </>
        )}

        {!loading && !data && (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            height: "100%", minHeight: 200, color: "var(--muted)", textAlign: "center", padding: "24px 16px",
          }}>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden="true"
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
              style={{ marginBottom: 10, opacity: 0.5 }}>
              <circle cx="12" cy="12" r="9" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Advance not found</p>
            <p style={{ fontSize: 12, marginTop: 4, maxWidth: 280 }}>
              This advance could not be loaded. It may have been removed or the link is invalid.
            </p>
            <button
              onClick={onBack}
              style={{
                marginTop: 14, padding: "7px 16px", borderRadius: 8,
                border: "1px solid var(--border)", background: "var(--card)",
                color: "var(--text)", fontSize: 12, fontWeight: 600, cursor: "pointer",
              }}
            >
              Go back
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeAdvanceDetailView;