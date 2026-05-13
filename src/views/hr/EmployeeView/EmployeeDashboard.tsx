import React, { useMemo } from "react";
import {
  Calendar,
  Bell,
  Gift,
  Sun,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
} from "lucide-react";

import { useAuth } from "../../../context/AuthContext";
import RoleSwitchButton from "../roleswitchbutton";

// ── Dummy data ────────────────────────────────────────────────────────────────

const DUMMY_LEAVE_SUMMARY = [
  {
    type: "Annual Leave",
    total: 18,
    used: 5,
    remaining: 13,
    color: "var(--primary)",
  },
  {
    type: "Sick Leave",
    total: 12,
    used: 2,
    remaining: 10,
    color: "var(--success)",
  },
  {
    type: "Casual Leave",
    total: 6,
    used: 1,
    remaining: 5,
    color: "var(--info)",
  },
  {
    type: "Emergency Leave",
    total: 3,
    used: 0,
    remaining: 3,
    color: "var(--warning)",
  },
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
  { name: "Gandhi Jayanti", date: "02 Oct 2026", day: "Friday" },
  { name: "Diwali", date: "20 Oct 2026", day: "Tuesday" },
  { name: "Christmas", date: "25 Dec 2026", day: "Friday" },
];

const DUMMY_EVENTS = [
  { title: "Team Standup", date: "Today, 10:00 AM", type: "meeting" },
  { title: "HR Policy Review", date: "Tomorrow, 2:00 PM", type: "review" },
  { title: "Salary Disbursement", date: "30 May 2026", type: "payroll" },
  { title: "Team Building Event", date: "16 May 2026", type: "event" },
];

const DUMMY_QUICK_STATS = {
  daysPresent: 18,
  daysAbsent: 2,
  pendingLeaves: 1,
  pendingExpenses: 2,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const typeConfig: Record<
  string,
  {
    icon: React.ReactNode;
    bg: string;
    text: string;
  }
> = {
  holiday: {
    icon: <Sun size={13} />,
    bg: "bg-warning/10",
    text: "text-warning",
  },

  announcement: {
    icon: <Bell size={13} />,
    bg: "bg-info/10",
    text: "text-info",
  },

  policy: {
    icon: <CheckCircle size={13} />,
    bg: "bg-success/10",
    text: "text-success",
  },

  event: {
    icon: <Calendar size={13} />,
    bg: "bg-[var(--row-hover)]",
    text: "text-primary",
  },

  meeting: {
    icon: <Users size={13} />,
    bg: "bg-info/10",
    text: "text-info",
  },

  review: {
    icon: <TrendingUp size={13} />,
    bg: "bg-warning/10",
    text: "text-warning",
  },

  payroll: {
    icon: <Gift size={13} />,
    bg: "bg-success/10",
    text: "text-success",
  },
};

// ─── Shared Section Card ─────────────────────────────────────────────────────

interface SectionCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

const SectionCard: React.FC<SectionCardProps> = ({
  title,
  children,
  className = "",
}) => {
  return (
    <section
      className={`
        app-surface
        card-interactive
        edge-highlight
        rounded-[24px]
        p-5
        lg:p-6
        overflow-hidden
        ${className}
      `}
    >
      <div className="flex items-center justify-between mb-5">
        <h2
          className="
            text-[11px]
            font-bold
            uppercase
            tracking-[0.18em]
            text-muted
          "
        >
          {title}
        </h2>
      </div>

      {children}
    </section>
  );
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
    <div className="bg-app min-h-screen text-main overflow-y-auto">
      <div className="container-wide mx-auto px-4 lg:px-6 py-6 lg:py-8">

        {/* DASHBOARD STACK */}

        <div className="flex flex-col gap-6">

          {/* ─────────────────────────────────────────────
              1. HEADER ZONE
          ───────────────────────────────────────────── */}

          <section id="dashboard-header-zone">

            {/* HERO */}

            <section
              className="
                relative
                overflow-hidden
                rounded-[32px]
                p-6
                lg:p-8
                text-white
                shadow-[var(--shadow-lg)]
              "
              style={{
                background: "var(--gradient-primary)",
              }}
            >
              {/* Glow Layer */}

              <div className="absolute inset-0 bg-radial-glow opacity-40 pointer-events-none" />

              {/* Decorative */}

              <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />

              <div className="absolute right-10 bottom-0 w-32 h-32 rounded-full bg-white/10 blur-3xl" />

              {/* Role Switch */}

              <div className="absolute top-5 right-5 z-20">
                <RoleSwitchButton />
              </div>

              <div className="relative z-10 flex flex-col gap-2">
                <p className="text-sm font-medium text-white/75">
                  {greeting}
                </p>

                <h1
                  className="
                    text-3xl
                    lg:text-4xl
                    font-bold
                    tracking-tight
                    leading-tight
                  "
                >
                  {user?.fullName ?? user?.username}
                </h1>

                <p className="text-sm text-white/70">
                  Employee ID: {user?.employeeId ?? "—"}
                </p>
              </div>
            </section>
          </section>

          {/* ─────────────────────────────────────────────
              2. PRIORITY ZONE
          ───────────────────────────────────────────── */}

          <section id="dashboard-priority-zone">

            {/* QUICK STATS */}

            <section className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              {[
                {
                  label: "Days Present",
                  value: DUMMY_QUICK_STATS.daysPresent,
                  icon: <CheckCircle size={18} />,
                  iconBg: "bg-success/10",
                  iconColor: "text-success",
                },

                {
                  label: "Days Absent",
                  value: DUMMY_QUICK_STATS.daysAbsent,
                  icon: <AlertCircle size={18} />,
                  iconBg: "bg-danger/10",
                  iconColor: "text-danger",
                },

                {
                  label: "Pending Leaves",
                  value: DUMMY_QUICK_STATS.pendingLeaves,
                  icon: <Clock size={18} />,
                  iconBg: "bg-warning/10",
                  iconColor: "text-warning",
                },

                {
                  label: "Pending Expenses",
                  value: DUMMY_QUICK_STATS.pendingExpenses,
                  icon: <TrendingUp size={18} />,
                  iconBg: "bg-info/10",
                  iconColor: "text-info",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="
                    app-surface
                    card-interactive
                    interactive
                    rounded-[22px]
                    p-4
                    lg:p-5
                    flex
                    items-center
                    gap-4
                  "
                >
                  <div
                    className={`
                      ${stat.iconBg}
                      ${stat.iconColor}

                      w-11
                      h-11
                      rounded-2xl
                      flex
                      items-center
                      justify-center
                      shrink-0
                    `}
                  >
                    {stat.icon}
                  </div>

                  <div className="min-w-0">
                    <p
                      className="
                        text-2xl
                        font-bold
                        leading-none
                        text-main
                      "
                    >
                      {stat.value}
                    </p>

                    <p
                      className="
                        mt-1
                        text-xs
                        font-medium
                        text-muted
                      "
                    >
                      {stat.label}
                    </p>
                  </div>
                </div>
              ))}
            </section>
          </section>

          {/* ─────────────────────────────────────────────
              3. WORKSPACE ZONE
          ───────────────────────────────────────────── */}

          <section id="dashboard-workspace-zone">

            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-6">

              {/* MAIN OPERATIONAL AREA */}

              <main className="min-w-0 flex flex-col gap-6">

                {/* LEAVE + HOLIDAYS */}

                <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                  {/* Leave Balance */}

                  <SectionCard
                    title="Leave Balance"
                    className="xl:col-span-2"
                  >
                    <div className="space-y-5">
                      {DUMMY_LEAVE_SUMMARY.map((leave) => {
                        const pct = Math.round(
                          (leave.used / leave.total) * 100
                        );

                        return (
                          <div key={leave.type} className="space-y-2">
                            <div className="flex items-center justify-between gap-4">
                              <span
                                className="
                                  text-sm
                                  font-semibold
                                  text-main
                                "
                              >
                                {leave.type}
                              </span>

                              <span
                                className="
                                  text-xs
                                  font-medium
                                  text-muted
                                "
                              >
                                {leave.remaining} / {leave.total} remaining
                              </span>
                            </div>

                            <div
                              className="
                                h-2.5
                                rounded-full
                                overflow-hidden
                                bg-[var(--row-hover)]
                              "
                            >
                              <div
                                className="
                                  h-full
                                  rounded-full
                                  transition-all
                                  duration-500
                                "
                                style={{
                                  width: `${pct}%`,
                                  background: leave.color,
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </SectionCard>

                  {/* Holidays */}

                  <SectionCard title="Upcoming Holidays">
                    <div className="space-y-3">
                      {DUMMY_UPCOMING_HOLIDAYS.map((holiday) => (
                        <div
                          key={holiday.name}
                          className="
                            group
                            flex
                            items-center
                            gap-3
                            rounded-2xl
                            p-3
                            transition-all
                            duration-200
                            hover:bg-[var(--row-hover)]
                          "
                        >
                          <div
                            className="
                              w-10
                              h-10
                              rounded-2xl
                              shrink-0
                              flex
                              items-center
                              justify-center
                              bg-primary
                              text-white
                              shadow-sm
                            "
                          >
                            <Sun size={16} />
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
                              {holiday.name}
                            </p>

                            <p
                              className="
                                text-xs
                                text-muted
                                mt-1
                              "
                            >
                              {holiday.date} · {holiday.day}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </SectionCard>
                </section>

                {/* BOTTOM GRID */}

                <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">

                  {/* Announcements */}

                  <SectionCard title="Announcements">
                    <div className="space-y-3">
                      {DUMMY_ANNOUNCEMENTS.map((a) => {
                        const cfg =
                          typeConfig[a.type] ??
                          typeConfig["announcement"];

                        return (
                          <div
                            key={a.id}
                            className="
                              group
                              relative
                              overflow-hidden
                              rounded-2xl
                              border
                              border-theme
                              p-4
                              transition-all
                              duration-200
                              hover:bg-[var(--row-hover)]
                            "
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={`
                                  ${cfg.bg}
                                  ${cfg.text}

                                  mt-0.5
                                  w-10
                                  h-10
                                  rounded-2xl
                                  flex
                                  items-center
                                  justify-center
                                  shrink-0
                                `}
                              >
                                {cfg.icon}
                              </div>

                              <div className="flex-1 min-w-0">
                                <p
                                  className="
                                    text-sm
                                    font-semibold
                                    leading-relaxed
                                    text-main
                                  "
                                >
                                  {a.title}
                                </p>

                                <p
                                  className="
                                    text-xs
                                    text-muted
                                    mt-2
                                  "
                                >
                                  {a.date}
                                </p>
                              </div>

                              {a.priority === "high" && (
                                <span
                                  className="
                                    badge
                                    bg-danger
                                    shrink-0
                                    text-[10px]
                                    tracking-wide
                                  "
                                >
                                  URGENT
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </SectionCard>

                  {/* Events */}

                  <SectionCard title="Upcoming Events">
                    <div className="space-y-3">
                      {DUMMY_EVENTS.map((event, i) => {
                        const cfg =
                          typeConfig[event.type] ??
                          typeConfig["event"];

                        return (
                          <div
                            key={i}
                            className="
                              flex
                              items-center
                              gap-3
                              rounded-2xl
                              border
                              border-theme
                              p-4
                              transition-all
                              duration-200
                              hover:bg-[var(--row-hover)]
                            "
                          >
                            <div
                              className={`
                                ${cfg.bg}
                                ${cfg.text}

                                w-10
                                h-10
                                rounded-2xl
                                flex
                                items-center
                                justify-center
                                shrink-0
                              `}
                            >
                              {cfg.icon}
                            </div>

                            <div className="min-w-0 flex-1">
                              <p
                                className="
                                  text-sm
                                  font-semibold
                                  text-main
                                "
                              >
                                {event.title}
                              </p>

                              <p
                                className="
                                  text-xs
                                  text-muted
                                  mt-1
                                "
                              >
                                {event.date}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </SectionCard>
                </section>
              </main>

              {/* SIDE INTELLIGENCE RAIL */}

              <aside className="flex flex-col gap-6">

                {/* Future widgets:
                    - Quick Actions
                    - Pending Approvals
                    - Activity Feed
                    - AI Insights
                    - Notifications
                */}

              </aside>
            </div>
          </section>

          {/* ─────────────────────────────────────────────
              4. INSIGHTS ZONE
          ───────────────────────────────────────────── */}

          <section id="dashboard-insights-zone">

            {/* Future analytics/charts */}

          </section>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;