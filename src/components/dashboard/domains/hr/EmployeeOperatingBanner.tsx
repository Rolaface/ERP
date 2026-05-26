import React, { useMemo } from "react";
import {
  Clock3,
  CheckCircle2,
  MapPin,
  Plane,
  LogOut,
  Timer,
  CalendarDays,
  Activity,
  ClipboardCheck,
} from "lucide-react";

import { useAuth } from "../../../../context/AuthContext";

const EmployeeOperatingBanner: React.FC = () => {
  const { user } = useAuth();

  const greeting = useMemo(() => {
    const hour = new Date().getHours();

    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";

    return "Good evening";
  }, []);

  const operationalItems = [
    {
      icon: CheckCircle2,
      label: "Checked In",
      value: "9:42 AM",
      tone: "success",
    },
    {
      icon: Timer,
      label: "Active Session",
      value: "3h 21m",
      tone: "neutral",
    },
    {
      icon: MapPin,
      label: "Location",
      value: "Noida Office",
      tone: "neutral",
    },
    {
      icon: Clock3,
      label: "Shift Progress",
      value: "42%",
      tone: "warning",
    },
  ];

  const metrics = [
    {
      label: "Attendance",
      value: "98%",
    },
    {
      label: "Tasks Completed",
      value: "12",
    },
    {
      label: "Pending Reviews",
      value: "2",
    },
    {
      label: "Leave Balance",
      value: "8 Days",
    },
    {
      label: "Performance",
      value: "92%",
    },
  ];

  const toneStyles: Record<string, string> = {
    success:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-600",

    warning:
      "border-amber-500/20 bg-amber-500/10 text-amber-600",

    neutral:
      "border-blue-500/20 bg-blue-500/10 text-blue-600",
  };

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
          opacity-[0.04]
        "
        style={{
          background:
            "radial-gradient(circle at top right, var(--primary) 0%, transparent 60%)",
        }}
      />

      <div className="relative z-10 space-y-6">
        {/* TOP SECTION */}
        <div
          className="
            flex
            flex-col
            gap-8
            xl:flex-row
            xl:items-start
            xl:justify-between
          "
        >
          {/* LEFT SIDE */}
          <div className="space-y-5">
            {/* Identity Zone */}
            <div className="flex items-start gap-4">
              {/* Profile */}
              <div className="relative">
                <div
                  className="
                    flex
                    h-16
                    w-16
                    items-center
                    justify-center
                    overflow-hidden
                    rounded-2xl
                    border
                    border-[var(--border)]
                    bg-[var(--background)]
                    text-lg
                    font-semibold
                    text-[var(--foreground)]
                    shadow-sm
                  "
                >
                  {user?.fullName?.charAt(0) ??
                    user?.username?.charAt(0) ??
                    "U"}
                </div>

                {/* Presence Indicator */}
                <div
                  className="
                    absolute
                    -bottom-1
                    -right-1
                    h-4
                    w-4
                    rounded-full
                    border-2
                    border-[var(--card)]
                    bg-emerald-500
                  "
                />
              </div>

              {/* Identity Content */}
              <div className="space-y-2">
                {/* Presence Status */}
                <div
                  className="
                    inline-flex
                    items-center
                    gap-2
                    rounded-full
                    border
                    border-emerald-500/20
                    bg-emerald-500/10
                    px-2.5
                    py-1
                    text-xs
                    font-medium
                    text-emerald-600
                  "
                >
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />

                  <span>Online</span>
                </div>

                {/* Greeting */}
                <div>
                  <p
                    className="
                      text-sm
                      font-medium
                      text-[var(--muted-foreground)]
                    "
                  >
                    {greeting}
                  </p>

                  <h1
                    className="
                      text-3xl
                      font-bold
                      tracking-tight
                      text-[var(--foreground)]
                    "
                  >
                    {user?.fullName ?? user?.username}
                  </h1>
                </div>

                {/* Metadata */}
                <div
                  className="
                    flex
                    flex-wrap
                    items-center
                    gap-2
                    text-sm
                    text-[var(--muted-foreground)]
                  "
                >
                  <span>Frontend Engineer</span>

                  <span className="opacity-40">•</span>

                  <span>Product Team</span>

                  <span className="opacity-40">•</span>

                  <span>Remote</span>
                </div>
              </div>
            </div>

            {/* Operational Chips */}
            <div className="flex flex-wrap gap-3">
              {operationalItems.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.label}
                    className={`
                      inline-flex
                      items-center
                      gap-2
                      rounded-2xl
                      border
                      px-3.5
                      py-2
                      text-sm
                      transition-all
                      ${toneStyles[item.tone]}
                    `}
                  >
                    <Icon className="h-4 w-4" />

                    <span className="font-medium opacity-80">
                      {item.label}
                    </span>

                    <span className="font-semibold">
                      {item.value}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Shift Information */}
            <div
              className="
                flex
                flex-wrap
                items-center
                gap-3
                text-sm
                text-[var(--muted-foreground)]
              "
            >
              <div
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-full
                  border
                  border-[var(--border)]
                  bg-[var(--background)]
                  px-3
                  py-1.5
                "
              >
                <Clock3 className="h-4 w-4" />

                <span>10:00 AM – 7:00 PM</span>
              </div>

              <div
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-full
                  border
                  border-[var(--border)]
                  bg-[var(--background)]
                  px-3
                  py-1.5
                "
              >
                <CalendarDays className="h-4 w-4" />

                <span>Next: Design Sync • 2:30 PM</span>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div
            className="
              flex
              flex-col
              gap-3
              sm:flex-row
              xl:flex-col
            "
          >
            {/* Primary Action */}
            <button
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-2xl
                bg-[var(--primary)]
                px-5
                py-3
                text-sm
                font-medium
                text-white
                shadow-sm
                transition-all
                hover:opacity-90
              "
            >
              <LogOut className="h-4 w-4" />

              <span>Clock Out</span>
            </button>

            {/* Secondary Actions */}
            <button
              className="
                inline-flex
                items-center
                justify-center
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
              <Plane className="h-4 w-4" />

              <span>Apply Leave</span>
            </button>

            <button
              className="
                inline-flex
                items-center
                justify-center
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
              <ClipboardCheck className="h-4 w-4" />

              <span>View Attendance</span>
            </button>
          </div>
        </div>

        {/* METRICS STRIP */}
        <div
          className="
            grid
            grid-cols-2
            gap-3
            border-t
            border-[var(--border)]
            pt-5
            sm:grid-cols-3
            xl:grid-cols-5
          "
        >
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="
                rounded-2xl
                border
                border-[var(--border)]
                bg-[var(--background)]
                px-4
                py-3
              "
            >
              <p
                className="
                  text-xs
                  font-medium
                  uppercase
                  tracking-wide
                  text-[var(--muted-foreground)]
                "
              >
                {metric.label}
              </p>

              <div className="mt-2 flex items-center gap-2">
                <Activity className="h-4 w-4 text-[var(--primary)]" />

                <p
                  className="
                    text-lg
                    font-semibold
                    text-[var(--foreground)]
                  "
                >
                  {metric.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default EmployeeOperatingBanner;