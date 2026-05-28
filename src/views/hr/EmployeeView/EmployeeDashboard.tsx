import React, { useState, useEffect } from "react";
import {
  getEmployeeDashboardSummary,
  EmployeeDashboardData,
} from "../../../api/dashboard/EmployeeDashboardApi";

import { useAuth } from "../../../context/AuthContext";
import QuickActions from "../../../components/dashboard/domains/hr/QuickActions";



import {
  Clock,
  LogIn,
  LogOut,
  CalendarDays,
  Briefcase,
  CheckCircle2,
  Umbrella,
  IndianRupee,
  Wallet,
  Receipt,
  ArrowRight,
  Sparkles,
  Gift,
  Trophy,
  ChevronRight,
} from "lucide-react";

function formatTime(dt: string | null): string {
  if (!dt) return "—";

  const d = new Date(dt.replace(" ", "T"));

  return d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(d: string | null): string {
  if (!d) return "—";

  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function workingMinutes(
  inTime: string | null,
  outTime: string | null
): number {
  if (!inTime || !outTime) return 0;

  const diff =
    new Date(outTime.replace(" ", "T")).getTime() -
    new Date(inTime.replace(" ", "T")).getTime();

  return Math.max(0, Math.floor(diff / 60000));
}

function formatDuration(mins: number): string {
  if (mins === 0) return "—";

  const h = Math.floor(mins / 60);
  const m = mins % 60;

  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function initials(name?: string | null): string {
  if (!name || typeof name !== "string") return "?";

  return name
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");
}

function getGreeting(): string {
  const hour = new Date().getHours();

  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";

  return "Good Evening";
}



// ── MOCK DATA (UI ONLY) ─────────────────────────────────────────────

const appraisalSteps = [
  {
    label: "Self Review",
    date: "12 Jun",
    status: "completed",
  },
  {
    label: "Manager Review",
    date: "18 Jun",
    status: "active",
  },
  {
    label: "HR Review",
    date: "24 Jun",
    status: "pending",
  },
  {
    label: "Final Rating",
    date: "30 Jun",
    status: "pending",
  },
];

const upcomingHolidays = [
  {
    name: "Independence Day",
    date: "15 Aug",
    day: "Friday",
    countdown: "In 8 days",
  },
  {
    name: "Raksha Bandhan",
    date: "19 Aug",
    day: "Tuesday",
    countdown: "In 12 days",
  },
  {
    name: "Janmashtami",
    date: "26 Aug",
    day: "Tuesday",
    countdown: "In 19 days",
  },
];

const upcomingBirthdays = [
  {
    name: "Ankit Kumar",
    when: "Tomorrow",
  },
  {
    name: "Riya Sharma",
    when: "In 3 days",
  },
  {
    name: "Neha Verma",
    when: "In 6 days",
  },
];

// ── SKELETON ────────────────────────────────────────────────────────

const Skeleton: React.FC<{ className?: string }> = ({

  className = "",
}) => (
  <div
    className={`animate-pulse rounded-lg bg-[var(--muted)]/40 ${className}`}
  />
);

// ── MAIN COMPONENT ─────────────────────────────────────────────────

const EmployeeDashboard: React.FC = () => {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);

  const [dashboardData, setDashboardData] =
    useState<EmployeeDashboardData | null>(null);

  useEffect(() => {
    const employeeId = user?.employeeId;

    if (!employeeId) return;

    let mounted = true;

    const fetchDashboard = async () => {
      setLoading(true);

      try {
        const data = await getEmployeeDashboardSummary(employeeId);

        if (mounted) setDashboardData(data);
      } catch (e) {
        console.error("Error fetching employee dashboard:", e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchDashboard();

    return () => {
      mounted = false;
    };
  }, [user?.employeeId]);

  const emp = dashboardData?.employeeDetails ?? null;
  const leave = dashboardData?.leaveBalance ?? null;
  const checkins = dashboardData?.checkins ?? null;

  const mins = workingMinutes(
    checkins?.inTime ?? null,
    checkins?.outTime ?? null
  );

  const leavePercent =
    leave && leave.totalAllocated > 0
      ? Math.round(
        (leave.totalRemaining / leave.totalAllocated) * 100
      )
      : 0;

  return (
    <div className="h-full overflow-y-auto bg-[var(--background)]">
      <div className="mx-auto max-w-7xl space-y-5 px-5 py-5">

        {/* ── HERO BANNER ───────────────────────────────────── */}
        <div
          className="
            relative overflow-hidden rounded-3xl
            bg-[var(--primary)] text-white
            px-6 py-5
          "
        >
          <span className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/5" />
          <span className="pointer-events-none absolute bottom-0 right-24 h-32 w-32 rounded-full bg-white/5" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

            <div className="flex items-center gap-4">

              {/* Avatar */}
              <div
                className="
                  flex h-16 w-16 shrink-0 items-center justify-center
                  rounded-2xl bg-white/15
                  text-xl font-bold tracking-tight
                "
              >
                {loading ? (
                  <Skeleton className="h-16 w-16 rounded-2xl" />
                ) : (
                  initials(emp?.employeeName ?? "?")
                )}
              </div>

              {/* Content */}
              <div className="min-w-0">
                {loading ? (
                  <>
                    <Skeleton className="mb-2 h-5 w-40" />
                    <Skeleton className="h-4 w-60" />
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <h2 className="truncate text-2xl font-semibold">
                        {getGreeting()},{" "}
                        {emp?.employeeName?.split(" ")[0] ?? "Employee"} 👋
                      </h2>
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/75">
                      <span className="flex items-center gap-1">
                        <Briefcase size={13} />
                        {emp?.designation || "Software Engineer"}
                      </span>

                      <span className="flex items-center gap-1">
                        <Sparkles size={13} />
                        {emp?.employeeId ?? "—"}
                      </span>

                      <span className="flex items-center gap-1">
                        <CalendarDays size={13} />
                        Joined{" "}
                        {formatDate(
                          emp?.dateOfJoining ?? null
                        )}
                      </span>
                    </div>

                    <div
                      className="
                        mt-3 inline-flex items-center gap-2
                        rounded-full border border-white/10
                        bg-white/10 px-3 py-1
                        text-xs font-medium text-white/90
                      "
                    >
                      <CheckCircle2 size={12} />
                      Attendance streak: 12 days
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Today */}
            <div
              className="
                flex flex-col rounded-2xl
                border border-white/10 bg-white/10
                px-4 py-3 backdrop-blur-sm
              "
            >
              <span className="text-xs uppercase tracking-widest text-white/60">
                Today
              </span>

              <span className="mt-1 text-sm font-semibold text-white">
                {formatDate(checkins?.asofDate ?? null)}
              </span>

              <span className="mt-2 text-xs text-white/70">
                Shift: 09:30 AM - 06:30 PM
              </span>
            </div>
          </div>
        </div>

        {/* ── MAIN GRID ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">

          {/* LEFT SIDE */}
          <div className="flex flex-col gap-5 xl:col-span-2">

            {/* ATTENDANCE CARD */}
            <div
              className="
                rounded-3xl border border-[var(--border)]
                bg-[var(--card)] p-4
              "
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold tracking-tight text-[var(--foreground)]">
                  Today's Attendance
                </h3>

                {!loading && (
                  <span
                    className={`
                      inline-flex items-center gap-1 rounded-full px-3 py-1
                      text-xs font-medium
                      ${checkins?.inTime
                        ? "bg-emerald-500/10 text-emerald-600"
                        : "bg-amber-500/10 text-amber-600"
                      }
                    `}
                  >
                    <CheckCircle2 size={11} />

                    {checkins?.inTime
                      ? "Checked In"
                      : "Not Checked In"}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {(
                  [
                    {
                      icon: LogIn,
                      label: "Check In",
                      value: formatTime(
                        checkins?.inTime ?? null
                      ),
                      color: "text-emerald-600",
                      bg:
                        "bg-emerald-500/5 border-emerald-500/10",
                    },
                    {
                      icon: LogOut,
                      label: "Check Out",
                      value: formatTime(
                        checkins?.outTime ?? null
                      ),
                      color: "text-rose-500",
                      bg: "bg-rose-500/5 border-rose-500/10",
                    },
                    {
                      icon: Clock,
                      label: "Working Hours",
                      value: formatDuration(mins),
                      color: "text-[var(--primary)]",
                      bg:
                        "bg-[var(--primary)]/5 border-[var(--primary)]/10",
                    },
                  ] as const
                ).map(
                  ({
                    icon: Icon,
                    label,
                    value,
                    color,
                    bg,
                  }) => (
                    <div
                      key={label}
                      className={`
                        rounded-2xl border p-4
                        ${bg}
                      `}
                    >
                      {loading ? (
                        <Skeleton className="h-16 w-full" />
                      ) : (
                        <div className="flex flex-col gap-2">
                          <Icon size={18} className={color} />

                          <div>
                            <p
                              className={`text-lg font-bold ${color}`}
                            >
                              {value}
                            </p>

                            <p className="text-xs text-[var(--muted-foreground)]">
                              {label}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                )}
              </div>

              {!loading && (
                <div
                  className="
                    mt-4 flex items-center justify-between
                    rounded-2xl border border-[var(--border)]
                    bg-[var(--background)] px-4 py-3
                  "
                >
                  <div>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Today's Progress
                    </p>

                    <p className="mt-1 text-sm font-medium text-[var(--foreground)]">
                      {Math.min(
                        100,
                        Math.round((mins / 540) * 100)
                      )}
                      % of shift completed
                    </p>
                  </div>

                  <div className="w-32 overflow-hidden rounded-full bg-[var(--muted)]/30">
                    <div
                      className="h-2 rounded-full bg-[var(--primary)] transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round((mins / 540) * 100)
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* LEAVE BALANCE */}
            <div
              className="
                rounded-3xl border border-[var(--border)]
                bg-[var(--card)] p-4
              "
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold tracking-tight text-[var(--foreground)]">
                  Leave Balance
                </h3>

                {!loading && leave && (
                  <span className="text-xs text-[var(--muted-foreground)]">
                    As of {formatDate(leave.asOfDate)}
                  </span>
                )}
              </div>

              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-5 w-1/2" />
                </div>
              ) : (
                <>
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    {(
                      [
                        {
                          label: "Allocated",
                          value:
                            leave?.totalAllocated ?? 0,
                          color:
                            "text-[var(--primary)]",
                        },
                        {
                          label: "Used",
                          value: leave?.totalUsed ?? 0,
                          color: "text-rose-500",
                        },
                        {
                          label: "Remaining",
                          value:
                            leave?.totalRemaining ?? 0,
                          color: "text-emerald-600",
                        },
                      ] as const
                    ).map(({ label, value, color }) => (
                      <div
                        key={label}
                        className="
                          rounded-2xl border border-[var(--border)]
                          bg-[var(--background)]
                          p-3 text-center
                        "
                      >
                        <p
                          className={`text-2xl font-bold ${color}`}
                        >
                          {value}
                        </p>

                        <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">
                          {label}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Leave Types */}
                  {leave &&
                    leave.leaveTypes.length > 0 && (
                      <div className="mt-4 space-y-3">
                        {leave.leaveTypes.map((lt) => {
                          const progress =
                            lt.allocated > 0
                              ? Math.min(
                                100,
                                Math.round(
                                  (lt.used /
                                    lt.allocated) *
                                  100
                                )
                              )
                              : 0;

                          return (
                            <div
                              key={lt.leaveType}
                              className="
                                rounded-2xl border border-[var(--border)]
                                bg-[var(--background)]
                                p-3
                              "
                            >
                              <div className="mb-2 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Umbrella
                                    size={14}
                                    className="text-[var(--primary)]"
                                  />

                                  <span className="text-sm font-medium capitalize text-[var(--foreground)]">
                                    {lt.leaveType}
                                  </span>
                                </div>

                                <span className="text-xs text-[var(--muted-foreground)]">
                                  {lt.used} / {lt.allocated}
                                </span>
                              </div>

                              <div className="h-2 overflow-hidden rounded-full bg-[var(--muted)]/30">
                                <div
                                  className="h-full rounded-full bg-[var(--primary)] transition-all duration-500"
                                  style={{
                                    width: `${progress}%`,
                                  }}
                                />
                              </div>

                              <div className="mt-2 flex justify-end">
                                <span className="text-xs font-medium text-emerald-600">
                                  {lt.remaining} left
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                </>
              )}
            </div>

            {/* SALARY SUMMARY */}

            <div
              className="
    relative overflow-hidden rounded-3xl
    bg-[var(--primary)] text-white
    p-4
  "
            >
              {/* decorative circles */}
              <span className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5" />
              <span className="pointer-events-none absolute bottom-0 right-20 h-28 w-28 rounded-full bg-white/5" />

              <div className="relative">

                {/* Header */}
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold tracking-tight text-white">
                      Salary Summary
                    </h3>

                    <p className="mt-1 text-xs text-white/70">
                      Latest payroll overview
                    </p>
                  </div>

                  <div
                    className="
          flex h-10 w-10 items-center justify-center
          rounded-2xl bg-white/10
          text-white
        "
                  >
                    <Wallet size={18} />
                  </div>
                </div>

                {/* Salary Cards */}
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">

                  {[
                    {
                      icon: IndianRupee,
                      label: "Net Salary",
                      value: "₹82,500",
                    },
                    {
                      icon: CalendarDays,
                      label: "Last Credit",
                      value: "28 May",
                    },
                    {
                      icon: Receipt,
                      label: "Payslips",
                      value: "12 Available",
                    },
                  ].map(({ icon: Icon, label, value }) => (
                    <div
                      key={label}
                      className="
            rounded-2xl border border-white/10
            bg-white/10 p-4
            backdrop-blur-sm
          "
                    >
                      <Icon
                        size={18}
                        className="text-white/90"
                      />

                      <p className="mt-3 text-lg font-bold text-white">
                        {value}
                      </p>

                      <p className="mt-1 text-xs text-white/70">
                        {label}
                      </p>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <button
                  onClick={() => navigate("hr/emp-financials")}
                  className="
        mt-4 inline-flex items-center gap-2
        rounded-xl border border-white/10
        bg-white/10
        px-4 py-2
        text-sm font-medium text-white
        transition-all duration-200
        hover:bg-white/15
      "
                >
                  View Payslip
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="xl:col-span-1">
            <div className="space-y-5 xl:sticky xl:top-4">

              <QuickActions />

              {/* REPORTING INFO */}
              {!loading && emp && (
                <div
                  className="
                    rounded-3xl border border-[var(--border)]
                    bg-[var(--card)] p-4
                  "
                >
                  <h4 className="mb-4 text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">
                    Reporting Info
                  </h4>

                  <div className="flex items-center gap-3">
                    <div
                      className="
                        flex h-11 w-11 shrink-0 items-center justify-center
                        rounded-2xl bg-[var(--primary)]/10
                        text-xs font-bold text-[var(--primary)]
                      "
                    >
                      {initials(emp.leaveApproverName)}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[var(--foreground)]">
                        {emp.leaveApproverName}
                      </p>

                      <p className="text-xs text-[var(--muted-foreground)]">
                        Leave Approver
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* UPCOMING HOLIDAYS */}
              <div
                className="
                  rounded-3xl border border-[var(--border)]
                  bg-[var(--card)] p-4
                "
              >
                <div className="mb-4 flex items-center gap-2">
                  <Gift
                    size={16}
                    className="text-[var(--primary)]"
                  />

                  <h3 className="text-sm font-semibold text-[var(--foreground)]">
                    Upcoming Holidays
                  </h3>
                </div>

                <div className="space-y-3">
                  {upcomingHolidays.map((holiday) => (
                    <div
                      key={holiday.name}
                      className="
                        rounded-2xl border border-[var(--border)]
                        bg-[var(--background)]
                        p-3
                      "
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-[var(--foreground)]">
                            {holiday.name}
                          </p>

                          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                            {holiday.date} • {holiday.day}
                          </p>
                        </div>

                        <span
                          className="
                            rounded-full bg-[var(--primary)]/10
                            px-2 py-1 text-[10px]
                            font-medium text-[var(--primary)]
                          "
                        >
                          {holiday.countdown}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── APPRAISAL CYCLE ─────────────────────────────── */}
        <div
          className="
            rounded-3xl border border-[var(--border)]
            bg-[var(--card)] p-5
          "
        >
          <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

            <div>
              <div className="flex items-center gap-2">
                <Trophy
                  size={18}
                  className="text-[var(--primary)]"
                />

                <h3 className="text-lg font-semibold text-[var(--foreground)]">
                  Appraisal Cycle
                </h3>
              </div>

              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                FY 2025-26 • Q2 Performance Review
              </p>
            </div>

            <div
              className="
                inline-flex items-center gap-2
                rounded-full bg-[var(--primary)]/10
                px-3 py-1.5
                text-xs font-medium text-[var(--primary)]
              "
            >
              <Sparkles size={12} />
              Manager Review In Progress
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">

            {appraisalSteps.map((step, index) => {
              const isCompleted =
                step.status === "completed";

              const isActive = step.status === "active";

              return (
                <div
                  key={step.label}
                  className="
                    relative overflow-hidden
                    rounded-2xl border
                    p-4
                  "
                >
                  <div
                    className={`
                      absolute inset-0 opacity-40
                      ${isActive
                        ? "bg-[var(--primary)]/5"
                        : ""
                      }
                    `}
                  />

                  <div className="relative">
                    <div className="flex items-center justify-between">

                      <div
                        className={`
                          flex h-9 w-9 items-center justify-center
                          rounded-full border text-sm font-bold
                          ${isCompleted
                            ? "border-emerald-500 bg-emerald-500 text-white"
                            : isActive
                              ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                              : "border-[var(--border)] bg-[var(--background)] text-[var(--muted-foreground)]"
                          }
                        `}
                      >
                        {isCompleted ? "✓" : index + 1}
                      </div>

                      {isActive && (
                        <span
                          className="
                            rounded-full bg-[var(--primary)]/10
                            px-2 py-1 text-[10px]
                            font-medium text-[var(--primary)]
                          "
                        >
                          ACTIVE
                        </span>
                      )}
                    </div>

                    <div className="mt-5">
                      <p className="text-sm font-semibold text-[var(--foreground)]">
                        {step.label}
                      </p>

                      <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                        Due on {step.date}
                      </p>
                    </div>

                    {index !== appraisalSteps.length - 1 && (
                      <div
                        className="
                          absolute right-[-28px] top-4 hidden
                          xl:flex
                        "
                      >
                        <ChevronRight
                          size={20}
                          className="text-[var(--border)]"
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── BOTTOM GRID ─────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

          {/* UPCOMING BIRTHDAYS */}
          <div
            className="
              rounded-3xl border border-[var(--border)]
              bg-[var(--card)] p-4
            "
          >
            <div className="mb-4 flex items-center gap-2">
              <Gift
                size={16}
                className="text-pink-500"
              />

              <h3 className="text-sm font-semibold text-[var(--foreground)]">
                Upcoming Birthdays
              </h3>
            </div>

            <div className="space-y-3">
              {upcomingBirthdays.map((person) => (
                <div
                  key={person.name}
                  className="
                    flex items-center justify-between
                    rounded-2xl border border-[var(--border)]
                    bg-[var(--background)] p-3
                  "
                >
                  <div className="flex items-center gap-3">

                    <div
                      className="
                        flex h-10 w-10 items-center justify-center
                        rounded-2xl bg-pink-500/10
                        text-xs font-bold text-pink-500
                      "
                    >
                      {initials(person.name)}
                    </div>

                    <div>
                      <p className="text-sm font-medium text-[var(--foreground)]">
                        {person.name}
                      </p>

                      <p className="text-xs text-[var(--muted-foreground)]">
                        Birthday {person.when}
                      </p>
                    </div>
                  </div>

                  {person.when === "Tomorrow" && (
                    <button
                      className="
                        rounded-xl bg-pink-500
                        px-3 py-1.5
                        text-xs font-medium text-white
                        transition-all duration-200
                        hover:bg-pink-600
                      "
                    >
                      Wish
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* EVENTS / COMPANY UPDATES */}
          <div
            className="
              rounded-3xl border border-[var(--border)]
              bg-[var(--card)] p-4
            "
          >
            <div className="mb-4 flex items-center gap-2">
              <Sparkles
                size={16}
                className="text-[var(--primary)]"
              />

              <h3 className="text-sm font-semibold text-[var(--foreground)]">
                Upcoming Events
              </h3>
            </div>

            <div className="space-y-3">

              {[
                {
                  title: "Quarterly Townhall",
                  subtitle: "07 Jun • 11:00 AM",
                },
                {
                  title: "Team Offsite",
                  subtitle: "14 Jun • Neemrana",
                },
                {
                  title: "Learning Workshop",
                  subtitle: "21 Jun • React Performance",
                },
              ].map((event) => (
                <div
                  key={event.title}
                  className="
                    flex items-center justify-between
                    rounded-2xl border border-[var(--border)]
                    bg-[var(--background)] p-3
                  "
                >
                  <div>
                    <p className="text-sm font-medium text-[var(--foreground)]">
                      {event.title}
                    </p>

                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                      {event.subtitle}
                    </p>
                  </div>

                  <ArrowRight
                    size={15}
                    className="text-[var(--muted-foreground)]"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;