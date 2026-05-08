import React, { lazy, Suspense, useMemo } from "react";
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
import AppSkeleton from "../../components/ui/AppSkeleton";
import { useUrlTab } from "../../hooks/useUrlTab";

const HrDashboard = lazy(() => import("./HrDashboard"));
const EmployeeManagement = lazy(() => import("./EmployeeManagement/EmployeeManagement"));
const PerformanceDevelopment = lazy(() => import("./performance&growth/performancedevolpment"));
const TimeAttendance = lazy(() => import("./time_leave/Attendance"));
const Leave = lazy(() => import("./time_leave/Leave"));
const PayrollManagement = lazy(() => import("./payroll-system/PayrollManagement"));
const HRSettingsPage = lazy(() => import("./hrsetup"));

const navTabs = [
  { key: "dashboard", label: "HR Dashboard", icon: <FaChartLine /> },
  { key: "management", label: "Employee Management", icon: <FaUserFriends /> },
  { key: "leave", label: "Leave Management", icon: <FaClipboardList /> },
  { key: "attendance", label: "Time & Attendance", icon: <FaCalendarDay /> },
  { key: "performance", label: "Performance & Growth", icon: <FaChartLine /> },
  { key: "payroll", label: "Payroll", icon: <FaMoneyCheckAlt /> },
  // { key: "compliance", label: "Compliance Management", icon: <FaClipboardList /> },
  { key: "setup", label: "HR Setup", icon: <FaSlidersH /> },
];

const HrPayrollModule: React.FC = () => {
  const tabs = useMemo(
    () =>
      navTabs.map((t) => ({
        id: t.key,
        label: t.label,
        icon: t.icon,
      })),
    [],
  );

  const [tab, setTab] = useUrlTab({
    tabs,
    defaultTab: "dashboard",
    basePath: "/hr",
    pathPrefix: "/hr",
  });

  const renderTab = () => {
    switch (tab) {
      case "dashboard":
        return <HrDashboard />;
      case "management":
        return <EmployeeManagement />;
      case "attendance":
        return <TimeAttendance />;
      case "leave":
        return <Leave />;
      case "payroll":
        return <PayrollManagement />;
      case "performance":
        return <PerformanceDevelopment />;
      case "setup":
        return <HRSettingsPage />;
      default:
        return <HrDashboard />;
    }
  };

  return (
    <AppPage viewportLocked={tab === "dashboard"}>
      <AppPageHeader
        title="Human Resources"
        icon={<FaUserTie />}
        description="Manage employees, payroll, attendance, and compliance"
      />

      <AppTabs
        tabs={tabs}
        activeTab={tab}
        onChange={setTab}
      />

      <AppPageBody className="mt-2" viewportLocked={tab === "dashboard"}>
        <Suspense fallback={<AppSkeleton />}>{renderTab()}</Suspense>
      </AppPageBody>
    </AppPage>
  );
};

export default HrPayrollModule;
