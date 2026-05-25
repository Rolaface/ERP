import React, { useState } from "react";
import { AppSubTabs } from "../../../components/ui/app-shell";

// Adjust these imports based on your actual file structure
import HrAttendanceView from "./HrAttendanceView";
import HrTimesheetView from "./HrTimesheetView";

const TABS = [
  { id: "attendance", label: "Attendance" },
  { id: "timesheet",  label: "Timesheet" },
];

const HrAttendanceTimesheet: React.FC = () => {
  const [tab, setTab] = useState("attendance");

  return (
    <div className="h-full flex flex-col">
      {/* Navigation Header */}
      <AppSubTabs tabs={TABS} activeTab={tab} onChange={setTab} />
      
      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto">
        {tab === "attendance" && <HrAttendanceView />}
        {tab === "timesheet"  && <HrTimesheetView />}
      </div>
    </div>
  );
};

export default HrAttendanceTimesheet;

 