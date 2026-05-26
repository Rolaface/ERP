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
    signal: "In meetings until 3 PM",
    status: "meeting",
  },
  {
    id: 4,
    name: "Priya Singh",
    signal: "Away today",
    status: "away",
  },
];

function getStatusColor(status: TeamSignal["status"]) {
  switch (status) {
    case "available":
      return "bg-emerald-500";

    case "focus":
      return "bg-amber-500";

    case "meeting":
      return "bg-blue-500";

    case "away":
      return "bg-zinc-400";
  }
}

export default function EmployeeSnapshot() {
  return (
    <section className="space-y-3">

      <div className="flex items-center gap-2">
        <div className="h-1.5 w-1.5 rounded-full bg-[var(--muted-foreground)]" />

        <h2
          className="
            text-xs
            font-semibold
            uppercase
            tracking-[0.18em]
            text-[var(--muted-foreground)]
          "
        >
          Nearby Team Signals
        </h2>
      </div>

      <div className="space-y-2.5">

        {signals.map((member) => (
          <div
            key={member.id}
            className="
              flex
              items-center
              gap-3
              text-sm
            "
          >
            <div
              className={`
                h-2
                w-2
                rounded-full
                ${getStatusColor(member.status)}
              `}
            />

            <span className="text-[var(--foreground)]">
              {member.name}
            </span>

            <span className="text-[var(--muted-foreground)]">
              · {member.signal}
            </span>
          </div>
        ))}

      </div>

    </section>
  );
}