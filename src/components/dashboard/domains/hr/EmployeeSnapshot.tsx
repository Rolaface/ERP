import React from "react";

import DashboardSection from "../../primitives/DashboardSection";

type EmployeeStatus =
  | "available"
  | "focus"
  | "meeting"
  | "away";

type Employee = {
  name: string;
  role: string;
  status: EmployeeStatus;
  note: string;
};

const teamMembers: Employee[] = [
  {
    name: "Amit Sharma",
    role: "Frontend Engineer",
    status: "focus",
    note: "Working on dashboard redesign",
  },
  {
    name: "Neha Verma",
    role: "HR Manager",
    status: "available",
    note: "Available for approvals",
  },
  {
    name: "Rahul Mehta",
    role: "Sales Executive",
    status: "meeting",
    note: "Client calls until 3 PM",
  },
  {
    name: "Priya Singh",
    role: "Operations Coordinator",
    status: "away",
    note: "On leave today",
  },
];

function getStatusStyles(status: EmployeeStatus) {
  switch (status) {
    case "available":
      return {
        dot: "bg-emerald-500",
        badge:
          "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
        label: "Available",
      };

    case "focus":
      return {
        dot: "bg-amber-500",
        badge:
          "bg-amber-500/10 text-amber-600 border-amber-500/20",
        label: "Focus Mode",
      };

    case "meeting":
      return {
        dot: "bg-blue-500",
        badge:
          "bg-blue-500/10 text-blue-600 border-blue-500/20",
        label: "In Meetings",
      };

    case "away":
      return {
        dot: "bg-zinc-400",
        badge:
          "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
        label: "Away",
      };
  }
}

export default function EmployeeSnapshot() {
  return (
    <DashboardSection
      title="Team Pulse"
      subtitle="Quick awareness about people around your workday"
    >
      <div className="space-y-3">

        {teamMembers.map((member) => {
          const styles = getStatusStyles(member.status);

          return (
            <div
              key={member.name}
              className="
                rounded-2xl
                border
                border-[var(--border)]
                bg-[var(--background)]
                p-4
                transition-all
                duration-200
                hover:border-[var(--primary)]
              "
            >
              <div className="flex items-start justify-between gap-3">

                {/* LEFT */}
                <div className="min-w-0 flex-1">

                  <div className="flex items-center gap-2">

                    <div
                      className={`
                        h-2.5
                        w-2.5
                        rounded-full
                        ${styles.dot}
                      `}
                    />

                    <h3
                      className="
                        text-sm
                        font-semibold
                        text-[var(--foreground)]
                      "
                    >
                      {member.name}
                    </h3>

                  </div>

                  <p
                    className="
                      mt-1
                      text-xs
                      text-[var(--muted-foreground)]
                    "
                  >
                    {member.role}
                  </p>

                  <p
                    className="
                      mt-3
                      text-sm
                      text-[var(--foreground)]
                    "
                  >
                    {member.note}
                  </p>

                </div>

                {/* RIGHT */}
                <div
                  className={`
                    shrink-0
                    rounded-full
                    border
                    px-2.5
                    py-1
                    text-xs
                    font-medium
                    ${styles.badge}
                  `}
                >
                  {styles.label}
                </div>

              </div>
            </div>
          );
        })}

      </div>
    </DashboardSection>
  );
}