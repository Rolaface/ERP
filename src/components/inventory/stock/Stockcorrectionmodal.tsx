// ─── Stock Correction Modal ───────────────────────────────────────────────────
// Sections: Item Info (with Warehouse + Date) · System Stock · Correction Details · Reason
// Uses project CSS variables from index.css — fully theme-aware.

import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import {
  X,
  RotateCcw,
  ShieldCheck,
  Package,
  CheckCircle2,
  Loader2,
  ArrowUpCircle,
  ArrowDownCircle,
  SlidersHorizontal,
  ChevronDown,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
  Calendar,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type CorrectionType = "add" | "remove" | "set";

export interface StockCorrectionModalProps {
  isOpen:     boolean;
  onClose:    () => void;
  onSuccess?: () => void;
  batch?: {
    batch_no?:     string;
    bal_qty?:      number;
    reserved_qty?: number;
    uom?:          string;
    warehouse?:    string;
    _itemCode?:    string;
    _itemName?:    string;
    [key: string]: any;
  } | null;
  warehouse?: string;
}

interface FormState {
  itemCode:    string;
  itemName:    string;
  batchNo:     string;
  uom:         string;
  warehouse:   string;
  currentQty:  number | null;
  reservedQty: number | null;
  type:        CorrectionType;
  qty:         string;
  reason:      string;
  remarks:     string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const EMPTY: FormState = {
  itemCode: "", itemName: "", batchNo: "", uom: "", warehouse: "",
  currentQty: null, reservedQty: null,
  type: "add", qty: "",
  reason: "", remarks: "",
};

const TYPES: {
  id: CorrectionType; label: string; desc: string;
  Icon: React.ElementType; TrendIcon: React.ElementType;
  rawColor: string; bgColor: string; ringColor: string;
}[] = [
  {
    id: "add",    label: "Add Stock",    desc: "Increase quantity",
    Icon: ArrowUpCircle,     TrendIcon: TrendingUp,
    rawColor: "#22c55e", bgColor: "rgba(34,197,94,0.08)",  ringColor: "rgba(34,197,94,0.22)",
  },
  {
    id: "remove", label: "Remove Stock", desc: "Decrease quantity",
    Icon: ArrowDownCircle,   TrendIcon: TrendingDown,
    rawColor: "#dc2626", bgColor: "rgba(220,38,38,0.08)",  ringColor: "rgba(220,38,38,0.22)",
  },
  {
    id: "set",    label: "Set Exact",    desc: "Physical count result",
    Icon: SlidersHorizontal, TrendIcon: Minus,
    rawColor: "#2563eb", bgColor: "rgba(37,99,235,0.08)",  ringColor: "rgba(37,99,235,0.22)",
  },
];

const REASONS = [
  { id: "COUNT_ERROR",     label: "Counting Error"            },
  { id: "DAMAGED",         label: "Damaged / Spoiled"         },
  { id: "EXPIRED",         label: "Expired Stock"             },
  { id: "THEFT",           label: "Theft / Loss"              },
  { id: "RETURN_SUPPLIER", label: "Supplier Return"           },
  { id: "RETURN_CUSTOMER", label: "Customer Return"           },
  { id: "TRANSFER_IN",     label: "Inter-branch Transfer In"  },
  { id: "TRANSFER_OUT",    label: "Inter-branch Transfer Out" },
  { id: "AUDIT",           label: "Physical Audit Adjustment" },
  { id: "SYSTEM_ERROR",    label: "System / Data Error"       },
  { id: "OTHER",           label: "Other"                     },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcNew(cur: number, adj: number, t: CorrectionType) {
  if (t === "add")    return cur + adj;
  if (t === "remove") return Math.max(0, cur - adj);
  return adj;
}

function nowLabel() {
  return new Date().toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

const StockCorrectionModal: React.FC<StockCorrectionModalProps> = ({
  isOpen, onClose, onSuccess, batch,
  warehouse: propWarehouse,
}) => {
  const [form,    setForm]    = useState<FormState>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [docDate]             = useState(nowLabel());
  const batchKey              = useRef<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      const t = setTimeout(() => {
        setForm(EMPTY); setError(null); setSuccess(false);
        batchKey.current = null;
      }, 220);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !batch) return;
    const key = `${batch._itemCode ?? ""}|${batch.batch_no ?? ""}`;
    if (batchKey.current === key) return;
    batchKey.current = key;
    setForm(prev => ({
      ...prev,
      itemCode:    batch._itemCode   ?? "",
      itemName:    batch._itemName   ?? "",
      batchNo:     batch.batch_no    ?? "",
      uom:         batch.uom         ?? "",
      warehouse:   propWarehouse ?? batch.warehouse ?? "",
      currentQty:  typeof batch.bal_qty      === "number" ? batch.bal_qty      : null,
      reservedQty: typeof batch.reserved_qty === "number" ? batch.reserved_qty : null,
    }));
  }, [isOpen, batch, propWarehouse]);

  useEffect(() => {
    if (!isOpen) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [isOpen, onClose]);

  const adj       = parseFloat(form.qty) || 0;
  const cur       = form.currentQty  ?? 0;
  const reserved  = form.reservedQty ?? 0;
  const available = Math.max(0, cur - reserved);
  const newQty    = calcNew(cur, adj, form.type);
  const diff      = newQty - cur;
  const AT        = TYPES.find(t => t.id === form.type)!;
  const canSave   = !!form.itemCode && adj > 0 && !!form.reason && !loading;

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    setError(null);
    setLoading(true);
    try {
      const { createItemStock } = await import("../../../api/stockApi");
      const res = await createItemStock({
        items: [{
          item_code:       form.itemCode,
          correction_type: form.type,
          adjustment_qty:  adj,
          new_qty:         newQty,
          reason :     form.reason,
          notes:           form.remarks,
        }],
      });
      if (!res || res.status_code !== 200) {
        setError(res?.message ?? "Failed to apply correction.");
        return;
      }
      setSuccess(true);
      setTimeout(() => { onSuccess?.(); onClose(); }, 1400);
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const diffLabel = diff > 0 ? `+${diff}` : `${diff}`;
  const diffColor = diff > 0 ? "var(--success)" : diff < 0 ? "var(--danger)" : "var(--muted)";

  // All form fields share this exact height so every row is consistent
  const FIELD_H = 36;

  return ReactDOM.createPortal(
    <>
      <style>{`
        @keyframes scm-in   { from{opacity:0} to{opacity:1} }
        @keyframes scm-up   { from{opacity:0;transform:translateY(24px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes scm-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes scm-pop  { 0%{transform:scale(0.92)} 60%{transform:scale(1.06)} 100%{transform:scale(1)} }

        .scm-overlay     { animation: scm-in  0.18s ease; }
        .scm-dialog      { animation: scm-up  0.24s cubic-bezier(0.22,1,0.36,1); }
        .scm-spinner     { animation: scm-spin 0.75s linear infinite; }
        .scm-success-pop { animation: scm-pop 0.35s cubic-bezier(0.34,1.56,0.64,1); }

        /* ── Shared field base ── */
        .scm-field {
          width: 100%; height: 36px; border-radius: 8px;
          border: 1.5px solid var(--border);
          background: var(--bg); color: var(--text);
          font-size: 13px; font-family: inherit;
          transition: border-color .14s, box-shadow .14s;
          box-sizing: border-box;
        }
        .scm-field-input  { padding: 0 11px; display: block; }
        .scm-field-select { padding: 0 32px 0 11px; display: block; appearance: none; cursor: pointer; }
        .scm-field:focus  {
          outline: none; border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(192,132,61,0.13);
        }
        .scm-field::placeholder { color: var(--muted); opacity: .45; }

        /* readonly display — same height as fields */
        .scm-readonly {
          height: 36px; border-radius: 8px;
          border: 1.5px solid var(--border);
          background: var(--bg);
          display: flex; align-items: center; padding: 0 11px;
          font-size: 13px; box-sizing: border-box;
        }

        /* textarea — taller but consistent border style */
        .scm-textarea {
          width: 100%; border-radius: 8px;
          border: 1.5px solid var(--border);
          background: var(--bg); color: var(--text);
          font-size: 13px; font-family: inherit;
          padding: 8px 11px; resize: none; line-height: 1.55;
          box-sizing: border-box;
          transition: border-color .14s, box-shadow .14s;
        }
        .scm-textarea:focus {
          outline: none; border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(192,132,61,0.13);
        }
        .scm-textarea::placeholder { color: var(--muted); opacity: .45; }

        /* ── Buttons ── */
        .scm-ghost {
          display: flex; align-items: center; gap: 6px;
          padding: 0 14px; height: 34px; border-radius: 8px;
          border: 1.5px solid var(--border);
          background: transparent; color: var(--muted);
          font-size: 12px; font-weight: 600; cursor: pointer;
          transition: all .13s; font-family: inherit; white-space: nowrap;
        }
        .scm-ghost:hover { background: var(--bg); color: var(--text); border-color: var(--primary); }

        .scm-submit {
          display: flex; align-items: center; gap: 7px;
          padding: 0 22px; height: 34px; border-radius: 8px; border: none;
          font-size: 12px; font-weight: 800; letter-spacing: .06em;
          text-transform: uppercase; cursor: pointer;
          transition: all .18s; font-family: inherit; white-space: nowrap;
        }
        .scm-submit:disabled { cursor: not-allowed; }
        .scm-submit:not(:disabled):hover { filter: brightness(1.08); transform: translateY(-1px); }

        /* ── Section header ── */
        .scm-section-hd {
          display: flex; align-items: center; gap: 8px;
          padding-bottom: 11px; border-bottom: 1px solid var(--border);
          margin-bottom: 14px;
        }
        .scm-badge {
          width: 20px; height: 20px; border-radius: 50%;
          background: var(--primary); color: #fff;
          font-size: 10px; font-weight: 900;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .scm-section-title {
          font-size: 10px; font-weight: 900; letter-spacing: .11em;
          text-transform: uppercase; color: var(--primary);
        }

        /* ── Stock stat cards ── */
        .scm-stat {
          flex: 1; border-radius: 10px; padding: 11px 14px;
          background: var(--bg); border: 1.5px solid var(--border);
          display: flex; flex-direction: column; gap: 3px; min-width: 0;
        }
        .scm-stat-lbl { font-size: 9px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); }
        .scm-stat-val { font-size: 20px; font-weight: 900; font-variant-numeric: tabular-nums; line-height: 1; }
        .scm-stat-sub { font-size: 10px; color: var(--muted); margin-top: 1px; }

        /* ── Flow panel ── */
        .scm-flow {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 14px; border-radius: 10px;
          background: var(--bg); border: 1.5px solid var(--border);
        }
        .scm-flow-col { display: flex; flex-direction: column; align-items: center; gap: 3px; flex: 1; }
        .scm-flow-lbl { font-size: 9px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); }
        .scm-flow-num { font-size: 20px; font-weight: 900; font-variant-numeric: tabular-nums; color: var(--text); line-height: 1; }

        /* ── Type indicator badge ── */
        .scm-type-badge {
          display: inline-flex; align-items: center; gap: 5px;
          margin-top: 5px; padding: 3px 9px; border-radius: 6px;
          font-size: 10px; font-weight: 700;
        }

        /* ── Scrollbar ── */
        .scm-scroll::-webkit-scrollbar { width: 4px; }
        .scm-scroll::-webkit-scrollbar-track { background: transparent; }
        .scm-scroll::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
      `}</style>

      {/* ── Overlay ── */}
      <div
        className="scm-overlay"
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        style={{
          position: "fixed", inset: 0, zIndex: 10000,
          background: "rgba(0,0,0,0.48)",
          backdropFilter: "blur(8px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 16,
        }}
      >
        {/* ── Dialog ── */}
        <div
          className="scm-dialog"
          style={{
            width: "min(820px,100%)", maxHeight: "92vh",
            display: "flex", flexDirection: "column",
            borderRadius: 16, overflow: "hidden",
            background: "var(--card)",
            boxShadow: "0 28px 72px rgba(0,0,0,0.26), 0 0 0 1px var(--border)",
          }}
        >

          {/* ══════════════ HEADER ══════════════ */}
          <div style={{
            flexShrink: 0,
            background: "var(--table-head)",
            padding: "14px 20px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            borderBottom: "1px solid var(--border)",
          }}>
            {/* Left: icon + title + date */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 9,
                background: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <Package size={17} style={{ color: "var(--table-head-text,#fff)" }} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "var(--table-head-text,#fff)", letterSpacing: "-0.01em" }}>
                  Stock Correction
                </p>
                {/* Date sits right below the title */}
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 3 }}>
                  <Calendar size={10} style={{ color: "rgba(255,255,255,0.45)" }} />
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", lineHeight: 1 }}>
                    {docDate}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: audit badge + close */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
             
              <button
                onClick={onClose}
                style={{
                  width: 28, height: 28, borderRadius: 7,
                  border: "1px solid rgba(255,255,255,0.15)",
                  background: "rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.55)",
                  cursor: "pointer", display: "flex",
                  alignItems: "center", justifyContent: "center",
                  transition: "background 0.13s",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.18)")}
                onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
              >
                <X size={13} />
              </button>
            </div>
          </div>

          {/* ══════════════ BODY ══════════════ */}
          <form
            onSubmit={handleSubmit}
            style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}
          >
            <div
              className="scm-scroll"
              style={{ flex: 1, overflowY: "auto", padding: "20px 22px", display: "flex", flexDirection: "column", gap: 22 }}
            >

              {/* ①  Item Information — 5 equal columns */}
              <section>
                <div className="scm-section-hd">
                  <div className="scm-badge">1</div>
                  <span className="scm-section-title">Item Information</span>
                </div>
                {/* All 5 fields in one row with equal column widths */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>

                  <div>
                    <FL text="Item Code" required />
                    <input
                      className="scm-field scm-field-input"
                      value={form.itemCode}
                      onChange={e => set("itemCode", e.target.value)}
                      placeholder="ITM-00123"
                    />
                  </div>

                  <div>
                    <FL text="Item Name" />
                    <input
                      className="scm-field scm-field-input"
                      value={form.itemName}
                      onChange={e => set("itemName", e.target.value)}
                      placeholder="Item description"
                    />
                  </div>

                  <div>
                    <FL text="Batch No." />
                    <div className="scm-readonly">
                      <span style={{
                        fontSize: 13, fontWeight: 600,
                        color: form.batchNo ? "var(--text)" : "var(--muted)",
                        opacity: form.batchNo ? 1 : 0.45,
                      }}>
                        {form.batchNo || "—"}
                      </span>
                    </div>
                  </div>

                  <div>
                    <FL text="UOM" />
                    <input
                      className="scm-field scm-field-input"
                      value={form.uom}
                      onChange={e => set("uom", e.target.value)}
                      placeholder="PCS"
                    />
                  </div>

                  <div>
                    <FL text="Warehouse" />
                    <input
                      className="scm-field scm-field-input"
                      value={form.warehouse}
                      onChange={e => set("warehouse", e.target.value)}
                      placeholder="Main Store"
                    />
                  </div>

                </div>
              </section>

              {/* ② System Stock */}
              <section>
                <div className="scm-section-hd">
                  <div className="scm-badge">2</div>
                  <span className="scm-section-title">System Stock</span>
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                  <div className="scm-stat">
                    <span className="scm-stat-lbl">Current Qty</span>
                    <span className="scm-stat-val" style={{ color: "var(--text)" }}>
                      {form.currentQty !== null ? form.currentQty : "—"}
                    </span>
                    <span className="scm-stat-sub">System balance · {form.uom || "units"}</span>
                  </div>
                  <div className="scm-stat">
                    <span className="scm-stat-lbl">Reserved</span>
                    <span className="scm-stat-val" style={{ color: "var(--muted)" }}>
                      {form.reservedQty !== null ? form.reservedQty : "—"}
                    </span>
                    <span className="scm-stat-sub">Pending orders</span>
                  </div>
                  <div className="scm-stat" style={{ borderColor: "rgba(34,197,94,0.3)" }}>
                    <span className="scm-stat-lbl">Available</span>
                    <span className="scm-stat-val" style={{ color: "var(--success)" }}>
                      {form.currentQty !== null ? available : "—"}
                    </span>
                    <span className="scm-stat-sub">Free to use</span>
                  </div>
                </div>
              </section>

              {/* ③ Correction Details — 3 equal columns */}
              <section>
                <div className="scm-section-hd">
                  <div className="scm-badge">3</div>
                  <span className="scm-section-title">Correction Details</span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>

                  {/* Correction Type select */}
                  <div>
                    <FL text="Correction Type" required />
                    <div style={{ position: "relative" }}>
                      <select
                        className="scm-field scm-field-select"
                        value={form.type}
                        onChange={e => set("type", e.target.value as CorrectionType)}
                        style={{
                          border: `1.5px solid ${AT.rawColor}`,
                          color: "var(--text)",
                          fontWeight: 700,
                        }}
                      >
                        {TYPES.map(t => (
                          <option key={t.id} value={t.id}>{t.label}</option>
                        ))}
                      </select>
                      <ChevronDown size={13} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "var(--muted)", pointerEvents: "none" }} />
                    </div>
                    {/* Colour-coded indicator under the select */}
                    <div
                      className="scm-type-badge"
                      style={{ background: AT.bgColor, border: `1px solid ${AT.ringColor}` }}
                    >
                      <AT.Icon size={11} style={{ color: AT.rawColor }} />
                      <span style={{ color: AT.rawColor }}>{AT.desc}</span>
                    </div>
                  </div>

                  {/* Adjustment Quantity */}
                  <div>
                    <FL text={form.type === "set" ? "Physical Count Qty" : "Adjustment Quantity"} required />
                    <input
                      className="scm-field scm-field-input no-spinner"
                      type="number"
                      min={0}
                      value={form.qty}
                      onChange={e => set("qty", e.target.value)}
                      placeholder="0"
                      style={{
                        border: `1.5px solid ${adj > 0 ? AT.rawColor : "var(--border)"}`,
                        fontSize: 16, fontWeight: 900, fontVariantNumeric: "tabular-nums",
                      }}
                    />
                  </div>

                  {/* System Qty → New Qty live flow */}
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <FL text="System Qty → New Qty" />
                    <div className="scm-flow" style={{ flex: 1 }}>
                      <div className="scm-flow-col">
                        <span className="scm-flow-lbl">System</span>
                        <span className="scm-flow-num">
                          {form.currentQty !== null ? cur : "—"}
                        </span>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                        {adj > 0 ? (
                          <div style={{
                            display: "flex", alignItems: "center", gap: 4,
                            padding: "3px 8px", borderRadius: 6,
                            background: AT.bgColor, border: `1px solid ${AT.ringColor}`,
                          }}>
                            <AT.TrendIcon size={10} style={{ color: AT.rawColor }} />
                            <span style={{ fontSize: 11, fontWeight: 800, color: AT.rawColor }}>
                              {form.type === "add" ? `+${adj}` : form.type === "remove" ? `−${adj}` : `=${adj}`}
                            </span>
                          </div>
                        ) : (
                          <ArrowRight size={15} style={{ color: "var(--muted)", opacity: .3 }} />
                        )}
                      </div>

                      <div className="scm-flow-col">
                        <span className="scm-flow-lbl">New Qty</span>
                        <span
                          className="scm-flow-num"
                          style={{
                            fontSize: 22,
                            color: adj > 0
                              ? (diff > 0 ? "var(--success)" : diff < 0 ? "var(--danger)" : "var(--muted)")
                              : "var(--muted)",
                            opacity: adj > 0 ? 1 : 0.28,
                          }}
                        >
                          {adj > 0 ? Math.max(0, newQty) : "—"}
                        </span>
                        {adj > 0 && diff !== 0 && (
                          <span style={{ fontSize: 10, fontWeight: 700, color: diffColor }}>
                            ({diffLabel} {form.uom || "units"})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                </div>
              </section>

              {/* ④ Reason — 2 equal columns */}
              <section>
                <div className="scm-section-hd">
                  <div className="scm-badge">4</div>
                  <span className="scm-section-title">Reason</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>

                  <div>
                    <FL text="Select Reason for Correction" required />
                    <div style={{ position: "relative" }}>
                      <select
                        className="scm-field scm-field-select"
                        value={form.reason}
                        onChange={e => set("reason", e.target.value)}
                        style={{
                          border: `1.5px solid ${form.reason ? AT.rawColor : "var(--border)"}`,
                          color: form.reason ? "var(--text)" : "var(--muted)",
                        }}
                      >
                        <option value="">Select reason for correct..…</option>
                        {REASONS.map(r => (
                          <option key={r.id} value={r.id}>{r.id} — {r.label}</option>
                        ))}
                      </select>
                      <ChevronDown size={13} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "var(--muted)", pointerEvents: "none" }} />
                    </div>
                    {form.reason && (
                      <p style={{ margin: "5px 0 0", fontSize: 11, color: AT.rawColor, fontWeight: 600 }}>
                        {REASONS.find(r => r.id === form.reason)?.label}
                      </p>
                    )}
                  </div>

                  <div>
                    <FL text="Remarks" />
                    <textarea
                      className="scm-textarea"
                      rows={3}
                      value={form.remarks}
                      onChange={e => set("remarks", e.target.value)}
                      placeholder="Add context for the audit trail… (optional)"
                    />
                  </div>

                </div>
              </section>

              {/* Error */}
              {error && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 14px", borderRadius: 9,
                  background: "rgba(220,38,38,0.06)",
                  border: "1px solid rgba(220,38,38,0.22)",
                  color: "var(--danger)", fontSize: 13,
                }}>
                  <AlertCircle size={15} style={{ flexShrink: 0 }} />
                  {error}
                </div>
              )}

            </div>

            {/* ══════════════ FOOTER ══════════════ */}
            <div style={{
              flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "12px 22px",
              background: "var(--card)",
              borderTop: "1px solid var(--border)",
            }}>
              {/* Summary line */}
              <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>
                {form.itemCode
                  ? (
                    <>
                      <span style={{ color: "var(--text)", fontWeight: 700 }}>{form.itemCode}</span>
                      {form.reason && (
                        <> · <span style={{ color: AT.rawColor, fontWeight: 600 }}>
                          {REASONS.find(r => r.id === form.reason)?.label}
                        </span></>
                      )}
                      {adj > 0 && (
                        <> · <span style={{ fontWeight: 700, color: diffColor }}>
                          {diffLabel} {form.uom || "units"}
                        </span></>
                      )}
                    </>
                  )
                  : "No item selected"
                }
              </p>

              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button type="button" className="scm-ghost" onClick={() => { setForm(EMPTY); setError(null); }}>
                  <RotateCcw size={11} /> Reset
                </button>
                <button type="button" className="scm-ghost" onClick={onClose}>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!canSave}
                  className={`scm-submit${success ? " scm-success-pop" : ""}`}
                  style={{
                    background: success ? "var(--success)" : canSave ? "var(--primary)" : "var(--border)",
                    color: canSave || success ? "#fff" : "var(--muted)",
                    boxShadow: canSave && !success ? "0 4px 14px rgba(192,132,61,0.28)" : "none",
                  }}
                >
                  {success
                    ? <><CheckCircle2 size={14} /> Applied!</>
                    : loading
                    ? <><Loader2 size={14} className="scm-spinner" /> Applying…</>
                    : "Apply Correction"
                  }
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>,
    document.body
  );
};

// ─── Field Label helper ───────────────────────────────────────────────────────

const FL: React.FC<{ text: string; required?: boolean }> = ({ text, required }) => (
  <label style={{
    display: "block", fontSize: 10, fontWeight: 700,
    textTransform: "uppercase", letterSpacing: ".09em",
    color: "var(--muted)", marginBottom: 6,
  }}>
    {text}{required && <span style={{ color: "var(--danger)", marginLeft: 2 }}>*</span>}
  </label>
);

export default StockCorrectionModal;