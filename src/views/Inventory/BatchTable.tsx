import React, { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import StockCorrectionModal from "../../components/inventory/stock/Stockcorrectionmodal";
import {
  Package2,
  Eye,
  MoreVertical,
  ClipboardEdit,
  Trash2,
  BookOpen,
  X,
  Calendar,
  Hash,
  TrendingUp,
  TrendingDown,
  Layers,
  ShoppingCart,
  Tag,
  AlertTriangle,
  CheckCircle2,
  Clock,
  BoxSelect,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Batch {
  batch_no?: string;
  manufacturing_date?: string;
  expiry_date?: string;
  bal_qty?: number;
  in_qty?: number;
  out_qty?: number;
  buy_value?: number;
  sell_value?: number;
  _itemCode?: string;
  _itemName?: string;
}

interface Props {
  batches: Batch[];
  itemCode?: string;
  itemName?: string;
  onEdit?: (batch: Batch) => void;
  onDelete?: (batch: Batch) => void;
  onLedger?: (batch: Batch) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const isExpired = (d?: string) => !!d && new Date(d) < new Date();
const isExpiringSoon = (d?: string) => {
  if (!d) return false;
  const diff = (new Date(d).getTime() - Date.now()) / 86400000;
  return diff > 0 && diff <= 90;
};
const formatDate = (d?: string) => {
  if (!d || d === "-") return "—";
  try {
    return new Date(d).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return d;
  }
};
const fmt = (n?: number | string, digits = 0) =>
  Number(n ?? 0).toLocaleString("en-IN", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });

// ─── Portal dropdown ──────────────────────────────────────────────────────────

const PortalMenu: React.FC<{
  anchor: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ anchor, open, onClose, children }) => {
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!open || !anchor) return;
    const r = anchor.getBoundingClientRect();
    const top =
      window.innerHeight - r.bottom < 180 ? r.top - 180 - 4 : r.bottom + 4;
    setPos({ top, left: r.right - 172 });
  }, [open, anchor]);

  useEffect(() => {
    if (!open) return;

    const h = (e: MouseEvent) => {
      const target = e.target as Node;

      if (anchor?.contains(target)) return;

      if ((target as HTMLElement).closest(".batch-menu")) return;

      onClose();
    };

    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open, anchor, onClose]);

  if (!open) return null;
  return ReactDOM.createPortal(
    <div
      style={{
        position: "fixed",
        top: pos.top,
        left: pos.left,
        zIndex: 99999,
        minWidth: 172,
        background: "#fff",
        border: "1px solid #e8e0d5",
        borderRadius: 12,
        boxShadow: "0 8px 28px rgba(0,0,0,0.14)",
        padding: "4px 0",
      }}
    >
      {children}
    </div>,
    document.body,
  );
};

// ─── Action Menu ─────────────────────────────────────────────────────────────

const BatchMenu: React.FC<{
  batch: Batch;
  onEdit?: (b: Batch) => void;
  onDelete?: (b: Batch) => void;
  onLedger?: (b: Batch) => void;
}> = ({ batch, onEdit, onDelete, onLedger }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);

  const items = [
    onEdit && {
      icon: ClipboardEdit,
      label: "Stock Correction",
      color: "#c97d2e",
      danger: false,
      action: () => {
        console.log("Stock correction clicked", batch);
        onEdit?.(batch);
        setOpen(false);
      },
    },
    onLedger && {
      icon: BookOpen,
      label: "View Ledger",
      color: "#2563eb",
      danger: false,
      action: () => {
        onLedger(batch);
        setOpen(false);
      },
    },
    onDelete && {
      icon: Trash2,
      label: "Delete Batch",
      color: "#ef4444",
      danger: true,
      action: () => {
        onDelete(batch);
        setOpen(false);
      },
    },
  ].filter(Boolean) as {
    icon: React.ElementType;
    label: string;
    color: string;
    danger: boolean;
    action: () => void;
  }[];

  return (
    <>
      <button
        ref={ref}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((p) => !p);
        }}
        style={{
          width: 28,
          height: 28,
          borderRadius: 7,
          border: `1px solid ${open ? "rgba(201,125,46,0.35)" : "rgba(0,0,0,0.1)"}`,
          background: open ? "rgba(201,125,46,0.09)" : "transparent",
          color: "#999",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.12s",
        }}
        onMouseEnter={(e) => {
          if (!open) {
            e.currentTarget.style.borderColor = "rgba(201,125,46,0.3)";
            e.currentTarget.style.background = "rgba(201,125,46,0.06)";
          }
        }}
        onMouseLeave={(e) => {
          if (!open) {
            e.currentTarget.style.borderColor = "rgba(0,0,0,0.1)";
            e.currentTarget.style.background = "transparent";
          }
        }}
      >
        <MoreVertical size={14} />
      </button>

      <PortalMenu
        anchor={ref.current}
        open={open}
        onClose={() => setOpen(false)}
      >
        {items.map((item, i) => (
          <React.Fragment key={item.label}>
            {item.danger && i > 0 && (
              <div
                style={{ height: 1, background: "#f0ebe4", margin: "3px 0" }}
              />
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                item.action();
              }}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 9,
                padding: "9px 14px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: item.color,
                fontSize: 12,
                fontWeight: 600,
                textAlign: "left",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = item.danger
                  ? "rgba(239,68,68,0.06)"
                  : "rgba(201,125,46,0.06)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <item.icon
                size={13}
                strokeWidth={2}
                style={{ color: item.color, flexShrink: 0 }}
              />
              {item.label}
            </button>
          </React.Fragment>
        ))}
      </PortalMenu>
    </>
  );
};

// ─── Batch Detail Modal ───────────────────────────────────────────────────────

const BatchDetailModal: React.FC<{
  batch: Batch | null;
  onClose: () => void;
}> = ({ batch, onClose }) => {
  useEffect(() => {
    if (!batch) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [batch, onClose]);

  if (!batch) return null;

  const expired = isExpired(batch.expiry_date);
  const expiring = isExpiringSoon(batch.expiry_date);
  const sc = expired
    ? {
        bg: "rgba(239,68,68,0.08)",
        border: "#ef4444",
        text: "#dc2626",
        dot: "#ef4444",
        label: "Expired",
        Icon: AlertTriangle,
      }
    : expiring
      ? {
          bg: "rgba(245,158,11,0.08)",
          border: "#f59e0b",
          text: "#d97706",
          dot: "#f59e0b",
          label: "Expiring Soon",
          Icon: Clock,
        }
      : {
          bg: "rgba(16,185,129,0.08)",
          border: "#10b981",
          text: "#059669",
          dot: "#10b981",
          label: "Active",
          Icon: CheckCircle2,
        };

  const Row = ({
    icon: Icon,
    label,
    value,
    valueEl,
    accent,
  }: {
    icon: React.ElementType;
    label: string;
    value?: string;
    valueEl?: React.ReactNode;
    accent?: boolean;
  }) => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "11px 16px",
        borderBottom: "1px solid rgba(201,125,46,0.07)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: "rgba(201,125,46,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={13} style={{ color: "#c97d2e" }} />
        </div>
        <span style={{ fontSize: 12, color: "#888", fontWeight: 500 }}>
          {label}
        </span>
      </div>
      {valueEl ?? (
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: accent ? "#c97d2e" : "#2d2d2d",
          }}
        >
          {value ?? "—"}
        </span>
      )}
    </div>
  );

  return ReactDOM.createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10001,
        background: "rgba(0,0,0,0.45)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: 460,
          maxHeight: "88vh",
          background: "#f9f6f1",
          borderRadius: 20,
          boxShadow: "0 24px 60px rgba(0,0,0,0.22)",
          border: "1px solid #e8e0d5",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 22px",
            background: "#fff",
            borderBottom: "1px solid #e8e0d5",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 11,
                background: "rgba(201,125,46,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <BoxSelect size={18} style={{ color: "#c97d2e" }} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{ fontSize: 14, fontWeight: 800, color: "#1f1a14" }}
                >
                  Batch Details
                </span>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: 99,
                    background: sc.bg,
                    border: `1px solid ${sc.border}`,
                    color: sc.text,
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: sc.dot,
                    }}
                  />
                  {sc.label}
                </span>
              </div>
              <p
                style={{
                  fontSize: 11,
                  color: "#999",
                  margin: "2px 0 0",
                  fontFamily: "monospace",
                }}
              >
                {batch._itemName ? `${batch._itemName} · ` : ""}
                {batch.batch_no || "—"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              border: "1px solid #e8e0d5",
              background: "transparent",
              color: "#aaa",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 0" }}>
          <p
            style={{
              fontSize: 10,
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: ".12em",
              color: "rgba(201,125,46,0.5)",
              padding: "4px 18px 6px",
            }}
          >
            Identification
          </p>
          <div
            style={{
              margin: "0 14px",
              background: "#fff",
              borderRadius: 12,
              border: "1px solid #e8e0d5",
              overflow: "hidden",
            }}
          >
            <Row
              icon={Hash}
              label="Batch No"
              valueEl={
                <span
                  style={{
                    fontFamily: "monospace",
                    fontSize: 12,
                    fontWeight: 700,
                    padding: "3px 10px",
                    borderRadius: 6,
                    background: "rgba(201,125,46,0.08)",
                    border: "1px solid rgba(201,125,46,0.18)",
                    color: "#1f1a14",
                  }}
                >
                  {batch.batch_no || "—"}
                </span>
              }
            />
            {batch._itemCode && (
              <Row icon={Tag} label="Item Code" value={batch._itemCode} />
            )}
            {batch._itemName && (
              <Row icon={Layers} label="Item Name" value={batch._itemName} />
            )}
          </div>

          <p
            style={{
              fontSize: 10,
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: ".12em",
              color: "rgba(201,125,46,0.5)",
              padding: "14px 18px 6px",
            }}
          >
            Dates
          </p>
          <div
            style={{
              margin: "0 14px",
              background: "#fff",
              borderRadius: 12,
              border: "1px solid #e8e0d5",
              overflow: "hidden",
            }}
          >
            <Row
              icon={Calendar}
              label="Mfg Date"
              value={formatDate(batch.manufacturing_date)}
            />
            <Row
              icon={Calendar}
              label="Expiry Date"
              valueEl={
                batch.expiry_date ? (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      fontSize: 12,
                      fontWeight: 600,
                      padding: "3px 9px",
                      borderRadius: 6,
                      background: sc.bg,
                      color: sc.text,
                      border: `1px solid ${sc.border}`,
                    }}
                  >
                    <sc.Icon size={11} />
                    {formatDate(batch.expiry_date)}
                  </span>
                ) : (
                  <span style={{ color: "rgba(0,0,0,0.2)", fontSize: 12 }}>
                    —
                  </span>
                )
              }
            />
          </div>

          <p
            style={{
              fontSize: 10,
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: ".12em",
              color: "rgba(201,125,46,0.5)",
              padding: "14px 18px 6px",
            }}
          >
            Stock Movement
          </p>
          <div
            style={{
              margin: "0 14px",
              background: "#fff",
              borderRadius: 12,
              border: "1px solid #e8e0d5",
              overflow: "hidden",
            }}
          >
            <Row
              icon={Layers}
              label="Balance Qty"
              valueEl={
                <span
                  style={{ fontSize: 15, fontWeight: 900, color: "#1f1a14" }}
                >
                  {fmt(batch.bal_qty)}
                </span>
              }
            />
            <Row
              icon={TrendingUp}
              label="In Qty"
              valueEl={
                <span
                  style={{ fontSize: 12, fontWeight: 700, color: "#16a34a" }}
                >
                  +{fmt(batch.in_qty, 4)}
                </span>
              }
            />
            <Row
              icon={TrendingDown}
              label="Out Qty"
              valueEl={
                <span
                  style={{ fontSize: 12, fontWeight: 700, color: "#dc2626" }}
                >
                  -{fmt(batch.out_qty, 4)}
                </span>
              }
            />
          </div>

          <p
            style={{
              fontSize: 10,
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: ".12em",
              color: "rgba(201,125,46,0.5)",
              padding: "14px 18px 6px",
            }}
          >
            Valuation
          </p>
          <div
            style={{
              margin: "0 14px 12px",
              background: "#fff",
              borderRadius: 12,
              border: "1px solid #e8e0d5",
              overflow: "hidden",
            }}
          >
            <Row
              icon={ShoppingCart}
              label="Buy Value"
              value={`INR ${fmt(batch.buy_value, 2)}`}
            />
            <Row
              icon={Tag}
              label="Sell Value"
              value={`INR ${fmt(batch.sell_value, 2)}`}
              accent
            />
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "12px 18px",
            background: "#fff",
            borderTop: "1px solid #e8e0d5",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "8px 22px",
              borderRadius: 10,
              border: "none",
              background: "#c97d2e",
              color: "#fff",
              fontSize: 12,
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(201,125,46,0.3)",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

// ─── Main BatchTable ──────────────────────────────────────────────────────────

const BatchTable: React.FC<Props> = ({
  batches,
  itemCode,
  itemName,
  onEdit,
  onDelete,
  onLedger,
}) => {
  const [viewBatch, setViewBatch] = useState<Batch | null>(null);

  // Enrich every batch with parent item context
  const enriched = batches.map((b) => ({
    ...b,
    _itemCode: itemCode,
    _itemName: itemName,
  }));

  const totalQty = enriched.reduce((s, b) => s + (b.bal_qty ?? 0), 0);
  const totalBuy = enriched.reduce((s, b) => s + Number(b.buy_value || 0), 0);
  const totalSell = enriched.reduce((s, b) => s + Number(b.sell_value || 0), 0);

  return (
    <>
      <div
        className="w-full"
        style={{
          background: "linear-gradient(to right,#fdf8f2,#fefcf9)",
          borderLeft: "3px solid var(--primary,#c97d2e)",
          boxShadow:
            "inset 0 2px 8px rgba(0,0,0,0.04),inset 0 -2px 8px rgba(0,0,0,0.03)",
        }}
      >
        {/* Sub-header */}
        <div
          className="flex items-center gap-2.5 px-6 py-2.5"
          style={{ borderBottom: "1px solid rgba(201,125,46,0.15)" }}
        >
          <div
            className="flex items-center justify-center w-5 h-5 rounded-md"
            style={{ background: "rgba(201,125,46,0.12)" }}
          >
            <Package2 size={11} style={{ color: "var(--primary,#c97d2e)" }} />
          </div>
          <span
            className="text-[10px] font-black tracking-widest uppercase"
            style={{ color: "var(--primary,#c97d2e)" }}
          >
            Batch Details
          </span>
          <span
            className="text-[10px] font-semibold rounded-full px-2 py-0.5"
            style={{
              background: "rgba(201,125,46,0.1)",
              color: "var(--primary,#c97d2e)",
            }}
          >
            {enriched.length} {enriched.length === 1 ? "batch" : "batches"}
          </span>
        </div>

        {enriched.length === 0 ? (
          <div
            className="px-8 py-5 text-xs opacity-50"
            style={{ color: "var(--muted,#999)" }}
          >
            No batch data available.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr
                className="text-[10px] font-black uppercase tracking-[0.1em]"
                style={{
                  color: "var(--muted,#999)",
                  background: "rgba(201,125,46,0.05)",
                  borderBottom: "1px solid rgba(201,125,46,0.12)",
                }}
              >
                <th className="w-14 pl-9 pr-2 py-2.5 text-center">#</th>
                <th className="px-5 py-2.5 text-left">Batch No</th>
                <th className="px-5 py-2.5 text-left">MFG Date</th>
                <th className="px-5 py-2.5 text-left">EXP Date</th>
                <th className="px-5 py-2.5 text-right">Qty</th>
                <th className="px-5 py-2.5 text-right">In Qty</th>
                <th className="px-5 py-2.5 text-right">Out Qty</th>
                <th className="px-5 py-2.5 text-right">Buy Value</th>
                <th className="px-5 py-2.5 text-right">Sell Value</th>
                <th
                  className="px-4 py-2.5 text-center"
                  style={{ minWidth: 100 }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {enriched.map((b, idx) => {
                const expired = isExpired(b.expiry_date);
                const expiring = isExpiringSoon(b.expiry_date);
                return (
                  <tr
                    key={idx}
                    style={{
                      background:
                        idx % 2 === 0
                          ? "rgba(253,248,242,0.6)"
                          : "rgba(255,255,255,0.7)",
                      borderBottom:
                        idx === enriched.length - 1
                          ? "none"
                          : "1px solid rgba(201,125,46,0.07)",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        "rgba(201,125,46,0.06)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background =
                        idx % 2 === 0
                          ? "rgba(253,248,242,0.6)"
                          : "rgba(255,255,255,0.7)")
                    }
                  >
                    <td
                      className="pl-9 pr-2 py-3 text-center text-[10px] font-semibold tabular-nums"
                      style={{ color: "rgba(201,125,46,0.35)" }}
                    >
                      {String(idx + 1).padStart(2, "0")}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className="font-mono text-xs font-semibold px-2.5 py-1 rounded-md"
                        style={{
                          background: "rgba(201,125,46,0.08)",
                          color: "var(--main,#2d2d2d)",
                          border: "1px solid rgba(201,125,46,0.18)",
                        }}
                      >
                        {b.batch_no || "—"}
                      </span>
                    </td>
                    <td
                      className="px-5 py-3 text-xs"
                      style={{ color: "var(--muted,#888)" }}
                    >
                      {formatDate(b.manufacturing_date)}
                    </td>
                    <td className="px-5 py-3">
                      {b.expiry_date ? (
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md ${expired ? "bg-red-50 text-red-600 border border-red-100" : expiring ? "bg-amber-50 text-amber-600 border border-amber-100" : "bg-emerald-50 text-emerald-700 border border-emerald-100"}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${expired ? "bg-red-500" : expiring ? "bg-amber-500" : "bg-emerald-500"}`}
                          />
                          {formatDate(b.expiry_date)}
                        </span>
                      ) : (
                        <span
                          className="text-xs"
                          style={{ color: "rgba(0,0,0,0.2)" }}
                        >
                          —
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span
                        className="font-bold text-xs tabular-nums"
                        style={{ color: "var(--main,#2d2d2d)" }}
                      >
                        {(b.bal_qty ?? 0).toLocaleString("en-IN")}
                      </span>
                    </td>
                    <td
                      className="px-5 py-3 text-right text-xs tabular-nums font-medium"
                      style={{ color: "#16a34a" }}
                    >
                      {b.in_qty ? (
                        `+${b.in_qty.toLocaleString("en-IN", { maximumFractionDigits: 4 })}`
                      ) : (
                        <span style={{ color: "var(--muted,#999)" }}>0</span>
                      )}
                    </td>
                    <td
                      className="px-5 py-3 text-right text-xs tabular-nums font-medium"
                      style={{ color: "#dc2626" }}
                    >
                      {b.out_qty ? (
                        `-${b.out_qty.toLocaleString("en-IN", { maximumFractionDigits: 4 })}`
                      ) : (
                        <span style={{ color: "var(--muted,#999)" }}>0</span>
                      )}
                    </td>
                    <td
                      className="px-5 py-3 text-right text-xs tabular-nums"
                      style={{ color: "var(--muted,#888)" }}
                    >
                      {Number(b.buy_value || 0).toLocaleString("en-IN")}
                    </td>
                    <td
                      className="px-5 py-3 text-right text-xs font-semibold tabular-nums"
                      style={{ color: "var(--primary,#c97d2e)" }}
                    >
                      {Number(b.sell_value || 0).toLocaleString("en-IN")}
                    </td>

                    {/* ── Actions ── */}
                    <td
                      className="px-4 py-3"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                        }}
                      >
                        {/* View button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewBatch(b);
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                            padding: "5px 10px",
                            borderRadius: 7,
                            border: "1px solid rgba(201,125,46,0.22)",
                            background: "rgba(201,125,46,0.07)",
                            color: "#c97d2e",
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background =
                              "rgba(201,125,46,0.14)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background =
                              "rgba(201,125,46,0.07)")
                          }
                        >
                          <Eye size={11} strokeWidth={2.5} />
                          View
                        </button>
                        {/* Three-dot menu */}
                        <BatchMenu
                          batch={b}
                          onEdit={(batch) => onEdit?.(batch)}
                          onDelete={(batch) => onDelete?.(batch)}
                          onLedger={(batch) => onLedger?.(batch)}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {enriched.length > 1 && (
              <tfoot>
                <tr
                  className="text-xs font-black"
                  style={{
                    borderTop: "2px solid rgba(201,125,46,0.2)",
                    background: "rgba(201,125,46,0.07)",
                  }}
                >
                  <td className="pl-9 pr-2 py-2.5" />
                  <td
                    colSpan={3}
                    className="px-5 py-2.5 text-[10px] uppercase tracking-widest"
                    style={{ color: "rgba(201,125,46,0.6)" }}
                  >
                    Total
                  </td>
                  <td
                    className="px-5 py-2.5 text-right tabular-nums"
                    style={{ color: "var(--main,#2d2d2d)" }}
                  >
                    {totalQty.toLocaleString("en-IN")}
                  </td>
                  <td className="px-5 py-2.5" />
                  <td className="px-5 py-2.5" />
                  <td
                    className="px-5 py-2.5 text-right tabular-nums"
                    style={{ color: "var(--muted,#888)" }}
                  >
                    {totalBuy.toLocaleString("en-IN")}
                  </td>
                  <td
                    className="px-5 py-2.5 text-right tabular-nums font-black"
                    style={{ color: "var(--primary,#c97d2e)" }}
                  >
                    {totalSell.toLocaleString("en-IN")}
                  </td>
                  <td className="px-4 py-2.5" />
                </tr>
              </tfoot>
            )}
          </table>
        )}
      </div>

      <BatchDetailModal batch={viewBatch} onClose={() => setViewBatch(null)} />
    </>
  );
};

export default BatchTable;
