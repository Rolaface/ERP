import React, { useEffect, useMemo, useState } from "react";

import {
  Clock3,
  CheckCircle2,
  MapPin,
  Timer,
  AlertTriangle,
  Activity,
  ShieldAlert,
} from "lucide-react";

import { useAuth } from "../../../../context/AuthContext";

import QuickActions from "./QuickActions";

/* ── TYPES ─────────────────────────────────────────────────────── */

interface EmployeeDetails {
  employeeId: string;

  employeeNumber: string;

  firstName: string;

  middleName: string;

  lastName: string;

  employeeName: string;

  profilePhoto: string;

  dateOfJoining: string;
}

interface EmployeeOperatingBannerProps {
  employeeDetails: EmployeeDetails;
}

const EmployeeOperatingBanner: React.FC<
  EmployeeOperatingBannerProps
> = ({ employeeDetails }) => {
  const { user } = useAuth();

  /**
   * LIVE SESSION CLOCK
   *
   * Still useful for dynamic UI
   * calculations like shift progress.
   */
  const [liveNow, setLiveNow] =
    useState<number>(Date.now());

  /**
   * Greeting Logic
   */
  const greeting = useMemo(() => {
    const hour =
      new Date().getHours();

    if (hour < 12)
      return "Good morning";

    if (hour < 17)
      return "Good afternoon";

    return "Good evening";
  }, []);

  /**
   * Live Clock Refresh
   */
  useEffect(() => {
    const interval =
      setInterval(() => {
        setLiveNow(Date.now());
      }, 60000);

    return () =>
      clearInterval(interval);
  }, []);

  /**
   * STATIC PLACEHOLDER STATE
   *
   * Previous attendance APIs removed.
   * This component now becomes
   * presentation-focused.
   */
  const attendanceStatus =
    "Checked In";

  const checkedInTime =
    "10:00 AM";

  const activeSession =
    "2h 45m";

  const workedToday =
    "5h 20m";

  const lastActivity =
    "Checked In • 10:00 AM";

  const attendanceWarning = {
    label: "Attendance healthy",

    tone: "success",
  };

  /**
   * Shift Progress
   */
  const shiftProgress =
    useMemo(() => {
      const shiftStart = 10;

      const shiftEnd = 19;

      const now = new Date(
        liveNow
      );

      const currentHour =
        now.getHours();

      const totalShiftHours =
        shiftEnd - shiftStart;

      const completedHours =
        Math.max(
          0,
          currentHour -
            shiftStart
        );

      const progress =
        Math.min(
          100,
          Math.floor(
            (completedHours /
              totalShiftHours) *
              100
          )
        );

      return `${progress}%`;
    }, [liveNow]);

  /**
   * UI PROJECTION
   */
  const operationalItems = [
    {
      icon: CheckCircle2,

      label:
        attendanceStatus,

      value: checkedInTime,

      tone: "success",
    },

    {
      icon: Timer,

      label:
        "Active Session",

      value: activeSession,

      tone: "neutral",
    },

    {
      icon: Activity,

      label:
        "Worked Today",

      value: workedToday,

      tone: "success",
    },

    {
      icon: Clock3,

      label:
        "Last Activity",

      value: lastActivity,

      tone: "neutral",
    },

    {
      icon: MapPin,

      label: "Location",

      value:
        user?.company ??
        "Office",

      tone: "neutral",
    },

    {
      icon: Clock3,

      label:
        "Shift Progress",

      value:
        shiftProgress,

      tone: "warning",
    },
  ];

  const toneStyles: Record<
    string,
    string
  > = {
    success:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-600",

    warning:
      "border-amber-500/20 bg-amber-500/10 text-amber-600",

    neutral:
      "border-blue-500/20 bg-blue-500/10 text-blue-600",

    danger:
      "border-red-500/20 bg-red-500/10 text-red-600",
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
      px-5
      py-4
      shadow-sm
    "
    >
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

      <div className="relative z-10">
        <div
          className="
          flex
          flex-col
          gap-4
          2xl:flex-row
          2xl:items-center
          2xl:justify-between
        "
        >
          <div className="min-w-0 flex-1">
            <div
              className="
              flex
              flex-col
              gap-4
              lg:flex-row
              lg:items-start
              lg:justify-between
            "
            >
              <div className="flex min-w-0 items-start gap-4">
                {/* Avatar */}
                <div
                  className="
                  flex
                  h-14
                  w-14
                  items-center
                  justify-center
                  overflow-hidden
                  rounded-2xl
                  border
                  border-[var(--border)]
                  bg-[var(--background)]
                  shadow-sm
                "
                >
                  {employeeDetails.profilePhoto ? (
                    <img
                      src={`http://mysite.local:8000${employeeDetails.profilePhoto}`}
                      alt={
                        employeeDetails.employeeName
                      }
                      className="
                        h-full
                        w-full
                        object-cover
                      "
                    />
                  ) : (
                    <span
                      className="
                        text-lg
                        font-semibold
                        text-[var(--foreground)]
                      "
                    >
                      {employeeDetails.employeeName?.charAt(
                        0
                      ) ?? "E"}
                    </span>
                  )}
                </div>

                {/* Identity */}
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
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
                      text-[11px]
                      font-semibold
                      text-emerald-600
                    "
                    >
                      <span
                        className="
                        h-2
                        w-2
                        rounded-full
                        bg-emerald-500
                      "
                      />

                      <span>
                        {
                          attendanceStatus
                        }
                      </span>
                    </div>

                    <div
                      className={`
                        inline-flex
                        items-center
                        gap-2
                        rounded-full
                        border
                        px-2.5
                        py-1
                        text-[11px]
                        font-medium

                        ${
                          toneStyles[
                            attendanceWarning
                              .tone
                          ]
                        }
                      `}
                    >
                      {attendanceWarning.tone ===
                      "success" ? (
                        <ShieldAlert className="h-3.5 w-3.5" />
                      ) : (
                        <AlertTriangle className="h-3.5 w-3.5" />
                      )}

                      <span>
                        {
                          attendanceWarning.label
                        }
                      </span>
                    </div>
                  </div>

                  {/* Greeting */}
                  <div className="space-y-0.5">
                    <p
                      className="
                      text-xs
                      font-medium
                      text-[var(--muted-foreground)]
                    "
                    >
                      {greeting}
                    </p>

                    <h1
                      className="
                      truncate
                      text-2xl
                      font-bold
                      tracking-tight
                      text-[var(--foreground)]
                    "
                    >
                      {
                        employeeDetails.employeeName
                      }
                    </h1>
                  </div>

                  {/* Metadata */}
                  <div
                    className="
                    flex
                    flex-wrap
                    items-center
                    gap-2
                    text-xs
                    text-[var(--muted-foreground)]
                  "
                  >
                    <span>
                      {user?.roleProfile ??
                        "Employee"}
                    </span>

                    <span className="opacity-40">
                      •
                    </span>

                    <span>
                      {user?.company ??
                        "Organization"}
                    </span>

                    <span className="opacity-40">
                      •
                    </span>

                    <span>
                      Joined{" "}
                      {new Date(
                        employeeDetails.dateOfJoining
                      ).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* METRICS */}
            <div
              className="
              mt-4
              flex
              flex-wrap
              gap-2
            "
            >
              {operationalItems.map(
                (item) => {
                  const Icon =
                    item.icon;

                  return (
                    <div
                      key={item.label}
                      className={`
                        inline-flex
                        items-center
                        gap-2
                        rounded-2xl
                        border
                        px-3
                        py-2
                        text-xs
                        transition-all

                        ${
                          toneStyles[
                            item.tone
                          ]
                        }
                      `}
                    >
                      <Icon className="h-3.5 w-3.5" />

                      <span className="font-medium opacity-80">
                        {
                          item.label
                        }
                      </span>

                      <span className="font-semibold">
                        {
                          item.value
                        }
                      </span>
                    </div>
                  );
                }
              )}
            </div>
          </div>

          {/* RIGHT SECTION */}
          <div
            className="
            w-full
            shrink-0
            2xl:w-[360px]
          "
          >
            <QuickActions compact />
          </div>
        </div>
      </div>
    </section>
  );
};

export default EmployeeOperatingBanner;