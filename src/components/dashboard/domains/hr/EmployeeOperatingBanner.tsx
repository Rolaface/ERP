import React, { useEffect, useMemo, useState } from "react";

import {
  Clock3,
  CheckCircle2,
  MapPin,
  LogOut,
  Timer,
  AlertTriangle,
  Activity,
  ShieldAlert,
} from "lucide-react";

import { useAuth } from "../../../../context/AuthContext";

import {
  getEmployeeByEmployeeId,
  postEmployeeAttendance,
} from "../../../../api/employeeAttendanceApi";

import { showApiError } from "../../../../utils/alert";

import { parseFrappeError } from "../../../../views/hr/tabs/leave-config/hooks/parseFrappeError";

import QuickActions from "./QuickActions";

interface AttendanceRecord {
  name?: string;

  log_type?: "IN" | "OUT";

  time?: string;

  employee?: string;
}

const EmployeeOperatingBanner: React.FC = () => {
  const { user } = useAuth();

  /**
   * FRONTEND STATE
   */
  const [
    attendanceRecords,
    setAttendanceRecords,
  ] = useState<
    AttendanceRecord[]
  >([]);

  const [loading, setLoading] =
    useState<boolean>(true);

  const [error, setError] =
    useState<string | null>(null);

  /**
   * Check-In / Check-Out Submission State
   */
  const [
    isSubmittingAttendance,
    setIsSubmittingAttendance,
  ] = useState<boolean>(false);

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
   * Component Mount
   */
  useEffect(() => {
    if (!user?.employeeId) return;

    loadAttendance();
  }, [user?.employeeId]);

  /**
   * Fetch Attendance Data
   */
  async function loadAttendance() {
    if (!user?.employeeId) return;

    try {
      setLoading(true);

      setError(null);

      const response =
        await getEmployeeByEmployeeId(
          user.employeeId
        );

      /**
       * Normalize ERP response
       */
      const rawRecords =
        response?.data?.data ||
        response?.data ||
        [];

      /**
       * Ensure chronological order
       */
      const sortedRecords = [
        ...rawRecords,
      ].sort(
        (a, b) =>
          new Date(
            a.time ?? ""
          ).getTime() -
          new Date(
            b.time ?? ""
          ).getTime()
      );

      setAttendanceRecords(
        sortedRecords
      );
    } catch (err) {
      console.error(
        "Failed to load attendance:",
        err
      );

      setError(
        "Unable to load attendance data"
      );
    } finally {
      setLoading(false);
    }
  }

  /**
   * Current timestamp formatter
   *
   * Frappe compatible:
   * YYYY-MM-DD HH:mm:ss
   */
  const getCurrentFormattedTime =
    () => {
      const now = new Date();

      const pad = (
        n: number
      ) =>
        n
          .toString()
          .padStart(2, "0");

      const YYYY =
        now.getFullYear();

      const MM = pad(
        now.getMonth() + 1
      );

      const DD = pad(
        now.getDate()
      );

      const HH = pad(
        now.getHours()
      );

      const mm = pad(
        now.getMinutes()
      );

      const ss = pad(
        now.getSeconds()
      );

      return `${YYYY}-${MM}-${DD} ${HH}:${mm}:${ss}`;
    };

  /**
   * DERIVED STATE
   */
  const latestAttendance =
    useMemo(() => {
      if (
        !attendanceRecords.length
      ) {
        return null;
      }

      return attendanceRecords[
        attendanceRecords.length -
        1
      ];
    }, [attendanceRecords]);

  const isCheckedIn =
    useMemo(() => {
      if (!latestAttendance) {
        return false;
      }

      return (
        latestAttendance.log_type ===
        "IN"
      );
    }, [latestAttendance]);

  /**
   * Attendance Status
   */
  const attendanceStatus =
    useMemo(() => {
      if (
        !latestAttendance &&
        !isCheckedIn
      ) {
        return "Offline";
      }

      return isCheckedIn
        ? "Checked In"
        : "Checked Out";
    }, [
      latestAttendance,
      isCheckedIn,
    ]);

  /**
   * Today's Logs
   */
  const todayLogs = useMemo(() => {
    const today =
      new Date().toDateString();

    return attendanceRecords.filter(
      (record) =>
        record.time &&
        new Date(
          record.time
        ).toDateString() ===
        today
    );
  }, [attendanceRecords]);

  /**
   * Today's First Check-In Time
   */
  const checkedInTime =
    useMemo(() => {
      const firstCheckIn =
        todayLogs.find(
          (record) =>
            record.log_type ===
            "IN"
        );

      if (!firstCheckIn?.time) {
        return "--";
      }

      return new Date(
        firstCheckIn.time
      ).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }, [todayLogs]);

  /**
   * Latest Check-Out Time
   */
  const checkedOutTime =
    useMemo(() => {
      const todayCheckOuts =
        todayLogs.filter(
          (record) =>
            record.log_type ===
            "OUT"
        );

      if (
        !todayCheckOuts.length
      ) {
        return "--";
      }

      const latestCheckOut =
        todayCheckOuts[
        todayCheckOuts.length -
        1
        ];

      return new Date(
        latestCheckOut.time!
      ).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }, [todayLogs]);

  /**
   * Active Session Duration
   */
  const activeSession =
    useMemo(() => {
      if (
        !latestAttendance?.time
      ) {
        return "0h 0m";
      }

      if (
        latestAttendance.log_type !==
        "IN"
      ) {
        return "Session Ended";
      }

      const checkInTime =
        new Date(
          latestAttendance.time
        ).getTime();

      const currentTime =
        Date.now();

      const diffMs =
        currentTime -
        checkInTime;

      const hours = Math.floor(
        diffMs /
        (1000 * 60 * 60)
      );

      const minutes =
        Math.floor(
          (diffMs %
            (1000 *
              60 *
              60)) /
          (1000 * 60)
        );

      return `${hours}h ${minutes}m`;
    }, [latestAttendance]);

  /**
   * WORKED TODAY
   */
  const workedToday =
    useMemo(() => {
      if (!todayLogs.length) {
        return "0h 0m";
      }

      let totalMs = 0;

      let currentIn:
        | AttendanceRecord
        | null = null;

      todayLogs.forEach((log) => {
        if (
          log.log_type === "IN"
        ) {
          currentIn = log;
        }

        if (
          log.log_type ===
          "OUT" &&
          currentIn?.time &&
          log.time
        ) {
          totalMs +=
            new Date(
              log.time
            ).getTime() -
            new Date(
              currentIn.time
            ).getTime();

          currentIn = null;
        }
      });

      /**
       * Active session
       */
      if (
        currentIn?.time &&
        latestAttendance?.log_type ===
        "IN"
      ) {
        totalMs +=
          Date.now() -
          new Date(
            currentIn.time
          ).getTime();
      }

      const hours = Math.floor(
        totalMs /
        (1000 * 60 * 60)
      );

      const minutes =
        Math.floor(
          (totalMs %
            (1000 *
              60 *
              60)) /
          (1000 * 60)
        );

      return `${hours}h ${minutes}m`;
    }, [
      todayLogs,
      latestAttendance,
    ]);

  /**
   * LAST ACTIVITY
   */
  const lastActivity =
    useMemo(() => {
      if (
        !latestAttendance?.time
      ) {
        return "No activity";
      }

      const action =
        latestAttendance.log_type ===
          "IN"
          ? "Checked In"
          : "Checked Out";

      const formattedTime =
        new Date(
          latestAttendance.time
        ).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });

      return `${action} • ${formattedTime}`;
    }, [latestAttendance]);

  /**
   * ATTENDANCE WARNING SYSTEM
   */
  const attendanceWarning =
    useMemo(() => {
      const now = new Date();

      /**
       * No attendance by noon
       */
      if (
        !todayLogs.length &&
        now.getHours() >= 12
      ) {
        return {
          label:
            "No attendance marked today",
          tone: "danger",
        };
      }

      /**
       * Late arrival
       */
      if (
        checkedInTime !== "--"
      ) {
        const firstIn =
          todayLogs.find(
            (r) =>
              r.log_type ===
              "IN"
          );

        if (firstIn?.time) {
          const firstHour =
            new Date(
              firstIn.time
            ).getHours();

          const firstMinute =
            new Date(
              firstIn.time
            ).getMinutes();

          /**
           * After 10:30 AM
           */
          if (
            firstHour > 10 ||
            (firstHour ===
              10 &&
              firstMinute > 30)
          ) {
            return {
              label:
                "Late check-in detected",
              tone: "warning",
            };
          }
        }
      }

      /**
       * Long active session
       */
      if (
        latestAttendance?.log_type ===
        "IN" &&
        latestAttendance.time
      ) {
        const sessionMs =
          Date.now() -
          new Date(
            latestAttendance.time
          ).getTime();

        const sessionHours =
          sessionMs /
          (1000 * 60 * 60);

        if (
          sessionHours >= 10
        ) {
          return {
            label:
              "Long running work session",
            tone: "danger",
          };
        }
      }

      return {
        label:
          "Attendance healthy",
        tone: "success",
      };
    }, [
      todayLogs,
      latestAttendance,
      checkedInTime,
    ]);

  /**
   * Shift Progress
   */
  const shiftProgress =
    useMemo(() => {
      const shiftStart = 10;

      const shiftEnd = 19;

      const now = new Date();

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
    }, []);

  /**
   * Check-In / Check-Out Handler
   */
  const handleCheckInOut =
    async () => {
      if (
        !user ||
        isSubmittingAttendance
      ) {
        return;
      }

      try {
        setIsSubmittingAttendance(
          true
        );

        /**
         * Backend-derived truth
         */
        const nextLogType =
          isCheckedIn
            ? "OUT"
            : "IN";

        const payload = {
          docstatus: 0,

          doctype:
            "Employee Checkin",

          owner: user.email,

          log_type:
            nextLogType,

          time:
            getCurrentFormattedTime(),

          employee_name:
            user.fullName,

          employee:
            user.employeeId,
        };

        /**
         * Persist attendance
         */
        await postEmployeeAttendance(
          payload
        );

        /**
         * Reload backend truth
         */
        await loadAttendance();
      } catch (error) {
        console.error(
          "Attendance submission failed:",
          error
        );

        showApiError(
          parseFrappeError(
            error
          ) ||
          "Failed to update attendance."
        );
      } finally {
        setIsSubmittingAttendance(
          false
        );
      }
    };

  /**
   * UI Projection State
   */
  const operationalItems = [
    {
      icon: CheckCircle2,

      label:
        attendanceStatus,

      value: isCheckedIn
        ? checkedInTime
        : checkedOutTime,

      tone:
        attendanceStatus ===
          "Checked In"
          ? "success"
          : "warning",
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
          {/* ───────────────────────────────────────────── */}
          {/* LEFT SECTION */}
          {/* ───────────────────────────────────────────── */}
          <div className="min-w-0 flex-1">
            {/* TOP ROW */}
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
              {/* USER INFO */}
              <div className="flex min-w-0 items-start gap-4">
                {/* Avatar */}
                <div className="relative shrink-0">
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
                    text-lg
                    font-semibold
                    text-[var(--foreground)]
                    shadow-sm
                  "
                  >
                    {user?.fullName?.charAt(
                      0
                    ) ??
                      user?.username?.charAt(
                        0
                      ) ??
                      "U"}
                  </div>

                  {/* Presence Dot */}
                  <div
                    className={`
                    absolute
                    -bottom-1
                    -right-1
                    h-4
                    w-4
                    rounded-full
                    border-2
                    border-[var(--card)]

                    ${attendanceStatus ===
                        "Checked In"
                        ? "bg-emerald-500"
                        : "bg-amber-500"
                      }
                  `}
                  />
                </div>

                {/* Identity */}
                <div className="min-w-0 space-y-2">
                  {/* Status Row */}
                  <div className="flex flex-wrap items-center gap-2">
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
                      font-semibold

                      ${attendanceStatus ===
                          "Checked In"
                          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600"
                          : "border-amber-500/20 bg-amber-500/10 text-amber-600"
                        }
                    `}
                    >
                      <span
                        className={`
                        h-2
                        w-2
                        rounded-full

                        ${attendanceStatus ===
                            "Checked In"
                            ? "bg-emerald-500"
                            : "bg-amber-500"
                          }
                      `}
                      />

                      <span>
                        {attendanceStatus}
                      </span>
                    </div>

                    {/* Attendance Warning */}
                    {!loading &&
                      !error && (
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

                          ${toneStyles[
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
                      )}
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
                      {user?.fullName ??
                        user?.username ??
                        "Employee"}
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
                  </div>
                </div>
              </div>

              {/* PRIMARY ACTION */}
              <div className="shrink-0">
                <button
                  onClick={
                    handleCheckInOut
                  }
                  disabled={
                    isSubmittingAttendance
                  }
                  className={`
                  inline-flex
                  h-11
                  items-center
                  justify-center
                  gap-2
                  rounded-2xl
                  px-5
                  text-sm
                  font-semibold
                  text-white
                  shadow-sm
                  transition-all

                  ${isCheckedIn
                      ? "bg-orange-500 hover:bg-orange-600"
                      : "bg-[var(--primary)] hover:opacity-90"
                    }

                  ${isSubmittingAttendance
                      ? "cursor-not-allowed opacity-70"
                      : ""
                    }
                `}
                >
                  {isCheckedIn ? (
                    <LogOut className="h-4 w-4" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}

                  <span>
                    {isSubmittingAttendance
                      ? "Processing..."
                      : isCheckedIn
                        ? "Check Out"
                        : "Check In"}
                  </span>
                </button>
              </div>
            </div>

            {/* LOADING */}
            {loading && (
              <div
                className="
                mt-4
                rounded-2xl
                border
                border-[var(--border)]
                bg-[var(--background)]
                px-4
                py-3
                text-sm
                text-[var(--muted-foreground)]
              "
              >
                Loading attendance session...
              </div>
            )}

            {/* ERROR */}
            {error && (
              <div
                className="
                mt-4
                rounded-2xl
                border
                border-red-500/20
                bg-red-500/10
                px-4
                py-3
                text-sm
                text-red-600
              "
              >
                {error}
              </div>
            )}

            {/* METRICS */}
            {!loading && !error && (
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

                        ${toneStyles[
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
            )}
          </div>

          {/* ───────────────────────────────────────────── */}
          {/* RIGHT SECTION → QUICK ACTIONS */}
          {/* ───────────────────────────────────────────── */}
          <div
            className="
            w-full
            2xl:w-[360px]
            shrink-0
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