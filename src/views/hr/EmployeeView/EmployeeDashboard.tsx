import React from "react";

// ── OPERATING SURFACE ─────────────────────────────────────────────
import EmployeeOperatingBanner from "../../../components/dashboard/domains/hr/EmployeeOperatingBanner";

// ── TEMPORAL FLOW ────────────────────────────────────────────────
import CalendarStrip from "../../../components/dashboard/domains/hr/CalendarStrip";

// ── PRIMARY OPERATIONAL FLOW ─────────────────────────────────────
import TodayStatusCard from "../../../components/dashboard/domains/hr/TodayStatusCard";
import ActionCenter from "../../../components/dashboard/domains/hr/ActionCenter";
import MyWorkdayPanel from "../../../components/dashboard/domains/hr/MyWorkdayPanel";
import AnnouncementPanel from "../../../components/dashboard/domains/hr/AnnouncementPanel";

// ── CONTEXTUAL INTELLIGENCE ──────────────────────────────────────
import AmbientSignalRail from "../../../components/dashboard/domains/hr/AmbientSignalRail";
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
      <div className="mx-auto max-w-7xl px-5 py-4">

        {/* ───────────────────────────────────────────── */}
        {/* LEVEL 1 — OPERATING HEADER */}
        {/* ───────────────────────────────────────────── */}
        <section
          className="
            mb-5
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
            mb-6
            transition-colors
            duration-200
          "
        >

          <div
            className="
              pb-3
              border-b
              border-[color-mix(in_srgb,var(--border)_20%,transparent)]
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
            gap-x-10
            gap-y-6
            items-start
          "
        >

          {/* ───────────────────────────────────────── */}
          {/* PRIMARY OPERATIONAL SPINE */}
          {/* 8 COLUMN DOMINANT EXECUTION FLOW */}
          {/* ───────────────────────────────────────── */}
          <div
            className="
              xl:col-span-8
              min-w-0
            "
          >

            <div
              className="
                relative
                space-y-0
              "
            >

              {/* CONTINUOUS OPERATIONAL GUIDE */}
              <div
                className="
                  absolute
                  left-0
                  top-0
                  bottom-0
                  w-px
                  bg-[color-mix(in_srgb,var(--border)_14%,transparent)]
                "
              />

              {/* TODAY STATUS */}
              <section
                className="
                  relative
                  pl-6
                  pb-6
                "
              >

                {/* ACTIVE STATE INDICATOR */}
                <div
                  className="
                    absolute
                    left-[-3px]
                    top-6
                    h-2
                    w-2
                    rounded-full
                    bg-emerald-500
                    motion-safe:animate-pulse
                  "
                />

                <TodayStatusCard />

              </section>

              {/* WORKDAY FLOW */}
              <section
                className="
                  relative
                  pl-6
                  py-6
                  border-t
                  border-[color-mix(in_srgb,var(--border)_10%,transparent)]
                "
              >

                <MyWorkdayPanel />

              </section>

              {/* ACTION CENTER */}
              <section
                className="
                  relative
                  pl-6
                  py-6
                  border-t
                  border-[color-mix(in_srgb,var(--border)_10%,transparent)]
                "
              >

                <ActionCenter />

              </section>

              {/* ANNOUNCEMENTS */}
              <section
                className="
                  relative
                  pl-6
                  pt-6
                  border-t
                  border-[color-mix(in_srgb,var(--border)_8%,transparent)]
                "
              >

                <AnnouncementPanel />

              </section>

            </div>

          </div>

          {/* ───────────────────────────────────────── */}
          {/* CONTEXTUAL INTELLIGENCE RAIL */}
          {/* 4 COLUMN PERIPHERAL SYSTEM */}
          {/* ───────────────────────────────────────── */}
          <div
            className="
              xl:col-span-4
              min-w-0
            "
          >

            <div
              className="
                sticky
                top-4
              "
            >

              {/* CONTEXTUAL STREAM */}
              <div
                className="
                  rounded-[28px]
                  border
                  border-[color-mix(in_srgb,var(--border)_12%,transparent)]
                  bg-[color-mix(in_srgb,var(--card)_40%,transparent)]
                  overflow-hidden
                  backdrop-blur-sm
                "
              >

                {/* TEAM AVAILABILITY */}
                <section
                  className="
                    px-5
                    pt-5
                    pb-5
                  "
                >

                  <TeamAvailability />

                </section>

                {/* AMBIENT SIGNALS */}
                <section
                  className="
                    px-5
                    py-5
                    border-t
                    border-[color-mix(in_srgb,var(--border)_10%,transparent)]
                  "
                >

                  <AmbientSignalRail />

                </section>

                {/* EMPLOYEE CONTEXT */}
                <section
                  className="
                    px-5
                    py-5
                    border-t
                    border-[color-mix(in_srgb,var(--border)_10%,transparent)]
                  "
                >

                  <EmployeeSnapshot />

                </section>

                {/* SUPPORT FLOW */}
                <section
                  className="
                    px-5
                    py-5
                    border-t
                    border-[color-mix(in_srgb,var(--border)_8%,transparent)]
                  "
                >

                  <FlowSupportPanel />

                </section>

              </div>

            </div>

          </div>

        </section>

        {/* SPATIAL TERMINATION */}
        <div className="h-10" />

      </div>

    </div>
  );
};

export default EmployeeDashboard;