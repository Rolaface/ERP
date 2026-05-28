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
  UserCircle2,
  Briefcase,
  CheckCircle2,
  TrendingUp,
  Umbrella,
} from "lucide-react";


function formatTime(dt: string | null): string {
  if (!dt) return "—";
  const d = new Date(dt.replace(" ", "T"));
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}


function formatDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}


function workingMinutes(inTime: string | null, outTime: string | null): number {
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

/** Initials from full name */
function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

// ── SKELETON ──────────────────────────────────────────────────────────────────
const Skeleton: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div
    className={`animate-pulse rounded-lg bg-[var(--muted)]/40 ${className}`}
  />
);

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
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

  const mins = workingMinutes(checkins?.inTime ?? null, checkins?.outTime ?? null);
  const leavePercent =
    leave && leave.totalAllocated > 0
      ? Math.round((leave.totalRemaining / leave.totalAllocated) * 100)
      : 0;

  return (
    <div className="h-full overflow-y-auto bg-[var(--background)]">
      <div className="mx-auto max-w-7xl px-5 py-5 space-y-5">

        {/* ── HERO BANNER ─────────────────────────────────────────── */}
        <div
          className="
            relative overflow-hidden rounded-2xl
            bg-[var(--primary)] text-white
            px-6 py-5
          "
        >
          {/* decorative circles */}
          <span className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/5" />
          <span className="pointer-events-none absolute -bottom-10 right-20 h-32 w-32 rounded-full bg-white/5" />

          <div className="relative flex items-center gap-4">
            {/* Avatar */}
            <div
              className="
                flex h-14 w-14 shrink-0 items-center justify-center
                rounded-2xl bg-white/15 text-xl font-bold tracking-tight
              "
            >
              {loading ? (
                <Skeleton className="h-14 w-14 rounded-2xl" />
              ) : (
                initials(emp?.employeeName ?? "?")
              )}
            </div>

            {/* Name + meta */}
            <div className="flex-1 min-w-0">
              {loading ? (
                <>
                  <Skeleton className="h-5 w-40 mb-2" />
                  <Skeleton className="h-3.5 w-56" />
                </>
              ) : (
                <>
                  <h2 className="text-lg font-semibold leading-tight truncate">
                    {emp?.employeeName ?? "—"}
                  </h2>
                  <p className="mt-0.5 text-sm text-white/70 flex flex-wrap gap-x-3 gap-y-0.5">
                    <span className="flex items-center gap-1">
                      <Briefcase size={12} />
                      {emp?.employeeId ?? "—"}
                    </span>
                    <span className="flex items-center gap-1">
                      <CalendarDays size={12} />
                      Joined {formatDate(emp?.dateOfJoining ?? null)}
                    </span>
                  </p>
                </>
              )}
            </div>

            {/* Today's date badge */}
            <div className="hidden sm:flex flex-col items-end shrink-0">
              <span className="text-xs text-white/60 uppercase tracking-widest">
                Today
              </span>
              <span className="text-sm font-medium text-white/90">
                {formatDate(checkins?.asofDate ?? null)}
              </span>
            </div>
          </div>

          {/* Leave approver strip */}
          {/* {!loading && emp?.leaveApproverName && (
            <div className="relative mt-4 flex items-center gap-2 border-t border-white/10 pt-3 text-xs text-white/60">
              <UserCircle2 size={13} />
              Leave Approver —{" "}
              <span className="text-white/85 font-medium">
                {emp.leaveApproverName}
              </span>
            </div>
          )} */}
        </div>

        {/* ── MAIN GRID ───────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">

          {/* LEFT — attendance + leave stacked */}
          <div className="flex flex-col gap-5 xl:col-span-2">

            {/* ATTENDANCE CARD */}
            <div
              className="
                rounded-2xl border border-[var(--border)]
                bg-[var(--card)] p-5 space-y-4
              "
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[var(--foreground)] tracking-tight">
                  Today's Attendance
                </h3>
                {!loading && (
                  <span
                    className={`
                      inline-flex items-center gap-1 rounded-full px-2.5 py-0.5
                      text-xs font-medium
                      ${checkins?.inTime
                        ? "bg-emerald-500/10 text-emerald-600"
                        : "bg-amber-500/10 text-amber-600"
                      }
                    `}
                  >
                    <CheckCircle2 size={11} />
                    {checkins?.inTime ? "Checked In" : "Not Checked In"}
                  </span>
                )}
              </div>

              {/* Check-in / Check-out / Duration row */}
              <div className="grid grid-cols-3 gap-3">
                {(
                  [
                    {
                      icon: LogIn,
                      label: "Check In",
                      value: formatTime(checkins?.inTime ?? null),
                      color: "text-emerald-600",
                      bg: "bg-emerald-500/8 border-emerald-500/15",
                    },
                    {
                      icon: LogOut,
                      label: "Check Out",
                      value: formatTime(checkins?.outTime ?? null),
                      color: "text-rose-500",
                      bg: "bg-rose-500/8 border-rose-500/15",
                    },
                    {
                      icon: Clock,
                      label: "Duration",
                      value: formatDuration(mins),
                      color: "text-[var(--primary)]",
                      bg: "bg-[var(--primary)]/8 border-[var(--primary)]/15",
                    },
                  ] as const
                ).map(({ icon: Icon, label, value, color, bg }) => (
                  <div
                    key={label}
                    className={`
                      flex flex-col items-center justify-center gap-1.5
                      rounded-xl border p-3 text-center ${bg}
                    `}
                  >
                    {loading ? (
                      <Skeleton className="h-12 w-full" />
                    ) : (
                      <>
                        <Icon size={18} className={color} />
                        <span className={`text-base font-bold ${color}`}>
                          {value}
                        </span>
                        <span className="text-[11px] text-[var(--muted-foreground)]">
                          {label}
                        </span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* LEAVE BALANCE CARD */}
            <div
              className="
                rounded-2xl border border-[var(--border)]
                bg-[var(--card)] p-5 space-y-4
              "
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[var(--foreground)] tracking-tight">
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
                  {/* Summary row */}
                  <div className="grid grid-cols-3 gap-3">
                    {(
                      [
                        {
                          label: "Allocated",
                          value: leave?.totalAllocated ?? 0,
                          color: "text-[var(--primary)]",
                        },
                        {
                          label: "Used",
                          value: leave?.totalUsed ?? 0,
                          color: "text-rose-500",
                        },
                        {
                          label: "Remaining",
                          value: leave?.totalRemaining ?? 0,
                          color: "text-emerald-600",
                        },
                      ] as const
                    ).map(({ label, value, color }) => (
                      <div
                        key={label}
                        className="
                          flex flex-col items-center justify-center gap-0.5
                          rounded-xl border border-[var(--border)]
                          bg-[var(--background)] p-3 text-center
                        "
                      >
                        <span className={`text-2xl font-bold ${color}`}>
                          {value}
                        </span>
                        <span className="text-[11px] text-[var(--muted-foreground)]">
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Progress bar */}
                  {/* <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-[var(--muted-foreground)]">
                      <span>Balance used</span>
                      <span>{100 - leavePercent}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--muted)]/30">
                      <div
                        className="h-full rounded-full bg-[var(--primary)] transition-all duration-500"
                        style={{ width: `${100 - leavePercent}%` }}
                      />
                    </div>
                  </div> */}

                  {/* Per-type breakdown */}
                  {leave && leave.leaveTypes.length > 0 && (
                    <div className="space-y-2">
                      {leave.leaveTypes.map((lt) => (
                        <div
                          key={lt.leaveType}
                          className="
                            flex items-center justify-between
                            rounded-xl border border-[var(--border)]
                            bg-[var(--background)] px-4 py-2.5
                          "
                        >
                          <div className="flex items-center gap-2">
                            <Umbrella size={14} className="text-[var(--primary)]" />
                            <span className="text-sm font-medium text-[var(--foreground)] capitalize">
                              {lt.leaveType}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
                            <span>Used <strong className="text-rose-500">{lt.used}</strong></span>
                            <span className="text-[var(--border)]">|</span>
                            <span>
                              Left{" "}
                              <strong className="text-emerald-600">{lt.remaining}</strong>
                            </span>
                            <span className="text-[var(--border)]">|</span>
                            <span>of {lt.allocated}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* RIGHT — quick actions sidebar */}
          <div className="xl:col-span-1">
            <div className="xl:sticky xl:top-4 space-y-5">
              <QuickActions />

              {/* Approver info card */}
              {!loading && emp && (
                <div
                  className="
                    rounded-2xl border border-[var(--border)]
                    bg-[var(--card)] p-4 space-y-3
                  "
                >
                  <h4 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">
                    Reporting Info
                  </h4>
                  <div className="flex items-center gap-3">
                    <div
                      className="
                        flex h-9 w-9 shrink-0 items-center justify-center
                        rounded-xl bg-[var(--primary)]/10 text-xs font-bold
                        text-[var(--primary)]
                      "
                    >
                      {initials(emp.leaveApproverName)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[var(--foreground)]">
                        {emp.leaveApproverName}
                      </p>
                      <p className="truncate text-xs text-[var(--muted-foreground)]">
                        Leave Approver
                      </p>
                    </div>
                  </div>
                  {/* <div className="rounded-lg bg-[var(--background)] px-3 py-2 text-xs text-[var(--muted-foreground)] flex items-center gap-2">
                    <TrendingUp size={12} />
                    Joined {formatDate(emp.dateOfJoining)}
                  </div> */}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;