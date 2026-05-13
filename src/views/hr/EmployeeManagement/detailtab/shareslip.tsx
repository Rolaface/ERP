"../../../../api/payroll/payrollEntryApi"; //import React from "react";
import {
  CheckCircle2,
  Clock,
  FileText,
  X,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import type { SlipStatus } from "./salarytypes";

// ─── Status Badge ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  SlipStatus,
  { bg: string; text: string; Icon: React.FC<{ className?: string }> }
> = {
  Paid: { bg: "bg-success/10", text: "text-success", Icon: CheckCircle2 },
  Submitted: { bg: "bg-warning/10", text: "text-warning", Icon: Clock },
  Draft: { bg: "bg-info/10", text: "text-info", Icon: FileText },
  Cancelled: { bg: "bg-danger/10", text: "text-danger", Icon: X },
};

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md";
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = "sm" }) => {
  const cfg = STATUS_CONFIG[status as SlipStatus] ?? STATUS_CONFIG.Draft;
  const { bg, text, Icon } = cfg;
  const textSize = size === "sm" ? "text-[10px]" : "text-xs";

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium px-2 py-0.5 rounded-full ${textSize} ${bg} ${text}`}
    >
      <Icon className="w-3 h-3" />
      {status}
    </span>
  );
};

// ─── Skeleton Loader ──────────────────────────────────────────────────────────

export const SkeletonBlock: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`} />
);

export const SalarySlipSkeleton: React.FC = () => (
  <div className="space-y-5">
    <div className="flex items-center justify-between">
      <div className="space-y-1">
        <SkeletonBlock className="h-5 w-52" />
        <SkeletonBlock className="h-3 w-72" />
      </div>
      <SkeletonBlock className="h-8 w-28 rounded-lg" />
    </div>
    {/* Summary cards */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonBlock key={i} className="h-28 rounded-xl" />
      ))}
    </div>
    {/* Quick filters */}
    <div className="flex gap-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <SkeletonBlock key={i} className="h-7 w-24 rounded-full" />
      ))}
    </div>
    {/* Slip rows */}
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <SkeletonBlock key={i} className="h-20 rounded-xl" />
      ))}
    </div>
  </div>
);

// ─── Empty State ──────────────────────────────────────────────────────────────

interface EmptyStateProps {
  employeeName: string;
  hasFilters?: boolean;
  onClearFilters?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  employeeName,
  hasFilters,
  onClearFilters,
}) => (
  <div className="flex flex-col items-center justify-center py-20 gap-4">
    <div className="w-20 h-20 rounded-2xl flex items-center justify-center bg-app border-2 border-dashed border-theme">
      <FileText className="w-9 h-9 text-muted opacity-40" />
    </div>
    <div className="text-center max-w-sm">
      <p className="text-sm font-semibold text-main">
        {hasFilters ? "No results match your filters" : "No salary slips yet"}
      </p>
      <p className="text-xs text-muted mt-1">
        {hasFilters
          ? "Try adjusting or clearing the active filters."
          : `No salary slips have been generated for ${employeeName}.`}
      </p>
    </div>
    {hasFilters && onClearFilters && (
      <button
        onClick={onClearFilters}
        className="mt-1 px-4 py-2 text-xs font-medium rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
      >
        Clear Filters
      </button>
    )}
  </div>
);

// ─── Error State ──────────────────────────────────────────────────────────────

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ message, onRetry }) => (
  <div className="flex flex-col items-center justify-center py-16 gap-4">
    <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-danger/10">
      <AlertCircle className="w-8 h-8 text-danger" />
    </div>
    <div className="text-center max-w-sm">
      <p className="text-sm font-semibold text-main">Something went wrong</p>
      <p className="text-xs text-muted mt-1">{message}</p>
    </div>
    {onRetry && (
      <button
        onClick={onRetry}
        className="flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        Retry
      </button>
    )}
  </div>
);

// ─── Section Header ───────────────────────────────────────────────────────────

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, subtitle, action }) => (
  <div className="flex items-center justify-between mb-3">
    <div>
      <h3 className="text-sm font-semibold text-main">{title}</h3>
      {subtitle && <p className="text-[10px] text-muted mt-0.5">{subtitle}</p>}
    </div>
    {action}
  </div>
);

// ─── Info Row ─────────────────────────────────────────────────────────────────

interface InfoRowProps {
  label: string;
  value: React.ReactNode;
}

export const InfoRow: React.FC<InfoRowProps> = ({ label, value }) => (
  <div>
    <p className="text-[9px] font-semibold uppercase tracking-wider text-muted">{label}</p>
    <p className="text-sm font-medium text-main mt-0.5">{value ?? "—"}</p>
  </div>
);