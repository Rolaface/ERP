import React from "react";

import {
  CalendarDays,
  Clock3,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const items = [
  {
    title: "Primary Focus",
    description: "Complete API integration review",
    icon: CheckCircle2,
    tone: "text-emerald-500",
  },
  {
    title: "Upcoming Meeting",
    description: "Sprint planning at 4:00 PM",
    icon: CalendarDays,
    tone: "text-blue-500",
  },
  {
    title: "Reminder",
    description: "Submit timesheet before 6 PM",
    icon: Clock3,
    tone: "text-amber-500",
  },
  {
    title: "Potential Blocker",
    description: "Awaiting deployment approval",
    icon: AlertCircle,
    tone: "text-rose-500",
  },
];

const MyWorkdayPanel: React.FC = () => {
  return (
    <section
      className="
        rounded-2xl
        border
        border-[var(--border)]
        bg-[var(--card)]
        px-4
        py-3
      "
    >

      <div className="flex items-center justify-between">

        <h2 className="text-sm font-medium text-[var(--foreground)]">
          Workday Flow
        </h2>

        <span className="text-xs text-[var(--muted-foreground)]">
          4 active
        </span>

      </div>

      <div className="mt-3 divide-y divide-[var(--border)]">

        {items.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="
                flex
                items-center
                gap-3
                py-3
              "
            >

              <div
                className="
                  flex
                  h-8
                  w-8
                  items-center
                  justify-center
                  rounded-xl
                  bg-[var(--background)]
                "
              >
                <Icon className={`h-4 w-4 ${item.tone}`} />
              </div>

              <div className="min-w-0 flex-1">

                <div className="flex items-center justify-between gap-3">

                  <p className="text-sm font-medium text-[var(--foreground)]">
                    {item.title}
                  </p>

                </div>

                <p className="mt-0.5 text-sm text-[var(--muted-foreground)]">
                  {item.description}
                </p>

              </div>

            </div>
          );
        })}

      </div>

    </section>
  );
};

export default MyWorkdayPanel;