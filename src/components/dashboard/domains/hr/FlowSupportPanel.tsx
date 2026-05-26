import React from "react";

type FlowSignal = {
  id: number;
  text: string;
  tone?: "default" | "warning" | "focus";
};

const signals: FlowSignal[] = [
  {
    id: 1,
    text: "Waiting for Rahul's feedback on payroll redesign",
    tone: "warning",
  },
  {
    id: 2,
    text: "Focus window reserved from 2 PM – 4 PM",
    tone: "focus",
  },
  {
    id: 3,
    text: "Deployment access pending approval",
    tone: "warning",
  },
  {
    id: 4,
    text: "3 unread project mentions",
    tone: "default",
  },
];

function getToneStyles(tone: FlowSignal["tone"]) {
  switch (tone) {
    case "warning":
      return "text-amber-600";

    case "focus":
      return "text-blue-600";

    default:
      return "text-[var(--muted-foreground)]";
  }
}

export default function FlowSupportPanel() {
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
          Operational Signals
        </h2>
      </div>

      <div className="space-y-2">
        {signals.map((signal) => (
          <div
            key={signal.id}
            className="
              flex
              items-start
              gap-3
              text-sm
            "
          >
            <div
              className={`
                mt-[7px]
                h-1.5
                w-1.5
                rounded-full
                bg-current
                ${getToneStyles(signal.tone)}
              `}
            />

            <p
              className={`
                leading-relaxed
                ${getToneStyles(signal.tone)}
              `}
            >
              {signal.text}
            </p>
          </div>
        ))}
      </div>

    </section>
  );
}