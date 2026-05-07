import React from "react";
import { Clock, CheckCircle2, XCircle } from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type ActiveTab = "overview" | "salary_slip" | "details";

// ─── Status Badge ──────────────────────────────────────────────────────────────

const statusConfig: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  Draft: {
    label: "Draft",
    color: "text-amber-600 bg-amber-50 border-amber-200",
    icon: <Clock className="w-3 h-3" />,
  },
  Submitted: {
    label: "Submitted",
    color: "text-emerald-600 bg-emerald-50 border-emerald-200",
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  Failed: {
    label: "Failed",
    color: "text-red-600 bg-red-50 border-red-200",
    icon: <XCircle className="w-3 h-3" />,
  },
  Cancelled: {
    label: "Cancelled",
    color: "text-gray-500 bg-gray-50 border-gray-200",
    icon: <XCircle className="w-3 h-3" />,
  },
};

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const cfg = statusConfig[status] ?? {
    label: status,
    color: "text-gray-500 bg-gray-50 border-gray-200",
    icon: <Clock className="w-3 h-3" />,
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.color}`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
};

// ─── Info Tile ─────────────────────────────────────────────────────────────────

export const InfoTile: React.FC<{
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  value: React.ReactNode;
}> = ({ icon, label, sublabel, value }) => (
  <div className="flex flex-col gap-1 p-4 rounded-xl border border-theme bg-surface">
    <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/8 text-primary mb-1">
      {icon}
    </div>
    <p className="text-[9px] font-extrabold uppercase tracking-widest text-muted">
      {label}
    </p>
    {sublabel && (
      <p className="text-[9px] text-muted/70 uppercase tracking-wider">
        {sublabel}
      </p>
    )}
    <p className="text-sm font-bold text-main mt-0.5">{value || "—"}</p>
  </div>
);

// ─── Detail Row ────────────────────────────────────────────────────────────────

export const DetailRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}> = ({ icon, label, value }) => (
  <div className="flex items-center justify-between py-3 border-b border-theme last:border-0">
    <div className="flex items-center gap-2 text-muted">
      <span className="text-primary/60">{icon}</span>
      <span className="text-[10px] font-extrabold uppercase tracking-wider">
        {label}
      </span>
    </div>
    <span className="text-xs font-semibold text-main text-right max-w-[55%] truncate">
      {value || "—"}
    </span>
  </div>
);