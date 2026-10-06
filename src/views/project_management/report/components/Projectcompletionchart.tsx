import React, { useMemo, useState } from "react";
import ChartCard, { ChartEmpty } from "./Chartcard";
import { clampPercent, formatPercent } from "../Utils";
import type { ProjectSummaryRow } from "../Types";


const SUCCESS_THRESHOLD = 60;

type Order = "desc" | "asc";

const ProjectCompletionChart: React.FC<{ rows: ProjectSummaryRow[] }> = ({ rows }) => {
  const [order, setOrder] = useState<Order>("desc");

  const sorted = useMemo(
    () =>
      [...rows].sort((a, b) =>
        order === "desc"
          ? b.percent_complete - a.percent_complete
          : a.percent_complete - b.percent_complete,
      ),
    [rows, order],
  );

  return (
    <ChartCard
      title="Project Completion"
      subtitle="Percentage completion of each project"
      right={
        <select
          value={order}
          onChange={(e) => setOrder(e.target.value as Order)}
          className="h-8 rounded-lg border border-[var(--border)] bg-card px-2.5 text-xs text-main focus:border-primary focus:outline-none"
        >
          <option value="desc">Top to Bottom</option>
          <option value="asc">Bottom to Top</option>
        </select>
      }
    >
      {sorted.length === 0 ? (
        <ChartEmpty />
      ) : (
        <ul className="custom-scrollbar flex max-h-[340px] flex-col gap-3 overflow-y-auto pr-1">
          {sorted.map((p) => (
            <li
              key={p.name}
              className="grid grid-cols-[minmax(0,170px)_1fr_48px] items-center gap-3"
            >
              <span className="truncate text-xs text-main" title={p.project_name}>
                {p.project_name}
              </span>
              <div className="h-2.5 overflow-hidden rounded-full bg-[var(--border)]">
                <div
                  className={`h-full rounded-full transition-all ${
                    p.percent_complete >= SUCCESS_THRESHOLD ? "bg-success" : "bg-primary"
                  }`}
                  style={{ width: `${clampPercent(p.percent_complete)}%` }}
                />
              </div>
              <span className="text-right text-xs font-semibold tabular-nums text-main">
                {formatPercent(p.percent_complete)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </ChartCard>
  );
};

export default ProjectCompletionChart;