// ─── Stock Correction — Right Sidebar ────────────────────────────────────────
// Displays item details, live correction summary, and audit trail info.

import React from "react";
import { SidebarCard }  from "../stock/Stockcorrectionatoms";
import { REASON_MAP }   from "../../../types/Stockcorrection.constants";
import type {
  CorrectionFormState,
  CorrectionType,
} from "../../../types/Stockcorrection.types";


// ─────────────────────────────────────────────────────────────────────────────
interface Props {
  form:    CorrectionFormState;
  newQty:  number;
  diff:    number;
  hasItem: boolean;
  hasAdj:  boolean;
  curQty:  number;
}

export const CorrectionSidebar: React.FC<Props> = ({
  form, newQty, diff, hasItem, hasAdj, curQty,
}) => {
  const showNewQty = hasItem && hasAdj && form.currentQty !== null;

  return (
    <div className="w-56 flex-shrink-0 flex flex-col gap-3">

      {/* ── Item card ─────────────────────────────────────────────────────── */}
      <SidebarCard title="Item">
        <div className="flex flex-col gap-2.5">
          <div className="flex items-start gap-2">
            <BoxIcon />
            <span className="text-sm font-medium text-main leading-snug break-all">
              {form.itemName || "—"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <DocIcon />
            <span className="text-xs text-muted">{form.itemClassCode || "—"}</span>
          </div>
          {form.unitOfMeasureCd && (
            <span className="text-xs text-muted">
              UOM: <span className="font-medium text-main">{form.unitOfMeasureCd}</span>
            </span>
          )}
        </div>
      </SidebarCard>

      {/* ── Summary card ──────────────────────────────────────────────────── */}
      <SidebarCard title="Summary">
        <div className="flex flex-col gap-2">
          <SummaryRow label="Current Qty"  value={form.currentQty !== null ? String(curQty) : "—"} />
          <SummaryRow
            label="Adjustment"
            value={
              hasAdj
                ? form.correctionType === "set"
                  ? `= ${parseFloat(form.adjustmentQty)}`
                  : `${form.correctionType === "add" ? "+" : "−"} ${parseFloat(form.adjustmentQty)}`
                : "—"
            }
          />
          <SummaryRow
            label="Reason"
            value={REASON_MAP[form.reason] || "—"}
            wrap
          />

          {/* New stock pill — color-coded by direction */}
          {showNewQty && (
            <div className={[
              "mt-1 flex justify-between items-center rounded-lg px-3 py-2.5",
              diff > 0 ? "bg-emerald-500" : diff < 0 ? "bg-red-500" : "bg-primary",
            ].join(" ")}>
              <span className="text-xs font-semibold text-white">New Stock</span>
              <span className="text-sm font-bold text-white tabular-nums">
                {Math.max(0, newQty)}
              </span>
            </div>
          )}
        </div>
      </SidebarCard>

      {/* ── Audit trail info ──────────────────────────────────────────────── */}
      <div className="rounded-xl border border-theme bg-card shadow-sm px-4 py-3 flex flex-col gap-1.5">
        <span className="text-[11px] font-bold uppercase tracking-widest text-muted">
          Audit Trail
        </span>
        <p className="text-[11px] text-muted leading-relaxed mt-1">
          Every correction is stamped with:
        </p>
        {["Date & time", "User account", "Before / after qty", "Reason code"].map(
          (item) => (
            <div key={item} className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-primary/60 flex-shrink-0" />
              <span className="text-[11px] text-muted">{item}</span>
            </div>
          )
        )}
      </div>
    </div>
  );
};

// ── Internal helpers ──────────────────────────────────────────────────────────
const SummaryRow: React.FC<{
  label: string; value: string; wrap?: boolean;
}> = ({ label, value, wrap }) => (
  <div className="flex justify-between items-start gap-2">
    <span className="text-xs text-muted flex-shrink-0">{label}</span>
    <span className={[
      "text-xs font-medium text-main text-right",
      wrap ? "break-words max-w-[110px]" : "truncate max-w-[110px]",
    ].join(" ")}>
      {value}
    </span>
  </div>
);

const BoxIcon = () => (
  <svg className="w-4 h-4 text-muted mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
    <line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
);

const DocIcon = () => (
  <svg className="w-4 h-4 text-muted flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <rect x="2" y="3" width="20" height="18" rx="2"/>
    <path d="M7 8h10M7 12h6" strokeLinecap="round"/>
  </svg>
);