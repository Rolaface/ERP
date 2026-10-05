import React, { useMemo } from "react";
import ChartCard, { ChartEmpty } from "./Chartcard";
import type { ProjectSummaryRow } from "../Types";

const LEGEND = [
  { label: "Completed", color: "var(--primary)" },
  { label: "Overdue", color: "var(--danger)" },
  { label: "Remaining", color: "var(--border)" },
];

const TasksByProjectChart: React.FC<{ rows: ProjectSummaryRow[] }> = ({ rows }) => {
  const sorted = useMemo(
    () => [...rows].sort((a, b) => b.total_tasks - a.total_tasks),
    [rows],
  );
  const max = Math.max(1, ...sorted.map((r) => r.total_tasks));
  const pct = (n: number) => `${(n / max) * 100}%`;

  return (
    <ChartCard
      title="Tasks by Project"
      subtitle="Total tasks with completed and overdue breakdown"
      right={
        <div className="flex items-center gap-3">
          {LEGEND.map((l) => (
            <span key={l.label} className="flex items-center gap-1.5 text-xs text-main">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: l.color }} />
              {l.label}
            </span>
          ))}
        </div>
      }
    >
      {sorted.length === 0 ? (
        <ChartEmpty />
      ) : (
        <ul className="custom-scrollbar flex max-h-[340px] flex-col gap-3 overflow-y-auto pr-1">
          {sorted.map((p) => {
            const remaining = Math.max(p.total_tasks - p.completed_tasks - p.overdue_tasks, 0);
            return (
              <li
                key={p.name}
                className="grid grid-cols-[minmax(0,190px)_1fr_28px] items-center gap-3"
              >
                <span className="truncate text-xs text-main" title={p.project_name}>
                  {p.project_name}
                </span>
                <div className="flex h-2.5 overflow-hidden rounded-full">
                  <div className="h-full bg-primary" style={{ width: pct(p.completed_tasks) }} />
                  <div className="h-full bg-[var(--danger)]" style={{ width: pct(p.overdue_tasks) }} />
                  <div className="h-full bg-[var(--border)]" style={{ width: pct(remaining) }} />
                </div>
                <span className="text-right text-xs font-semibold tabular-nums text-main">
                  {p.total_tasks}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </ChartCard>
  );
};

export default TasksByProjectChart;