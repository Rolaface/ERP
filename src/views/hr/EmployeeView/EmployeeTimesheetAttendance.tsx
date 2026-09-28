import React, { useState } from "react";
import { AppSubTabs } from "../../../components/ui/app-shell";


import EmployeeAttendance from "./EmployeeAttendance";
import EmployeeTimesheet from "./project/EmployeeTaskTimesheet";

const TABS = [
  { id: "attendance", label: "Attendance" },
  { id: "timesheet",  label: "Timesheet" },
];

interface EmployeeAttendanceTimesheetProps {
  mode?: "attendance" | "timesheet";
}

const EmployeeAttendanceTimesheet: React.FC<EmployeeAttendanceTimesheetProps> = ({ mode }) => {
  const [tab, setTab] = useState<"attendance" | "timesheet">(mode ?? "attendance");

  const handleTabChange = (tabId: string) => {
    setTab(tabId as "attendance" | "timesheet");
  };


  if (mode) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-1 overflow-y-auto">
          {mode === "attendance" && <EmployeeAttendance />}
          {mode === "timesheet" && <EmployeeTimesheet />}
        </div>
      </div>
    );
  }


  return (
    <div className="h-full flex flex-col">
      {/* Navigation Header */}
      <AppSubTabs tabs={TABS} activeTab={tab} onChange={handleTabChange} />

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto">
        {tab === "attendance" && <EmployeeAttendance />}
        {tab === "timesheet"  && <EmployeeTimesheet />}
      </div>
    </div>
  );
};

export default EmployeeAttendanceTimesheet;