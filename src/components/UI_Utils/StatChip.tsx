// StatChip.tsx
import React from "react";

export const StatChip: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  valueClass?: string;
}> = ({ icon, label, value, sub, valueClass = "text-main" }) => (
  <div className="bg-card border border-theme rounded-lg px-3 py-1.5 flex items-center gap-2 min-w-0">
    <div className="shrink-0 w-6 h-6 rounded-md bg-app border border-theme flex items-center justify-center text-muted [&>svg]:w-3 [&>svg]:h-3">
      {icon}
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[9px] font-extrabold uppercase tracking-wider text-muted leading-none">{label}</p>
      <p className={`text-[12px] font-extrabold tabular-nums leading-tight truncate ${valueClass}`}>{value}</p>
      {sub && <p className="text-[9px] text-muted truncate leading-none mt-0.5">{sub}</p>}
    </div>
  </div>
);