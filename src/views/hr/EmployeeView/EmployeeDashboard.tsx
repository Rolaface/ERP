import React, { useMemo } from "react";
import {
  Calendar, Bell, Gift, Sun, TrendingUp,
  Clock, CheckCircle, AlertCircle, Users,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";

// ── Dummy data ────────────────────────────────────────────────────────────────

const DUMMY_LEAVE_SUMMARY = [
  { type: "Annual Leave",    total: 18, used: 5,  remaining: 13, color: "var(--primary)" },
  { type: "Sick Leave",      total: 12, used: 2,  remaining: 10, color: "#22c55e" },
  { type: "Casual Leave",    total: 6,  used: 1,  remaining: 5,  color: "#3b82f6" },
  { type: "Emergency Leave", total: 3,  used: 0,  remaining: 3,  color: "#f59e0b" },
];

const DUMMY_ANNOUNCEMENTS = [
  {
    id: "1",
    title: "Office Closed — Independence Day",
    date: "14 Aug 2026",
    type: "holiday",
    priority: "high",
  },
  {
    id: "2",
    title: "Q3 Performance Reviews Start Next Week",
    date: "10 May 2026",
    type: "announcement",
    priority: "medium",
  },
  {
    id: "3",
    title: "New Leave Policy Effective June 1",
    date: "01 Jun 2026",
    type: "policy",
    priority: "medium",
  },
  {
    id: "4",
    title: "Team Building Event — Register by Friday",
    date: "16 May 2026",
    type: "event",
    priority: "low",
  },
];

const DUMMY_UPCOMING_HOLIDAYS = [
  { name: "Independence Day", date: "15 Aug 2026", day: "Saturday" },
  { name: "Gandhi Jayanti",   date: "02 Oct 2026", day: "Friday" },
  { name: "Diwali",           date: "20 Oct 2026", day: "Tuesday" },
  { name: "Christmas",        date: "25 Dec 2026", day: "Friday" },
];

const DUMMY_EVENTS = [
  { title: "Team Standup",         date: "Today, 10:00 AM",   type: "meeting" },
  { title: "HR Policy Review",     date: "Tomorrow, 2:00 PM", type: "review" },
  { title: "Salary Disbursement",  date: "30 May 2026",       type: "payroll" },
  { title: "Team Building Event",  date: "16 May 2026",       type: "event" },
];

const DUMMY_QUICK_STATS = {
  daysPresent:     18,
  daysAbsent:      2,
  pendingLeaves:   1,
  pendingExpenses: 2,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const typeConfig: Record<string, { icon: React.ReactNode; bg: string; text: string }> = {
  holiday:      { icon: <Sun size={13} />,         bg: "bg-amber-50",  text: "text-amber-700" },
  announcement: { icon: <Bell size={13} />,         bg: "bg-blue-50",   text: "text-blue-700" },
  policy:       { icon: <CheckCircle size={13} />,  bg: "bg-green-50",  text: "text-green-700" },
  event:        { icon: <Calendar size={13} />,     bg: "bg-purple-50", text: "text-purple-700" },
  meeting:      { icon: <Users size={13} />,        bg: "bg-blue-50",   text: "text-blue-700" },
  review:       { icon: <TrendingUp size={13} />,   bg: "bg-orange-50", text: "text-orange-700" },
  payroll:      { icon: <Gift size={13} />,         bg: "bg-green-50",  text: "text-green-700" },
};

// ─── Component ────────────────────────────────────────────────────────────────

const EmployeeDashboard: React.FC = () => {
  const { user } = useAuth();

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">

        {/* ── Greeting ── */}
        <div
          className="rounded-2xl p-6 text-white relative overflow-hidden"
          style={{ background: "var(--gradient-primary, var(--primary))" }}
        >
          {/* <div className="absolute top-4 right-4 z-20">
            <RoleSwitchButton />
          </div> */}

          <div className="relative z-10">
            <p className="text-sm font-medium opacity-80 mb-1">{greeting}</p>
            <h1 className="text-2xl font-bold">{user?.fullName ?? user?.username}</h1>
            <p className="text-sm opacity-70 mt-1">
              Employee ID: {user?.employeeId ?? "—"}
            </p>
          </div>

          {/* Decorative circles */}
          <div
            className="absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-20"
            style={{ background: "rgba(255,255,255,0.3)" }}
          />
          <div
            className="absolute -right-4 -bottom-8 w-24 h-24 rounded-full opacity-10"
            style={{ background: "rgba(255,255,255,0.3)" }}
          />
        </div>

        {/* ── Quick Stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Days Present",      value: DUMMY_QUICK_STATS.daysPresent,     icon: <CheckCircle size={18} />, color: "text-green-600",  bg: "bg-green-50" },
            { label: "Days Absent",        value: DUMMY_QUICK_STATS.daysAbsent,      icon: <AlertCircle size={18} />, color: "text-red-500",    bg: "bg-red-50" },
            { label: "Pending Leaves",     value: DUMMY_QUICK_STATS.pendingLeaves,   icon: <Clock size={18} />,       color: "text-amber-600",  bg: "bg-amber-50" },
            { label: "Pending Expenses",   value: DUMMY_QUICK_STATS.pendingExpenses, icon: <TrendingUp size={18} />,  color: "text-blue-600",   bg: "bg-blue-50" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 flex items-center gap-3"
            >
              <div className={`${stat.bg} ${stat.color} p-2.5 rounded-lg shrink-0`}>
                {stat.icon}
              </div>
              <div className="min-w-0">
                <p className="text-xl font-bold text-[var(--text)]">{stat.value}</p>
                <p className="text-xs text-[var(--muted)] leading-tight mt-0.5">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Main Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Leave Summary ── */}
          <div className="lg:col-span-2 bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5">
            <h2 className="text-sm font-bold text-[var(--text)] uppercase tracking-widest mb-4">
              Leave Balance
            </h2>
            <div className="space-y-3">
              {DUMMY_LEAVE_SUMMARY.map((leave) => {
                const pct = Math.round((leave.used / leave.total) * 100);
                return (
                  <div key={leave.type}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-[var(--text)]">
                        {leave.type}
                      </span>
                      <span className="text-xs text-[var(--muted)]">
                        {leave.remaining} / {leave.total} remaining
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--row-hover)] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, background: leave.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Upcoming Holidays ── */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5">
            <h2 className="text-sm font-bold text-[var(--text)] uppercase tracking-widest mb-4">
              Upcoming Holidays
            </h2>
            <div className="space-y-2.5">
              {DUMMY_UPCOMING_HOLIDAYS.map((holiday) => (
                <div
                  key={holiday.name}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[var(--row-hover)] transition-colors"
                >
                  <div
                    className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: "var(--primary)" }}
                  >
                    <Sun size={14} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--text)] truncate">
                      {holiday.name}
                    </p>
                    <p className="text-xs text-[var(--muted)]">
                      {holiday.date} · {holiday.day}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Announcements + Events ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Announcements */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5">
            <h2 className="text-sm font-bold text-[var(--text)] uppercase tracking-widest mb-4">
              Announcements
            </h2>
            <div className="space-y-3">
              {DUMMY_ANNOUNCEMENTS.map((a) => {
                const cfg = typeConfig[a.type] ?? typeConfig["announcement"];
                return (
                  <div
                    key={a.id}
                    className="flex items-start gap-3 p-3 rounded-xl border border-[var(--border)] hover:bg-[var(--row-hover)] transition-colors"
                  >
                    <div className={`${cfg.bg} ${cfg.text} p-2 rounded-lg shrink-0 mt-0.5`}>
                      {cfg.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[var(--text)] leading-snug">
                        {a.title}
                      </p>
                      <p className="text-xs text-[var(--muted)] mt-1">{a.date}</p>
                    </div>
                    {a.priority === "high" && (
                      <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                        URGENT
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5">
            <h2 className="text-sm font-bold text-[var(--text)] uppercase tracking-widest mb-4">
              Upcoming Events
            </h2>
            <div className="space-y-3">
              {DUMMY_EVENTS.map((event, i) => {
                const cfg = typeConfig[event.type] ?? typeConfig["event"];
                return (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] hover:bg-[var(--row-hover)] transition-colors"
                  >
                    <div className={`${cfg.bg} ${cfg.text} p-2 rounded-lg shrink-0`}>
                      {cfg.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[var(--text)]">{event.title}</p>
                      <p className="text-xs text-[var(--muted)] mt-0.5">{event.date}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default EmployeeDashboard;