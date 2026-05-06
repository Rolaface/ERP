import React, { useState } from "react";
import {
  FaUserTie,
  FaUserFriends,
  FaClipboardList,
  FaCalendarDay,
  FaMoneyCheckAlt,
  FaChartLine,
  FaSlidersH,
} from "react-icons/fa";

import {
  AppPage,
  AppPageHeader,
  AppTabs,
  AppPageBody,
} from "../../components/ui/app-shell";

import HrDashboard from "./HrDashboard";
import EmployeeManagement from "./EmployeeManagement/EmployeeManagement";
import PerformanceDevelopment from "./performance&growth/performancedevolpment";
import ComplianceManagement from "./compiliance/ComplianceManagement";
import TimeAttendance from "./time_leave/Attendance";
import Leave from "./time_leave/Leave";
import PayrollManagement from "./payroll-system/PayrollManagement";
import HRSettingsPage from "./hrsetup";

const navTabs = [
  { key: "dashboard", label: "HR Dashboard", icon: <FaChartLine /> },
  { key: "management", label: "Employee Management", icon: <FaUserFriends /> },
  { key: "leave", label: "Leave Management", icon: <FaClipboardList /> },
  { key: "attendance", label: "Time & Attendance", icon: <FaCalendarDay /> },
  { key: "performance", label: "Performance & Growth", icon: <FaChartLine /> },
  { key: "payroll", label: "Payroll", icon: <FaMoneyCheckAlt /> },
  // { key: "compliance", label: "Compliance Management", icon: <FaClipboardList /> },
  { key: "Hrsetting", label: "HR Setup", icon: <FaSlidersH /> },
];

const HrPayrollModule: React.FC = () => {
  const [tab, setTab] = useState("dashboard");

  return (
    <AppPage viewportLocked>
      {/* Header */}
      <AppPageHeader
        title="Human Resources"
        icon={<FaUserTie />}
        description="Manage employees, payroll, attendance, and compliance"
      />

      {/* Tabs */}
      <AppTabs
        tabs={navTabs.map((t) => ({
          id: t.key,
          label: t.label,
          icon: t.icon,
        }))}
        activeTab={tab}
        onChange={setTab}
      />

      {/* Content */}
      <AppPageBody className="mt-2">
        {tab === "dashboard" && <HrDashboard />}
        {tab === "management" && <EmployeeManagement />}
        {tab === "attendance" && <TimeAttendance />}
        {tab === "leave" && <Leave />}
        {tab === "payroll" && <PayrollManagement />}
        {tab === "performance" && <PerformanceDevelopment />}
        {/* {tab === "compliance" && <ComplianceManagement />} */}
        {tab === "Hrsetting" && <HRSettingsPage />}
      </AppPageBody>
    </AppPage>
  );
};

export default HrPayrollModule;