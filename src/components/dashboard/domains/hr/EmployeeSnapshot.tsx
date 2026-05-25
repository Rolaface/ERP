import React from "react";

import DashboardSection from "../../primitives/DashboardSection";
import DashboardGrid from "../../layout/DashboardGrid";
import DashboardStack from "../../layout/DashboardStack";


type Employee = {
  name: string;
  role: string;
  department: "engineering" | "hr" | "sales" | "ops";
  availability: "available" | "busy" | "overloaded" | "on_leave";
  workload: number;
  tasksCompletedToday: number;
  pendingApprovals: number;
  lastActive: string;
};

const mockEmployees: Employee[] = [
  {
    name: "Amit Sharma",
    role: "Frontend Engineer",
    department: "engineering",
    availability: "busy",
    workload: 72,
    tasksCompletedToday: 5,
    pendingApprovals: 2,
    lastActive: "5 min ago",
  },
  {
    name: "Neha Verma",
    role: "HR Manager",
    department: "hr",
    availability: "available",
    workload: 45,
    tasksCompletedToday: 3,
    pendingApprovals: 4,
    lastActive: "Just now",
  },
  {
    name: "Rahul Mehta",
    role: "Sales Executive",
    department: "sales",
    availability: "overloaded",
    workload: 91,
    tasksCompletedToday: 7,
    pendingApprovals: 1,
    lastActive: "12 min ago",
  },
  {
    name: "Priya Singh",
    role: "Ops Coordinator",
    department: "ops",
    availability: "on_leave",
    workload: 0,
    tasksCompletedToday: 0,
    pendingApprovals: 0,
    lastActive: "1 day ago",
  },
];

function getAvailabilityColor(status: Employee["availability"]) {
  switch (status) {
    case "available":
      return "text-green-500";
    case "busy":
      return "text-yellow-500";
    case "overloaded":
      return "text-red-500";
    case "on_leave":
      return "text-gray-400";
  }
}

function getWorkloadBar(workload: number) {
  let color = "bg-green-500";

  if (workload >= 85) color = "bg-red-500";
  else if (workload >= 65) color = "bg-yellow-500";

  return (
    <div className="w-full h-2 bg-[var(--surface-muted)] rounded-full overflow-hidden">
      <div
        className={`h-full ${color}`}
        style={{ width: `${workload}%` }}
      />
    </div>
  );
}

function DepartmentBadge({ dept }: { dept: Employee["department"] }) {
  return (
    <span className="text-xs px-2 py-1 rounded-md bg-[var(--surface-muted)] text-[var(--text-muted)] uppercase">
      {dept}
    </span>
  );
}

export default function EmployeeSnapshot() {
  const avgWorkload = Math.round(
    mockEmployees.reduce((acc, e) => acc + e.workload, 0) /
      mockEmployees.length
  );

  const overloadedCount = mockEmployees.filter(
    (e) => e.workload >= 85
  ).length;

  return (
    <DashboardSection
      title="Human Execution Intelligence"
      subtitle="Real-time employee state monitoring system"
    >
      {/* System KPIs */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="p-3 rounded-xl border bg-[var(--surface)] border-[var(--border-subtle)]">
          <div className="text-xs text-[var(--text-muted)]">
            Avg Workload
          </div>
          <div className="text-lg font-medium text-[var(--text)]">
            {avgWorkload}%
          </div>
        </div>

        <div className="p-3 rounded-xl border bg-[var(--surface)] border-[var(--border-subtle)]">
          <div className="text-xs text-[var(--text-muted)]">
            Overloaded Nodes
          </div>
          <div className="text-lg font-medium text-[var(--text)]">
            {overloadedCount}
          </div>
        </div>

        <div className="p-3 rounded-xl border bg-[var(--surface)] border-[var(--border-subtle)]">
          <div className="text-xs text-[var(--text-muted)]">
            Active Nodes
          </div>
          <div className="text-lg font-medium text-[var(--text)]">
            {mockEmployees.length}
          </div>
        </div>
      </div>

      {/* Employee Grid */}
      <DashboardGrid cols={2}>
        {mockEmployees.map((emp) => (
          <div
            key={emp.name}
            className="p-4 rounded-xl border bg-[var(--surface)] border-[var(--border-subtle)]"
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-medium text-[var(--text)]">
                  {emp.name}
                </h3>
                <div className="text-xs text-[var(--text-muted)]">
                  {emp.role}
                </div>
              </div>

              <span
                className={`text-xs font-medium ${getAvailabilityColor(
                  emp.availability
                )}`}
              >
                {emp.availability.toUpperCase()}
              </span>
            </div>

            {/* Meta */}
            <div className="flex items-center justify-between mt-3">
              <DepartmentBadge dept={emp.department} />

              <span className="text-xs text-[var(--text-muted)]">
                {emp.lastActive}
              </span>
            </div>

            {/* Workload */}
            <div className="mt-3">
              <div className="flex justify-between text-xs text-[var(--text-muted)] mb-1">
                <span>Workload</span>
                <span>{emp.workload}%</span>
              </div>

              {getWorkloadBar(emp.workload)}
            </div>

            {/* Activity Metrics */}
            <DashboardStack gap="xs" className="mt-3">
              <div className="flex justify-between text-xs">
                <span className="text-[var(--text-muted)]">
                  Tasks Completed
                </span>
                <span className="text-[var(--text)]">
                  {emp.tasksCompletedToday}
                </span>
              </div>

              <div className="flex justify-between text-xs">
                <span className="text-[var(--text-muted)]">
                  Pending Approvals
                </span>
                <span className="text-[var(--text)]">
                  {emp.pendingApprovals}
                </span>
              </div>
            </DashboardStack>
          </div>
        ))}
      </DashboardGrid>
    </DashboardSection>
  );
}