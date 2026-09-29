import React from "react";
import { Kanban, List } from "lucide-react";

export type TaskMode = "table" | "kanban";

interface Props {
  mode: TaskMode;
  onChange: (mode: TaskMode) => void;
}

const OPTIONS = [
  { value: "table", label: "Table", Icon: List },
  { value: "kanban", label: "Kanban", Icon: Kanban },
] as const;

const TaskViewToggle: React.FC<Props> = ({ mode, onChange }) => (
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

export default TaskViewToggle;