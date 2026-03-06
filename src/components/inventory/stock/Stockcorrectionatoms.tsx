// ─── Stock Correction — Shared UI Atoms ──────────────────────────────────────
// Tiny, reusable presentational building blocks.
// No business logic. No API calls. Pure UI.

import React from "react";
import type { CorrectionType } from "../../../types/Stockcorrection.types";
import { CORRECTION_TYPE_META } from "../../../types/Stockcorrection.constants";
import { computeNewQty }        from "../../../types/Usestockcorrection";

// ── FieldLabel ────────────────────────────────────────────────────────────────
export const FieldLabel: React.FC<{
  label:     string;
  required?: boolean;
}> = ({ label, required }) => (
  <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
    {label}
    {required && <span className="text-red-500 ml-0.5">*</span>}
  </span>
);

// ── CellInput — styled input matching border-theme / bg-card tokens ───────────
export const CellInput: React.FC<{
  value:        string | number;
  onChange?:    (v: string) => void;
  placeholder?: string;
  type?:        string;
  min?:         number;
  step?:        string;
  readOnly?:    boolean;
  className?:   string;
}> = ({ value, onChange, placeholder, type = "text", min, step, readOnly, className = "" }) => (
  <input
    type={type}
    min={min}
    step={step}
    value={value}
    readOnly={readOnly}
    placeholder={placeholder}
    onChange={(e) => onChange?.(e.target.value)}
    className={[
      "w-full h-9 rounded-lg border border-theme bg-card text-main text-sm px-3",
      "placeholder:text-muted/40",
      "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary",
      readOnly ? "opacity-60 cursor-not-allowed bg-app" : "",
      className,
    ].filter(Boolean).join(" ")}
  />
);

// ── SectionCard — numbered card shell used in the manual form ─────────────────
export const SectionCard: React.FC<{
  step:     number;
  title:    string;
  children: React.ReactNode;
}> = ({ step, title, children }) => (
  <div className="rounded-xl border border-theme bg-card shadow-sm overflow-hidden">
    <div className="px-4 py-3 border-b border-theme bg-app/50 flex items-center gap-2">
      <span className="w-5 h-5 rounded-md bg-primary/10 text-primary flex items-center justify-center text-[11px] font-bold shrink-0">
        {step}
      </span>
      <span className="text-[11px] font-bold uppercase tracking-widest text-muted">{title}</span>
    </div>
    <div className="px-4 py-4">{children}</div>
  </div>
);

// ── SidebarCard — right-panel card shell ──────────────────────────────────────
export const SidebarCard: React.FC<{
  title:    string;
  children: React.ReactNode;
}> = ({ title, children }) => (
  <div className="rounded-xl border border-theme bg-card shadow-sm overflow-hidden">
    <div className="px-4 py-3 border-b border-theme bg-app/50">
      <span className="text-[11px] font-bold uppercase tracking-widest text-muted">{title}</span>
    </div>
    <div className="px-4 py-3">{children}</div>
  </div>
);

// ── CorrectionTypeToggle — Add / Remove / Set pill group ──────────────────────
export const CorrectionTypeToggle: React.FC<{
  value:    CorrectionType;
  onChange: (v: CorrectionType) => void;
}> = ({ value, onChange }) => {
  const colorMap: Record<string, (active: boolean) => string> = {
    emerald: (a) => a ? "bg-emerald-500 text-white" : "text-muted hover:text-emerald-600 hover:bg-emerald-50/50",
    red:     (a) => a ? "bg-red-500 text-white"     : "text-muted hover:text-red-600 hover:bg-red-50/50",
    blue:    (a) => a ? "bg-primary text-white"     : "text-muted hover:text-primary hover:bg-primary/5",
  };

  return (
    <div className="flex rounded-xl border border-theme overflow-hidden bg-app">
      {(Object.entries(CORRECTION_TYPE_META) as [CorrectionType, typeof CORRECTION_TYPE_META[CorrectionType]][]).map(
        ([id, meta]) => (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={[
              "flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold",
              "transition-all duration-150 border-r border-theme last:border-r-0",
              colorMap[meta.color](value === id),
            ].join(" ")}
          >
            <span className="text-base font-bold leading-none">{meta.icon}</span>
            {meta.label}
          </button>
        )
      )}
    </div>
  );
};

// ── VarianceBadge — live current → new indicator ──────────────────────────────
export const VarianceBadge: React.FC<{
  current:  number;
  adjusted: number;
  type:     CorrectionType;
}> = ({ current, adjusted, type }) => {
  const newQty     = computeNewQty(current, adjusted, type);
  const diff       = newQty - current;
  const pct        = current > 0 ? ((diff / current) * 100).toFixed(1) : "∞";
  const isPositive = diff > 0;
  const isNeutral  = diff === 0;

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 text-sm font-medium text-main">
        <span className="tabular-nums">{current}</span>
        <svg className="w-4 h-4 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className={[
          "tabular-nums font-bold",
          isNeutral ? "text-muted" : isPositive ? "text-emerald-600" : "text-red-600",
        ].join(" ")}>
          {Math.max(0, newQty)}
        </span>
      </div>
      <span className={[
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1",
        isNeutral  ? "bg-muted/10 text-muted ring-muted/20"           :
        isPositive ? "bg-emerald-50 text-emerald-700 ring-emerald-200":
                     "bg-red-50 text-red-700 ring-red-200",
      ].join(" ")}>
        {isPositive ? "+" : ""}{diff} ({pct}%)
      </span>
    </div>
  );
};

// ── UOMWrapper — strips label from ItemGenericSelect for inline table use ──────
export const UOMWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="uom-wrap">
    <style>{`
      .uom-wrap > div { gap: 0 !important; }
      .uom-wrap span:first-child { display: none !important; }
      .uom-wrap input {
        height: 36px !important; font-size: 0.8125rem !important;
        padding: 0 12px !important; border-radius: 8px !important;
        border: 1px solid var(--border) !important;
        background: var(--bg-card) !important;
        color: var(--text-main) !important;
        box-sizing: border-box !important; width: 100% !important;
      }
      .uom-wrap input:focus {
        outline: none !important;
        border-color: var(--primary) !important;
        box-shadow: 0 0 0 2px color-mix(in srgb,var(--primary) 20%,transparent) !important;
      }
    `}</style>
    {children}
  </div>
);