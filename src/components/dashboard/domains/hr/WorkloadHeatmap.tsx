import React from "react";

import DashboardSection from "../../primitives/DashboardSection";

type HeatCell = {
  team: string;
  day: string;
  load: number;
};

const teams = ["Eng", "HR", "Sales", "Ops"];
const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];

const mockData: HeatCell[] = [
  { team: "Eng", day: "Mon", load: 70 },
  { team: "Eng", day: "Tue", load: 85 },
  { team: "Eng", day: "Wed", load: 90 },
  { team: "Eng", day: "Thu", load: 60 },
  { team: "Eng", day: "Fri", load: 75 },

  { team: "HR", day: "Mon", load: 40 },
  { team: "HR", day: "Tue", load: 55 },
  { team: "HR", day: "Wed", load: 45 },
  { team: "HR", day: "Thu", load: 50 },
  { team: "HR", day: "Fri", load: 60 },

  { team: "Sales", day: "Mon", load: 80 },
  { team: "Sales", day: "Tue", load: 88 },
  { team: "Sales", day: "Wed", load: 92 },
  { team: "Sales", day: "Thu", load: 78 },
  { team: "Sales", day: "Fri", load: 85 },

  { team: "Ops", day: "Mon", load: 50 },
  { team: "Ops", day: "Tue", load: 65 },
  { team: "Ops", day: "Wed", load: 70 },
  { team: "Ops", day: "Thu", load: 60 },
  { team: "Ops", day: "Fri", load: 55 },
];

function getCell(team: string, day: string) {
  return mockData.find((d) => d.team === team && d.day === day);
}

function getColor(load: number) {
  if (load >= 85) return "bg-red-500";
  if (load >= 70) return "bg-yellow-500";
  if (load >= 50) return "bg-green-400";
  return "bg-green-200";
}

function getLabel(load: number) {
  if (load >= 85) return "CRITICAL";
  if (load >= 70) return "HIGH";
  if (load >= 50) return "MODERATE";
  return "LOW";
}

export default function WorkloadHeatmap() {
  const avgLoad =
    mockData.reduce((acc, d) => acc + d.load, 0) / mockData.length;

  const peakCell = mockData.reduce((max, cell) =>
    cell.load > max.load ? cell : max
  );

  const overloadCount = mockData.filter((d) => d.load >= 85).length;

  return (
    <DashboardSection
      title="Workload Density Intelligence"
      subtitle="Cross-team execution pressure matrix"
    >
      {/* System KPIs */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="p-3 rounded-xl border bg-[var(--surface)] border-[var(--border-subtle)]">
          <div className="text-xs text-[var(--text-muted)]">
            Avg System Load
          </div>
          <div className="text-lg font-medium text-[var(--text)]">
            {avgLoad.toFixed(1)}%
          </div>
        </div>

        <div className="p-3 rounded-xl border bg-[var(--surface)] border-[var(--border-subtle)]">
          <div className="text-xs text-[var(--text-muted)]">
            Peak Pressure
          </div>
          <div className="text-lg font-medium text-[var(--text)]">
            {peakCell.team} · {peakCell.day}
          </div>
        </div>

        <div className="p-3 rounded-xl border bg-[var(--surface)] border-[var(--border-subtle)]">
          <div className="text-xs text-[var(--text-muted)]">
            Overload Zones
          </div>
          <div className="text-lg font-medium text-[var(--text)]">
            {overloadCount}
          </div>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Header Row */}
          <div className="grid grid-cols-6 gap-2 mb-2">
            <div />
            {days.map((d) => (
              <div
                key={d}
                className="text-xs text-center text-[var(--text-muted)]"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Rows */}
          {teams.map((team) => (
            <div key={team} className="grid grid-cols-6 gap-2 mb-2">
              {/* Team label */}
              <div className="text-xs flex items-center text-[var(--text)]">
                {team}
              </div>

              {/* Cells */}
              {days.map((day) => {
                const cell = getCell(team, day);

                if (!cell) return <div key={day} />;

                return (
                  <div
                    key={day}
                    className={`h-10 rounded-md flex items-center justify-center text-[10px] text-white ${getColor(
                      cell.load
                    )}`}
                  >
                    {cell.load}%
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-3 mt-4 text-xs text-[var(--text-muted)]">
        <span>🟩 Low</span>
        <span>🟨 Moderate</span>
        <span>🟠 High</span>
        <span>🔴 Critical</span>
      </div>
    </DashboardSection>
  );
}