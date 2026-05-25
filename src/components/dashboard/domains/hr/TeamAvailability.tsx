import React from "react";

import DashboardSection from "../../primitives/DashboardSection";
import DashboardGrid from "../../layout/DashboardGrid";
import DashboardStack from "../../layout/DashboardStack";

type Team = {
  name: string;
  total: number;
  available: number;
  busy: number;
  onLeave: number;
};

const mockTeams: Team[] = [
  {
    name: "Engineering",
    total: 18,
    available: 6,
    busy: 10,
    onLeave: 2,
  },
  {
    name: "HR",
    total: 8,
    available: 5,
    busy: 2,
    onLeave: 1,
  },
  {
    name: "Sales",
    total: 12,
    available: 4,
    busy: 7,
    onLeave: 1,
  },
  {
    name: "Operations",
    total: 10,
    available: 3,
    busy: 6,
    onLeave: 1,
  },
];

function getUtilization(team: Team) {
  return Math.round(((team.busy + team.onLeave) / team.total) * 100);
}

function getRiskColor(utilization: number) {
  if (utilization >= 85) return "border-red-500";
  if (utilization >= 65) return "border-yellow-500";
  return "border-green-500";
}

function getStatusLabel(utilization: number) {
  if (utilization >= 85) return "OVERLOADED";
  if (utilization >= 65) return "SATURATED";
  return "STABLE";
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

export default function TeamAvailability() {
  const enriched = mockTeams.map((t) => ({
    ...t,
    utilization: getUtilization(t),
  }));

  const avgUtilization = Math.round(
    enriched.reduce((acc, t) => acc + t.utilization, 0) / enriched.length
  );

  return (
    <DashboardSection
      title="Team Capacity Intelligence"
      subtitle="Real-time workforce distribution system"
    >
      {/* System KPI */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="p-3 rounded-xl border bg-[var(--surface)] border-[var(--border-subtle)]">
          <div className="text-xs text-[var(--text-muted)]">
            Avg Utilization
          </div>
          <div className="text-lg font-medium text-[var(--text)]">
            {avgUtilization}%
          </div>
        </div>

        <div className="p-3 rounded-xl border bg-[var(--surface)] border-[var(--border-subtle)]">
          <div className="text-xs text-[var(--text-muted)]">
            Active Teams
          </div>
          <div className="text-lg font-medium text-[var(--text)]">
            {mockTeams.length}
          </div>
        </div>

        <div className="p-3 rounded-xl border bg-[var(--surface)] border-[var(--border-subtle)]">
          <div className="text-xs text-[var(--text-muted)]">
            Total Workforce
          </div>
          <div className="text-lg font-medium text-[var(--text)]">
            {mockTeams.reduce((a, t) => a + t.total, 0)}
          </div>
        </div>
      </div>

      {/* Team Grid */}
      <DashboardGrid cols={2}>
        {enriched.map((team) => {
          const utilization = team.utilization;

          return (
            <div
              key={team.name}
              className={`p-4 rounded-xl border bg-[var(--surface)] ${getRiskColor(
                utilization
              )}`}
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <h3 className="text-sm font-medium text-[var(--text)]">
                  {team.name}
                </h3>

                <span className="text-xs px-2 py-1 rounded-md bg-[var(--surface-muted)] text-[var(--text-muted)]">
                  {getStatusLabel(utilization)}
                </span>
              </div>

              {/* Utilization */}
              <div className="mt-3">
                <div className="flex justify-between text-xs text-[var(--text-muted)] mb-1">
                  <span>Utilization</span>
                  <span>{utilization}%</span>
                </div>

                <UtilBar value={utilization} />
              </div>

              {/* Breakdown */}
              <DashboardStack gap="xs" className="mt-3">
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--text-muted)]">Available</span>
                  <span className="text-[var(--text)]">
                    {team.available}
                  </span>
                </div>

                <div className="flex justify-between text-xs">
                  <span className="text-[var(--text-muted)]">Busy</span>
                  <span className="text-[var(--text)]">{team.busy}</span>
                </div>

                <div className="flex justify-between text-xs">
                  <span className="text-[var(--text-muted)]">On Leave</span>
                  <span className="text-[var(--text)]">
                    {team.onLeave}
                  </span>
                </div>
              </DashboardStack>
            </div>
          );
        })}
      </DashboardGrid>
    </DashboardSection>
  );
}