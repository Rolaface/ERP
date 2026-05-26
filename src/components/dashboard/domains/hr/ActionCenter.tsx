import React from "react";

import {
  AlertTriangle,
  Clock3,
  BellRing,
  ChevronRight,
} from "lucide-react";

type ActionPriority = "critical" | "warning" | "info";

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
    description: "Submit yesterday's work log before 6 PM",
    priority: "critical",
    ctaLabel: "Submit",
  },
  {
    id: 2,
    title: "Approval requests waiting",
    description: "2 requests require your review",
    priority: "warning",
    ctaLabel: "Review",
  },
  {
    id: 3,
    title: "Attendance anomaly detected",
    description: "Missing punch-out from Tuesday",
    priority: "critical",
    ctaLabel: "Resolve",
  },
  {
    id: 4,
    title: "Policy acknowledgement",
    description: "Updated remote-work guidelines available",
    priority: "info",
    ctaLabel: "Open",
  },
];

function getPriorityConfig(priority: ActionPriority) {
  switch (priority) {
    case "critical":
      return {
        icon: AlertTriangle,
        iconTone: "text-rose-500",
        line: "bg-rose-500",
        container:
          "bg-[color-mix(in_srgb,var(--card)_88%,transparent)]",
        title:
          "text-[15px] font-semibold text-[var(--foreground)]",
        description:
          "text-sm text-[var(--muted-foreground)]",
        cta:
          "text-rose-600 hover:text-rose-700",
        spacing: "py-4",
      };

    case "warning":
      return {
        icon: Clock3,
        iconTone: "text-amber-500",
        line: "bg-amber-500",
        container:
          "bg-[color-mix(in_srgb,var(--card)_70%,transparent)]",
        title:
          "text-sm font-medium text-[var(--foreground)]",
        description:
          "text-sm text-[var(--muted-foreground)]",
        cta:
          "text-amber-600 hover:text-amber-700",
        spacing: "py-3",
      };

    case "info":
      return {
        icon: BellRing,
        iconTone: "text-blue-500",
        line: "bg-blue-500",
        container: "bg-transparent",
        title:
          "text-sm font-medium text-[var(--foreground)]",
        description:
          "text-sm text-[var(--muted-foreground)]",
        cta:
          "text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
        spacing: "py-2.5",
      };
  }
}

const ActionCenter: React.FC = () => {
  return (
    <section
      className="
        rounded-[28px]
        border
        border-[var(--border)]
        bg-[var(--card)]
        px-5
        py-4
      "
    >

      {/* HEADER */}
      <div className="flex items-start justify-between gap-4">

        <div className="space-y-1">

          <div className="flex items-center gap-2">

            <div className="h-2 w-2 rounded-full bg-emerald-500" />

            <h2
              className="
                text-base
                font-semibold
                text-[var(--foreground)]
              "
            >
              Operational Queue
            </h2>

          </div>

          <p
            className="
              text-sm
              text-[var(--muted-foreground)]
            "
          >
            Actions affecting today's workflow momentum
          </p>

        </div>

        <div
          className="
            shrink-0
            rounded-full
            bg-[var(--background)]
            px-3
            py-1.5
            text-xs
            font-medium
            text-[var(--muted-foreground)]
          "
        >
          {actions.length} active
        </div>

      </div>

      {/* FLOW STREAM */}
      <div className="mt-5">

        {actions.map((item, index) => {
          const config = getPriorityConfig(item.priority);
          const Icon = config.icon;

          return (
            <div
              key={item.id}
              className={`
                group
                relative
                flex
                items-start
                gap-4
                ${config.spacing}
                ${index !== actions.length - 1
                  ? "border-b border-[var(--border)]"
                  : ""
                }
              `}
            >

              {/* PRIORITY COLUMN */}
              <div className="flex flex-col items-center pt-1">

                <div
                  className={`
                    h-10
                    w-1
                    rounded-full
                    ${config.line}
                  `}
                />

              </div>

              {/* ICON */}
              <div
                className={`
                  flex
                  h-9
                  w-9
                  shrink-0
                  items-center
                  justify-center
                  rounded-2xl
                  bg-[var(--background)]
                  ${config.iconTone}
                `}
              >
                <Icon className="h-4 w-4" />
              </div>

              {/* CONTENT */}
              <div className="min-w-0 flex-1">

                <div className="flex items-start justify-between gap-4">

                  <div className="min-w-0">

                    <h3 className={config.title}>
                      {item.title}
                    </h3>

                    <p
                      className={`
                        mt-1
                        leading-relaxed
                        ${config.description}
                      `}
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