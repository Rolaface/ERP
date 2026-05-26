import React, { useState } from "react";
import { AppSubTabs } from "../../../components/ui/app-shell";

// Adjust these imports based on your actual file structure
import EmployeeAttendance from "./EmployeeAttendance";
import EmployeeTimesheet from "./EmployeeTimesheet";

const TABS = [
  { id: "attendance", label: "Attendance" },
  { id: "timesheet",  label: "Timesheet" },
];

const EmployeeAttendanceTimesheet: React.FC = () => {
  const [tab, setTab] = useState("attendance");

  return (
    <div className="h-full flex flex-col">
      {/* Navigation Header */}
      <AppSubTabs tabs={TABS} activeTab={tab} onChange={setTab} />
      
      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto">
        {tab === "attendance" && <EmployeeAttendance />}
        {tab === "timesheet"  && <EmployeeTimesheet />}
      </div>
    </div>
  );
};

export default EmployeeAttendanceTimesheet;

 