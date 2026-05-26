import React from "react";

import {
  AlertTriangle,
  Focus,
  BellDot,
} from "lucide-react";

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

function getToneConfig(tone: FlowSignal["tone"]) {
  switch (tone) {
    case "warning":
      return {
        icon: AlertTriangle,
        tone:
          "text-amber-700 bg-amber-500/10 border-amber-500/20",
      };

    case "focus":
      return {
        icon: Focus,
        tone:
          "text-blue-700 bg-blue-500/10 border-blue-500/20",
      };

    default:
      return {
        icon: BellDot,
        tone:
          "text-[var(--foreground)] bg-[var(--background)] border-[var(--border)]",
      };
  }
}

export default function FlowSupportPanel() {
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
          Attention Queue
        </h2>

        <p
          className="
            mt-1
            text-xs
            text-[var(--muted-foreground)]
          "
        >
          Signals requiring awareness or follow-up
        </p>
      </div>

      <div className="space-y-3">

        {signals.map((signal) => {
          const config = getToneConfig(signal.tone);
          const Icon = config.icon;

          return (
            <div
              key={signal.id}
              className={`
                flex
                items-start
                gap-3
                rounded-2xl
                border
                px-3
                py-3
                ${config.tone}
              `}
            >

              <Icon className="mt-0.5 h-4 w-4 shrink-0" />

              <p className="text-sm leading-relaxed">
                {signal.text}
              </p>

            </div>
          );
        })}

      </div>

    </section>
  );
}