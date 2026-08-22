import React, { useEffect, useState } from "react";
import { fetchImportedDeclarationDetail } from "../../../api/Inventory/Processimportmodal.api";
import type {
  ImportedDeclarationItemRaw,
  ImportedDeclarationDetailRaw,
} from "../../../types/inventory/ImportedItem.types";

interface Props {
  declaration: ImportedDeclarationItemRaw;
  onClose: () => void;
  onViewPdf?: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────
const fmt = (n?: number | null, currency?: string | null) => {
  if (n === null || n === undefined) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
    minimumFractionDigits: 2,
  }).format(n);
};

const num = (n?: number | null, unit?: string | null) => {
  if (n === null || n === undefined) return "—";
  return `${n.toLocaleString()}${unit ? ` ${unit}` : ""}`;
};

const formatDate = (raw?: string | null) => {
  if (!raw) return "—";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (raw?: string | null) => {
  if (!raw) return "—";
  const d = new Date(raw.replace(" ", "T"));
  if (isNaN(d.getTime())) return raw;
  const datePart = d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const timePart = d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${datePart}, ${timePart}`;
};

const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  "3": { bg: "rgba(16, 185, 129, 0.1)", text: "var(--success)" },
  "4": { bg: "rgba(239, 68, 68, 0.1)", text: "var(--danger)" },
};
const DEFAULT_STATUS_STYLE = { bg: "var(--bg)", text: "var(--muted)" };

// TODO: confirm with backend — assuming standard Frappe docstatus convention
const DOCSTATUS_LABEL: Record<
  number,
  { label: string; bg: string; text: string }
> = {
  0: { label: "Draft", bg: "var(--bg)", text: "var(--muted)" },
  1: {
    label: "Submitted",
    bg: "rgba(16, 185, 129, 0.1)",
    text: "var(--success)",
  },
  2: {
    label: "Cancelled",
    bg: "rgba(239, 68, 68, 0.1)",
    text: "var(--danger)",
  },
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

// ─── Main Component ─────────────────────────────────────────────────────────
const DeclarationDetailsDrawer: React.FC<Props> = ({
  declaration,
  onClose,
  onViewPdf,
}) => {
  const [detail, setDetail] = useState<ImportedDeclarationDetailRaw | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchImportedDeclarationDetail(declaration.name);
        if (!cancelled) setDetail(data);
      } catch (err) {
        if (!cancelled)
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load declaration details",
          );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [declaration.name]);

  const d: ImportedDeclarationItemRaw | ImportedDeclarationDetailRaw =
    detail ?? declaration;
  const statusStyle = STATUS_STYLE[d.status_code ?? ""] ?? DEFAULT_STATUS_STYLE;
  const docstatusInfo = detail ? DOCSTATUS_LABEL[detail.docstatus] : undefined;

  return (
    <>
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
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                <p
                  style={{
                    fontSize: 15,
                    fontWeight: 800,
                    color: "var(--text)",
                  }}
                >
                  {d.declaration_no}
                </p>
                {d.status && (
                  <span
                    style={{
                      padding: "2px 8px",
                      fontSize: 10,
                      fontWeight: 600,
                      borderRadius: 20,
                      background: statusStyle.bg,
                      color: statusStyle.text,
                    }}
                  >
                    {d.status}
                  </span>
                )}
                {/* {docstatusInfo && (
                  <span
                    style={{
                      padding: "2px 8px",
                      fontSize: 10,
                      fontWeight: 600,
                      borderRadius: 20,
                      background: docstatusInfo.bg,
                      color: docstatusInfo.text,
                    }}
                  >
                    {docstatusInfo.label}
                  </span>
                )} */}
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
          {error && (
            <div
              style={{
                padding: "10px 12px",
                marginBottom: 16,
                borderRadius: 8,
                background: "rgba(239, 68, 68, 0.08)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                color: "var(--danger)",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {error} — showing last known data.
            </div>
          )}

          {/* ── SUMMARY CARDS ── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 1fr 1fr",
              gap: 8,
              marginBottom: 8,
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
                Invoice Amount
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
                {isLoading ? "…" : fmt(d.invoice_amount, d.currency)}
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
              <p
                style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}
              >
                {isLoading ? "…" : formatDate(d.declaration_date)}
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
                Base Amount
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
                {isLoading ? "…" : fmt(d.base_invoice_amount)}
              </p>
            </div>
          </div>

          {/* ── TRANSACTION DETAILS ── */}
          <S title="Transaction Details" />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px 12px",
            }}
          >
            <F label="Task Code" value={d.task_code} mono />
            <F
              label="Item Sequence"
              value={d.item_sequence != null ? String(d.item_sequence) : null}
            />
            <F label="Origin Country" value={d.origin_country} />
            <F label="Export Country" value={d.export_country} />
            <F
              label="Exchange Rate"
              value={d.exchange_rate != null ? String(d.exchange_rate) : null}
            />
            <F label="Currency" value={d.currency} />
          </div>

          {/* ── SUPPLIER & AGENT ── */}
          <S title="Supplier & Agent" />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px 12px",
            }}
          >
            <F label="Supplier" value={d.supplier_name} />
            <F label="Agent" value={d.agent_name} />
          </div>

          {/* ── ITEM ── */}
          <S title="Item" />
          <div
            style={{
              background: "var(--bg)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: 12,
              display: "flex",
              flexDirection: "column",
              gap: 10,
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
                {d.item_name || "—"}
              </span>
              {d.hs_code && (
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
                  {d.hs_code}
                </span>
              )}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px 12px",
              }}
            >
              <F label="Quantity" value={num(d.quantity, d.quantity_unit)} />
              <F
                label="Package Count"
                value={num(d.package_count, d.package_unit)}
              />
              <F label="Net Weight" value={num(d.net_weight, "KGM")} />
              <F label="Total Weight" value={num(d.total_weight, "KGM")} />
            </div>

            {(d.mapped_erp_item || d.status) && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  flexWrap: "wrap",
                }}
              >
                {d.mapped_erp_item && (
                  <span
                    className="pidm-pill"
                    style={{
                      background: "var(--card)",
                      borderColor: "var(--border)",
                      color: "var(--muted)",
                      textTransform: "none",
                    }}
                  >
                    {d.mapped_erp_item}
                  </span>
                )}
                {d.status && (
                  <span
                    className="pidm-pill"
                    style={{
                      background: statusStyle.bg,
                      color: statusStyle.text,
                      borderColor: statusStyle.bg,
                    }}
                  >
                    {d.status}
                  </span>
                )}
              </div>
            )}

            {d.remarks && (
              <div
                style={{
                  padding: "8px 10px",
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  color: "var(--muted)",
                  fontSize: 11,
                  fontWeight: 500,
                }}
              >
                {d.remarks}
              </div>
            )}
          </div>

          {/* ── RECORD ACTIVITY ── */}
          <S title="Record Activity" />
          <div
            style={{
              border: "1px solid var(--border)",
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            {[
              { label: "Checked By", val: d.checker },
              { label: "Checked At", val: formatDateTime(d.checked_at) },
              {
                label: "Created",
                val: detail
                  ? formatDateTime(detail.creation)
                  : isLoading
                    ? "…"
                    : "—",
              },
              {
                label: "Last Modified",
                val: detail
                  ? formatDateTime(detail.modified)
                  : isLoading
                    ? "…"
                    : "—",
              },
              { label: "Record ID", val: detail?.name ?? declaration.name },
            ].map((log, idx, arr) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  background: "var(--card)",
                  borderBottom:
                    idx === arr.length - 1 ? "none" : "1px solid var(--border)",
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
                    fontFamily:
                      log.label === "Record ID" ? "monospace" : undefined,
                  }}
                >
                  {log.val || "—"}
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
