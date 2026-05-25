import React from "react";

import DashboardSection from "../../primitives/DashboardSection";

type DayLoad = {
  day: string;
  totalCapacity: number;
  scheduledLoad: number;
};

const mockWeek: DayLoad[] = [
  { day: "Mon", totalCapacity: 100, scheduledLoad: 72 },
  { day: "Tue", totalCapacity: 100, scheduledLoad: 88 },
  { day: "Wed", totalCapacity: 100, scheduledLoad: 95 },
  { day: "Thu", totalCapacity: 100, scheduledLoad: 60 },
  { day: "Fri", totalCapacity: 100, scheduledLoad: 78 },
  { day: "Sat", totalCapacity: 100, scheduledLoad: 30 },
  { day: "Sun", totalCapacity: 100, scheduledLoad: 20 },
];

function getUtilization(load: DayLoad) {
  return Math.round((load.scheduledLoad / load.totalCapacity) * 100);
}

function getRiskColor(util: number) {
  if (util >= 90) return "bg-red-500";
  if (util >= 70) return "bg-yellow-500";
  return "bg-green-500";
}

function getIntensityLabel(util: number) {
  if (util >= 90) return "OVERLOADED";
  if (util >= 70) return "BUSY";
  if (util >= 40) return "NORMAL";
  return "LIGHT";
}

function UtilBar({ value }: { value: number }) {
  return (
    <div className="w-full h-2 bg-[var(--surface-muted)] rounded-full overflow-hidden">
      <div
        className="h-full bg-[var(--color-primary)]"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

export default function CalendarStrip() {
  const enriched = mockWeek.map((d) => ({
    ...d,
    utilization: getUtilization(d),
  }));

  const avgUtil = Math.round(
    enriched.reduce((acc, d) => acc + d.utilization, 0) / enriched.length
  );

  const peakDay = enriched.reduce((max, d) =>
    d.utilization > max.utilization ? d : max
  );

  return (
    <DashboardSection
      title="Workload Calendar Intelligence"
      subtitle="Temporal execution load distribution"
    >
      {/* System Signals */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="p-3 rounded-xl border bg-[var(--surface)] border-[var(--border-subtle)]">
          <div className="text-xs text-[var(--text-muted)]">
            Avg Weekly Load
          </div>
          <div className="text-lg font-medium text-[var(--text)]">
            {avgUtil}%
          </div>
        </div>

        <div className="p-3 rounded-xl border bg-[var(--surface)] border-[var(--border-subtle)]">
          <div className="text-xs text-[var(--text-muted)]">
            Peak Day
          </div>
          <div className="text-lg font-medium text-[var(--text)]">
            {peakDay.day}
          </div>
        </div>

        <div className="p-3 rounded-xl border bg-[var(--surface)] border-[var(--border-subtle)]">
          <div className="text-xs text-[var(--text-muted)]">
            High Load Days
          </div>
          <div className="text-lg font-medium text-[var(--text)]">
            {enriched.filter((d) => d.utilization >= 70).length}
          </div>
        </div>
      </div>

      {/* Calendar Strip */}
      <div className="grid grid-cols-7 gap-2">
        {enriched.map((day) => {
          const util = day.utilization;

          return (
            <div
              key={day.day}
              className="p-3 rounded-xl border bg-[var(--surface)] border-[var(--border-subtle)] flex flex-col items-center gap-2"
            >
              {/* Day label */}
              <span className="text-xs text-[var(--text-muted)]">
                {day.day}
              </span>

              {/* Circular intensity indicator */}
              <div className="relative w-10 h-10">
                <div className="absolute inset-0 rounded-full bg-[var(--surface-muted)]" />

                <div
                  className={`absolute inset-0 rounded-full ${getRiskColor(
                    util
                  )} opacity-20`}
                />

                <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-[var(--text)]">
                  {util}%
                </div>
              </div>

              {/* Mini bar */}
              <div className="w-full">
                <UtilBar value={util} />
              </div>

              {/* Label */}
              <span className="text-[10px] text-[var(--text-muted)]">
                {getIntensityLabel(util)}
              </span>
            </div>
          );
        })}
      </div>
    </DashboardSection>
  );
}