import React from "react";
import type { SelectOption } from "../Types";

interface Props {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
}


const FloatingSelect: React.FC<Props> = ({ label, value, options, onChange, disabled }) => (
  <div className="flex min-w-[160px] flex-col gap-1">
    <label className="text-[9px] font-black uppercase tracking-widest text-muted">
      {label}
    </label>
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className="h-8 rounded-md border border-[var(--border)] bg-card px-2.5 text-xs text-main focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  </div>
);

export default FloatingSelect;