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
        border-x
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
            Workflow Stream
          </p>

          <h2 className="mt-2 text-xl font-semibold">
            Workday Flow
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
          4 active
        </div>

      </div>

      <div className="mt-7 space-y-2">

        {items.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="
                flex
                items-start
                gap-4
                rounded-2xl
                px-4
                py-4
                transition-colors
                hover:bg-[var(--background)]
              "
            >

              <div
                className="
                  mt-0.5
                  flex
                  h-10
                  w-10
                  shrink-0
                  items-center
                  justify-center
                  rounded-2xl
                  bg-[var(--background)]
                "
              >

                <Icon className={`h-5 w-5 ${item.tone}`} />

              </div>

              <div className="min-w-0 flex-1">

                <p className="text-sm font-semibold text-[var(--foreground)]">
                  {item.title}
                </p>

                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
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