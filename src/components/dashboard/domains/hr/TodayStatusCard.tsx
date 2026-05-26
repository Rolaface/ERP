import React from "react";

import {
  CheckCircle2,
  Clock3,
  Plane,
  CalendarDays,
} from "lucide-react";

const TodayStatusCard: React.FC = () => {
  const workedHours = 5.2;
  const targetHours = 8;

  const progress = (workedHours / targetHours) * 100;

  return (
    <section
      className="
        rounded-t-[32px]
        border-x
        border-t
        border-[var(--border)]
        bg-[var(--card)]
        px-7
        pt-7
        pb-6
      "
    >

      {/* HEADER */}
      <div className="flex items-start justify-between gap-6">

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
            Live Operational Status
          </p>

          <h2
            className="
              mt-2
              text-2xl
              font-semibold
              text-[var(--foreground)]
            "
          >
            Your Workday
          </h2>

        </div>

        <div
          className="
            flex
            items-center
            gap-2
            rounded-full
            bg-emerald-500/10
            px-3
            py-1.5
            text-sm
            font-medium
            text-emerald-700
          "
        >

          <CheckCircle2 className="h-4 w-4" />

          Active Shift

        </div>

      </div>

      {/* PRIMARY STATUS */}
      <div
        className="
          mt-7
          grid
          grid-cols-1
          gap-4
          lg:grid-cols-3
        "
      >

        {/* CHECK IN */}
        <div
          className="
            rounded-3xl
            border
            border-emerald-500/15
            bg-emerald-500/5
            p-5
          "
        >

          <div className="flex items-center gap-2">

            <CheckCircle2 className="h-4 w-4 text-emerald-600" />

            <p className="text-sm font-medium text-emerald-700">
              Checked In
            </p>

          </div>

          <p
            className="
              mt-4
              text-4xl
              font-bold
              tracking-tight
              text-[var(--foreground)]
            "
          >
            9:42
          </p>

          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            AM • Shift started successfully
          </p>

        </div>

        {/* WORK PROGRESS */}
        <div
          className="
            rounded-3xl
            border
            border-[var(--border)]
            p-5
          "
        >

          <div className="flex items-center gap-2">

            <Clock3 className="h-4 w-4 text-blue-600" />

            <p className="text-sm font-medium text-[var(--foreground)]">
              Work Progress
            </p>

          </div>

          <div className="mt-5">

            <div
              className="
                h-2
                overflow-hidden
                rounded-full
                bg-[var(--muted)]
              "
            >

              <div
                className="
                  h-full
                  rounded-full
                  bg-blue-500
                "
                style={{ width: `${progress}%` }}
              />

            </div>

            <div className="mt-4 flex items-end justify-between">

              <div>

                <p
                  className="
                    text-3xl
                    font-bold
                    text-[var(--foreground)]
                  "
                >
                  {Math.round(progress)}%
                </p>

                <p className="text-sm text-[var(--muted-foreground)]">
                  Shift completion
                </p>

              </div>

              <div className="text-right">

                <p className="text-sm font-medium text-[var(--foreground)]">
                  {workedHours}h worked
                </p>

                <p className="text-sm text-[var(--muted-foreground)]">
                  Target {targetHours}h
                </p>

              </div>

            </div>

          </div>

        </div>

        {/* LEAVE HEALTH */}
        <div
          className="
            rounded-3xl
            border
            border-[var(--border)]
            p-5
          "
        >

          <div className="flex items-center gap-2">

            <Plane className="h-4 w-4 text-violet-600" />

            <p className="text-sm font-medium text-[var(--foreground)]">
              Leave Health
            </p>

          </div>

          <div className="mt-5">

            <p
              className="
                text-4xl
                font-bold
                tracking-tight
                text-[var(--foreground)]
              "
            >
              12
            </p>

            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Available leave days
            </p>

            <div
              className="
                mt-5
                inline-flex
                rounded-full
                bg-violet-500/10
                px-3
                py-1
                text-xs
                font-medium
                text-violet-700
              "
            >
              Healthy Balance
            </div>

          </div>

        </div>

      </div>

      {/* SCHEDULE */}
      <div
        className="
          mt-6
          rounded-3xl
          border
          border-[var(--border)]
          px-5
          py-4
        "
      >

        <div className="flex items-center gap-2">

          <CalendarDays className="h-4 w-4 text-amber-600" />

          <p className="text-sm font-medium text-[var(--foreground)]">
            Schedule Awareness
          </p>

        </div>

        <div
          className="
            mt-5
            grid
            grid-cols-3
            gap-4
          "
        >

          <div>
            <p className="text-sm text-[var(--muted-foreground)]">
              Meetings Left
            </p>

            <p className="mt-1 text-lg font-semibold">
              2 meetings
            </p>
          </div>

          <div>
            <p className="text-sm text-[var(--muted-foreground)]">
              Next Break
            </p>

            <p className="mt-1 text-lg font-semibold">
              4:00 PM
            </p>
          </div>

          <div>
            <p className="text-sm text-[var(--muted-foreground)]">
              Shift Ends
            </p>

            <p className="mt-1 text-lg font-semibold">
              7:00 PM
            </p>
          </div>

        </div>

      </div>

    </section>
  );
};

export default TodayStatusCard;