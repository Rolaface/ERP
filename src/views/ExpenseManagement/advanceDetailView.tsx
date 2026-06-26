import React from "react";
import ModalTable from "../../components/ui/Table/ModalTableInside";
import type { Column } from "../../components/ui/Table/type";

export interface ExpenseClaimEntry {
  name: string;
  parent: string;
  posting_date: string;
  expense_posting_date: string;
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
  expense_posting_date: string;
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
  draft: { bg: "#f3f4f6", color: "#6b7280" },
  unpaid: { bg: "#fef3c7", color: "#d97706" },
  paid: { bg: "#d1fae5", color: "#059669" },
  claimed: { bg: "#dbeafe", color: "#2563eb" },
  cancelled: { bg: "#fee2e2", color: "#dc2626" },
};

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

const EmployeeAdvanceDetailView: React.FC<Props> = ({ data, loading, onBack }) => {
  const statusKey = data?.status?.toLowerCase() ?? "draft";
  const statusStyle = STATUS_COLORS[statusKey] ?? STATUS_COLORS.draft;
  const currency = data?.currency ?? "INR";
  const claims = data?.expense_claims ?? [];

  /* ── ModalTable columns ── */
  const claimColumns: Column<ExpenseClaimEntry>[] = [
    {
      key: "parent",
      header: "Claim ID",
      render: (ec) => (
        <span style={{
          color: "var(--primary)", fontFamily: "monospace",
          fontWeight: 700, fontSize: 11,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          display: "block",
        }}>
          {ec.parent}
        </span>
      ),
    },
    {
      key: "description",
      header: "Description",
      render: (ec) => (
        <span style={{ color: "var(--muted)", fontSize: 11 }}>
          {ec.claim_title || ec.description || "—"}
        </span>
      ),
    },
    {
      key: "expense_posting_date",
      header: "Date",
      render: (ec) => (
        <span style={{ color: "var(--muted)", fontSize: 11, whiteSpace: "nowrap" }}>
          {fmtDate(ec.expense_posting_date)}
        </span>
      ),
    },
    {
      key: "allocated_amount",
      header: "Claimed",
      align: "right",
      render: (ec) => (
        <span style={{
          color: "#059669", fontWeight: 700, fontSize: 12,
          fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap",
        }}>
          {fmt(ec.allocated_amount, currency)}
        </span>
      ),
    },
    {
      key: "unclaimed_amount",
      header: "Remaining",
      align: "right",
      render: (ec) => {
        return (
          <span
            style={{
              fontWeight: 700,
              fontSize: 12,
              fontVariantNumeric: "tabular-nums",
              whiteSpace: "nowrap",
            }}
          >
            {fmt(ec.unclaimed_amount, currency)}
          </span>
        );
      },
    },
  ];

  return (
    <div className="eadv" style={{
      display: "flex", flexDirection: "column",
      height: "100%", minHeight: 0,
      background: "var(--card)", color: "var(--text)",
    }}>
      <style>{`
        .eadv, .eadv * { box-sizing: border-box; }
        @keyframes adv-spin { to { transform: rotate(360deg); } }
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

        @media (prefers-reduced-motion: reduce) {
          .eadv * { transition: none !important; animation: none !important; }
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
              {/* Identity row — employee info on left, Total Advance highlight on right */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "11px 14px",
                background: "var(--bg)",
                borderBottom: "1px solid var(--border)",
              }}>
                {/* Avatar */}
                <div style={{
                  width: 34, height: 34, borderRadius: "50%",
                  background: "var(--primary)", display: "flex",
                  alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0,
                }}>
                  {initials(data.employee_name)}
                </div>

                {/* Name + sub */}
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

                {/* ── Total Advance highlight — right side ── */}
                <div style={{
                  marginLeft: 16,
                  flexShrink: 0,
                  textAlign: "right",
                  background: "var(--primary)",
                  borderRadius: 8,
                  padding: "6px 12px",
                  alignSelf: "center",
                }}>
                  <p style={{
                    fontSize: 9, fontWeight: 700, textTransform: "uppercase",
                    letterSpacing: "0.07em", color: "rgba(255,255,255,0.7)", marginBottom: 3,
                  }}>
                    Total Advance
                  </p>
                  <p style={{
                    fontSize: 15, fontWeight: 800, color: "#fff",
                    fontVariantNumeric: "tabular-nums", lineHeight: 1.1,
                  }}>
                    {fmt(data.advance_amount, currency)}
                  </p>
                </div>
              </div>

              {/* Attributes — removed Total Advance from here since it's now in identity row */}
              <div className="eadv-attrs">
                <Field label="Advance Date" value={fmtDate(data.posting_date)} />
                <Field label="Currency" value={data.currency} />
                <Field label="Mode of Payment" value={data.mode_of_payment || "—"} />
                <Field label="Purpose" value={data.purpose || "—"} />
                <Field label="Advance Account" value={data.advance_account} mono />
              </div>
            </div>

            {/* ── EXPENSE CLAIMS via ModalTable ── */}
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

              {/* ModalTable — bounded height, no pagination needed */}
              <div style={{ maxHeight: 320 }}>
                <ModalTable<ExpenseClaimEntry>
                  columns={claimColumns}
                  data={claims}
                  rowKey={(ec) => ec.name}
                  emptyMessage="No expense claims yet"
                  totalItems={claims.length}
                  pageSize={claims.length || 10}
                />
              </div>
            </div>
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