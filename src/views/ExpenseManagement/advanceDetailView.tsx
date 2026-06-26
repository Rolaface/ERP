import React from "react";

export interface ExpenseClaimEntry {
  name: string;
  parent: string;
  posting_date: string;
  advance_paid: number;
  allocated_amount: number;
  unclaimed_amount: number;
  return_amount: number;
  advance_account: string;
  exchange_rate: number;
  docstatus: number;
}

export interface EmployeeAdvanceDetail {
  name: string;
  employee: string;
  employee_name: string;
  posting_date: string;
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
  open: boolean;
  data: EmployeeAdvanceDetail | null;
  loading?: boolean;
  onClose: () => void;
}

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

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  draft:     { bg: "#f3f4f6", color: "#6b7280" },
  unpaid:    { bg: "#fef3c7", color: "#d97706" },
  paid:      { bg: "#d1fae5", color: "#059669" },
  cancelled: { bg: "#fee2e2", color: "#dc2626" },
};

const F: React.FC<{ label: string; value?: string | number | null; mono?: boolean }> = ({
  label,
  value,
  mono,
}) => (
  <div>
    <p style={{ fontSize: 9, color: "var(--muted)", textTransform: "uppercase",
      letterSpacing: "0.07em", fontWeight: 700, marginBottom: 1 }}>
      {label}
    </p>
    <p style={{ fontSize: 13, color: value != null ? "var(--text)" : "var(--muted)",
      fontWeight: 500, fontFamily: mono ? "monospace" : undefined, lineHeight: 1.3 }}>
      {value ?? "—"}
    </p>
  </div>
);

const S: React.FC<{ title: string }> = ({ title }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "12px 0 7px" }}>
    <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.1em",
      textTransform: "uppercase", color: "var(--muted)", whiteSpace: "nowrap" }}>
      {title}
    </span>
    <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
  </div>
);

const AmountCard: React.FC<{ label: string; value: number; currency: string; highlight?: boolean }> = ({
  label, value, currency, highlight,
}) => (
  <div style={{ padding: "9px 11px", borderRadius: 7,
    background: highlight ? "var(--primary)" : "var(--bg)",
    border: highlight ? "none" : "1px solid var(--border)" }}>
    <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.08em",
      textTransform: "uppercase", marginBottom: 2,
      color: highlight ? "rgba(255,255,255,0.7)" : "var(--muted)" }}>
      {label}
    </p>
    <p style={{ fontSize: 15, fontWeight: 800, letterSpacing: "-0.02em",
      color: highlight ? "#fff" : "var(--text)" }}>
      {fmt(value, currency)}
    </p>
  </div>
);

const EmployeeAdvanceDetailModal: React.FC<Props> = ({ open, data, loading, onClose }) => {
  if (!open) return null;

  const statusKey = data?.status?.toLowerCase() ?? "draft";
  const statusStyle = STATUS_COLORS[statusKey] ?? STATUS_COLORS.draft;
  const currency = data?.currency ?? "INR";

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, zIndex: 999,
          background: "rgba(0,0,0,0.4)", backdropFilter: "blur(2px)",
          animation: "idm-fade .15s ease" }}
      />

      {/* Drawer */}
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 1000,
        width: "min(560px, 100vw)", background: "var(--card)", color: "var(--text)",
        display: "flex", flexDirection: "column",
        boxShadow: "-6px 0 32px rgba(0,0,0,0.15)",
        animation: "idm-slide .2s cubic-bezier(.4,0,.2,1)", overflow: "hidden" }}>

        <style>{`
          @keyframes idm-fade  { from{opacity:0}to{opacity:1} }
          @keyframes idm-slide { from{transform:translateX(48px);opacity:0}to{transform:translateX(0);opacity:1} }
          @keyframes idm-spin  { to{transform:rotate(360deg)} }
        `}</style>

        {/* ── HEADER ── */}
        <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "var(--card)", flexShrink: 0 }}>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: 7,
              background: "var(--primary)", display: "flex",
              alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <path d="M8 21h8M12 17v4" />
              </svg>
            </div>
            <div style={{ lineHeight: 1 }}>
              <p style={{ fontSize: 9, color: "var(--muted)", fontWeight: 700,
                textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2 }}>
                Employee Advance
              </p>
              <p style={{ fontSize: 15, fontWeight: 800, color: "var(--text)" }}>
                {data?.name ?? "—"}
              </p>
            </div>
            <span style={{ display: "inline-flex", alignItems: "center",
              padding: "2px 9px", borderRadius: 20, fontSize: 10, fontWeight: 700,
              background: statusStyle.bg, color: statusStyle.color }}>
              {data?.status ?? "Draft"}
            </span>
          </div>

          <button
            onClick={onClose}
            style={{ width: 26, height: 26, borderRadius: 6,
              border: "1px solid var(--border)", background: "transparent",
              cursor: "pointer", display: "flex", alignItems: "center",
              justifyContent: "center", color: "var(--muted)" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* ── BODY ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "10px 14px" }}>

          {loading && (
            <div style={{ display: "flex", alignItems: "center",
              justifyContent: "center", height: 180, gap: 10, color: "var(--muted)" }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
                stroke="var(--primary)" strokeWidth="2"
                style={{ animation: "idm-spin 1s linear infinite" }}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              <span style={{ fontSize: 13 }}>Loading...</span>
            </div>
          )}

          {!loading && data && (
            <>
              {/* ── AMOUNT CARDS ── */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6, marginBottom: 2 }}>
                <AmountCard label="Advance Amount" value={data.advance_amount} currency={currency} highlight />
                <AmountCard label="Paid Amount"    value={data.paid_amount}    currency={currency} />
                <AmountCard label="Pending Amount" value={data.pending_amount} currency={currency} />
              </div>

              {/* ── EMPLOYEE ── */}
              <S title="Employee Details" />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
                <F label="Employee ID"   value={data.employee} mono />
                <F label="Employee Name" value={data.employee_name} />
                <F label="Department"    value={data.department} />
              </div>

              {/* ── ADVANCE INFO ── */}
              <S title="Advance Information" />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
                <F label="Posting Date"     value={fmtDate(data.posting_date)} />
                <F label="Currency"         value={data.currency} />
                <F label="Mode of Payment"  value={data.mode_of_payment} />
                <F label="Advance Account"  value={data.advance_account} mono />
                <F label="Company"          value={data.company} />
                <F label="Repay from Salary" value={data.repay_unclaimed_amount_from_salary ? "Yes" : "No"} />
              </div>
              <div style={{ marginTop: 8 }}>
                <F label="Purpose" value={data.purpose} />
              </div>

              {/* ── FINANCIAL SUMMARY ── */}
              <S title="Financial Summary" />
              <div style={{ borderRadius: 7, overflow: "hidden", border: "1px solid var(--border)" }}>
                {[
                  { label: "Advance Amount",  value: data.advance_amount },
                  { label: "Paid Amount",     value: data.paid_amount },
                  { label: "Claimed Amount",  value: data.claimed_amount },
                  { label: "Return Amount",   value: data.return_amount },
                  { label: "Pending Amount",  value: data.pending_amount },
                ].map(({ label, value }, i) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between",
                    alignItems: "center", padding: "7px 10px",
                    borderTop: i > 0 ? "1px solid var(--border)" : "none",
                    background: i % 2 === 0 ? "var(--card)" : "var(--bg)" }}>
                    <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600,
                      textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      {label}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)",
                      fontVariantNumeric: "tabular-nums" }}>
                      {fmt(value, currency)}
                    </span>
                  </div>
                ))}
              </div>

              {/* ── LINKED EXPENSE CLAIMS ── */}
              {Array.isArray(data.expense_claims) && data.expense_claims.length > 0 && (
                <>
                  <S title="Linked Expense Claims" />
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {data.expense_claims.map((ec, i) => (
                      <div
                        key={ec.name}
                        style={{
                          borderRadius: 7,
                          border: "1px solid var(--border)",
                          overflow: "hidden",
                        }}
                      >
                        {/* Claim header */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "7px 10px",
                            background: "var(--bg)",
                            borderBottom: "1px solid var(--border)",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span
                              style={{
                                fontSize: 9,
                                fontWeight: 800,
                                color: "var(--muted)",
                                textTransform: "uppercase",
                                letterSpacing: "0.07em",
                              }}
                            >
                              #{i + 1}
                            </span>
                            <span
                              style={{
                                fontSize: 12,
                                fontWeight: 700,
                                color: "var(--primary)",
                                fontFamily: "monospace",
                              }}
                            >
                              {ec.parent}
                            </span>
                          </div>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 600,
                              color: "var(--muted)",
                            }}
                          >
                            {fmtDate(ec.posting_date)}
                          </span>
                        </div>

                        {/* Claim amounts grid */}
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(3, 1fr)",
                            borderBottom: "1px solid var(--border)",
                          }}
                        >
                          {[
                            { label: "Advance Paid",  value: ec.advance_paid },
                            { label: "Allocated",     value: ec.allocated_amount },
                            { label: "Unclaimed",     value: ec.unclaimed_amount },
                          ].map(({ label, value }, j) => (
                            <div
                              key={label}
                              style={{
                                padding: "7px 10px",
                                borderRight: j < 2 ? "1px solid var(--border)" : "none",
                              }}
                            >
                              <p
                                style={{
                                  fontSize: 9,
                                  fontWeight: 700,
                                  textTransform: "uppercase",
                                  letterSpacing: "0.07em",
                                  color: "var(--muted)",
                                  marginBottom: 2,
                                }}
                              >
                                {label}
                              </p>
                              <p
                                style={{
                                  fontSize: 12,
                                  fontWeight: 700,
                                  color: "var(--text)",
                                  fontVariantNumeric: "tabular-nums",
                                }}
                              >
                                {fmt(value, currency)}
                              </p>
                            </div>
                          ))}
                        </div>

                        {/* Account row */}
                        <div style={{ padding: "6px 10px", background: "var(--card)" }}>
                          <span
                            style={{
                              fontSize: 9,
                              fontWeight: 700,
                              textTransform: "uppercase",
                              letterSpacing: "0.07em",
                              color: "var(--muted)",
                            }}
                          >
                            Account:{" "}
                          </span>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              color: "var(--text)",
                              fontFamily: "monospace",
                            }}
                          >
                            {ec.advance_account}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div style={{ height: 12 }} />
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default EmployeeAdvanceDetailModal;