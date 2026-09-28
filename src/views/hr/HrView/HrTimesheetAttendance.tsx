import React, { useState } from "react";
import { AppSubTabs } from "../../../components/ui/app-shell";

// Adjust these imports based on your actual file structure
import HrAttendanceView from "./HrAttendanceView";
import HrTimesheetView from "../../project_management/timesheet/table/HrTimesheetView";

const TABS = [
  { id: "attendance", label: "Attendance" },
  { id: "timesheet",  label: "Timesheet" },
];

interface HrAttendanceTimesheetProps {
  mode?: "attendance" | "timesheet";
}

const HrAttendanceTimesheet: React.FC<HrAttendanceTimesheetProps> = ({ mode }) => {
  const [tab, setTab] = useState<"attendance" | "timesheet">(mode ?? "attendance");

  const handleTabChange = (tabId: string) => {
    setTab(tabId as "attendance" | "timesheet");
  };

  if (mode) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-1 overflow-y-auto">
          {mode === "attendance" && <HrAttendanceView />}
          {mode === "timesheet" && <HrTimesheetView />}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <AppSubTabs tabs={TABS} activeTab={tab} onChange={handleTabChange} />

      <div className="flex-1 overflow-y-auto">
        {tab === "attendance" && <HrAttendanceView />}
        {tab === "timesheet"  && <HrTimesheetView />}
      </div>
    </div>
  );
};

export default HrAttendanceTimesheet;