import React, { useState, useEffect, useRef, useMemo } from "react";
import ReactDOM from "react-dom";
import {
  X,
  RotateCcw,
  Boxes,
  CheckCircle2,
  Loader2,
  ArrowUpCircle,
  ArrowDownCircle,
  SlidersHorizontal,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
  Calendar,
  Plus,
  Trash2,
  Building2,
} from "lucide-react";

// ⚠️ Point this at the ONE file where these atoms actually live in your project
// (the file with ModalInput / ModalSelect / ModalTextarea / NumericInput / etc.)
import {
  ModalInput,
  ModalSelect,
  ModalTextarea,
  NumericInput,
} from "../../../components/ui/modal/modalComponent";

// FieldLabel is used standalone next to NumericInput, since NumericInput
// (unlike ModalInput/ModalSelect) doesn't render its own label.
import { FieldLabel } from "./Stockcorrectionatoms";

// ─── Types ────────────────────────────────────────────────────────────────────

type CorrectionType = "add" | "remove" | "set";
type Mode           = "correction" | "movement";

export interface BranchStock {
  branch:       string;
  quantity:     number;
  reserved_qty?: number;
  mrp?:         number;
  batch_no?:    string;
}

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
  /** Full per-branch stock — pass this to unlock multi-branch view + Stock Movement tab */
  branches?: BranchStock[];
}

interface CorrectionFormState {
  itemCode:  string;
  itemName:  string;
  batchNo:   string;
  uom:       string;
  type:      CorrectionType;
  qty:       string;
  reason:    string;
  remarks:   string;
}

interface MoveRow {
  id:    string;
  from:  string;
  to:    string;
  qty:   string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const EMPTY_CORRECTION: CorrectionFormState = {
  itemCode: "", itemName: "", batchNo: "", uom: "",
  type: "add", qty: "", reason: "", remarks: "",
};

const TYPES: {
  id: CorrectionType; label: string; desc: string;
  Icon: React.ElementType; TrendIcon: React.ElementType;
  rawColor: string; bgColor: string; ringColor: string;
}[] = [
  {
    id: "add", label: "Add Stock", desc: "Increase quantity",
    Icon: ArrowUpCircle, TrendIcon: TrendingUp,
    rawColor: "#22c55e", bgColor: "rgba(34,197,94,0.08)", ringColor: "rgba(34,197,94,0.22)",
  },
  {
    id: "remove", label: "Remove Stock", desc: "Decrease quantity",
    Icon: ArrowDownCircle, TrendIcon: TrendingDown,
    rawColor: "#dc2626", bgColor: "rgba(220,38,38,0.08)", ringColor: "rgba(220,38,38,0.22)",
  },
  {
    id: "set", label: "Set Exact", desc: "Physical count result",
    Icon: SlidersHorizontal, TrendIcon: Minus,
    rawColor: "#2563eb", bgColor: "rgba(37,99,235,0.08)", ringColor: "rgba(37,99,235,0.22)",
  },
];

const REASON_OPTIONS = [
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
].map((r) => ({ label: `${r.id} — ${r.label}`, value: r.id }));

const MOVE_REASON_OPTIONS = [
  { id: "REBALANCE",   label: "Stock Rebalancing" },
  { id: "DEMAND",      label: "Branch Demand"     },
  { id: "CONSOLIDATE", label: "Consolidation"     },
  { id: "OTHER",       label: "Other"             },
].map((r) => ({ label: r.label, value: r.id }));

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

function rid() {
  return Math.random().toString(36).slice(2, 10);
}

function emptyMoveRow(): MoveRow {
  return { id: rid(), from: "", to: "", qty: "" };
}

// ─── Component ────────────────────────────────────────────────────────────────

const StockCorrectionModal: React.FC<StockCorrectionModalProps> = ({
  isOpen, onClose, onSuccess, batch, warehouse: propWarehouse, branches,
}) => {
  const [mode, setMode] = useState<Mode>("correction");

  const [form, setForm] = useState<CorrectionFormState>(EMPTY_CORRECTION);
  const [correctionBranch, setCorrectionBranch] = useState<string>("");

  const [moveRows,   setMoveRows]   = useState<MoveRow[]>([emptyMoveRow()]);
  const [moveReason, setMoveReason] = useState("");
  const [moveNotes,  setMoveNotes]  = useState("");

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [docDate]             = useState(nowLabel());
  const batchKey              = useRef<string | null>(null);

  const branchList: BranchStock[] = useMemo(() => {
    if (branches && branches.length) return branches;
    if (batch) {
      return [{
        branch:       propWarehouse ?? batch.warehouse ?? "Default",
        quantity:     typeof batch.bal_qty === "number" ? batch.bal_qty : 0,
        reserved_qty: typeof batch.reserved_qty === "number" ? batch.reserved_qty : 0,
        mrp:          0,
        batch_no:     batch.batch_no,
      }];
    }
    return [];
  }, [branches, batch, propWarehouse]);

  const isMultiBranch = branchList.length > 1;

  const branchMap = useMemo(() => {
    const m: Record<string, BranchStock> = {};
    branchList.forEach((b) => { m[b.branch] = b; });
    return m;
  }, [branchList]);

  const branchOptions = useMemo(
    () => branchList.map((b) => ({ label: `${b.branch} (Avail: ${availableOf(b)})`, value: b.branch })),
    [branchList],
  );

  function availableOf(b: BranchStock) {
    return Math.max(0, b.quantity - (b.reserved_qty ?? 0));
  }

  // ── Reset / hydrate on open ──────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) {
      const t = setTimeout(() => {
        setForm(EMPTY_CORRECTION); setError(null); setSuccess(false);
        setMoveRows([emptyMoveRow()]); setMoveReason(""); setMoveNotes("");
        setMode("correction"); setCorrectionBranch("");
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
    setForm((prev) => ({
      ...prev,
      itemCode: batch._itemCode ?? "",
      itemName: batch._itemName ?? "",
      batchNo:  batch.batch_no  ?? "",
      uom:      batch.uom       ?? "",
    }));
  }, [isOpen, batch]);

  useEffect(() => {
    if (!isOpen) return;
    if (branchList.length && !correctionBranch) {
      setCorrectionBranch(branchList[0].branch);
    }
  }, [isOpen, branchList, correctionBranch]);

  useEffect(() => {
    if (!isOpen) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [isOpen, onClose]);

  // ── Correction derived values ────────────────────────────────────────────
  const activeBranchStock = branchMap[correctionBranch];
  const cur       = activeBranchStock ? activeBranchStock.quantity : 0;
  const reserved  = activeBranchStock ? (activeBranchStock.reserved_qty ?? 0) : 0;
  const available = Math.max(0, cur - reserved);
  const adj       = parseFloat(form.qty) || 0;
  const newQty    = calcNew(cur, adj, form.type);
  const diff      = newQty - cur;
  const AT        = TYPES.find((t) => t.id === form.type)!;

  const canSaveCorrection =
    !!form.itemCode && !!correctionBranch && adj > 0 && !!form.reason && !loading;

  // ── Movement derived values ──────────────────────────────────────────────
  const outflowByBranch = useMemo(() => {
    const m: Record<string, number> = {};
    moveRows.forEach((r) => {
      const q = parseFloat(r.qty) || 0;
      if (r.from && q > 0) m[r.from] = (m[r.from] ?? 0) + q;
    });
    return m;
  }, [moveRows]);

  const rowError = (row: MoveRow): string | null => {
    if (!row.from || !row.to) return null;
    if (row.from === row.to) return "From and To must differ";
    const q = parseFloat(row.qty) || 0;
    if (q <= 0) return null;
    const src = branchMap[row.from];
    if (!src) return null;
    if (outflowByBranch[row.from] > availableOf(src)) return "Exceeds available stock";
    return null;
  };

  const validMoveRows = moveRows.filter((r) => {
    const q = parseFloat(r.qty) || 0;
    return r.from && r.to && r.from !== r.to && q > 0 && !rowError(r);
  });

  const canSaveMovement =
    isMultiBranch && validMoveRows.length > 0 &&
    validMoveRows.length === moveRows.length &&
    !!moveReason && !loading;

  const netEffect = useMemo(() => {
    const deltas: Record<string, number> = {};
    validMoveRows.forEach((r) => {
      const q = parseFloat(r.qty) || 0;
      deltas[r.from] = (deltas[r.from] ?? 0) - q;
      deltas[r.to]   = (deltas[r.to]   ?? 0) + q;
    });
    return branchList
      .filter((b) => deltas[b.branch])
      .map((b) => ({ branch: b.branch, before: b.quantity, delta: deltas[b.branch], after: b.quantity + deltas[b.branch] }));
  }, [validMoveRows, branchList]);

  // ── Setters ───────────────────────────────────────────────────────────────
  const setF = <K extends keyof CorrectionFormState>(k: K, v: CorrectionFormState[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const updateRow = (id: string, patch: Partial<MoveRow>) =>
    setMoveRows((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const addRow    = () => setMoveRows((rows) => [...rows, emptyMoveRow()]);
  const removeRow = (id: string) => setMoveRows((rows) => rows.length > 1 ? rows.filter((r) => r.id !== id) : rows);

  const switchMode = (next: Mode) => {
    if (next === "movement" && !isMultiBranch) return;
    setMode(next);
    setError(null);
  };

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === "correction") {
      if (!canSaveCorrection) return;
      setLoading(true);
      try {
        const { createItemStock } = await import("../../../api/stockApi");
        const res = await createItemStock({
          items: [{
            item_code:       form.itemCode,
            branch:          correctionBranch,
            correction_type: form.type,
            adjustment_qty:  adj,
            new_qty:         newQty,
            reason:          form.reason,
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
    } else {
      if (!canSaveMovement) return;
      setLoading(true);
      try {
        // NOTE: wire this to the real endpoint — placeholder name, mirrors createItemStock's shape.
        const { moveItemStock } = await import("../../../api/stockApi");
        const res = await moveItemStock({
          item_code: form.itemCode,
          reason:    moveReason,
          notes:     moveNotes,
          moves: validMoveRows.map((r) => ({
            from_branch: r.from,
            to_branch:   r.to,
            qty:         parseFloat(r.qty),
          })),
        });
        if (!res || res.status_code !== 200) {
          setError(res?.message ?? "Failed to move stock.");
          return;
        }
        setSuccess(true);
        setTimeout(() => { onSuccess?.(); onClose(); }, 1400);
      } catch (err: any) {
        setError(err?.message ?? "Something went wrong.");
      } finally {
        setLoading(false);
      }
    }
  };

  if (!isOpen) return null;

  const diffLabel = diff > 0 ? `+${diff}` : `${diff}`;
  const diffColor = diff > 0 ? "var(--success)" : diff < 0 ? "var(--danger)" : "var(--muted)";
  const canSave   = mode === "correction" ? canSaveCorrection : canSaveMovement;

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

        .scm-stat {
          flex: 1; border-radius: 10px; padding: 11px 14px;
          background: var(--bg); border: 1.5px solid var(--border);
          display: flex; flex-direction: column; gap: 3px; min-width: 0;
        }
        .scm-stat-lbl { font-size: 9px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); }
        .scm-stat-val { font-size: 20px; font-weight: 900; font-variant-numeric: tabular-nums; line-height: 1; }
        .scm-stat-sub { font-size: 10px; color: var(--muted); margin-top: 1px; }

        .scm-flow {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 14px; border-radius: 10px;
          background: var(--bg); border: 1.5px solid var(--border);
        }
        .scm-flow-col { display: flex; flex-direction: column; align-items: center; gap: 3px; flex: 1; }
        .scm-flow-lbl { font-size: 9px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); }
        .scm-flow-num { font-size: 20px; font-weight: 900; font-variant-numeric: tabular-nums; color: var(--text); line-height: 1; }

        .scm-type-badge {
          display: inline-flex; align-items: center; gap: 5px;
          margin-top: 5px; padding: 3px 9px; border-radius: 6px;
          font-size: 10px; font-weight: 700;
        }

        .scm-scroll::-webkit-scrollbar { width: 4px; }
        .scm-scroll::-webkit-scrollbar-track { background: transparent; }
        .scm-scroll::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }

        /* ── Mode toggle (checkbox style, sits on the dark header) ──
           Kept custom rather than YesNoCheckbox/ToggleSwitch: those atoms are
           styled for a light card background, this sits on the dark header bar. */
        .scm-mode-toggle { display: flex; align-items: center; gap: 18px; padding: 6px 4px; }
        .scm-mode-option { display: flex; align-items: center; gap: 8px; cursor: pointer; user-select: none; }
        .scm-mode-option.disabled { cursor: not-allowed; opacity: .4; }
        .scm-mode-checkbox {
          width: 17px; height: 17px; border-radius: 5px; flex-shrink: 0;
          border: 1.5px solid rgba(255,255,255,0.45);
          background: rgba(255,255,255,0.06);
          display: flex; align-items: center; justify-content: center;
          transition: all .14s;
        }
        .scm-mode-option.checked .scm-mode-checkbox { background: #fff; border-color: #fff; }
        .scm-mode-label {
          font-size: 12.5px; font-weight: 700; color: rgba(255,255,255,0.7);
          transition: color .14s; white-space: nowrap;
        }
        .scm-mode-option.checked .scm-mode-label { color: #fff; }

        /* ── Branch stock table ── */
        .scm-branch-table { width: 100%; border-collapse: collapse; }
        .scm-branch-table th {
          text-align: left; font-size: 9.5px; font-weight: 800; letter-spacing: .06em;
          text-transform: uppercase; color: var(--muted);
          padding: 7px 10px; border-bottom: 1.5px solid var(--border);
        }
        .scm-branch-table td {
          padding: 8px 10px; font-size: 12.5px; color: var(--text);
          border-bottom: 1px solid var(--border);
        }
        .scm-branch-table tr:last-child td { border-bottom: none; }
        .scm-branch-table tr.active-row td { background: rgba(192,132,61,0.06); }

        /* ── Movement rows ── */
        .scm-move-row {
          display: grid; grid-template-columns: 1fr 32px 1fr 120px 32px;
          align-items: end; gap: 8px; padding: 8px 0;
          border-bottom: 1px dashed var(--border);
        }
        .scm-move-row:last-of-type { border-bottom: none; }
        .scm-icon-btn {
          width: 30px; height: 30px; border-radius: 7px;
          border: 1.5px solid var(--border); background: var(--bg);
          color: var(--muted); display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all .13s; flex-shrink: 0;
        }
        .scm-icon-btn:hover { color: var(--danger); border-color: var(--danger); background: rgba(220,38,38,0.06); }
        .scm-icon-btn:disabled { opacity: .35; cursor: not-allowed; }
        .scm-add-row {
          display: flex; align-items: center; gap: 6px;
          font-size: 12px; font-weight: 700; color: var(--primary);
          background: none; border: none; cursor: pointer; padding: 8px 0 0;
          font-family: inherit;
        }
        .scm-add-row:hover { text-decoration: underline; }
        .scm-row-error { font-size: 10.5px; color: var(--danger); font-weight: 600; margin-top: 3px; }

        /* ── Net effect table ── */
        .scm-net-row {
          display: grid; grid-template-columns: 1.4fr 1fr 1fr 1fr;
          gap: 8px; padding: 7px 10px; font-size: 12px; align-items: center;
          border-bottom: 1px solid var(--border);
        }
        .scm-net-row:last-child { border-bottom: none; }
        .scm-net-hd {
          display: grid; grid-template-columns: 1.4fr 1fr 1fr 1fr;
          gap: 8px; padding: 0 10px 7px; font-size: 9.5px; font-weight: 800;
          letter-spacing: .06em; text-transform: uppercase; color: var(--muted);
          border-bottom: 1.5px solid var(--border); margin-bottom: 3px;
        }
      `}</style>

      <div
        className="scm-overlay"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        style={{
          position: "fixed", inset: 0, zIndex: 10000,
          background: "rgba(0,0,0,0.48)", backdropFilter: "blur(8px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
        }}
      >
        <div
          className="scm-dialog"
          style={{
            width: "min(880px,100%)", maxHeight: "92vh",
            display: "flex", flexDirection: "column",
            borderRadius: 16, overflow: "hidden",
            background: "var(--card)",
            boxShadow: "0 28px 72px rgba(0,0,0,0.26), 0 0 0 1px var(--border)",
          }}
        >

          {/* ══════════════ HEADER ══════════════ */}
          <div style={{
            flexShrink: 0, background: "var(--table-head)", padding: "14px 20px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            borderBottom: "1px solid var(--border)", gap: 16, flexWrap: "wrap",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 9,
                background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <Boxes size={17} style={{ color: "var(--table-head-text,#fff)" }} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "var(--table-head-text,#fff)", letterSpacing: "-0.01em" }}>
                  Stock Correction &amp; Movement
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 3 }}>
                  <Calendar size={10} style={{ color: "rgba(255,255,255,0.45)" }} />
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", lineHeight: 1 }}>{docDate}</span>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div className="scm-mode-toggle">
                <label className={`scm-mode-option${mode === "correction" ? " checked" : ""}`}>
                  <input type="checkbox" checked={mode === "correction"} onChange={() => switchMode("correction")} style={{ display: "none" }} />
                  <span className="scm-mode-checkbox">
                    {mode === "correction" && <CheckCircle2 size={12} style={{ color: "#111" }} />}
                  </span>
                  <span className="scm-mode-label">Stock Correction</span>
                </label>

                <label
                  className={`scm-mode-option${mode === "movement" ? " checked" : ""}${!isMultiBranch ? " disabled" : ""}`}
                  title={!isMultiBranch ? "Needs stock in 2+ branches" : undefined}
                >
                  <input type="checkbox" checked={mode === "movement"} disabled={!isMultiBranch} onChange={() => switchMode("movement")} style={{ display: "none" }} />
                  <span className="scm-mode-checkbox">
                    {mode === "movement" && <CheckCircle2 size={12} style={{ color: "#111" }} />}
                  </span>
                  <span className="scm-mode-label">Stock Movement</span>
                </label>
              </div>

              <button
                onClick={onClose}
                style={{
                  width: 28, height: 28, borderRadius: 7,
                  border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.55)", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.13s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.18)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
              >
                <X size={13} />
              </button>
            </div>
          </div>

          {/* ══════════════ BODY ══════════════ */}
          <form onSubmit={handleSubmit} style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}>
            <div className="scm-scroll" style={{ flex: 1, overflowY: "auto", padding: "20px 22px", display: "flex", flexDirection: "column", gap: 22 }}>

              {/* ①  Item Information — now on ModalInput */}
              <section>
                <div className="scm-section-hd">
                  <div className="scm-badge">1</div>
                  <span className="scm-section-title">Item Information</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                  <ModalInput
                    label="Item Code"
                    required
                    value={form.itemCode}
                    onChange={(e) => setF("itemCode", e.target.value)}
                    placeholder="ITM-00123"
                  />
                  <ModalInput
                    label="Item Name"
                    value={form.itemName}
                    onChange={(e) => setF("itemName", e.target.value)}
                    placeholder="Item description"
                  />
                  <ModalInput
                    label="Batch No."
                    value={form.batchNo}
                    readOnly
                    placeholder="—"
                  />
                  <ModalInput
                    label="Unit of Measure"
                    value={form.uom}
                    onChange={(e) => setF("uom", e.target.value)}
                    placeholder="PCS"
                  />
                </div>
              </section>

              {/* ②  Stock by Branch — no matching atom, stays bespoke */}
              <section>
                <div className="scm-section-hd">
                  <div className="scm-badge">2</div>
                  <span className="scm-section-title">
                    {isMultiBranch ? "Stock by Branch" : "System Stock"}
                  </span>
                </div>

                {isMultiBranch ? (
                  <div style={{ borderRadius: 10, border: "1.5px solid var(--border)", overflow: "hidden" }}>
                    <table className="scm-branch-table">
                      <thead>
                        <tr>
                          <th><Building2 size={10} style={{ marginRight: 4, verticalAlign: -1 }} />Branch</th>
                          <th>Qty</th>
                          <th>Reserved</th>
                          <th>Available</th>
                          <th>Batch</th>
                        </tr>
                      </thead>
                      <tbody>
                        {branchList.map((b) => (
                          <tr key={b.branch} className={mode === "correction" && b.branch === correctionBranch ? "active-row" : ""}>
                            <td style={{ fontWeight: 700 }}>{b.branch}</td>
                            <td className="tabular-nums">{b.quantity}</td>
                            <td className="tabular-nums" style={{ color: "var(--muted)" }}>{b.reserved_qty ?? 0}</td>
                            <td className="tabular-nums" style={{ color: "var(--success)", fontWeight: 700 }}>{availableOf(b)}</td>
                            <td style={{ color: "var(--muted)" }}>{b.batch_no || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: 12 }}>
                    <div className="scm-stat">
                      <span className="scm-stat-lbl">Current Qty</span>
                      <span className="scm-stat-val" style={{ color: "var(--text)" }}>{branchList.length ? cur : "—"}</span>
                      <span className="scm-stat-sub">System balance · {form.uom || "units"}</span>
                    </div>
                    <div className="scm-stat">
                      <span className="scm-stat-lbl">Reserved</span>
                      <span className="scm-stat-val" style={{ color: "var(--muted)" }}>{branchList.length ? reserved : "—"}</span>
                      <span className="scm-stat-sub">Pending orders</span>
                    </div>
                    <div className="scm-stat" style={{ borderColor: "rgba(34,197,94,0.3)" }}>
                      <span className="scm-stat-lbl">Available</span>
                      <span className="scm-stat-val" style={{ color: "var(--success)" }}>{branchList.length ? available : "—"}</span>
                      <span className="scm-stat-sub">Free to use</span>
                    </div>
                  </div>
                )}
              </section>

              {/* ═══════════════ MODE: CORRECTION ═══════════════ */}
              {mode === "correction" && (
                <>
                  <section>
                    <div className="scm-section-hd">
                      <div className="scm-badge">3</div>
                      <span className="scm-section-title">Correction Details</span>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: isMultiBranch ? "repeat(4, 1fr)" : "repeat(3, 1fr)", gap: 12 }}>

                      {isMultiBranch && (
                        <ModalSelect
                          label="Branch"
                          required
                          value={correctionBranch}
                          options={branchOptions}
                          onChange={(e) => setCorrectionBranch(e.target.value)}
                        />
                      )}

                      <div>
                        <ModalSelect
                          label="Correction Type"
                          required
                          value={form.type}
                          options={TYPES.map((t) => ({ label: t.label, value: t.id }))}
                          onChange={(e) => setF("type", e.target.value as CorrectionType)}
                          style={{ borderColor: AT.rawColor }}
                        />
                        <div className="scm-type-badge" style={{ background: AT.bgColor, border: `1px solid ${AT.ringColor}` }}>
                          <AT.Icon size={11} style={{ color: AT.rawColor }} />
                          <span style={{ color: AT.rawColor }}>{AT.desc}</span>
                        </div>
                      </div>

                      <div>
                        <FieldLabel label={form.type === "set" ? "Physical Count Qty" : "Adjustment Quantity"} required />
                        <NumericInput
                          name="qty"
                          value={form.qty === "" ? null : Number(form.qty)}
                          onChange={(v) => setF("qty", v == null ? "" : String(v))}
                          placeholder="0"
                          decimalScale={0}
                          allowNegative={false}
                          className="w-full h-9"
                          style={{ borderColor: adj > 0 ? AT.rawColor : undefined, fontSize: 16, fontWeight: 900 }}
                        />
                      </div>

                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <FieldLabel label="System Qty → New Qty" />
                        <div className="scm-flow" style={{ flex: 1 }}>
                          <div className="scm-flow-col">
                            <span className="scm-flow-lbl">System</span>
                            <span className="scm-flow-num">{branchList.length ? cur : "—"}</span>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                            {adj > 0 ? (
                              <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 6, background: AT.bgColor, border: `1px solid ${AT.ringColor}` }}>
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
                            <span className="scm-flow-num" style={{
                              fontSize: 22,
                              color: adj > 0 ? (diff > 0 ? "var(--success)" : diff < 0 ? "var(--danger)" : "var(--muted)") : "var(--muted)",
                              opacity: adj > 0 ? 1 : 0.28,
                            }}>
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

                  <section>
                    <div className="scm-section-hd">
                      <div className="scm-badge">4</div>
                      <span className="scm-section-title">Reason</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <ModalSelect
                        label="Select Reason for Correction"
                        required
                        value={form.reason}
                        options={REASON_OPTIONS}
                        placeholder="Select reason for correction…"
                        onChange={(e) => setF("reason", e.target.value)}
                        style={{ borderColor: form.reason ? AT.rawColor : undefined }}
                      />
                      <ModalTextarea
                        label="Remarks"
                        value={form.remarks}
                        onChange={(e) => setF("remarks", e.target.value)}
                        placeholder="Add context for the audit trail… (optional)"
                        className="h-[76px]"
                      />
                    </div>
                  </section>
                </>
              )}

              {/* ═══════════════ MODE: MOVEMENT ═══════════════ */}
              {mode === "movement" && (
                <>
                  <section>
                    <div className="scm-section-hd">
                      <div className="scm-badge">3</div>
                      <span className="scm-section-title">Move Stock</span>
                    </div>

                    {moveRows.map((row) => {
                      const err = rowError(row);
                      const srcAvail = row.from && branchMap[row.from] ? availableOf(branchMap[row.from]) : null;
                      const toOptions = branchList
                        .filter((b) => b.branch !== row.from)
                        .map((b) => ({ label: b.branch, value: b.branch }));

                      return (
                        <div key={row.id}>
                          <div className="scm-move-row">
                            <ModalSelect
                              label="From Branch"
                              value={row.from}
                              options={branchOptions}
                              placeholder="Select…"
                              onChange={(e) => updateRow(row.id, { from: e.target.value })}
                              style={{ borderColor: err ? "var(--danger)" : undefined }}
                            />

                            <div style={{ display: "flex", justifyContent: "center", paddingBottom: 8 }}>
                              <ArrowRight size={15} style={{ color: "var(--muted)" }} />
                            </div>

                            <ModalSelect
                              label="To Branch"
                              value={row.to}
                              options={toOptions}
                              placeholder="Select…"
                              onChange={(e) => updateRow(row.id, { to: e.target.value })}
                              style={{ borderColor: err ? "var(--danger)" : undefined }}
                            />

                            <div>
                              <FieldLabel label="Quantity" />
                              <NumericInput
                                name={`move-qty-${row.id}`}
                                value={row.qty === "" ? null : Number(row.qty)}
                                onChange={(v) => updateRow(row.id, { qty: v == null ? "" : String(v) })}
                                placeholder="0"
                                decimalScale={0}
                                allowNegative={false}
                                className="w-full h-9"
                                style={{ borderColor: err ? "var(--danger)" : undefined, fontWeight: 700 }}
                              />
                            </div>

                            <button
                              type="button"
                              className="scm-icon-btn"
                              onClick={() => removeRow(row.id)}
                              disabled={moveRows.length === 1}
                              style={{ marginBottom: 1 }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                          {err && <div className="scm-row-error">{err}</div>}
                          {!err && srcAvail !== null && row.qty && (
                            <div style={{ fontSize: 10.5, color: "var(--muted)", marginTop: 3 }}>
                              {srcAvail} available in {row.from}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    <button type="button" className="scm-add-row" onClick={addRow}>
                      <Plus size={13} /> Add Row
                    </button>
                  </section>

                  {netEffect.length > 0 && (
                    <section>
                      <div className="scm-section-hd">
                        <div className="scm-badge">4</div>
                        <span className="scm-section-title">Net Effect Preview</span>
                      </div>
                      <div style={{ borderRadius: 10, border: "1.5px solid var(--border)", padding: "8px 0" }}>
                        <div className="scm-net-hd">
                          <span>Branch</span><span>Before</span><span>Change</span><span>After</span>
                        </div>
                        {netEffect.map((n) => (
                          <div className="scm-net-row" key={n.branch}>
                            <span style={{ fontWeight: 700 }}>{n.branch}</span>
                            <span className="tabular-nums" style={{ color: "var(--muted)" }}>{n.before}</span>
                            <span className="tabular-nums" style={{ fontWeight: 700, color: n.delta > 0 ? "var(--success)" : "var(--danger)" }}>
                              {n.delta > 0 ? `+${n.delta}` : n.delta}
                            </span>
                            <span className="tabular-nums" style={{ fontWeight: 800 }}>{n.after}</span>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  <section>
                    <div className="scm-section-hd">
                      <div className="scm-badge">{netEffect.length > 0 ? 5 : 4}</div>
                      <span className="scm-section-title">Reason</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <ModalSelect
                        label="Reason for Movement"
                        required
                        value={moveReason}
                        options={MOVE_REASON_OPTIONS}
                        placeholder="Select reason…"
                        onChange={(e) => setMoveReason(e.target.value)}
                      />
                      <ModalTextarea
                        label="Remarks"
                        value={moveNotes}
                        onChange={(e) => setMoveNotes(e.target.value)}
                        placeholder="Add context for the audit trail… (optional)"
                        className="h-[76px]"
                      />
                    </div>
                  </section>
                </>
              )}

              {error && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 9,
                  background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.22)",
                  color: "var(--danger)", fontSize: 13,
                }}>
                  <AlertCircle size={15} style={{ flexShrink: 0 }} />
                  {error}
                </div>
              )}
            </div>

            {/* ══════════════ FOOTER ══════════════ */}
            <div style={{
              flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "12px 22px", background: "var(--card)", borderTop: "1px solid var(--border)",
            }}>
              <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>
                {mode === "correction" ? (
                  form.itemCode ? (
                    <>
                      <span style={{ color: "var(--text)", fontWeight: 700 }}>{form.itemCode}</span>
                      {isMultiBranch && correctionBranch && <> · <span style={{ color: "var(--text)" }}>{correctionBranch}</span></>}
                      {form.reason && <> · <span style={{ color: AT.rawColor, fontWeight: 600 }}>{REASON_OPTIONS.find((r) => r.value === form.reason)?.label}</span></>}
                      {adj > 0 && <> · <span style={{ fontWeight: 700, color: diffColor }}>{diffLabel} {form.uom || "units"}</span></>}
                    </>
                  ) : "No item selected"
                ) : (
                  validMoveRows.length > 0
                    ? `${validMoveRows.length} move${validMoveRows.length > 1 ? "s" : ""} · ${validMoveRows.reduce((s, r) => s + (parseFloat(r.qty) || 0), 0)} units total`
                    : "No valid movement rows yet"
                )}
              </p>

              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button type="button" className="scm-ghost" onClick={() => {
                  if (mode === "correction") setForm(EMPTY_CORRECTION);
                  else { setMoveRows([emptyMoveRow()]); setMoveReason(""); setMoveNotes(""); }
                  setError(null);
                }}>
                  <RotateCcw size={11} /> Reset
                </button>
                <button type="button" className="scm-ghost" onClick={onClose}>Cancel</button>
                <button type="submit" disabled={!canSave} className={`scm-submit${success ? " scm-success-pop" : ""}`}
                  style={{
                    background: success ? "var(--success)" : canSave ? "var(--primary)" : "var(--border)",
                    color: canSave || success ? "#fff" : "var(--muted)",
                    boxShadow: canSave && !success ? "0 4px 14px rgba(192,132,61,0.28)" : "none",
                  }}>
                  {success
                    ? <><CheckCircle2 size={14} /> {mode === "correction" ? "Applied!" : "Moved!"}</>
                    : loading
                    ? <><Loader2 size={14} className="scm-spinner" /> {mode === "correction" ? "Applying…" : "Moving…"}</>
                    : mode === "correction" ? "Apply Correction" : "Execute Movement"}
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

export default StockCorrectionModal;