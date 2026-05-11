import React from "react";

// ─── Field ────────────────────────────────────────────────────────────────────

interface FieldProps {
  label: string;
  value?: string | null;
  className?: string;
  mono?: boolean;
}

export const Field: React.FC<FieldProps> = ({
  label,
  value,
  className = "",
  mono = false,
}) => (
  <div className={className}>
    <p className="text-[10px] uppercase tracking-wider text-muted font-semibold mb-0.5">
      {label}
    </p>
    <p className={`text-xs font-medium text-main ${mono ? "font-mono" : ""}`}>
      {value ?? <span className="text-muted italic font-normal">—</span>}
    </p>
  </div>
);

// ─── Section ──────────────────────────────────────────────────────────────────

interface SectionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const Section: React.FC<SectionProps> = ({ title, icon, children }) => (
  <div className="mb-5">
    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-theme">
      {icon && <span className="text-primary">{icon}</span>}
      <h3 className="text-[11px] font-bold text-main uppercase tracking-wider">
        {title}
      </h3>
    </div>
    {children}
  </div>
);

// ─── QuickStat ────────────────────────────────────────────────────────────────

interface QuickStatProps {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
}

export const QuickStat: React.FC<QuickStatProps> = ({ icon, label, value }) => (
  <div className="flex items-start gap-2.5 py-2 border-b border-theme last:border-0">
    <div className="text-primary mt-0.5 flex-shrink-0 w-4">{icon}</div>
    <div className="flex-1 min-w-0">
      <p className="text-[9px] uppercase tracking-wider text-muted font-semibold">
        {label}
      </p>
      <p className="text-[11px] font-semibold text-main truncate">
        {value || "—"}
      </p>
    </div>
  </div>
);