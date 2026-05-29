import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  Umbrella,
  AlertCircle,
  Gift,
  Cake,
  Sparkles,
  MapPin,
  User,
} from "lucide-react";

// ── TYPE PATCHES ─────────────────────────────────────────────────────
// These extend the API types locally so TS stops complaining about
// fields that exist at runtime but aren't declared in the shared type.

interface HolidayEntry {
  date: string;
  description: string;
}

interface BirthdayEntry {
  employeeName: string;
  dateOfBirth: string;
  daysLeft: number;
}

interface SafeDashboardData extends Omit<EmployeeDashboardData, "holidays" | "birthdays"> {
  holidays?: { upcoming: HolidayEntry[] };
  birthdays?: { upcoming: BirthdayEntry[] };
  employeeDetails?: EmployeeDashboardData["employeeDetails"] & {
    expenseApproverName?: string;
    shiftApproverName?: string;
  };
}

// ── HELPERS ───────────────────────────────────────────────────────────

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

function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

function getDayName(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", { weekday: "long" });
}

function getCountdown(dateStr: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  const diff = Math.round((target.getTime() - today.getTime()) / 86_400_000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff < 0) return "Passed";
  return `${diff}d`;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

function workingMinutes(
  inTime: string | null,
  outTime: string | null
): number {
  if (!inTime || !outTime) return 0;
  const diff =
    new Date(outTime.replace(" ", "T")).getTime() -
    new Date(inTime.replace(" ", "T")).getTime();
  return Math.max(0, Math.floor(diff / 60_000));
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
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

function getBirthdayLabel(daysLeft: number): string {
  if (daysLeft === 0) return "Today! 🎂";
  if (daysLeft === 1) return "Tomorrow";
  return `In ${daysLeft}d`;
}

// ── ATOMS ────────────────────────────────────────────────────────────

const Skeleton: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`animate-pulse rounded-xl bg-[var(--muted)]/40 ${className}`} />
);

const EmptyState: React.FC<{ message?: string }> = ({
  message = "No data available",
}) => (
  <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
    <AlertCircle size={20} className="text-[var(--muted-foreground)]/30" />
    <p className="text-xs text-[var(--muted-foreground)]">{message}</p>
  </div>
);

const AVATAR_COLORS = [
  "bg-violet-100 text-violet-700",
  "bg-sky-100 text-sky-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-indigo-100 text-indigo-700",
];

const Avatar: React.FC<{
  name?: string | null;
  photo?: string | null;
  size?: "sm" | "md" | "lg";
  colorIndex?: number;
}> = ({ name, photo, size = "md", colorIndex = 0 }) => {
  const sizeMap = {
    sm: "h-7 w-7 text-[10px]",
    md: "h-9 w-9 text-xs",
    lg: "h-12 w-12 text-sm",
  };
  const color = AVATAR_COLORS[colorIndex % AVATAR_COLORS.length];
  return (
    <div
      className={`${sizeMap[size]} shrink-0 rounded-xl overflow-hidden flex items-center justify-center font-semibold ${photo ? "" : color}`}
    >
      {photo ? (
        <img src={photo} alt={name ?? ""} className="h-full w-full object-cover" />
      ) : (
        initials(name)
      )}
    </div>
  );
};

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => (
  <div className={`rounded-2xl border border-[var(--border)] bg-[var(--card)] ${className}`}>
    {children}
  </div>
);

const SectionHeader: React.FC<{
  icon: React.ElementType;
  iconColor?: string;
  title: string;
  right?: React.ReactNode;
}> = ({ icon: Icon, iconColor = "text-[var(--primary)]", title, right }) => (
  <div className="flex items-center justify-between px-4 pt-4 pb-3">
    <div className="flex items-center gap-2">
      <div
        className={`rounded-lg p-1.5 ${iconColor}`}
        style={{ background: "color-mix(in srgb, var(--primary) 10%, transparent)" }}
      >
        <Icon size={13} />
      </div>
      <h3 className="text-sm font-semibold text-[var(--foreground)]">{title}</h3>
    </div>
    {right && <div>{right}</div>}
  </div>
);

// ── MAIN COMPONENT ───────────────────────────────────────────────────

const EmployeeDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<SafeDashboardData | null>(null);

  useEffect(() => {
    const employeeId = user?.employeeId;
    if (!employeeId) return;
    let mounted = true;

    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const data = await getEmployeeDashboardSummary(employeeId);
        if (mounted) setDashboardData(data as SafeDashboardData);
      } catch (e) {
        console.error("Error fetching employee dashboard:", e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchDashboard();
    return () => { mounted = false; };
  }, [user?.employeeId]);

  const emp = dashboardData?.employeeDetails ?? null;
  const leave = dashboardData?.leaveBalance ?? null;
  const checkins = dashboardData?.checkins ?? null;
  const upcomingHolidays = dashboardData?.holidays?.upcoming ?? [];
  const upcomingBirthdays = dashboardData?.birthdays?.upcoming ?? [];

  const mins = workingMinutes(checkins?.inTime ?? null, checkins?.outTime ?? null);

  // Approvers for Reporting Info
  const approvers = emp
    ? [
      { name: emp.leaveApproverName, role: "Leave Approver" },
      { name: emp.expenseApproverName, role: "Expense Approver" },
      { name: emp.shiftApproverName, role: "Shift Approver" },
    ]
    : [];

  return (
    <div className="w-full space-y-4 py-4">

      {/* ── HERO BANNER ─────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-[var(--primary)] px-5 py-4 text-white">
        {/* decorative blobs */}
        <span className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/5" />
        <span className="pointer-events-none absolute bottom-0 right-32 h-28 w-28 rounded-full bg-white/5" />
        <span className="pointer-events-none absolute top-3 right-60 h-14 w-14 rounded-full bg-white/5" />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          {/* ── LEFT: avatar + greeting ──── */}
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-white/15 flex items-center justify-center text-base font-bold">
              {loading ? (
                <Skeleton className="h-12 w-12 rounded-2xl" />
              ) : emp?.profilePhoto ? (
                <img
                  src={emp.profilePhoto}
                  alt={emp.employeeName ?? ""}
                  className="h-full w-full object-cover"
                />
              ) : (
                initials(emp?.employeeName)
              )}
            </div>

            <div className="min-w-0">
              {loading ? (
                <>
                  <Skeleton className="mb-1.5 h-5 w-40 bg-white/20" />
                  <Skeleton className="h-3 w-52 bg-white/15" />
                </>
              ) : (
                <>
                  <h1 className="text-lg font-semibold truncate leading-tight">
                    {getGreeting()}, {emp?.employeeName?.split(" ")[0] ?? "Employee"} 👋
                  </h1>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-white/60">
                    <span className="flex items-center gap-1">
                      <Sparkles size={10} />
                      {emp?.employeeId ?? "—"}
                    </span>
                    <span className="flex items-center gap-1">
                      <CalendarDays size={10} />
                      Joined {formatDate(emp?.dateOfJoining ?? null)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ── CENTRE: Reporting Info chips (inline in header) ── */}
          {!loading && approvers.some((a) => a.name) && (
            <div className="hidden lg:flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest text-white/100 mr-1">
                Reports to
              </span>
              {approvers.map(({ name, role }) =>
                name ? (
                  <div
                    key={role}
                    className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/10 px-2.5 py-1.5 backdrop-blur-sm"
                    title={role}
                  >
                    <div className="flex h-5 w-5 items-center justify-center rounded-md bg-white/20 text-[9px] font-bold shrink-0">
                      {initials(name)}
                    </div>
                    <div>
                      <p className="text-[11px] font-medium text-white leading-tight">
                        {name}
                      </p>
                      <p className="text-[9px] text-white/50 leading-tight">{role}</p>
                    </div>
                  </div>
                ) : null
              )}
            </div>
          )}

          {/* ── RIGHT: date pill ─────────────────────────────── */}
          <div className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 backdrop-blur-sm self-start sm:self-auto shrink-0">
            <p className="text-[9px] uppercase tracking-widest text-white/45 mb-0.5">Today</p>
            <p className="text-sm font-semibold text-white whitespace-nowrap">
              {formatDate(checkins?.asofDate ?? null)}
            </p>
          </div>
        </div>
      </div>

      {/* ── ATTENDANCE STAT STRIP ─────────────────────────────── */}
      {/* Narrower — max ~680px, left-aligned, not full width */}
      <div className="grid grid-cols-3 gap-3 max-w-2xl">
        {(
          [
            {
              icon: LogIn,
              label: "Check In",
              value: formatTime(checkins?.inTime ?? null),
              accent: "text-emerald-600",
              bg: "bg-emerald-500/6 border-emerald-500/15",
            },
            {
              icon: LogOut,
              label: "Check Out",
              value: formatTime(checkins?.outTime ?? null),
              accent: "text-rose-500",
              bg: "bg-rose-500/6 border-rose-500/15",
            },
            {
              icon: Clock,
              label: "Hours Worked",
              value: formatDuration(mins),
              accent: "text-[var(--primary)]",
              bg: "bg-[var(--primary)]/6 border-[var(--primary)]/15",
            },
          ] as const
        ).map(({ icon: Icon, label, value, accent, bg }) => (
          <div key={label} className={`rounded-2xl border p-3 ${bg}`}>
            {loading ? (
              <Skeleton className="h-14 w-full" />
            ) : (
              <div className="flex flex-col gap-1">
                <Icon size={14} className={accent} />
                <p className={`text-lg font-bold leading-tight ${accent}`}>{value}</p>
                <p className="text-[10px] text-[var(--muted-foreground)]">{label}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── MAIN GRID ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">

        {/* LEFT 2 COLS */}
        <div className="flex flex-col gap-4 xl:col-span-2">

          {/* LEAVE BALANCE */}
          <Card>
            <SectionHeader
              icon={Umbrella}
              title="Leave Balance"
              right={
                !loading && leave ? (
                  <span className="text-[10px] text-[var(--muted-foreground)]">
                    As of {formatDate(leave.asOfDate)}
                  </span>
                ) : null
              }
            />
            <div className="px-4 pb-4">
              {loading ? (
                <div className="space-y-2.5">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-3/4" />
                </div>
              ) : !leave ? (
                <EmptyState message="Leave balance unavailable" />
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-2.5 mb-3">
                    {(
                      [
                        { label: "Allocated", value: leave.totalAllocated, color: "text-[var(--primary)]" },
                        { label: "Used", value: leave.totalUsed, color: "text-rose-500" },
                        { label: "Remaining", value: leave.totalRemaining, color: "text-emerald-600" },
                      ] as const
                    ).map(({ label, value, color }) => (
                      <div
                        key={label}
                        className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-3 text-center"
                      >
                        <p className={`text-2xl font-bold ${color}`}>{value}</p>
                        <p className="mt-0.5 text-[10px] uppercase tracking-wide text-[var(--muted-foreground)]">
                          {label}
                        </p>
                      </div>
                    ))}
                  </div>

                  {leave.leaveTypes.length > 0 && (
                    <div className="space-y-2">
                      {leave.leaveTypes.map((lt) => {
                        const pct =
                          lt.allocated > 0
                            ? Math.min(100, Math.round((lt.used / lt.allocated) * 100))
                            : 0;
                        return (
                          <div
                            key={lt.leaveType}
                            className="rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5"
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs font-medium capitalize text-[var(--foreground)]">
                                {lt.leaveType}
                              </span>
                              <div className="flex items-center gap-3">
                                <span className="text-[10px] text-[var(--muted-foreground)]">
                                  {lt.used} / {lt.allocated}
                                </span>
                                <span className="text-[10px] font-semibold text-emerald-600">
                                  {lt.remaining} left
                                </span>
                              </div>
                            </div>
                            <div className="h-1.5 rounded-full bg-[var(--muted)]/25 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-[var(--primary)] transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          </Card>

          {/* UPCOMING BIRTHDAYS */}
          <Card>
            <SectionHeader
              icon={Cake}
              iconColor="text-pink-500"
              title="Upcoming Birthdays"
            />
            <div className="px-4 pb-4">
              {loading ? (
                <div className="grid grid-cols-2 gap-2">
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                </div>
              ) : upcomingBirthdays.length === 0 ? (
                <EmptyState message="No upcoming birthdays" />
              ) : (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {upcomingBirthdays.map((b, i) => {
                    const isToday = b.daysLeft === 0;
                    return (
                      <div
                        key={`${b.employeeName}-${i}`}
                        className={`
                              flex items-center gap-2.5 rounded-xl border px-3 py-2.5
                              ${isToday
                            ? "border-pink-200 bg-pink-50/60"
                            : "border-[var(--border)] bg-[var(--background)]"}
                            `}
                      >
                        <Avatar name={b.employeeName} colorIndex={i} size="md" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-[var(--foreground)] capitalize truncate">
                            {b.employeeName}
                          </p>
                          <p className="text-[10px] text-[var(--muted-foreground)]">
                            {new Date(b.dateOfBirth).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "long",
                            })}
                          </p>
                        </div>
                        <span
                          className={`
                                shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap
                                ${isToday
                              ? "bg-pink-500 text-white"
                              : "bg-[var(--primary)]/10 text-[var(--primary)]"}
                              `}
                        >
                          {getBirthdayLabel(b.daysLeft)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="xl:col-span-1">
          <div className="space-y-4 xl:sticky xl:top-4">

            {/* Quick Actions — slightly nudged up via negative margin */}
            <div className="-mt-0">
              <QuickActions />
            </div>

            {/* Reporting Info (mobile fallback — hidden on lg where it's in header) */}
            {!loading && emp && (
              <Card className="lg:hidden">
                <SectionHeader icon={User} title="Reporting Info" />
                <div className="px-4 pb-4 space-y-2.5">
                  {approvers.map(({ name, role }, i) => (
                    <div key={role} className="flex items-center gap-2.5">
                      <Avatar name={name} colorIndex={i + 2} size="sm" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-[var(--foreground)] truncate">
                          {name ?? "Not assigned"}
                        </p>
                        <p className="text-[10px] text-[var(--muted-foreground)]">{role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Upcoming Holidays */}
            <Card>
              <SectionHeader icon={Gift} title="Upcoming Holidays" />
              <div className="px-4 pb-4">
                {loading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-14 w-full" />
                    <Skeleton className="h-14 w-full" />
                  </div>
                ) : upcomingHolidays.length === 0 ? (
                  <EmptyState message="No upcoming holidays" />
                ) : (
                  <div className="space-y-2">
                    {upcomingHolidays.map((holiday: HolidayEntry) => {
                      const countdown = getCountdown(holiday.date);
                      if (countdown === "Passed") return null;
                      const isNext =
                        countdown === "Tomorrow" || countdown === "Today";
                      return (
                        <div
                          key={holiday.date}
                          className={`
                                flex items-start justify-between gap-2.5 rounded-xl border p-2.5
                                ${isNext
                              ? "border-[var(--primary)]/20 bg-[var(--primary)]/5"
                              : "border-[var(--border)] bg-[var(--background)]"}
                              `}
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-[var(--foreground)] truncate">
                              {stripHtml(holiday.description) || "Holiday"}
                            </p>
                            <p className="mt-0.5 text-[10px] text-[var(--muted-foreground)]">
                              {formatDateShort(holiday.date)} · {getDayName(holiday.date)}
                            </p>
                          </div>
                          <span
                            className={`
                                  shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold
                                  ${isNext
                                ? "bg-[var(--primary)] text-white"
                                : "bg-[var(--muted)]/40 text-[var(--muted-foreground)]"}
                                `}
                          >
                            {countdown}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;