import React from "react";

import {
  AlertTriangle,
  Clock3,
  BellRing,
  ChevronRight,
} from "lucide-react";

type ActionPriority =
  | "critical"
  | "warning"
  | "info";

interface ActionItem {
  id: number;
  title: string;
  description: string;
  priority: ActionPriority;
  ctaLabel: string;
}

const actions: ActionItem[] = [
  {
    id: 1,
    title: "Timesheet pending",
    description:
      "Submit yesterday's work log before 6 PM",
    priority: "critical",
    ctaLabel: "Submit",
  },
  {
    id: 2,
    title: "Approval requests waiting",
    description:
      "2 requests require your review",
    priority: "warning",
    ctaLabel: "Review",
  },
  {
    id: 3,
    title: "Attendance anomaly detected",
    description:
      "Missing punch-out from Tuesday",
    priority: "critical",
    ctaLabel: "Resolve",
  },
  {
    id: 4,
    title: "Policy acknowledgement",
    description:
      "Updated remote-work guidelines available",
    priority: "info",
    ctaLabel: "Open",
  },
];

function getPriorityConfig(
  priority: ActionPriority
) {
  switch (priority) {
    case "critical":
      return {
        icon: AlertTriangle,
        dot: "bg-rose-500",
        iconTone: "text-rose-600",
        cta: "text-rose-600",
        badge:
          "bg-rose-500/10 text-rose-700",
      };

    case "warning":
      return {
        icon: Clock3,
        dot: "bg-amber-500",
        iconTone: "text-amber-600",
        cta: "text-amber-600",
        badge:
          "bg-amber-500/10 text-amber-700",
      };

    case "info":
      return {
        icon: BellRing,
        dot: "bg-blue-500",
        iconTone: "text-blue-600",
        cta: "text-blue-600",
        badge:
          "bg-blue-500/10 text-blue-700",
      };
  }
}

const ActionCenter: React.FC = () => {
  return (
    <section
      className="
        rounded-3xl
        border
        border-[var(--border)]
        bg-[var(--card)]
        px-5
        py-4
      "
    >

      {/* HEADER */}
      <div className="flex items-center justify-between">

        <div>

          <div className="flex items-center gap-2">

            <div className="h-2 w-2 rounded-full bg-emerald-500" />

            <p
              className="
                text-xs
                font-semibold
                uppercase
                tracking-[0.16em]
                text-[var(--muted-foreground)]
              "
            >
              Operational Queue
            </p>

          </div>

          <h2
            className="
              mt-2
              text-lg
              font-semibold
              text-[var(--foreground)]
            "
          >
            Active Workflow Actions
          </h2>

        </div>

        <div
          className="
            rounded-full
            border
            border-[var(--border)]
            bg-[var(--background)]
            px-2.5
            py-1
            text-xs
            font-medium
            text-[var(--muted-foreground)]
          "
        >
          {actions.length} active
        </div>

      </div>

      {/* ACTION STREAM */}
      <div className="mt-5 divide-y divide-[var(--border)]">

        {actions.map((item) => {
          const config =
            getPriorityConfig(item.priority);

          const Icon = config.icon;

          return (
            <div
              key={item.id}
              className="
                group
                flex
                items-start
                gap-3
                py-3
              "
            >

              {/* PRIORITY */}
              <div className="pt-1">

                <div
                  className={`
                    h-2
                    w-2
                    rounded-full
                    ${config.dot}
                  `}
                />

              </div>

              {/* ICON */}
              <div
                className={`
                  flex
                  h-8
                  w-8
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  bg-[var(--background)]
                  ${config.iconTone}
                `}
              >

                <Icon className="h-4 w-4" />

              </div>

              {/* CONTENT */}
              <div className="min-w-0 flex-1">

                <div className="flex items-start justify-between gap-3">

                  <div className="min-w-0">

                    <div className="flex items-center gap-2">

                      <h3
                        className="
                          text-sm
                          font-medium
                          text-[var(--foreground)]
                        "
                      >
                        {item.title}
                      </h3>

                      <span
                        className={`
                          rounded-full
                          px-2
                          py-0.5
                          text-[10px]
                          font-medium
                          ${config.badge}
                        `}
                      >
                        {item.priority}
                      </span>

                    </div>

                    <p
                      className="
                        mt-1
                        text-sm
                        leading-relaxed
                        text-[var(--muted-foreground)]
                      "
                    >
                      {item.description}
                    </p>

                  </div>

                  {/* CTA */}
                  <button
                    className={`
                      inline-flex
                      shrink-0
                      items-center
                      gap-1
                      text-xs
                      font-medium
                      transition-colors
                      ${config.cta}
                    `}
                  >

                    {item.ctaLabel}

                    <ChevronRight className="h-3.5 w-3.5" />

                  </button>

                </div>

              </div>

            </div>
          );
        })}

      </div>

    </section>
  );
};

export default ActionCenter;