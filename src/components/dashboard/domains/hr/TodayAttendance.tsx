import React from "react";
import {
  Clock3,
  Timer,
  Coffee,
  CheckCircle2,
  ArrowRight,
  AlertTriangle,
  CalendarClock,
  ShieldCheck,
} from "lucide-react";

const TodayAttendance: React.FC = () => {
  const shiftProgress = 72;

  return (
    <section
      className="
        relative
        overflow-hidden
        rounded-3xl
        border
        border-[var(--border)]
        bg-[var(--card)]
        p-6
        shadow-sm
      "
    >
      {/* Background Accent */}
      <div
        className="
          pointer-events-none
          absolute
          inset-0
          opacity-[0.03]
        "
        style={{
          background:
            "radial-gradient(circle at top right, var(--primary) 0%, transparent 65%)",
        }}
      />

      <div className="relative z-10">
        {/* Header */}
        <div
          className="
            flex
            items-start
            justify-between
            gap-4
          "
        >
          <div>
            <p
              className="
                text-xs
                font-semibold
                uppercase
                tracking-[0.2em]
                text-[var(--muted-foreground)]
              "
            >
              Daily Work Session
            </p>

            <h2
              className="
                mt-2
                text-2xl
                font-bold
                tracking-tight
                text-[var(--foreground)]
              "
            >
              Today's Attendance
            </h2>
          </div>

          {/* Attendance Status */}
          <div
            className="
              inline-flex
              items-center
              gap-2
              rounded-full
              border
              border-emerald-500/20
              bg-emerald-500/10
              px-3
              py-1.5
              text-sm
              font-medium
              text-emerald-600
            "
          >
            <CheckCircle2 className="h-4 w-4" />

            <span>Present</span>
          </div>
        </div>

        {/* Live Session Timer */}
        <div
          className="
            mt-6
            rounded-2xl
            border
            border-[var(--border)]
            bg-[var(--background)]
            p-5
          "
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className="
                  flex
                  h-11
                  w-11
                  items-center
                  justify-center
                  rounded-2xl
                  bg-blue-500/10
                  text-blue-600
                "
              >
                <Timer className="h-5 w-5" />
              </div>

              <div>
                <p
                  className="
                    text-sm
                    font-medium
                    text-[var(--muted-foreground)]
                  "
                >
                  Currently Working
                </p>

                <p
                  className="
                    mt-1
                    text-3xl
                    font-bold
                    tracking-tight
                    text-[var(--foreground)]
                  "
                >
                  6h 21m
                </p>
              </div>
            </div>

            <div
              className="
                rounded-2xl
                border
                border-[var(--border)]
                bg-[var(--card)]
                px-4
                py-3
                text-right
              "
            >
              <p
                className="
                  text-xs
                  font-medium
                  text-[var(--muted-foreground)]
                "
              >
                Expected Logout
              </p>

              <p
                className="
                  mt-1
                  text-lg
                  font-semibold
                  text-[var(--foreground)]
                "
              >
                6:30 PM
              </p>
            </div>
          </div>
        </div>

        {/* Attendance Metrics */}
        <div
          className="
            mt-5
            grid
            grid-cols-2
            gap-4
          "
        >
          {/* Check In */}
          <div
            className="
              rounded-2xl
              border
              border-[var(--border)]
              bg-[var(--background)]
              p-4
            "
          >
            <div className="flex items-center gap-2">
              <Clock3
                className="
                  h-4
                  w-4
                  text-[var(--primary)]
                "
              />

              <p
                className="
                  text-sm
                  font-medium
                  text-[var(--muted-foreground)]
                "
              >
                Check In
              </p>
            </div>

            <p
              className="
                mt-3
                text-xl
                font-semibold
                text-[var(--foreground)]
              "
            >
              9:42 AM
            </p>

            <p
              className="
                mt-1
                text-xs
                text-amber-600
              "
            >
              12 mins late
            </p>
          </div>

          {/* Break Time */}
          <div
            className="
              rounded-2xl
              border
              border-[var(--border)]
              bg-[var(--background)]
              p-4
            "
          >
            <div className="flex items-center gap-2">
              <Coffee
                className="
                  h-4
                  w-4
                  text-[var(--primary)]
                "
              />

              <p
                className="
                  text-sm
                  font-medium
                  text-[var(--muted-foreground)]
                "
              >
                Break Time
              </p>
            </div>

            <p
              className="
                mt-3
                text-xl
                font-semibold
                text-[var(--foreground)]
              "
            >
              42 mins
            </p>

            <p
              className="
                mt-1
                text-xs
                text-[var(--muted-foreground)]
              "
            >
              Within policy
            </p>
          </div>

          {/* Worked Hours */}
          <div
            className="
              rounded-2xl
              border
              border-[var(--border)]
              bg-[var(--background)]
              p-4
            "
          >
            <div className="flex items-center gap-2">
              <Timer
                className="
                  h-4
                  w-4
                  text-[var(--primary)]
                "
              />

              <p
                className="
                  text-sm
                  font-medium
                  text-[var(--muted-foreground)]
                "
              >
                Worked
              </p>
            </div>

            <p
              className="
                mt-3
                text-xl
                font-semibold
                text-[var(--foreground)]
              "
            >
              6h 21m
            </p>

            <p
              className="
                mt-1
                text-xs
                text-[var(--muted-foreground)]
              "
            >
              2h remaining
            </p>
          </div>

          {/* Compliance Status */}
          <div
            className="
              rounded-2xl
              border
              border-[var(--border)]
              bg-[var(--background)]
              p-4
            "
          >
            <div className="flex items-center gap-2">
              <ShieldCheck
                className="
                  h-4
                  w-4
                  text-emerald-500
                "
              />

              <p
                className="
                  text-sm
                  font-medium
                  text-[var(--muted-foreground)]
                "
              >
                Compliance
              </p>
            </div>

            <p
              className="
                mt-3
                text-xl
                font-semibold
                text-emerald-600
              "
            >
              On Track
            </p>

            <p
              className="
                mt-1
                text-xs
                text-[var(--muted-foreground)]
              "
            >
              No action required
            </p>
          </div>
        </div>

        {/* Attendance Intelligence */}
        <div
          className="
            mt-5
            grid
            grid-cols-1
            gap-3
            sm:grid-cols-2
          "
        >
          {/* Attendance Health */}
          <div
            className="
              rounded-2xl
              border
              border-[var(--border)]
              bg-[var(--background)]
              p-4
            "
          >
            <div className="flex items-center gap-2">
              <CalendarClock
                className="
                  h-4
                  w-4
                  text-blue-500
                "
              />

              <p
                className="
                  text-sm
                  font-medium
                  text-[var(--muted-foreground)]
                "
              >
                Monthly Attendance
              </p>
            </div>

            <p
              className="
                mt-3
                text-2xl
                font-bold
                text-[var(--foreground)]
              "
            >
              96%
            </p>
          </div>

          {/* Leave Impact */}
          <div
            className="
              rounded-2xl
              border
              border-amber-500/20
              bg-amber-500/5
              p-4
            "
          >
            <div className="flex items-center gap-2">
              <AlertTriangle
                className="
                  h-4
                  w-4
                  text-amber-500
                "
              />

              <p
                className="
                  text-sm
                  font-medium
                  text-amber-700
                "
              >
                Leave Impact
              </p>
            </div>

            <p
              className="
                mt-3
                text-sm
                font-semibold
                text-[var(--foreground)]
              "
            >
              No leave deduction risk
            </p>
          </div>
        </div>

        {/* Shift Progress */}
        <div className="mt-6">
          <div
            className="
              mb-2
              flex
              items-center
              justify-between
            "
          >
            <p
              className="
                text-sm
                font-medium
                text-[var(--muted-foreground)]
              "
            >
              Shift Progress
            </p>

            <span
              className="
                text-sm
                font-semibold
                text-[var(--foreground)]
              "
            >
              {shiftProgress}%
            </span>
          </div>

          <div
            className="
              h-3
              overflow-hidden
              rounded-full
              bg-[var(--accent)]
            "
          >
            <div
              className="
                h-full
                rounded-full
                bg-[var(--primary)]
                transition-all
              "
              style={{
                width: `${shiftProgress}%`,
              }}
            />
          </div>
        </div>

        {/* CTA */}
        <button
          className="
            mt-6
            inline-flex
            items-center
            gap-2
            rounded-2xl
            border
            border-[var(--border)]
            bg-[var(--background)]
            px-5
            py-3
            text-sm
            font-medium
            text-[var(--foreground)]
            transition-all
            hover:border-[var(--primary)]
            hover:bg-[var(--accent)]
          "
        >
          <span>Open Attendance Details</span>

          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
};

export default TodayAttendance;