import React from "react";

import {
  CalendarDays,
  Clock3,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const MyWorkdayPanel: React.FC = () => {
  return (
    <section
      className="
        rounded-2xl
        border
        border-[var(--border)]
        bg-[var(--background)]
        p-5
        space-y-5
      "
    >
      {/* HEADER */}
      <div className="space-y-1">
        <h2
          className="
            text-sm
            font-semibold
            uppercase
            tracking-wide
            text-[var(--muted-foreground)]
          "
        >
          My Workday
        </h2>

        <p
          className="
            text-sm
            text-[var(--muted-foreground)]
          "
        >
          Lightweight guidance for your remaining workday
        </p>
      </div>

      {/* WORKDAY ITEMS */}
      <div className="space-y-3">

        {/* Focus */}
        <div
          className="
            flex
            items-start
            gap-3
            rounded-xl
            border
            border-[var(--border)]
            p-4
          "
        >
          <CheckCircle2
            className="mt-0.5 text-emerald-500"
            size={18}
          />

          <div className="space-y-1">
            <p className="text-sm font-medium text-[var(--foreground)]">
              Primary Focus
            </p>

            <p className="text-sm text-[var(--muted-foreground)]">
              Complete API integration review before end of day
            </p>
          </div>
        </div>

        {/* Meeting */}
        <div
          className="
            flex
            items-start
            gap-3
            rounded-xl
            border
            border-[var(--border)]
            p-4
          "
        >
          <CalendarDays
            className="mt-0.5 text-blue-500"
            size={18}
          />

          <div className="space-y-1">
            <p className="text-sm font-medium text-[var(--foreground)]">
              Upcoming Meeting
            </p>

            <p className="text-sm text-[var(--muted-foreground)]">
              Sprint planning at 4:00 PM with Product Team
            </p>
          </div>
        </div>

        {/* Reminder */}
        <div
          className="
            flex
            items-start
            gap-3
            rounded-xl
            border
            border-[var(--border)]
            p-4
          "
        >
          <Clock3
            className="mt-0.5 text-amber-500"
            size={18}
          />

          <div className="space-y-1">
            <p className="text-sm font-medium text-[var(--foreground)]">
              Reminder
            </p>

            <p className="text-sm text-[var(--muted-foreground)]">
              Submit timesheet before 6:00 PM
            </p>
          </div>
        </div>

        {/* Blocker */}
        <div
          className="
            flex
            items-start
            gap-3
            rounded-xl
            border
            border-[var(--border)]
            p-4
          "
        >
          <AlertCircle
            className="mt-0.5 text-rose-500"
            size={18}
          />

          <div className="space-y-1">
            <p className="text-sm font-medium text-[var(--foreground)]">
              Potential Blocker
            </p>

            <p className="text-sm text-[var(--muted-foreground)]">
              Awaiting backend approval for deployment access
            </p>
          </div>
        </div>

      </div>
    </section>
  );
};

export default MyWorkdayPanel;