import React, { useMemo, useState } from "react";
import { ListTodo, Clock } from "lucide-react";
import { AppSubTabs } from "../../../../components/ui/app-shell";
import { useAuth } from "../../../../context/AuthContext";
import { usePermission } from "../../../../hooks/permission/usePermission";
import HrTaskView from "../../../project_management/task/table/HrTaskView";
import HrTimesheetView from "../../../project_management/timesheet/table/HrTimesheetView";

const TASK_TIMESHEET_TABS = [
  { id: "task", label: "Task", icon: <ListTodo size={14} />, module: "Task" },
  { id: "timesheet", label: "Timesheet", icon: <Clock size={14} />, module: "Timesheet" },
];

const EmployeeTaskTimesheet: React.FC = () => {
  const { user } = useAuth();
  const { can, permissions, isAdmin } = usePermission();
  const [activeTab, setActiveTab] = useState("task");

  const tabs = useMemo(
    () => TASK_TIMESHEET_TABS.filter((t) => can(t.module, "read")),
    [can, permissions, isAdmin],
  );

  if (tabs.length === 0) return null;
  const current = tabs.some((t) => t.id === activeTab) ? activeTab : tabs[0].id;

  return (
    <div className="h-full flex flex-col">
      {tabs.length > 1 && (
        <AppSubTabs tabs={tabs} activeTab={current} onChange={setActiveTab} />
      )}
      <div className="flex-1 overflow-y-auto mt-5">
        {current === "task" && (
          <HrTaskView context="employee" currentUserEmail={user?.email} />
        )}
        {current === "timesheet" && <HrTimesheetView />}
      </div>
    </div>
  );
};

export default EmployeeTaskTimesheet;