import React, { useState } from "react";
import { ERP_BASE } from "../../config/api";
import { getGLNameWithoutAbbreviation } from "../../api/utils/glAccountUtils";

interface ExpenseItem {
  name: string;
  expense_date?: string;
  expense_type?: string;
  default_account?: string;
  description?: string;
  amount?: number;
  base_amount?: number;
  sanctioned_amount?: number;
  base_sanctioned_amount?: number;
}

interface ExpenseAttachment {
  name: string;
  file_name: string;
  file_url: string;
  file_size?: number;
  file_type?: string;
  is_private?: number;
  creation?: string;
}

interface ExpenseClaim {
  name?: string;
  employee?: string;
  employee_name?: string;
  company?: string;
  expense_approver?: string;
  approval_status?: string;
  status?: string;
  currency?: string;
  exchange_rate?: number;
  total_claimed_amount?: number;
  total_sanctioned_amount?: number;
  total_advance_amount?: number;
  grand_total?: number;
  total_amount_reimbursed?: number;
  total_taxes_and_charges?: number;
  base_total_claimed_amount?: number;
  base_total_sanctioned_amount?: number;
  base_total_advance_amount?: number;
  base_grand_total?: number;
  base_total_taxes_and_charges?: number;
  posting_date?: string;
  creation?: string;
  modified?: string;
  modified_by?: string;
  is_paid?: number | boolean;
  payable_account?: string;
  cost_center?: string;
  remark?: string;
  naming_series?: string;
  docstatus?: number;
  doctype?: string;
  expenses?: ExpenseItem[];
  taxes?: any[];
  advances?: any[];
  attachments?: ExpenseAttachment[];
  comments?: string;
}

interface Props {
  open?: boolean;
  expenseData?: ExpenseClaim | null;
  loading?: boolean;
  onClose?: () => void;
  onBack?: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n?: number | null, currency = "INR") => {
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

const fmtDate = (d?: string | null) => {
  if (!d) return "—";
  const dt = new Date(d);
  return isNaN(dt.getTime())
    ? d
    : dt.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

const fmtSize = (bytes?: number) => {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
const stripHtml = (html: string) => {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent ?? tmp.innerText ?? html;
};
const resolveFileUrl = (url: string) => {
  if (!url) return "#";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${ERP_BASE}${url.startsWith("/") ? "" : "/"}${url}`;
};

const STATUS_MAP: Record<string, string> = {
  Draft: "#f59e0b",
  Approved: "#10b981",
  Rejected: "#ef4444",
  Paid: "#3b82f6",
  Submitted: "#6366f1",
  Cancelled: "#6b7280",
};

const STATUS_BG: Record<string, string> = {
  Draft: "rgba(245,158,11,0.12)",
  Approved: "rgba(16,185,129,0.12)",
  Rejected: "rgba(239,68,68,0.12)",
  Paid: "rgba(59,130,246,0.12)",
  Submitted: "rgba(99,102,241,0.12)",
  Cancelled: "rgba(107,114,128,0.12)",
};

const STATUS_LABEL: Record<string, string> = {
  Draft: "Pending for Approval",
  Approved: "Approved",
  Rejected: "Rejected",
  Paid: "Paid",
  Submitted: "Submitted",
  Cancelled: "Cancelled",
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


const ExpenseClaimDetailView: React.FC<Props> = ({
  open,
  expenseData,
  loading,
  onClose,
  onBack,
}) => {
  const handleClose = onClose ?? onBack;

  if (open === false) return null;

  const downloadFile = (fileName: string, fileUrl: string) => {
    const a = document.createElement("a");
    a.href = resolveFileUrl(fileUrl);
    a.download = fileName;
    // a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const claim: ExpenseClaim = expenseData ?? {};
  const currency = claim.currency ?? "INR";
  const expenses = claim.expenses ?? [];
  const taxes = claim.taxes ?? [];
  const advances = claim.advances ?? [];
  const attachments = claim.attachments ?? [];
  const comments: { comment: string; by: string; name: string }[] = (() => {
  try {
    return JSON.parse((claim as any).comments ?? "[]");
  } catch {
    return [];
  }
})();
  const approvalStatus = claim.approval_status ?? claim.status ?? "Draft";
  const approvalLabel = STATUS_LABEL[approvalStatus] ?? approvalStatus;
  const statusColor = STATUS_MAP[approvalStatus] ?? STATUS_MAP["Draft"];
  const statusBg = STATUS_BG[approvalStatus] ?? STATUS_BG["Draft"];

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 999,
          background: "rgba(0,0,0,0.4)",
          backdropFilter: "blur(2px)",
          animation: "ecv-fade .15s ease",
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
          animation: "ecv-slide .2s cubic-bezier(.4,0,.2,1)",
          overflow: "hidden",
        }}
      >
        <style>{`
          @keyframes ecv-fade  { from{opacity:0} to{opacity:1} }
          @keyframes ecv-slide { from{transform:translateX(48px);opacity:0} to{transform:translateX(0);opacity:1} }
          @keyframes ecv-spin  { to{transform:rotate(360deg)} }
          .ecv-btn {
            display:inline-flex; align-items:center; gap:5px;
            padding:5px 11px; border-radius:6px; font-size:12px; font-weight:600;
            cursor:pointer; border:none; transition:opacity .12s,transform .1s; white-space:nowrap;
          }
          .ecv-btn:hover  { opacity:.85; transform:translateY(-1px) }
          .ecv-btn:active { transform:translateY(0) }
          .ecv-irow { transition: background .1s }
          .ecv-irow:hover { background: var(--row-hover) }
          .ecv-att-row { cursor:pointer; transition: background .1s }
          .ecv-att-row:hover { background: var(--row-hover) }
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
                <polyline points="10 9 9 9 8 9" />
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
                Expense Claim
              </p>
              <p
                style={{ fontSize: 15, fontWeight: 800, color: "var(--text)" }}
              >
                {claim.name ?? "—"}
              </p>
            </div>

            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "2px 9px",
                borderRadius: 20,
                fontSize: 10,
                fontWeight: 700,
                color: statusColor,
                background: statusBg,
                border: `1px solid ${statusColor}33`,
              }}
            >
              {approvalLabel}
            </span>
          </div>

          <button
            onClick={handleClose}
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
                style={{ animation: "ecv-spin 1s linear infinite" }}
              >
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              <span style={{ fontSize: 13 }}>Loading...</span>
            </div>
          )}

          {!loading && (
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
                    {fmt(claim.grand_total, currency)}
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
                    Claimed
                  </p>
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: "var(--text)",
                    }}
                  >
                    {fmt(claim.total_claimed_amount, currency)}
                  </p>
                </div>
              </div>

              {/* ── EMPLOYEE & CLAIM INFO ── */}
              <S title="Employee & Claim" />
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 8,
                  marginBottom: 7,
                }}
              >
                <F label="Employee Name" value={claim.employee_name} />
                <F label="Employee ID" value={claim.employee} mono />
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4,1fr)",
                  gap: 8,
                  marginTop: 7,
                }}
              >
                <F label="Posting Date" value={fmtDate(claim.posting_date)} />
                <F label="Currency" value={currency} />
              </div>

              {/* ── STATUS ── */}
              <S title="Status" />
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4,1fr)",
                  gap: 8,
                }}
              >
                <F label="Approval" value={approvalLabel} />
                <F label="Payment" value={claim.status} />
                <F
                  label="Approver"
                  value={claim.expense_approver || "Not Assigned"}
                />
              </div>

              {claim.remark && (
                <div
                  style={{
                    marginTop: 9,
                    padding: "7px 10px",
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
                    Remark
                  </p>
                  <p
                    style={{
                      fontSize: 12,
                      color: "var(--text)",
                      lineHeight: 1.5,
                    }}
                  >
                    {claim.remark}
                  </p>
                </div>
              )}

              {/* ── EXPENSE LINE ITEMS ── */}
              <S title={`Line Items (${expenses.length})`} />
              {expenses.length === 0 ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "28px 0",
                    gap: 6,
                    color: "var(--muted)",
                    border: "1px dashed var(--border)",
                    borderRadius: 7,
                  }}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    opacity={0.35}
                  >
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                  </svg>
                  <p style={{ fontSize: 11, fontStyle: "italic" }}>
                    No expense line items
                  </p>
                </div>
              ) : (
                <div
                  style={{
                    borderRadius: 7,
                    overflow: "hidden",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "minmax(0,2fr) 90px 80px 80px",
                      padding: "6px 10px",
                      background: "var(--table-head, var(--bg))",
                      color: "var(--table-head-text, var(--muted))",
                      fontSize: 9,
                      fontWeight: 800,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      gap: 4,
                    }}
                  >
                    <span>EXpense</span>
                    <span style={{ textAlign: "right" }}>Expense Date</span>
                    <span style={{ textAlign: "right" }}>Claimed</span>
                    <span style={{ textAlign: "right" }}>Sanctioned</span>
                  </div>

                  {expenses.map((item, i) => (
                    <div
                      key={item.name ?? i}
                      className="ecv-irow"
                      style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(0,2fr) 90px 80px 80px",
                        padding: "7px 10px",
                        gap: 4,
                        borderTop: "1px solid var(--border)",
                        alignItems: "start",
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
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
                          {item.expense_type ?? "—"}
                        </p>
                        {item.description && (
                          <p
                            style={{
                              fontSize: 10,
                              color: "var(--muted)",
                              marginTop: 1,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {item.description}
                          </p>
                        )}
                        {item.default_account && (
                          <span
                            style={{
                              display: "inline-block",
                              marginTop: 3,
                              fontSize: 9,
                              background: "var(--bg)",
                              border: "1px solid var(--border)",
                              borderRadius: 4,
                              padding: "1px 5px",
                              color: "var(--muted)",
                              fontFamily: "monospace",
                            }}
                          >
                            {getGLNameWithoutAbbreviation(item.default_account)}
                          </span>
                        )}
                      </div>

                      <p
                        style={{
                          fontSize: 11,
                          textAlign: "right",
                          color: "var(--muted)",
                          paddingTop: 1,
                        }}
                      >
                        {fmtDate(item.expense_date)}
                      </p>

                      <p
                        style={{
                          fontSize: 12,
                          textAlign: "right",
                          color: "var(--text)",
                          fontVariantNumeric: "tabular-nums",
                          paddingTop: 1,
                        }}
                      >
                        {fmt(item.amount, currency)}
                      </p>

                      <p
                        style={{
                          fontSize: 12,
                          textAlign: "right",
                          fontWeight: 700,
                          color:
                            (item.sanctioned_amount ?? 0) < (item.amount ?? 0)
                              ? "var(--danger, #ef4444)"
                              : "var(--text)",
                          fontVariantNumeric: "tabular-nums",
                          paddingTop: 1,
                        }}
                      >
                        {fmt(item.sanctioned_amount, currency)}
                      </p>
                    </div>
                  ))}

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
                        label: "Total Claimed",
                        val: fmt(claim.total_claimed_amount, currency),
                      },
                      {
                        label: "Total Sanctioned",
                        val: fmt(claim.total_sanctioned_amount, currency),
                      },
                      {
                        label: "Advance Amount",
                        val: fmt(claim.total_advance_amount, currency),
                      },
                      {
                        label: "Taxes & Charges",
                        val: fmt(claim.total_taxes_and_charges, currency),
                      },
                      {
                        label: "Grand Total",
                        val: fmt(claim.base_grand_total, currency),
                        big: true,
                      },
                    ].map(({ label, val, big }) => (
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
                            color: "var(--text)",
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {val}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {advances.length > 0 && (
                <>
                  <S title="Advances" />
                  <div
                    style={{
                      borderRadius: 7,
                      overflow: "hidden",
                      border: "1px solid var(--border)",
                    }}
                  >
                    {advances.map((adv: any, i: number) => (
  <div
    key={adv.name ?? i}
    className="ecv-irow"
    style={{
      padding: "7px 10px",
      borderTop: i > 0 ? "1px solid var(--border)" : "none",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    }}
  >
    <p
      style={{
        fontSize: 12,
        fontWeight: 600,
        color: "var(--text)",
      }}
    >
      {adv.employee_advance ?? "Advance"}
    </p>
    {adv.allocated_amount != null && (
      <p
        style={{
          fontSize: 12,
          color: "var(--text)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {fmt(adv.allocated_amount, currency)}
      </p>
    )}
    {adv.purpose && (
      <p
        style={{
          fontSize: 11,
          color: "var(--muted)",
          fontStyle: "italic",
        }}
      >
        {adv.purpose}
      </p>
    )}
  </div>
))}
                  </div>
                </>
              )}

              {/* ── TAXES ── */}
              {taxes.length > 0 && (
                <>
                  <S title="Taxes & Charges" />
                  <div
                    style={{
                      borderRadius: 7,
                      overflow: "hidden",
                      border: "1px solid var(--border)",
                    }}
                  >
                    {taxes.map((tax: any, i: number) => (
                      <div
                        key={tax.name ?? i}
                        className="ecv-irow"
                        style={{
                          padding: "7px 10px",
                          borderTop: i > 0 ? "1px solid var(--border)" : "none",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <p
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: "var(--text)",
                          }}
                        >
                          {tax.description ?? tax.name ?? "Tax"}
                        </p>
                        {tax.tax_amount != null && (
                          <p
                            style={{
                              fontSize: 12,
                              color: "var(--text)",
                              fontVariantNumeric: "tabular-nums",
                            }}
                          >
                            {fmt(tax.tax_amount, currency)}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* ── ATTACHMENTS ── */}
              {attachments.length > 0 && (
                <>
                  <S title={`Attachments (${attachments.length})`} />
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 5 }}
                  >
                    {attachments.map((att) => (
                      <div
                        key={att.name}
                        className="ecv-att-row"
                        onClick={() =>
                          downloadFile(att.file_name, att.file_url)
                        }
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 9,
                          padding: "7px 10px",
                          borderRadius: 7,
                          border: "1px solid var(--border)",
                          background: "var(--bg)",
                        }}
                      >
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 7,
                            background: "var(--primary)",
                            opacity: 0.85,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <svg
                            width="15"
                            height="15"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
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
                            {att.file_name}
                          </p>
                          <div
                            style={{
                              display: "flex",
                              gap: 6,
                              marginTop: 3,
                              alignItems: "center",
                              flexWrap: "wrap",
                            }}
                          >
                            {att.file_type && (
                              <span
                                style={{
                                  fontSize: 9,
                                  fontWeight: 700,
                                  color: "var(--muted)",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.06em",
                                  background: "var(--card)",
                                  border: "1px solid var(--border)",
                                  borderRadius: 4,
                                  padding: "1px 5px",
                                }}
                              >
                                {att.file_type}
                              </span>
                            )}
                            {!!att.file_size && (
                              <span
                                style={{ fontSize: 10, color: "var(--muted)" }}
                              >
                                {fmtSize(att.file_size)}
                              </span>
                            )}
                            {att.is_private === 1 && (
                              <span
                                style={{
                                  fontSize: 9,
                                  padding: "1px 6px",
                                  borderRadius: 4,
                                  background: "rgba(239,68,68,0.08)",
                                  color: "#ef4444",
                                  fontWeight: 700,
                                  border: "1px solid rgba(239,68,68,0.2)",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 3,
                                }}
                              >
                                <svg
                                  width="8"
                                  height="8"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.5"
                                  strokeLinecap="round"
                                >
                                  <rect
                                    x="3"
                                    y="11"
                                    width="18"
                                    height="11"
                                    rx="2"
                                    ry="2"
                                  />
                                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                                Private
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Download icon (visual hint only — whole row is clickable) */}
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="var(--muted)"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{ flexShrink: 0 }}
                        >
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                      </div>
                    ))}
                  </div>
                </>
              )}
              {comments.length > 0 && (
  <>
    <S title={`Comments (${comments.length})`} />
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {comments.map((c) => (
        <div
          key={c.name}
          style={{
            padding: "8px 10px",
            borderRadius: 7,
            border: "1px solid var(--border)",
            background: "var(--bg)",
          }}
        >
          <p style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.5 }}>
             {stripHtml(c.comment)}
          </p>
          <p style={{ fontSize: 10, color: "var(--muted)", marginTop: 4 }}>
            {c.by}
          </p>
        </div>
      ))}
    </div>
  </>
)}

<div style={{ height: 12 }} />

              <div style={{ height: 12 }} />
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default ExpenseClaimDetailView;
