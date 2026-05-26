import React from "react";
import {
  CalendarDays,
  Plane,
  TreePalm,
  BriefcaseMedical,
  Clock3,
  ArrowRight,
} from "lucide-react";

const LeaveBalance: React.FC = () => {
  const leaveUsedPercentage = 60;

  const leaveTypes = [
    {
      icon: TreePalm,
      label: "Casual Leave",
      value: "4 Days",
      tone: "text-emerald-600 bg-emerald-500/10",
    },
    {
      icon: BriefcaseMedical,
      label: "Sick Leave",
      value: "2 Days",
      tone: "text-amber-600 bg-amber-500/10",
    },
    {
      icon: CalendarDays,
      label: "Earned Leave",
      value: "2 Days",
      tone: "text-blue-600 bg-blue-500/10",
    },
  ];

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
            "radial-gradient(circle at top right, #10b981 0%, transparent 65%)",
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
              Leave Intelligence
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
              Leave Balance
            </h2>
          </div>

          {/* Leave Status */}
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
            <Plane className="h-4 w-4" />

            <span>Healthy Balance</span>
          </div>
        </div>

        {/* Main Leave Balance */}
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
          <p
            className="
              text-sm
              font-medium
              text-[var(--muted-foreground)]
            "
          >
            Available Leave Balance
          </p>

          <div
            className="
              mt-3
              flex
              items-end
              gap-2
            "
          >
            <h3
              className="
                text-4xl
                font-bold
                tracking-tight
                text-[var(--foreground)]
              "
            >
              8
            </h3>

            <span
              className="
                mb-1
                text-sm
                font-medium
                text-[var(--muted-foreground)]
              "
            >
              Days Available
            </span>
          </div>

          {/* Leave Burn Visualization */}
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
                Leave Usage
              </p>

              <span
                className="
                  text-sm
                  font-semibold
                  text-[var(--foreground)]
                "
              >
                {leaveUsedPercentage}%
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
                  bg-emerald-500
                  transition-all
                "
                style={{
                  width: `${leaveUsedPercentage}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Leave Categories */}
        <div
          className="
            mt-5
            space-y-3
          "
        >
          {leaveTypes.map((leave) => {
            const Icon = leave.icon;

            return (
              <div
                key={leave.label}
                className="
                  flex
                  items-center
                  justify-between
                  rounded-2xl
                  border
                  border-[var(--border)]
                  bg-[var(--background)]
                  p-4
                "
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`
                      flex
                      h-10
                      w-10
                      items-center
                      justify-center
                      rounded-xl
                      ${leave.tone}
                    `}
                  >
                    <Icon className="h-4 w-4" />
                  </div>

                  <div>
                    <p
                      className="
                        text-sm
                        font-medium
                        text-[var(--foreground)]
                      "
                    >
                      {leave.label}
                    </p>

                    <p
                      className="
                        mt-0.5
                        text-xs
                        text-[var(--muted-foreground)]
                      "
                    >
                      Available Balance
                    </p>
                  </div>
                </div>

                <p
                  className="
                    text-sm
                    font-semibold
                    text-[var(--foreground)]
                  "
                >
                  {leave.value}
                </p>
              </div>
            );
          })}
        </div>

        {/* Operational Insights */}
        <div
          className="
            mt-5
            grid
            grid-cols-1
            gap-3
            sm:grid-cols-2
          "
        >
          {/* Pending Request */}
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
                  text-amber-500
                "
              />

              <p
                className="
                  text-sm
                  font-medium
                  text-[var(--muted-foreground)]
                "
              >
                Pending Requests
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
              1
            </p>
          </div>

          {/* Upcoming Holiday */}
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
              <CalendarDays
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
                Next Holiday
              </p>
            </div>

            <p
              className="
                mt-3
                text-lg
                font-semibold
                text-[var(--foreground)]
              "
            >
              May 30
            </p>
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
            hover:border-emerald-500/40
            hover:bg-emerald-500/5
          "
        >
          <span>Apply Leave</span>

          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
};

export default LeaveBalance;