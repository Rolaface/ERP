import React from "react";

interface Props {
  declaration: any; // Passed from parent
  onClose: () => void;
  onViewPdf?: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n?: number | string, currency = "USD") => {
  const num = typeof n === "string" ? parseFloat(n) : n ?? 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(num);
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
      margin: "24px 0 12px",
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
const DeclarationDetailsDrawer: React.FC<Props> = ({
  declaration,
  onClose,
  onViewPdf,
}) => {
  // Dummy data mapped from the screenshot for display purposes
  const totalAmount = 296865.6;
  const items = [
    {
      name: "BAKED BEANS",
      qty: "19,946",
      weight: "19,945.57",
      total: 296865.6,
      hsCode: "20055900000",
      map: "BEAN-001 - Baked Beans 400g",
      status: "approved",
    },
    {
      name: "TOMATO SAUCE",
      qty: "10,000",
      weight: "9,950.00",
      total: 150000.0,
      hsCode: "21032000000",
      map: "TMS-002 - Tomato Sauce 500ml",
      status: "approved",
    },
    {
      name: "SUGAR",
      qty: "5,000",
      weight: "4,998.00",
      total: 75000.0,
      hsCode: "17019900000",
      map: "SUG-001 - Sugar 50kg",
      status: "rejected",
      error: "Weight variance exceeds 5% tolerance vs mapped item",
    },
  ];

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
          width: "min(520px, 100vw)",
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
          .pidm-btn {
            display:inline-flex; align-items:center; gap:5px;
            padding:5px 11px; border-radius:6px; font-size:12px; font-weight:600;
            cursor:pointer; border:none; transition:opacity .12s,transform .1s; white-space:nowrap;
          }
          .pidm-btn:hover  { opacity:.85; transform:translateY(-1px) }
          .pidm-btn:active { transform:translateY(0) }
          .pidm-pill {
            padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; border: 1px solid transparent;
          }
        `}</style>

        {/* ── HEADER ── */}
        <div
          style={{
            padding: "12px 16px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "var(--bg)",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 7,
                background: "var(--primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {/* Package Icon */}
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
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                <line x1="12" y1="22.08" x2="12" y2="12"></line>
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
                  marginBottom: 3,
                }}
              >
                Declaration
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <p
                  style={{
                    fontSize: 15,
                    fontWeight: 800,
                    color: "var(--text)",
                  }}
                >
                  {declaration?.id ?? "C3460-2019-TZDL"}
                </p>
                <span
                  style={{
                    padding: "2px 8px",
                    fontSize: 10,
                    fontWeight: 600,
                    borderRadius: 20,
                    background: "var(--warning)",
                    color: "#fff",
                  }}
                >
                  Partially Approved
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              className="pidm-btn"
              onClick={onViewPdf}
              style={{ background: "var(--primary)", color: "#fff" }}
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
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              PDF
            </button>

            <button
              onClick={onClose}
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                border: "1px solid var(--border)",
                background: "var(--card)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--muted)",
              }}
            >
              <svg
                width="14"
                height="14"
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
            padding: "16px 20px",
            position: "relative",
          }}
        >
          {/* ── SUMMARY CARDS ── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 1fr 1fr",
              gap: 8,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                padding: "12px 14px",
                borderRadius: 8,
                background: "var(--primary)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <p
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.7)",
                  marginBottom: 4,
                }}
              >
                Total Amount
              </p>
              <p
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: "#fff",
                  letterSpacing: "-0.02em",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {fmt(totalAmount)}
              </p>
            </div>
            <div
              style={{
                padding: "12px 14px",
                borderRadius: 8,
                background: "var(--bg)",
                border: "1px solid var(--border)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <p
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--muted)",
                  marginBottom: 4,
                }}
              >
                Declaration Date
              </p>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>
                {declaration?.declDate ?? "20 Nov 2023"}
              </p>
            </div>
            <div
              style={{
                padding: "12px 14px",
                borderRadius: 8,
                background: "var(--bg)",
                border: "1px solid var(--border)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <p
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--muted)",
                  marginBottom: 4,
                }}
              >
                Posted Date
              </p>
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--text)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {declaration?.postedDate ?? "30 Nov 2023, 10:45"}
              </p>
            </div>
          </div>

          {/* ── SUPPLIER & TRANSACTION INFO ── */}
          <S title="Supplier & Transaction" />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px 12px",
            }}
          >
            <F label="Supplier" value="ODERICH CONSERVA QUALIDADE BRASIL" />
            <F label="Agent" value="BN METRO Ltd" />
            <F label="Task Code" value="2239078" />
            <F label="Exchange Rate" value="929.79" />
            <F label="Origin / Export" value="BR / BR" />
            <F label="Reviewed By" value="Mary Mukuka" />
          </div>

          {/* ── IMPORTED ITEMS ── */}
          <S title="Imported Items (3)" />
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Header Row */}
            <div
              style={{
                display: "flex",
                padding: "0 10px",
                fontSize: 9,
                fontWeight: 800,
                color: "var(--muted)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              <div style={{ flex: 1 }}>Item</div>
              <div style={{ width: 60, textAlign: "right" }}>Qty</div>
              <div style={{ width: 80, textAlign: "right" }}>Weight</div>
              <div style={{ width: 100, textAlign: "right" }}>Total</div>
            </div>

            {/* Item Rows */}
            {items.map((it, idx) => (
              <div
                key={idx}
                style={{
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: "12px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span
                    style={{
                      flex: 1,
                      fontWeight: 800,
                      fontSize: 13,
                      color: "var(--text)",
                    }}
                  >
                    {it.name}
                  </span>
                  <span
                    style={{
                      width: 60,
                      textAlign: "right",
                      fontSize: 13,
                      color: "var(--muted)",
                    }}
                  >
                    {it.qty}
                  </span>
                  <span
                    style={{
                      width: 80,
                      textAlign: "right",
                      fontSize: 13,
                      color: "var(--muted)",
                    }}
                  >
                    {it.weight}
                  </span>
                  <span
                    style={{
                      width: 100,
                      textAlign: "right",
                      fontSize: 13,
                      fontWeight: 800,
                      color: "var(--text)",
                    }}
                  >
                    {fmt(it.total)}
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    className="pidm-pill"
                    style={{
                      background: "var(--card)",
                      borderColor: "var(--border)",
                      color: "var(--muted)",
                      textTransform: "none",
                      fontFamily: "monospace",
                    }}
                  >
                    {it.hsCode}
                  </span>
                  <span
                    className="pidm-pill"
                    style={{
                      background: "var(--card)",
                      borderColor: "var(--border)",
                      color: "var(--muted)",
                      textTransform: "none",
                    }}
                  >
                    {it.map}
                  </span>
                  <span
                    className="pidm-pill"
                    style={{
                      background:
                        it.status === "approved"
                          ? "rgba(16, 185, 129, 0.1)"
                          : "rgba(239, 68, 68, 0.1)",
                      color:
                        it.status === "approved"
                          ? "var(--success)"
                          : "var(--danger)",
                      borderColor:
                        it.status === "approved"
                          ? "rgba(16, 185, 129, 0.2)"
                          : "rgba(239, 68, 68, 0.2)",
                    }}
                  >
                    {it.status}
                  </span>
                </div>

                {it.error && (
                  <div
                    style={{
                      marginTop: 4,
                      padding: "8px 10px",
                      background: "rgba(239, 68, 68, 0.05)",
                      border: "1px solid rgba(239, 68, 68, 0.2)",
                      borderRadius: 6,
                      color: "var(--danger)",
                      fontSize: 11,
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    {it.error}
                  </div>
                )}
              </div>
            ))}

            {/* ── GRAND TOTALS ── */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                marginTop: 8,
                padding: "0 10px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 12,
                  color: "var(--muted)",
                }}
              >
                <span>Total Weight (KGM)</span>
                <span style={{ fontWeight: 600 }}>34,893.57</span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 12,
                  color: "var(--muted)",
                }}
              >
                <span>Package Count</span>
                <span style={{ fontWeight: 600 }}>5,222</span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 13,
                  marginTop: 6,
                  paddingTop: 12,
                  borderTop: "1px solid var(--border)",
                }}
              >
                <span style={{ fontWeight: 800, color: "var(--text)" }}>
                  Total Amount
                </span>
                <span style={{ fontWeight: 800, color: "var(--text)" }}>
                  {fmt(totalAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* ── ACTIVITY LOG ── */}
          <S title="Activity Log" />
          <div
            style={{
              border: "1px solid var(--border)",
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            {[
              { label: "Fetched from ASYCUDA", val: "20 Nov 2023" },
              { label: "Reviewed By", val: "Mary Mukuka" },
            ].map((log, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  background: "var(--card)",
                  borderBottom: idx === 0 ? "1px solid var(--border)" : "none",
                }}
              >
                <div
                  style={{
                    width: "40%",
                    padding: "10px 12px",
                    background: "var(--bg)",
                    borderRight: "1px solid var(--border)",
                    fontSize: 11,
                    fontWeight: 600,
                    color: "var(--muted)",
                  }}
                >
                  {log.label}
                </div>
                <div
                  style={{
                    width: "60%",
                    padding: "10px 12px",
                    fontSize: 12,
                    fontWeight: 500,
                    color: "var(--text)",
                  }}
                >
                  {log.val}
                </div>
              </div>
            ))}
          </div>

          <div style={{ height: 24 }} />
        </div>
      </div>
    </>
  );
};

export default DeclarationDetailsDrawer;