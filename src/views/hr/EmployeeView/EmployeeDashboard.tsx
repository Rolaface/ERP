import React from "react";

// ── OPERATING SURFACE ─────────────────────────────────────────────
import EmployeeOperatingBanner from "../../../components/dashboard/domains/hr/EmployeeOperatingBanner";
import TodayAttendance from "../../../components/dashboard/domains/hr/TodayAttendance";

const EmployeeDashboard: React.FC = () => {
  return (
    <div
      className="
        h-full
        overflow-y-auto
        bg-[var(--background)]
      "
    >
      <div className="mx-auto max-w-7xl px-5 py-4">
        {/* ── OPERATING BANNER ───────────────────────────────────── */}
        <section
          className="
            mb-5
            transition-all
            duration-200
          "
        >
          <EmployeeOperatingBanner />
        </section>

        {/* ── DAILY OPERATIONS GRID ─────────────────────────────── */}
        <section
          className="
            grid
            grid-cols-1
            gap-5
            xl:grid-cols-2
          "
        >
          <TodayAttendance />
        </section>
      </div>
    </div>
  );
};

export default EmployeeDashboard;