import React from "react";
import { CalendarDays, List } from "lucide-react";

export type TimesheetMode = "table" | "calendar";

interface Props {
  mode: TimesheetMode;
  onChange: (mode: TimesheetMode) => void;
}

const OPTIONS = [
  { value: "table", label: "Table", Icon: List },
  { value: "calendar", label: "Calendar", Icon: CalendarDays },
] as const;

const ViewToggle: React.FC<Props> = ({ mode, onChange }) => (
  <div className="flex shrink-0 overflow-hidden rounded-xl border border-[var(--border)] bg-card">
    {OPTIONS.map(({ value, label, Icon }) => (
      <button
        key={value}
        type="button"
        onClick={() => value !== mode && onChange(value)}
        className={[
          "flex items-center gap-1.5 px-3 py-2.5 text-sm font-semibold transition-colors",
          mode === value ? "bg-primary text-white" : "text-muted hover:text-main",
        ].join(" ")}
      >
        <Icon size={14} />
        {label}
      </button>
    ))}
  </div>
);

export default ViewToggle;