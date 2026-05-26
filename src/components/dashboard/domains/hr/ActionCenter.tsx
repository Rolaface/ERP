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
        tone: "text-rose-500",
        line: "bg-rose-500",
        cta: "text-rose-600",
      };

    case "warning":
      return {
        icon: Clock3,
        tone: "text-amber-500",
        line: "bg-amber-500",
        cta: "text-amber-600",
      };

    case "info":
      return {
        icon: BellRing,
        tone: "text-blue-500",
        line: "bg-blue-500",
        cta: "text-blue-600",
      };
  }
}

const ActionCenter: React.FC = () => {
  return (
    <section
      className="
        rounded-b-[32px]
        border
        border-t-0
        border-[var(--border)]
        bg-[var(--card)]
        px-7
        py-6
      "
    >

      <div className="flex items-center justify-between">

        <div>

          <p
            className="
              text-xs
              font-medium
              uppercase
              tracking-[0.18em]
              text-[var(--muted-foreground)]
            "
          >
            Decision Queue
          </p>

          <h2 className="mt-2 text-xl font-semibold">
            Operational Actions
          </h2>

        </div>

        <div
          className="
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

      <div className="mt-7 space-y-3">

        {actions.map((item) => {
          const config = getPriorityConfig(item.priority);
          const Icon = config.icon;

          return (
            <div
              key={item.id}
              className="
                flex
                items-start
                gap-4
                rounded-2xl
                border
                border-[var(--border)]
                px-4
                py-4
                transition-all
                hover:border-[color-mix(in_srgb,var(--border)_70%,black)]
                hover:bg-[var(--background)]
              "
            >

              <div
                className={`
                  mt-1
                  h-10
                  w-1
                  rounded-full
                  ${config.line}
                `}
              />

              <div
                className={`
                  flex
                  h-10
                  w-10
                  shrink-0
                  items-center
                  justify-center
                  rounded-2xl
                  bg-[var(--background)]
                  ${config.tone}
                `}
              >

                <Icon className="h-5 w-5" />

              </div>

              <div className="min-w-0 flex-1">

                <div className="flex items-start justify-between gap-4">

                  <div>

                    <h3
                      className="
                        text-sm
                        font-semibold
                        text-[var(--foreground)]
                      "
                    >
                      {item.title}
                    </h3>

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

                  <button
                    className={`
                      inline-flex
                      items-center
                      gap-1
                      text-sm
                      font-medium
                      transition-colors
                      ${config.cta}
                    `}
                  >

                    {item.ctaLabel}

                    <ChevronRight className="h-4 w-4" />

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