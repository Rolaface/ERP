import React from "react";

// ── DOMAIN MODULES ────────────────────────────────────────────────
import EmployeeOperatingBanner from "../../../components/dashboard/domains/hr/EmployeeOperatingBanner";

import TodayStatusCard from "../../../components/dashboard/domains/hr/TodayStatusCard";

import ActionCenter from "../../../components/dashboard/domains/hr/ActionCenter";

import AnnouncementPanel from "../../../components/dashboard/domains/hr/AnnouncementPanel";

import EmployeeSnapshot from "../../../components/dashboard/domains/hr/EmployeeSnapshot";
import TeamAvailability from "../../../components/dashboard/domains/hr/TeamAvailability";

import CalendarStrip from "../../../components/dashboard/domains/hr/CalendarStrip";
import WorkloadHeatmap from "../../../components/dashboard/domains/hr/WorkloadHeatmap";

// ────────────────────────────────────────────────────────────────

const EmployeeDashboard: React.FC = () => {
  return (
    <div className="h-full overflow-y-auto bg-[var(--background)]">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">

        {/* ─────────────────────────────────────────────
            EMPLOYEE OPERATING BANNER
        ───────────────────────────────────────────── */}
        <EmployeeOperatingBanner />

        {/* ─────────────────────────────────────────────
            🥇 PRIMARY OPERATIONAL ZONE
        ───────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          <div className="lg:col-span-2">
            <ActionCenter />
          </div>

          <TodayStatusCard />

        </div>

        {/* ─────────────────────────────────────────────
            🧭 TEMPORAL CONTEXT ZONE
        ───────────────────────────────────────────── */}
        {/* ─────────────────────────────────────────────
    🧭 TEMPORAL CONTEXT ZONE
───────────────────────────────────────────── */}
        <section className="space-y-4">

          <div className="space-y-1">
            <h2
              className="
        text-lg
        font-semibold
        text-[var(--foreground)]
      "
            >
              Upcoming Schedule
            </h2>

            <p
              className="
        text-sm
        text-[var(--muted-foreground)]
      "
            >
              Stay aligned with your upcoming workday flow
            </p>
          </div>

          <CalendarStrip />

        </section>

        {/* ─────────────────────────────────────────────
    SECONDARY & BACKGROUND CONTEXT LAYER
───────────────────────────────────────────── */}
        <div className="space-y-5">

          {/* 📢 AWARENESS ZONE */}
          <section className="space-y-3">
            <AnnouncementPanel />
          </section>

          {/* 🥉 TEAM CONTEXT ZONE */}
          <section className="space-y-3">

            <div className="space-y-1">
              <h2
                className="
          text-sm
          font-semibold
          uppercase
          tracking-wide
          text-[var(--muted-foreground)]
        "
              >
                Team Context
              </h2>

              <p
                className="
          text-sm
          text-[var(--muted-foreground)]
        "
              >
                Lightweight awareness about surrounding team activity
              </p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">

              <div className="opacity-90">
                <EmployeeSnapshot />
              </div>

              <div className="opacity-90">
                <TeamAvailability />
              </div>

            </div>

          </section>

          {/* 🧨 SYSTEM INSIGHTS */}
          <section
            className="
      space-y-3
      border-t
      border-[var(--border)]
      pt-4
      opacity-75
    "
          >

            <div className="space-y-1">
              <h2
                className="
          text-sm
          font-semibold
          uppercase
          tracking-wide
          text-[var(--muted-foreground)]
        "
              >
                System Insights
              </h2>

              <p
                className="
          text-sm
          text-[var(--muted-foreground)]
        "
              >
                Background operational analytics and workload patterns
              </p>
            </div>

            <WorkloadHeatmap />

          </section>

        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;