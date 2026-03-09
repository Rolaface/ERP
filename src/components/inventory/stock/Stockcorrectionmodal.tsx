// ─── Stock Correction Modal ───────────────────────────────────────────────────
// Zero top-level external dependencies — opens guaranteed.
// createItemStock is dynamic-imported only on submit (won't crash on load).
// Portal into document.body — no z-index / overflow issues.

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
  ChevronRight,
  AlertCircle,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type CorrectionType = "add" | "remove" | "set";

export interface StockCorrectionModalProps {
  isOpen:     boolean;
  onClose:    () => void;
  onSuccess?: () => void;
  batch?: {
    batch_no?:  string;
    bal_qty?:   number;
    _itemCode?: string;
    _itemName?: string;
    [key: string]: any;
  } | null;
}

interface FormState {
  itemCode:   string;
  itemName:   string;
  currentQty: number | null;
  type:       CorrectionType;
  qty:        string;
  reason:     string;
  notes:      string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const EMPTY: FormState = {
  itemCode: "", itemName: "", currentQty: null,
  type: "add", qty: "", reason: "", notes: "",
};

const TYPES: {
  id: CorrectionType; label: string; desc: string;
  Icon: React.ElementType; color: string; bg: string; ring: string;
}[] = [
  { id: "add",    label: "Add Stock",    desc: "Increase quantity",      Icon: ArrowUpCircle,    color: "#059669", bg: "rgba(5,150,105,0.09)",  ring: "rgba(5,150,105,0.28)"  },
  { id: "remove", label: "Remove Stock", desc: "Decrease quantity",      Icon: ArrowDownCircle,  color: "#dc2626", bg: "rgba(220,38,38,0.09)",  ring: "rgba(220,38,38,0.28)"  },
  { id: "set",    label: "Set Exact",    desc: "Physical count result",  Icon: SlidersHorizontal,color: "#2563eb", bg: "rgba(37,99,235,0.09)",  ring: "rgba(37,99,235,0.28)"  },
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

// ─── Pure helpers ─────────────────────────────────────────────────────────────

function calcNew(cur: number, adj: number, t: CorrectionType) {
  if (t === "add")    return cur + adj;
  if (t === "remove") return Math.max(0, cur - adj);
  return adj; // set
}

// ─── Component ────────────────────────────────────────────────────────────────

const StockCorrectionModal: React.FC<StockCorrectionModalProps> = ({
  isOpen, onClose, onSuccess, batch,
}) => {
  const [form,      setForm]      = useState<FormState>(EMPTY);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [success,   setSuccess]   = useState(false);
  const batchKey = useRef<string | null>(null);

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      const t = setTimeout(() => {
        setForm(EMPTY);
        setError(null);
        setSuccess(false);
        batchKey.current = null;
      }, 220);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // Pre-fill from batch prop — no API call needed
  useEffect(() => {
    if (!isOpen || !batch) return;
    const key = `${batch._itemCode ?? ""}|${batch.batch_no ?? ""}`;
    if (batchKey.current === key) return;
    batchKey.current = key;
    setForm(prev => ({
      ...prev,
      itemCode:   batch._itemCode ?? "",
      itemName:   batch._itemName ?? "",
      currentQty: typeof batch.bal_qty === "number" ? batch.bal_qty : null,
    }));
  }, [isOpen, batch]);

  // Escape key
  useEffect(() => {
    if (!isOpen) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [isOpen, onClose]);

  // Derived values
  const adj    = parseFloat(form.qty) || 0;
  const cur    = form.currentQty ?? 0;
  const newQty = calcNew(cur, adj, form.type);
  const diff   = newQty - cur;
  const AT     = TYPES.find(t => t.id === form.type)!;
  const canSave = !!form.itemCode && adj > 0 && !!form.reason && !loading;

  const setField = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    setError(null);
    setLoading(true);
    try {
      // Dynamic import — won't crash modal if API module has issues
      const { createItemStock } = await import("../../../api/stockApi");
      const res = await createItemStock({
        items: [{
          item_code:       form.itemCode,
          correction_type: form.type,
          adjustment_qty:  adj,
          new_qty:         newQty,
          reason_code:     form.reason,
          notes:           form.notes,
        }],
      });
      if (!res || res.status_code !== 200) {
        setError(res?.message ?? "Failed to apply correction.");
        return;
      }
      setSuccess(true);
      setTimeout(() => { onSuccess?.(); onClose(); }, 1100);
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // ─── Render ───────────────────────────────────────────────────────────────

  return ReactDOM.createPortal(
    <>
      {/* ── Injected styles ── */}
      <style>{`
        @keyframes scm-backdrop { from{opacity:0} to{opacity:1} }
        @keyframes scm-slide    { from{opacity:0;transform:translateY(20px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        .scm-backdrop { animation: scm-backdrop 0.18s ease; }
        .scm-panel    { animation: scm-slide    0.22s cubic-bezier(0.34,1.3,0.64,1); }
        .scm-input    { transition: border-color 0.15s, box-shadow 0.15s; }
        .scm-input:focus { outline:none; border-color:#c97d2e !important; box-shadow:0 0 0 3px rgba(201,125,46,0.14) !important; }
        .scm-input::placeholder { color:#c4b8ac; }
        .scm-type-card { transition: all 0.15s; cursor:pointer; }
        .scm-type-card:hover { opacity:0.82; }
        .scm-ghost { transition: background 0.12s; }
        .scm-ghost:hover { background: rgba(201,125,46,0.06) !important; }
      `}</style>

      {/* ── Backdrop ── */}
      <div
        className="scm-backdrop"
        style={{ position:"fixed", inset:0, zIndex:10000, background:"rgba(10,6,2,0.55)", backdropFilter:"blur(6px)", display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        {/* ── Panel ── */}
        <div
          className="scm-panel"
          style={{ width:"min(860px,100%)", maxHeight:"92vh", display:"flex", flexDirection:"column", borderRadius:22, overflow:"hidden", boxShadow:"0 40px 100px rgba(0,0,0,.4), 0 0 0 1px rgba(201,125,46,.18)" }}
        >

          {/* ═══ HEADER ═══ */}
          <div style={{ flexShrink:0, background:"linear-gradient(135deg,#161009 0%,#28180a 100%)", padding:"18px 26px", display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:"1px solid rgba(201,125,46,.16)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:14 }}>
              {/* Icon box */}
              <div style={{ width:44, height:44, borderRadius:13, background:"rgba(201,125,46,.13)", border:"1px solid rgba(201,125,46,.26)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <Package size={20} style={{ color:"#c97d2e" }} />
              </div>
              <div>
                <p style={{ color:"#f0e8de", fontWeight:800, fontSize:15, margin:0, letterSpacing:"-0.01em" }}>Stock Correction</p>
                <p style={{ color:"rgba(201,125,46,.6)", fontSize:11, margin:"3px 0 0", lineHeight:1 }}>
                  {form.itemName
                    ? `Adjusting · ${form.itemName}${batch?.batch_no ? ` · Batch ${batch.batch_no}` : ""}`
                    : "Manual inventory adjustment — full audit trail"}
                </p>
              </div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 11px", borderRadius:8, background:"rgba(201,125,46,.09)", border:"1px solid rgba(201,125,46,.2)", color:"rgba(201,125,46,.75)", fontSize:10, fontWeight:700, letterSpacing:".05em" }}>
                <ShieldCheck size={12} style={{ color:"#c97d2e" }} />
                Audit-logged
              </div>
              <button
                onClick={onClose}
                style={{ width:32, height:32, borderRadius:9, border:"1px solid rgba(255,255,255,.1)", background:"rgba(255,255,255,.05)", color:"rgba(255,255,255,.45)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}
                onMouseEnter={e=>(e.currentTarget.style.background="rgba(255,255,255,.1)")}
                onMouseLeave={e=>(e.currentTarget.style.background="rgba(255,255,255,.05)")}
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* ═══ BODY ═══ */}
          <form onSubmit={handleSubmit} style={{ flex:1, display:"flex", flexDirection:"column", minHeight:0, overflow:"hidden", background:"#f8f4f0" }}>
            <div style={{ flex:1, display:"flex", overflowY:"auto", minHeight:0 }}>

              {/* ── LEFT: Form ── */}
              <div style={{ flex:1, padding:"26px 28px", display:"flex", flexDirection:"column", gap:24, minWidth:0, overflowY:"auto" }}>

                {/* ① Item */}
                <Section step={1} title="Item">
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                    <div>
                      <Label text="Item Code / Name" required />
                      <input
                        className="scm-input"
                        value={form.itemCode}
                        onChange={e => { setField("itemCode", e.target.value); setField("itemName", e.target.value); }}
                        placeholder="Enter item code…"
                        style={inputStyle()}
                      />
                    </div>
                    <div>
                      <Label text="Current Stock" />
                      <div style={{ height:40, borderRadius:10, border:"1.5px solid #e8e0d8", background:"#f1ece6", display:"flex", alignItems:"center", gap:8, padding:"0 14px" }}>
                        {form.currentQty !== null
                          ? <><span style={{ fontSize:17, fontWeight:900, color:"#1f1a14", fontVariantNumeric:"tabular-nums" }}>{form.currentQty}</span><span style={{ fontSize:11, color:"#b0a496" }}>units</span></>
                          : <span style={{ fontSize:12, color:"#c4b8ac", fontStyle:"italic" }}>—</span>
                        }
                      </div>
                    </div>
                  </div>
                </Section>

                {/* Divider */}
                <div style={{ height:1, background:"linear-gradient(to right,transparent,rgba(201,125,46,.2),transparent)" }} />

                {/* ② Correction Type */}
                <Section step={2} title="Correction Type">
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
                    {TYPES.map(t => {
                      const active = form.type === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          className="scm-type-card"
                          onClick={() => setField("type", t.id)}
                          style={{ padding:"16px 12px", borderRadius:14, border:`2px solid ${active ? t.color : "#e8e0d8"}`, background:active ? t.bg : "#fff", boxShadow:active ? `0 0 0 4px ${t.ring}` : "none", display:"flex", flexDirection:"column", alignItems:"center", gap:7 }}
                        >
                          <t.Icon size={22} style={{ color:active ? t.color : "#c4b8ac", strokeWidth:active ? 2.5 : 1.8 }} />
                          <span style={{ fontSize:11, fontWeight:800, color:active ? t.color : "#5a5049" }}>{t.label}</span>
                          <span style={{ fontSize:10, color:active ? t.color : "#a09488", opacity:active ? 0.8 : 0.7 }}>{t.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </Section>

                {/* Divider */}
                <div style={{ height:1, background:"linear-gradient(to right,transparent,rgba(201,125,46,.2),transparent)" }} />

                {/* ③ Details */}
                <Section step={3} title="Details">
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>

                    <div>
                      <Label text={form.type === "set" ? "Physical Count" : "Adjustment Quantity"} required />
                      <input
                        className="scm-input"
                        type="number"
                        min={0}
                        value={form.qty}
                        onChange={e => setField("qty", e.target.value)}
                        placeholder="0"
                        style={{ ...inputStyle(), border:`1.5px solid ${adj > 0 ? AT.color : "#e8e0d8"}`, fontSize:16, fontWeight:800 }}
                      />
                    </div>

                    <div>
                      <Label text="Reason for Correction" required />
                      <div style={{ position:"relative" }}>
                        <select
                          className="scm-input"
                          value={form.reason}
                          onChange={e => setField("reason", e.target.value)}
                          style={{ ...inputStyle(), border:`1.5px solid ${form.reason ? AT.color : "#e8e0d8"}`, color: form.reason ? "#1f1a14" : "#c4b8ac", cursor:"pointer", appearance:"none", paddingRight:32 }}
                        >
                          <option value="">Select reason…</option>
                          {REASONS.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                        </select>
                        <ChevronRight size={13} style={{ position:"absolute", right:11, top:"50%", transform:"translateY(-50%) rotate(90deg)", color:"#a09488", pointerEvents:"none" }} />
                      </div>
                    </div>

                    <div style={{ gridColumn:"1/-1" }}>
                      <Label text="Notes / Remarks" />
                      <input
                        className="scm-input"
                        value={form.notes}
                        onChange={e => setField("notes", e.target.value)}
                        placeholder="Optional — add context for the audit trail…"
                        style={inputStyle()}
                      />
                    </div>
                  </div>
                </Section>

                {/* Error */}
                {error && (
                  <div style={{ display:"flex", alignItems:"center", gap:10, padding:"11px 15px", borderRadius:10, background:"rgba(220,38,38,.06)", border:"1px solid rgba(220,38,38,.22)", color:"#b91c1c", fontSize:13 }}>
                    <AlertCircle size={15} style={{ flexShrink:0, color:"#dc2626" }} />
                    {error}
                  </div>
                )}
              </div>

              {/* ── RIGHT: Live Preview ── */}
              <div style={{ width:220, flexShrink:0, background:"linear-gradient(160deg,#161009 0%,#1e1208 100%)", borderLeft:"1px solid rgba(201,125,46,.14)", padding:"22px 18px", display:"flex", flexDirection:"column", gap:14 }}>
                <p style={{ fontSize:10, fontWeight:900, letterSpacing:".14em", textTransform:"uppercase", color:"rgba(201,125,46,.5)", margin:0 }}>Live Preview</p>

                {/* Item card */}
                <DarkCard>
                  <DarkLabel>Item</DarkLabel>
                  <p style={{ fontSize:13, fontWeight:700, color:form.itemName ? "#f0e8de" : "rgba(255,255,255,.18)", marginTop:5, lineHeight:1.4, wordBreak:"break-word" }}>
                    {form.itemName || "No item selected"}
                  </p>
                  {batch?.batch_no && (
                    <p style={{ fontSize:10, fontFamily:"monospace", color:"rgba(201,125,46,.55)", marginTop:3 }}>Batch: {batch.batch_no}</p>
                  )}
                </DarkCard>

                {/* Stock flow */}
                <DarkCard>
                  <DarkLabel>Stock Change</DarkLabel>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:8 }}>
                    <span style={{ fontSize:11, color:"rgba(255,255,255,.38)" }}>Before</span>
                    <span style={{ fontSize:14, fontWeight:800, color:"#f0e8de", fontVariantNumeric:"tabular-nums" }}>
                      {form.currentQty !== null ? form.currentQty : "—"}
                    </span>
                  </div>

                  {form.itemCode && adj > 0 ? (
                    <>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 10px", borderRadius:9, background:AT.bg, margin:"8px 0" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                          <AT.Icon size={11} style={{ color:AT.color }} />
                          <span style={{ fontSize:10, fontWeight:700, color:AT.color }}>
                            {form.type === "add" ? `+${adj}` : form.type === "remove" ? `−${adj}` : `= ${adj}`}
                          </span>
                        </div>
                        <span style={{ fontSize:10, fontWeight:800, color:AT.color, fontVariantNumeric:"tabular-nums" }}>
                          {diff > 0 ? "+" : ""}{diff}
                        </span>
                      </div>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", borderTop:"1px solid rgba(255,255,255,.07)", paddingTop:8 }}>
                        <span style={{ fontSize:11, color:"rgba(255,255,255,.38)" }}>After</span>
                        <span style={{ fontSize:24, fontWeight:900, fontVariantNumeric:"tabular-nums", color: diff > 0 ? "#4ade80" : diff < 0 ? "#f87171" : "#94a3b8" }}>
                          {Math.max(0, newQty)}
                        </span>
                      </div>
                    </>
                  ) : (
                    <p style={{ fontSize:10, color:"rgba(255,255,255,.18)", textAlign:"center", padding:"10px 0" }}>Fill the form to preview</p>
                  )}
                </DarkCard>

                {/* Reason */}
                {form.reason && (
                  <DarkCard accent>
                    <DarkLabel accent>Reason</DarkLabel>
                    <p style={{ fontSize:11, fontWeight:600, color:"rgba(201,125,46,.9)", marginTop:4 }}>
                      {REASONS.find(r => r.id === form.reason)?.label}
                    </p>
                  </DarkCard>
                )}

                {/* Audit trail */}
                <div style={{ marginTop:"auto" }}>
                  <DarkCard>
                    <DarkLabel>Audit Trail</DarkLabel>
                    {["Timestamp", "User account", "Before / after qty", "Reason code"].map(x => (
                      <div key={x} style={{ display:"flex", alignItems:"center", gap:6, marginTop:6 }}>
                        <span style={{ color:"rgba(201,125,46,.4)", fontSize:9 }}>›</span>
                        <span style={{ fontSize:10, color:"rgba(255,255,255,.28)" }}>{x}</span>
                      </div>
                    ))}
                  </DarkCard>
                </div>
              </div>
            </div>

            {/* ═══ FOOTER ═══ */}
            <div style={{ flexShrink:0, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 28px", background:"#fff", borderTop:"1px solid #ede6dc" }}>
              <p style={{ fontSize:12, color:"#b0a496", margin:0 }}>
                {form.itemName || "No item selected"}
                {form.reason && ` · ${REASONS.find(r => r.id === form.reason)?.label}`}
              </p>
              <div style={{ display:"flex", gap:9, alignItems:"center" }}>
                <GhostBtn onClick={() => { setForm(EMPTY); setError(null); }}>
                  <RotateCcw size={12} /> Reset
                </GhostBtn>
                <GhostBtn onClick={onClose}>
                  Cancel
                </GhostBtn>
                <button
                  type="submit"
                  disabled={!canSave}
                  style={{
                    display:"flex", alignItems:"center", gap:7,
                    padding:"9px 24px", borderRadius:11, border:"none",
                    background: success ? "#059669" : canSave ? "#c97d2e" : "#e8e0d8",
                    color: canSave ? "#fff" : "#b0a496",
                    fontSize:12, fontWeight:900, letterSpacing:".06em", textTransform:"uppercase",
                    cursor: canSave ? "pointer" : "not-allowed",
                    boxShadow: canSave && !success ? "0 4px 16px rgba(201,125,46,.32)" : "none",
                    transition:"all 0.2s",
                  }}
                >
                  {success
                    ? <><CheckCircle2 size={14} /> Applied!</>
                    : loading
                    ? <><Loader2 size={14} style={{ animation:"spin 0.8s linear infinite" }} /> Applying…</>
                    : "Apply Correction"}
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

// ─── Tiny internal helpers ────────────────────────────────────────────────────

const inputStyle = (): React.CSSProperties => ({
  width:"100%", height:40, borderRadius:10, border:"1.5px solid #e8e0d8",
  padding:"0 13px", fontSize:13, background:"#fff", color:"#1f1a14",
  boxSizing:"border-box", display:"block",
});

const Section: React.FC<{ step:number; title:string; children:React.ReactNode }> = ({ step, title, children }) => (
  <div>
    <div style={{ display:"flex", alignItems:"center", gap:9, marginBottom:16 }}>
      <div style={{ width:22, height:22, borderRadius:"50%", background:"#c97d2e", color:"#fff", fontSize:11, fontWeight:900, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{step}</div>
      <span style={{ fontSize:10, fontWeight:900, letterSpacing:".12em", textTransform:"uppercase", color:"#c97d2e" }}>{title}</span>
    </div>
    {children}
  </div>
);

const Label: React.FC<{ text:string; required?:boolean }> = ({ text, required }) => (
  <label style={{ display:"block", fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:".1em", color:"#8a7e72", marginBottom:7 }}>
    {text}{required && <span style={{ color:"#ef4444", marginLeft:2 }}>*</span>}
  </label>
);

const DarkCard: React.FC<{ accent?:boolean; children:React.ReactNode }> = ({ accent, children }) => (
  <div style={{ borderRadius:12, background:accent?"rgba(201,125,46,.09)":"rgba(255,255,255,.04)", border:`1px solid ${accent?"rgba(201,125,46,.2)":"rgba(255,255,255,.07)"}`, padding:14 }}>
    {children}
  </div>
);

const DarkLabel: React.FC<{ accent?:boolean; children:React.ReactNode }> = ({ accent, children }) => (
  <p style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:".08em", color:accent?"rgba(201,125,46,.55)":"rgba(255,255,255,.28)", margin:0 }}>{children}</p>
);

const GhostBtn: React.FC<{ onClick:()=>void; children:React.ReactNode }> = ({ onClick, children }) => (
  <button
    type="button"
    className="scm-ghost"
    onClick={onClick}
    style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 16px", borderRadius:10, border:"1.5px solid #e8e0d8", background:"transparent", color:"#5a5049", fontSize:12, fontWeight:600, cursor:"pointer" }}
  >
    {children}
  </button>
);

export default StockCorrectionModal;