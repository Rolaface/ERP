import React from "react";

// ── OPERATING SURFACE ─────────────────────────────────────────────
import EmployeeOperatingBanner from "../../../components/dashboard/domains/hr/EmployeeOperatingBanner";



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

     
        <section
          className="
            mb-5
            transition-all
            duration-200
          "
        >

          <EmployeeOperatingBanner />

        </section>

        

      </div>

    </div>
  );
};

export default EmployeeDashboard;