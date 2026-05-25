import React from "react";
import {
  AlertTriangle,
  ClipboardCheck,
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

const ActionCenter: React.FC = () => {
  const actions: ActionItem[] = [
    {
      id: 1,
      title: "Timesheet pending",
      description: "Submit yesterday's work log before 6 PM",
      priority: "critical",
      ctaLabel: "Submit Now",
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
      description: "Review updated remote-work guidelines",
      priority: "info",
      ctaLabel: "Open",
    },
  ];

  const groupedActions = {
    critical: actions.filter((a) => a.priority === "critical"),
    warning: actions.filter((a) => a.priority === "warning"),
    info: actions.filter((a) => a.priority === "info"),
  };

  const sectionConfig = {
    critical: {
      title: "Critical",
      icon: AlertTriangle,
      tone:
        "border-red-500/20 bg-red-500/5 text-red-600",
    },

    warning: {
      title: "Needs Attention",
      icon: Clock3,
      tone:
        "border-amber-500/20 bg-amber-500/5 text-amber-600",
    },

    info: {
      title: "Awareness",
      icon: BellRing,
      tone:
        "border-blue-500/20 bg-blue-500/5 text-blue-600",
    },
  };

  return (
    <section
      className="
        rounded-3xl
        border
        border-[var(--border)]
        bg-[var(--card)]
        p-6
        shadow-sm
      "
    >
      {/* HEADER */}
      <div className="space-y-1">
        <h2
          className="
            text-lg
            font-semibold
            text-[var(--foreground)]
          "
        >
          Action Center
        </h2>

        <p
          className="
            text-sm
            text-[var(--muted-foreground)]
          "
        >
          Items requiring your attention today
        </p>
      </div>

      {/* CONTENT */}
      <div className="mt-6 space-y-6">

        {(Object.keys(groupedActions) as ActionPriority[]).map(
          (priorityKey) => {
            const items = groupedActions[priorityKey];

            if (!items.length) return null;

            const config = sectionConfig[priorityKey];
            const Icon = config.icon;

            return (
              <div key={priorityKey} className="space-y-3">

                {/* PRIORITY HEADER */}
                <div className="flex items-center gap-2">
                  <div
                    className={`
                      flex
                      h-8
                      w-8
                      items-center
                      justify-center
                      rounded-xl
                      border
                      ${config.tone}
                    `}
                  >
                    <Icon className="h-4 w-4" />
                  </div>

                  <h3
                    className="
                      text-sm
                      font-semibold
                      text-[var(--foreground)]
                    "
                  >
                    {config.title}
                  </h3>
                </div>

                {/* ACTION ITEMS */}
                <div className="space-y-3">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="
                        rounded-2xl
                        border
                        border-[var(--border)]
                        bg-[var(--background)]
                        p-4
                        transition-all
                        hover:border-[var(--primary)]
                      "
                    >
                      <div className="flex items-start justify-between gap-4">

                        {/* LEFT */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <ClipboardCheck className="h-4 w-4 text-[var(--primary)]" />

                            <h4
                              className="
                                text-sm
                                font-semibold
                                text-[var(--foreground)]
                              "
                            >
                              {item.title}
                            </h4>
                          </div>

                          <p
                            className="
                              mt-2
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
                          className="
                            inline-flex
                            items-center
                            gap-1
                            rounded-xl
                            border
                            border-[var(--border)]
                            bg-[var(--card)]
                            px-3
                            py-2
                            text-xs
                            font-medium
                            text-[var(--foreground)]
                            transition-all
                            hover:border-[var(--primary)]
                            hover:text-[var(--primary)]
                          "
                        >
                          {item.ctaLabel}

                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>

                      </div>
                    </div>
                  ))}
                </div>

              </div>
            );
          }
        )}

      </div>
    </section>
  );
};

export default ActionCenter;