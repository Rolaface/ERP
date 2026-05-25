import React from "react";

import DashboardSection from "../../primitives/DashboardSection";
import DashboardGrid from "../../layout/DashboardGrid";

type KPI = {
  label: string;
  value: number;
  delta: number;
  tone: "success" | "warning" | "danger" | "neutral";
  suffix?: string;
};

const mockKPIs: KPI[] = [
  {
    label: "Workforce Availability",
    value: 86,
    delta: +4,
    tone: "success",
    suffix: "%",
  },
  {
    label: "System Load",
    value: 72,
    delta: +9,
    tone: "warning",
    suffix: "%",
  },
  {
    label: "Approval Latency",
    value: 34,
    delta: +12,
    tone: "danger",
    suffix: "h",
  },
  {
    label: "Team Utilization",
    value: 78,
    delta: -3,
    tone: "warning",
    suffix: "%",
  },
  {
    label: "Schedule Efficiency",
    value: 81,
    delta: +6,
    tone: "success",
    suffix: "%",
  },
  {
    label: "Operational Stability",
    value: 88,
    delta: +2,
    tone: "success",
    suffix: "%",
  },
];

function getDeltaColor(delta: number) {
  if (delta > 0) return "text-green-500";
  if (delta < 0) return "text-red-500";
  return "text-[var(--text-muted)]";
}

function formatDelta(delta: number) {
  return delta > 0 ? `+${delta}` : `${delta}`;
}

export default function KPIAnalyticsPanel() {
  const avgHealth = Math.round(
    mockKPIs.reduce((acc, k) => acc + k.value, 0) / mockKPIs.length
  );

  return (
    <DashboardSection
      title="Executive Intelligence Overview"
      subtitle="Cross-domain operational health synthesis"
    >
      {/* System Health Header */}
      <div className="mb-4 p-4 rounded-xl border bg-[var(--surface)] border-[var(--border-subtle)]">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-[var(--text)]">
              System Health Index
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Aggregated organizational performance signal
            </p>
          </div>

          <div className="text-2xl font-semibold text-[var(--text)]">
            {avgHealth}%
          </div>
        </div>

        <div className="w-full h-2 mt-3 bg-[var(--surface-muted)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--color-primary)]"
            style={{ width: `${avgHealth}%` }}
          />
        </div>
      </div>

      {/* KPI Grid */}
      <DashboardGrid cols={3}>
        {mockKPIs.map((kpi) => (
          <div
            key={kpi.label}
            className="p-4 rounded-xl border bg-[var(--surface)] border-[var(--border-subtle)]"
          >
            <div className="text-xs text-[var(--text-muted)]">
              {kpi.label}
            </div>

            <div className="flex items-end justify-between mt-2">
              <div className="text-xl font-medium text-[var(--text)]">
                {kpi.value}
                {kpi.suffix}
              </div>

              <div className={`text-xs ${getDeltaColor(kpi.delta)}`}>
                {formatDelta(kpi.delta)}
              </div>
            </div>
          </div>
        ))}
      </DashboardGrid>
    </DashboardSection>
  );
}