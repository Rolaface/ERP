import React from "react";

import DashboardSection from "../../primitives/DashboardSection";
import StatCard from "../../patterns/StatCard";
import DashboardGrid from "../../layout/DashboardGrid";
import DashboardStack from "../../layout/DashboardStack";
import TimelineItem from "../../primitives/TimelineItem";

type AttendanceStatus = {
  present: number;
  absent: number;
  late: number;
  onLeave: number;
};

type AttendanceTrend = {
  date: string;
  present: number;
  absent: number;
};

type Alert = {
  id: string;
  type: "warning" | "critical" | "info";
  message: string;
  timestamp: string;
};

const mockStatus: AttendanceStatus = {
  present: 42,
  absent: 3,
  late: 5,
  onLeave: 8,
};

const mockTrend: AttendanceTrend[] = [
  { date: "Mon", present: 40, absent: 6 },
  { date: "Tue", present: 44, absent: 2 },
  { date: "Wed", present: 41, absent: 5 },
  { date: "Thu", present: 45, absent: 1 },
  { date: "Fri", present: 42, absent: 3 },
];

const mockAlerts: Alert[] = [
  {
    id: "1",
    type: "warning",
    message: "Higher-than-average absenteeism in Engineering team",
    timestamp: "2h ago",
  },
  {
    id: "2",
    type: "info",
    message: "3 employees marked late in morning shift",
    timestamp: "4h ago",
  },
];

function AttendanceMiniTrend({ data }: { data: AttendanceTrend[] }) {
  const max = Math.max(...data.map((d) => d.present + d.absent));

  return (
    <div className="flex items-end gap-2 h-20">
      {data.map((d) => {
        const total = d.present + d.absent;
        const height = (total / max) * 100;

        return (
          <div key={d.date} className="flex flex-col items-center gap-1 flex-1">
            <div
              className="w-full bg-[var(--surface-muted)] rounded-md relative overflow-hidden"
              style={{ height: "80px" }}
            >
              <div
                className="absolute bottom-0 w-full bg-[var(--color-primary)]"
                style={{ height: `${height}%` }}
              />
            </div>
            <span className="text-xs text-[var(--text-muted)]">{d.date}</span>
          </div>
        );
      })}
    </div>
  );
}

function getAlertTone(type: Alert["type"]) {
  switch (type) {
    case "critical":
      return "border-red-500";
    case "warning":
      return "border-yellow-500";
    default:
      return "border-blue-500";
  }
}

export default function AttendanceWidget() {
  const { present, absent, late, onLeave } = mockStatus;

  return (
    <DashboardSection
      title="Attendance Intelligence"
      subtitle="Real-time workforce presence overview"
    >
      {/* KPI Layer */}
      <DashboardGrid cols={4}>
        <StatCard label="Present" value={present} tone="success" />
        <StatCard label="Absent" value={absent} tone="danger" />
        <StatCard label="Late Arrivals" value={late} tone="warning" />
        <StatCard label="On Leave" value={onLeave} tone="neutral" />
      </DashboardGrid>

      {/* Trend + Alerts */}
      <DashboardGrid cols={2}>
        {/* Trend Layer */}
        <div className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)]">
          <div className="mb-3">
            <h3 className="text-sm font-medium text-[var(--text)]">
              5-Day Attendance Trend
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Workforce stability signal
            </p>
          </div>

          <AttendanceMiniTrend data={mockTrend} />
        </div>

        {/* Alerts Layer */}
        <div className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)]">
          <div className="mb-3">
            <h3 className="text-sm font-medium text-[var(--text)]">
              Operational Alerts
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Exceptions requiring attention
            </p>
          </div>

          <DashboardStack gap="sm">
            {mockAlerts.map((alert) => (
              <TimelineItem
                key={alert.id}
                title={alert.message}
                subtitle={alert.timestamp}
                tone={alert.type}
                className={getAlertTone(alert.type)}
              />
            ))}
          </DashboardStack>
        </div>
      </DashboardGrid>
    </DashboardSection>
  );
}