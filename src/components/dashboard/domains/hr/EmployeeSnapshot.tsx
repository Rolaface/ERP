import React from "react";

type TeamSignal = {
  id: number;
  name: string;
  signal: string;
  status: "available" | "focus" | "meeting" | "away";
};

const signals: TeamSignal[] = [
  {
    id: 1,
    name: "Amit Sharma",
    signal: "Focus mode",
    status: "focus",
  },
  {
    id: 2,
    name: "Neha Verma",
    signal: "Available for approvals",
    status: "available",
  },
  {
    id: 3,
    name: "Rahul Mehta",
    signal: "Meetings until 3 PM",
    status: "meeting",
  },
  {
    id: 4,
    name: "Priya Singh",
    signal: "Away today",
    status: "away",
  },
];

function getStatusStyles(status: TeamSignal["status"]) {
  switch (status) {
    case "available":
      return {
        dot: "bg-emerald-500",
        badge:
          "bg-emerald-500/10 text-emerald-700",
      };

    case "focus":
      return {
        dot: "bg-amber-500",
        badge:
          "bg-amber-500/10 text-amber-700",
      };

    case "meeting":
      return {
        dot: "bg-blue-500",
        badge:
          "bg-blue-500/10 text-blue-700",
      };

    case "away":
      return {
        dot: "bg-zinc-400",
        badge:
          "bg-zinc-500/10 text-zinc-600",
      };
  }
}

export default function EmployeeSnapshot() {
  return (
    <section className="space-y-4">

      <div>
        <h2
          className="
            text-sm
            font-semibold
            text-[var(--foreground)]
          "
        >
          Team Pulse
        </h2>

        <p
          className="
            mt-1
            text-xs
            text-[var(--muted-foreground)]
          "
        >
          Nearby collaboration awareness
        </p>
      </div>

      <div className="space-y-3">

        {signals.map((member) => {
          const styles = getStatusStyles(member.status);

          return (
            <div
              key={member.id}
              className="
                flex
                items-center
                justify-between
                gap-3
                rounded-2xl
                border
                border-[var(--border)]
                bg-[var(--background)]
                px-3
                py-3
              "
            >

              <div className="flex items-center gap-3">

                <div
                  className={`
                    h-2.5
                    w-2.5
                    rounded-full
                    ${styles.dot}
                  `}
                />

                <div>

                  <p className="text-sm font-medium text-[var(--foreground)]">
                    {member.name}
                  </p>

                  <p className="text-xs text-[var(--muted-foreground)]">
                    {member.signal}
                  </p>

                </div>

              </div>

              <div
                className={`
                  rounded-full
                  px-2.5
                  py-1
                  text-[10px]
                  font-medium
                  ${styles.badge}
                `}
              >
                {member.status}
              </div>

            </div>
          );
        })}

      </div>

    </section>
  );
}