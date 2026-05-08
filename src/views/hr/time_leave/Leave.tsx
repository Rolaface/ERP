import React, { useState } from "react";
import { Calendar, Clock, ClipboardList, Settings, User } from "lucide-react";
import { useUrlTab } from "../../../hooks/useUrlTab";
import { HrSectionFrame } from "../components/HrTabLayout";
import LeaveManagement from "./LeaveApproval";
import LeaveApply from "./LeaveApply";
import History from "./History";
import Setup from "./Setup";
import EmployeeDashboard from "./EmployeeLeaveDashboard";
import EmployeeHistory from "./EmployeeLeaveHistory";

const Leave: React.FC = () => {
  const tabs = [
    { id: "leave", label: "Leave Approval", icon: <Clock size={15} /> },
    { id: "employeeDashboard", label: "Employee Dashboard", icon: <User size={15} /> },
    { id: "leaveApply", label: "Leave Apply", icon: <Calendar size={15} /> },
    { id: "employeeHistory", label: "Employee History", icon: <ClipboardList size={15} /> },
    { id: "history", label: "History", icon: <ClipboardList size={15} /> },
    { id: "setup", label: "Setup", icon: <Settings size={15} /> },
  ];

  const [tab, setTab] = useUrlTab({
    tabs,
    defaultTab: "leave",
    param: "leaveTab",
    basePath: "/hr",
  });
  const [editLeaveId, setEditLeaveId] = useState<string | null>(null);

  const handleGoToApply = () => {
    setEditLeaveId(null);
    setTab("leaveApply");
  };

  const handleEditLeave = (leaveId: string) => {
    setEditLeaveId(leaveId);
    setTab("leaveApply");
  };

  return (
    <HrSectionFrame
      tabs={tabs}
      activeTab={tab}
      onTabChange={setTab}
    >
      {tab === "leave" && <LeaveManagement />}
      {tab === "leaveApply" && <LeaveApply editLeaveId={editLeaveId} />}
      {tab === "employeeDashboard" && <EmployeeDashboard />}
      {tab === "employeeHistory" && <EmployeeHistory />}
      {tab === "history" && (
        <History onNewRequest={handleGoToApply} onEditLeave={handleEditLeave} />
      )}
      {tab === "setup" && <Setup />}
    </HrSectionFrame>
  );
};

export default Leave;
