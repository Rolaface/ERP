import React, { useMemo, useState } from "react";

import { ListTodo, Clock } from "lucide-react";

import { AppSubTabs } from "../../../../components/ui/app-shell";

import HrTaskView from "../../../project_management/task/table/HrTaskView";
import HrTimesheetView from "../../../project_management/timesheet/table/HrTimesheetView";

const TASK_TIMESHEET_TABS = [
  {
    id: "task",
    label: "Task",
    icon: <ListTodo size={14} />,
  },
  {
    id: "timesheet",
    label: "Timesheet",
    icon: <Clock size={14} />,
  },
];

const getStoredUserEmail = (): string | undefined => {
  try {
    const raw = localStorage.getItem("auth_user");
    return raw ? JSON.parse(raw)?.email : undefined;
  } catch {
    return undefined;
  }
};

const EmployeeTaskTimesheet: React.FC = () => {
  const [activeTab, setActiveTab] = useState("task");
  const currentUserEmail = useMemo(getStoredUserEmail, []);

  return (
    <div className="h-full flex flex-col">
      <AppSubTabs
        tabs={TASK_TIMESHEET_TABS}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      <div className="flex-1 overflow-y-auto mt-5">
        {activeTab === "task" && (
          <HrTaskView context="employee" currentUserEmail={currentUserEmail} />
        )}

        {activeTab === "timesheet" && <HrTimesheetView />}
      </div>
    </div>
  );
};

export default EmployeeTaskTimesheet;