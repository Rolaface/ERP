import React from "react";

import DashboardSection from "../../primitives/DashboardSection";
import DashboardGrid from "../../layout/DashboardGrid";
import DashboardStack from "../../layout/DashboardStack";
import StatCard from "../../patterns/StatCard";
import TimelineItem from "../../primitives/TimelineItem";

type LeaveBalance = {
  total: number;
  used: number;
  remaining: number;
};

type LeaveTrend = {
  month: string;
  used: number;
};

type LeaveInsight = {
  id: string;
  type: "warning" | "info" | "critical";
  message: string;
  impact: string;
};

const mockBalance: LeaveBalance = {
  total: 24,
  used: 10,
  remaining: 14,
};

const mockTrend: LeaveTrend[] = [
  { month: "Jan", used: 2 },
  { month: "Feb", used: 1 },
  { month: "Mar", used: 3 },
  { month: "Apr", used: 2 },
  { month: "May", used: 2 },
];

const mockInsights: LeaveInsight[] = [
  {
    id: "1",
    type: "warning",
    message: "Leave usage increasing in Engineering team",
    impact: "Possible sprint capacity reduction",
  },
  {
    id: "2",
    type: "info",
    message: "HR policy compliance within normal range",
    impact: "No action required",
  },
];

function LeaveMiniTrend({ data }: { data: LeaveTrend[] }) {
  const max = Math.max(...data.map((d) => d.used));

  return (
    <div className="flex items-end gap-2 h-24">
      {data.map((d) => {
        const height = (d.used / max) * 100;

        return (
          <div key={d.month} className="flex flex-col items-center flex-1 gap-1">
            <div
              className="w-full bg-[var(--surface-muted)] rounded-md relative overflow-hidden"
              style={{ height: "90px" }}
            >
              <div
                className="absolute bottom-0 w-full bg-[var(--color-accent)]"
                style={{ height: `${height}%` }}
              />
            </div>

            <span className="text-xs text-[var(--text-muted)]">
              {d.month}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function getTone(type: LeaveInsight["type"]) {
  switch (type) {
    case "critical":
      return "border-red-500";
    case "warning":
      return "border-yellow-500";
    default:
      return "border-blue-500";
  }
}

export default function LeaveBalanceCard() {
  const { total, used, remaining } = mockBalance;

  const utilization = Math.round((used / total) * 100);

  return (
    <DashboardSection
      title="Leave Capacity Intelligence"
      subtitle="Employee availability forecasting system"
    >
      {/* KPI Layer */}
      <DashboardGrid cols={3}>
        <StatCard label="Total Leave" value={total} tone="neutral" />
        <StatCard label="Used" value={used} tone="warning" />
        <StatCard label="Remaining" value={remaining} tone="success" />
      </DashboardGrid>

      {/* Utilization Signal */}
      <div className="mt-4 p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)]">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-[var(--text)]">
            Utilization Rate
          </h3>

          <span className="text-sm text-[var(--text-muted)]">
            {utilization}%
          </span>
        </div>

        <div className="w-full h-2 bg-[var(--surface-muted)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--color-primary)]"
            style={{ width: `${utilization}%` }}
          />
        </div>

        <p className="mt-2 text-xs text-[var(--text-muted)]">
          Workforce leave consumption intensity indicator
        </p>
      </div>

      {/* Trend + Insights */}
      <DashboardGrid cols={2} className="mt-4">
        {/* Trend */}
        <div className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)]">
          <h3 className="text-sm font-medium text-[var(--text)] mb-3">
            Leave Usage Trend
          </h3>

          <LeaveMiniTrend data={mockTrend} />
        </div>

        {/* Insights */}
        <div className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)]">
          <h3 className="text-sm font-medium text-[var(--text)] mb-3">
            Capacity Insights
          </h3>

          <DashboardStack gap="sm">
            {mockInsights.map((insight) => (
              <TimelineItem
                key={insight.id}
                title={insight.message}
                subtitle={insight.impact}
                tone={insight.type}
                className={getTone(insight.type)}
              />
            ))}
          </DashboardStack>
        </div>
      </DashboardGrid>
    </DashboardSection>
  );
}