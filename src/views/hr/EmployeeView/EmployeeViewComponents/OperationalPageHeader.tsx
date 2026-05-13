import React, { useMemo } from "react";
import {
  Bell,
  CalendarDays,
  Search,
  Sparkles,
} from "lucide-react";

import { useAuth } from "../../../../context/AuthContext";


const OperationalPageHeader: React.FC = () => {
  const { user } = useAuth();

  const greeting = useMemo(() => {
    const hour = new Date().getHours();

    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";

    return "Good evening";
  }, []);

  const today = useMemo(() => {
    return new Intl.DateTimeFormat("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date());
  }, []);

  return (
    <header
      className="
        relative
        overflow-hidden
        rounded-[32px]
        app-surface
        edge-highlight
        p-5
        sm:p-6
        lg:p-8
      "
    >
      {/* Background Glow */}
      <div className="absolute inset-0 bg-radial-glow opacity-30 pointer-events-none" />

      {/* Decorative Gradient Orb */}
      <div
        className="
          absolute
          -top-16
          -right-16
          w-56
          h-56
          rounded-full
          blur-3xl
          opacity-20
        "
        style={{
          background: "var(--primary)",
        }}
      />

      <div
        className="
          relative
          z-10
          flex
          flex-col
          gap-6
          xl:flex-row
          xl:items-start
          xl:justify-between
        "
      >
        {/* ───────────────── LEFT SIDE ───────────────── */}

        <div className="min-w-0 space-y-5">
          {/* Greeting Row */}
          <div
            className="
              inline-flex
              items-center
              gap-2
              rounded-full
              border
              border-theme
              bg-[var(--card-bg-secondary)]
              px-3
              py-1.5
            "
          >
            <Sparkles
              size={14}
              className="text-primary shrink-0"
            />

            <span
              className="
                text-xs
                font-semibold
                tracking-wide
                text-muted
              "
            >
              {greeting}
            </span>
          </div>

          {/* Main Heading */}
          <div className="space-y-3">
            <div className="space-y-1">
              <h1
                className="
                  text-[28px]
                  sm:text-[34px]
                  lg:text-[40px]
                  font-bold
                  tracking-tight
                  leading-[1.05]
                  text-main
                "
              >
                Employee Dashboard
              </h1>

              <p
                className="
                  text-sm
                  sm:text-base
                  text-muted
                  leading-relaxed
                  max-w-2xl
                "
              >
                Monitor attendance, leave balances,
                announcements, and upcoming events in one
                operational workspace.
              </p>
            </div>

            {/* Metadata Row */}
            <div
              className="
                flex
                flex-wrap
                items-center
                gap-3
                pt-1
              "
            >
              {/* Employee Identity */}
              <div
                className="
                  flex
                  items-center
                  gap-2
                  rounded-2xl
                  border
                  border-theme
                  bg-[var(--card-bg-secondary)]
                  px-3
                  py-2
                "
              >
                <div
                  className="
                    flex
                    items-center
                    justify-center
                    w-8
                    h-8
                    rounded-xl
                    bg-primary
                    text-white
                    text-xs
                    font-bold
                    shrink-0
                  "
                >
                  {(user?.fullName ?? user?.username ?? "U")
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div className="min-w-0">
                  <p
                    className="
                      text-sm
                      font-semibold
                      text-main
                      truncate
                    "
                  >
                    {user?.fullName ?? user?.username}
                  </p>

                  <p
                    className="
                      text-[11px]
                      text-muted
                    "
                  >
                    Employee ID:{" "}
                    {user?.employeeId ?? "—"}
                  </p>
                </div>
              </div>

              {/* Date */}
              <div
                className="
                  flex
                  items-center
                  gap-2
                  rounded-2xl
                  border
                  border-theme
                  bg-[var(--card-bg-secondary)]
                  px-3
                  py-2
                "
              >
                <CalendarDays
                  size={15}
                  className="text-primary shrink-0"
                />

                <span
                  className="
                    text-xs
                    sm:text-sm
                    font-medium
                    text-muted
                  "
                >
                  {today}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ───────────────── RIGHT SIDE ───────────────── */}

        <div
          className="
            flex
            flex-col
            sm:flex-row
            items-stretch
            sm:items-center
            gap-3
            xl:justify-end
            shrink-0
          "
        >
          {/* Search Action */}
          <button
            className="
              interactive
              flex
              items-center
              justify-center
              gap-2
              h-12
              px-4
              rounded-2xl
              border
              border-theme
              bg-[var(--card-bg-secondary)]
              text-sm
              font-semibold
              text-main
              transition-all
              duration-200
              hover:bg-[var(--row-hover)]
            "
          >
            <Search size={16} />

            <span>Search</span>
          </button>

          {/* Notifications */}
          <button
            className="
              interactive
              relative
              flex
              items-center
              justify-center
              w-12
              h-12
              rounded-2xl
              border
              border-theme
              bg-[var(--card-bg-secondary)]
              text-main
              transition-all
              duration-200
              hover:bg-[var(--row-hover)]
            "
          >
            <Bell size={18} />

            {/* Notification Dot */}
            <span
              className="
                absolute
                top-2.5
                right-2.5
                w-2
                h-2
                rounded-full
                bg-danger
              "
            />
          </button>

          
        </div>
      </div>
    </header>
  );
};

export default OperationalPageHeader;