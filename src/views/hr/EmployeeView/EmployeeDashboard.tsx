import React from "react";

// ── OPERATING SURFACE ─────────────────────────────────────────────
import EmployeeOperatingBanner from "../../../components/dashboard/domains/hr/EmployeeOperatingBanner";

// ── TEMPORAL FLOW ────────────────────────────────────────────────
import CalendarStrip from "../../../components/dashboard/domains/hr/CalendarStrip";

// ── OPERATIONAL FLOW STREAM ──────────────────────────────────────
import TodayStatusCard from "../../../components/dashboard/domains/hr/TodayStatusCard";
import ActionCenter from "../../../components/dashboard/domains/hr/ActionCenter";
import MyWorkdayPanel from "../../../components/dashboard/domains/hr/MyWorkdayPanel";
import AnnouncementPanel from "../../../components/dashboard/domains/hr/AnnouncementPanel";

// ── AMBIENT INTELLIGENCE ─────────────────────────────────────────
import AmbientSignalRail from "../../../components/dashboard/domains/hr/AmbientSignalRail";

// ── TEAM FLOW STREAM ─────────────────────────────────────────────
import EmployeeSnapshot from "../../../components/dashboard/domains/hr/EmployeeSnapshot";
import TeamAvailability from "../../../components/dashboard/domains/hr/TeamAvailability";
import FlowSupportPanel from "../../../components/dashboard/domains/hr/FlowSupportPanel";

// ─────────────────────────────────────────────────────────────────

const EmployeeDashboard: React.FC = () => {
  return (
    <div
      className="
        h-full
        overflow-y-auto
        bg-[var(--background)]
      "
    >

      {/* ROOT OPERATIONAL CANVAS */}
      <div className="mx-auto max-w-7xl px-5 py-3">

        {/* ───────────────────────────────────────────── */}
        {/* LEVEL 1 — OPERATING HEADER */}
        {/* ───────────────────────────────────────────── */}
        <section
          className="
            mb-4
            transition-all
            duration-200
          "
        >

          <EmployeeOperatingBanner />

        </section>

        {/* ───────────────────────────────────────────── */}
        {/* LEVEL 2 — TEMPORAL RHYTHM */}
        {/* ───────────────────────────────────────────── */}
        <section
          className="
            mb-5
            transition-colors
            duration-200
          "
        >

          <div
            className="
              pb-3
              border-b
              border-[color-mix(in_srgb,var(--border)_24%,transparent)]
              transition-colors
              duration-200
            "
          >

            <CalendarStrip />

          </div>

        </section>

        {/* ───────────────────────────────────────────── */}
        {/* CONTINUOUS OPERATIONAL WORKSPACE */}
        {/* ───────────────────────────────────────────── */}
        <section
          className="
            grid
            grid-cols-1
            xl:grid-cols-12
            gap-x-7
            gap-y-4
            items-start
          "
        >

          {/* ───────────────────────────────────────── */}
          {/* LEVEL 1 — PRIMARY OPERATIONAL FLOW */}
          {/* ───────────────────────────────────────── */}
          <div
            className="
              xl:col-span-7
              min-w-0
            "
          >

            <div className="space-y-5">

              {/* CRITICAL STATUS */}
              <div
                className="
                  group
                  relative
                  pl-3
                  border-l
                  border-[color-mix(in_srgb,var(--primary)_30%,transparent)]
                  transition-colors
                  duration-200
                  hover:border-[color-mix(in_srgb,var(--primary)_45%,transparent)]
                "
              >

                {/* LIVE STATUS BREATH */}
                <div
                  className="
                    absolute
                    left-[-1px]
                    top-5
                    h-2
                    w-[2px]
                    rounded-full
                    bg-[var(--primary)]
                    opacity-70
                    motion-safe:animate-pulse
                  "
                />

                <TodayStatusCard />

              </div>

              {/* ACTIVE WORKDAY */}
              <div
                className="
                  pl-3
                  transition-all
                  duration-200
                "
              >

                <MyWorkdayPanel />

              </div>

              {/* CRITICAL ACTIONS */}
              <div
                className="
                  pt-2
                  pl-3
                  border-t
                  border-[color-mix(in_srgb,var(--border)_14%,transparent)]
                  transition-colors
                  duration-200
                  hover:border-[color-mix(in_srgb,var(--border)_24%,transparent)]
                "
              >

                <ActionCenter />

              </div>

              {/* AMBIENT ANNOUNCEMENTS */}
              <div
                className="
                  pt-2
                  border-t
                  border-[color-mix(in_srgb,var(--border)_10%,transparent)]
                  transition-colors
                  duration-200
                  hover:border-[color-mix(in_srgb,var(--border)_18%,transparent)]
                "
              >

                <AnnouncementPanel />

              </div>

            </div>

          </div>

          {/* ───────────────────────────────────────── */}
          {/* LEVEL 3 — AMBIENT INTELLIGENCE */}
          {/* ───────────────────────────────────────── */}
          <div
            className="
              xl:col-span-2
              min-w-0
              pt-1
              transition-all
              duration-200
            "
          >

            <AmbientSignalRail />

          </div>

          {/* ───────────────────────────────────────── */}
          {/* LEVEL 2 — TEAM FLOW STREAM */}
          {/* ───────────────────────────────────────── */}
          <div
            className="
              xl:col-span-3
              min-w-0
            "
          >

            {/* TEAM PRESENCE STREAM */}
            <div
              className="
                divide-y
                divide-[color-mix(in_srgb,var(--border)_14%,transparent)]
                transition-colors
                duration-200
              "
            >

              {/* ACTIVE COLLABORATION */}
              <div
                className="
                  pb-4
                  transition-all
                  duration-200
                "
              >

                <TeamAvailability />

              </div>

              {/* TEAM CONTEXT */}
              <div
                className="
                  py-4
                  transition-all
                  duration-200
                "
              >

                <EmployeeSnapshot />

              </div>

              {/* FLOW SUPPORT */}
              <div
                className="
                  pt-4
                  transition-all
                  duration-200
                "
              >

                <FlowSupportPanel />

              </div>

            </div>

          </div>

        </section>

        {/* SPATIAL TERMINATION */}
        <div className="h-8" />

      </div>

    </div>
  );
};

export default EmployeeDashboard;