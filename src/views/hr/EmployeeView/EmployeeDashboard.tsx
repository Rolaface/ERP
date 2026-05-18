import React from "react";
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

import OperationalPageHeader from "./EmployeeViewComponents/OperationalPageHeader";
import KPIPriorityStrip from "./EmployeeViewComponents/KPIPriorityStrip";
import WorkspaceCluster from "./EmployeeViewComponents/WorkspaceCluster";
import IntelligenceRail from "./EmployeeViewComponents/IntelligenceRail";

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
  {
    name: "Independence Day",
    date: "15 Aug 2026",
    day: "Saturday",
  },

  {
    name: "Gandhi Jayanti",
    date: "02 Oct 2026",
    day: "Friday",
  },

  {
    name: "Diwali",
    date: "20 Oct 2026",
    day: "Tuesday",
  },

  {
    name: "Christmas",
    date: "25 Dec 2026",
    day: "Friday",
  },
];

const DUMMY_EVENTS = [
  {
    title: "Team Standup",
    date: "Today, 10:00 AM",
    type: "meeting",
  },

  {
    title: "HR Policy Review",
    date: "Tomorrow, 2:00 PM",
    type: "review",
  },

  {
    title: "Salary Disbursement",
    date: "30 May 2026",
    type: "payroll",
  },

  {
    title: "Team Building Event",
    date: "16 May 2026",
    type: "event",
  },
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

// ── Shared Section Card ──────────────────────────────────────────────────────

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

// ── Component ────────────────────────────────────────────────────────────────

const EmployeeDashboard: React.FC = () => {
  const { user } = useAuth();

  // ─────────────────────────────────────────────
  // KPI DATA LAYER
  // ─────────────────────────────────────────────

  const KPI_ITEMS = [
    {
      id: "days-present",

      label: "Days Present",

      value: DUMMY_QUICK_STATS.daysPresent,

      icon: <CheckCircle size={20} />,

      tone: "success" as const,

      priority: "high" as const,

      subtitle: "Attendance consistency this month",

      trend: {
        value: "+4%",
        positive: true,
      },
    },

    {
      id: "days-absent",

      label: "Days Absent",

      value: DUMMY_QUICK_STATS.daysAbsent,

      icon: <AlertCircle size={20} />,

      tone: "danger" as const,

      priority: "medium" as const,

      subtitle: "Absence tracking overview",

      trend: {
        value: "-1%",
        positive: true,
      },
    },

    {
      id: "pending-leaves",

      label: "Pending Leaves",

      value: DUMMY_QUICK_STATS.pendingLeaves,

      icon: <Clock size={20} />,

      tone: "warning" as const,

      priority: "high" as const,

      subtitle: "Awaiting HR approval",

      trend: {
        value: "+2",
        positive: false,
      },
    },

    {
      id: "pending-expenses",

      label: "Pending Expenses",

      value: DUMMY_QUICK_STATS.pendingExpenses,

      icon: <TrendingUp size={20} />,

      tone: "info" as const,

      priority: "medium" as const,

      subtitle: "Expense claims under review",

      trend: {
        value: "+6%",
        positive: false,
      },
    },
  ];

  // ─────────────────────────────────────────────
  // INTELLIGENCE RAIL DATA
  // ─────────────────────────────────────────────

  const intelligenceItems = [
    {
      id: "1",

      label: "Approval Alert",

      title: "5 leave requests pending approval",

      description:
        "Several leave approvals are awaiting manager review beyond expected SLA.",

      priority: "high" as const,
    },

    {
      id: "2",

      label: "Attendance Insight",

      title: "Attendance consistency improved",

      description:
        "Employee attendance increased compared to the previous operational cycle.",

      priority: "medium" as const,
    },

    {
      id: "3",

      label: "Expense Monitoring",

      title: "Expense claims require verification",

      description:
        "Some submitted reimbursements are missing supporting documentation.",

      priority: "medium" as const,
    },
  ];

  return (
    <div className="bg-app min-h-screen text-main overflow-y-auto">
      <div className="container-wide mx-auto px-4 lg:px-6 py-6 lg:py-8">

        {/* DASHBOARD STACK */}

        <div className="flex flex-col gap-6">

          {/* ─────────────────────────────────────────────
              1. HEADER ZONE
          ───────────────────────────────────────────── */}

          <section id="dashboard-header-zone">

            <OperationalPageHeader />

          </section>

          {/* ─────────────────────────────────────────────
              2. PRIORITY ZONE
          ───────────────────────────────────────────── */}

          <section id="dashboard-priority-zone">

            <KPIPriorityStrip
              title="Operational Snapshot"
              description="Monitor your attendance, approvals, leave activity, and workforce operations in one unified priority layer."
              items={KPI_ITEMS}
            />

          </section>

          {/* ─────────────────────────────────────────────
              3. WORKSPACE ZONE
          ───────────────────────────────────────────── */}

          <section id="dashboard-workspace-zone">

            <div
              className="
                grid
                grid-cols-1
                2xl:grid-cols-[minmax(0,1fr)_360px]
                gap-6
                items-start
              "
            >

              {/* ─────────────────────────────────────
                  PRIMARY WORKSPACE COLUMN
              ───────────────────────────────────── */}

              <main className="min-w-0 flex flex-col gap-6">

                {/* ─────────────────────────────────────
                    WORKFORCE OPERATIONS CLUSTER
                ───────────────────────────────────── */}

                <WorkspaceCluster
                  eyebrow="Operations Cluster"
                  title="Workforce Operations"
                  description="Centralized employee operations covering leave balances, attendance visibility, holidays, and operational planning."
                  contentClassName="flex flex-col gap-6"
                >

                  {/* LEAVE + HOLIDAY GRID */}

                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                    {/* LEAVE BALANCE */}

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
                            <div
                              key={leave.type}
                              className="space-y-2"
                            >
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

                    {/* HOLIDAYS */}

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

                  </div>

                </WorkspaceCluster>

                {/* ─────────────────────────────────────
                    COMMUNICATION CLUSTER
                ───────────────────────────────────── */}

                <WorkspaceCluster
                  eyebrow="Communication Cluster"
                  title="Communication & Coordination"
                  description="Operational communication layer for workforce announcements, organizational updates, and scheduled activities."
                  contentClassName="grid grid-cols-1 xl:grid-cols-2 gap-6"
                >

                  {/* ANNOUNCEMENTS */}

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

                  {/* EVENTS */}

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

                </WorkspaceCluster>

              </main>

              {/* ─────────────────────────────────────
                  INTELLIGENCE SIDE RAIL
              ───────────────────────────────────── */}

              <aside
                className="
                  min-w-0
                  flex
                  flex-col
                  gap-6
                "
              >

                <IntelligenceRail
                  items={intelligenceItems}
                />

              </aside>

            </div>

          </section>

          {/* ─────────────────────────────────────────────
              4. INSIGHTS ZONE
          ───────────────────────────────────────────── */}

          <section id="dashboard-insights-zone">

            <WorkspaceCluster
              eyebrow="Future Operations Layer"
              title="Workforce Insights & Predictive Analytics"
              description="Reserved operational intelligence layer for predictive analytics, workforce behavior insights, attendance forecasting, AI-driven recommendations, and future enterprise reporting systems."
              contentClassName="
                min-h-[240px]
                flex
                items-center
                justify-center
              "
            >

              <div className="max-w-2xl text-center">

                <div
                  className="
                    mx-auto
                    w-16
                    h-16
                    rounded-[20px]
                    bg-primary/10
                    text-primary

                    flex
                    items-center
                    justify-center
                  "
                >
                  <TrendingUp size={28} />
                </div>

                <h3
                  className="
                    mt-6
                    text-2xl
                    lg:text-3xl
                    font-bold
                    tracking-tight
                    text-main
                  "
                >
                  Enterprise Workforce Intelligence
                </h3>

                <p
                  className="
                    mt-4
                    text-sm
                    lg:text-base
                    leading-relaxed
                    text-muted
                  "
                >
                  This future analytics environment will consolidate
                  operational forecasting, productivity intelligence,
                  behavioral workforce analytics, AI-generated operational
                  recommendations, and strategic HR insights into a unified
                  enterprise intelligence platform.
                </p>

              </div>

            </WorkspaceCluster>

          </section>

        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;