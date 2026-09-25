import React from "react";
import type { PlanProductCode, PlanStatus } from "../../../types/Subscription/Plan/plan";


const PRODUCT_STYLES: Record<PlanProductCode, string> = {
  ERP: "bg-emerald-100 text-emerald-700",
  LMS: "bg-blue-100 text-blue-700",
  LOS: "bg-violet-100 text-violet-700",
};
const STATUS_STYLES: Record<PlanStatus, string> = {
  Active: "bg-green-100 text-green-700",
  Draft: "bg-amber-100 text-amber-700",
  Archived: "bg-gray-100 text-gray-600",
};

export const PlanProductBadge: React.FC<{ code: PlanProductCode }> = ({ code }) => (
  <span className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-semibold ${PRODUCT_STYLES[code]}`}>
    {code}
  </span>
);

export const PlanStatusBadge: React.FC<{ status: PlanStatus }> = ({ status }) => (
  <span className={`inline-flex items-center justify-center whitespace-nowrap rounded-full px-2 py-1 text-xs font-medium ${STATUS_STYLES[status]}`}>
    {status}
  </span>
);

export const PlanField: React.FC<{
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}> = ({ label, required, error, hint, className = "", children }) => (
  <div className={`flex min-w-0 flex-col ${className}`}>
    <span className="mb-1 block text-[10px] font-medium text-main">
      {label}
      {required && <span className="text-danger">*</span>}
    </span>
    {children}
    {error ? (
      <span className="mt-1 text-[10px] text-danger">{error}</span>
    ) : hint ? (
      <span className="mt-1 text-[10px] text-muted">{hint}</span>
    ) : null}
  </div>
);

export const GHOST_BTN =
  "rounded-lg border border-[var(--border)] bg-card px-3 py-1 text-[11px] font-medium text-main transition-colors hover:bg-row-hover";