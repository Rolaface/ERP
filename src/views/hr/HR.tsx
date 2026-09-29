import React, {
  lazy,
  Suspense,
  useMemo,
  useEffect,
  useState,
  ComponentType,
} from "react";
import {
  FaUserTie,
  FaUserFriends,
  FaClipboardList,
  FaCalendarDay,
  FaMoneyCheckAlt,
  FaChartLine,
  FaSlidersH,
  FaTasks,
  FaRegClock,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import {
  AppPage,
  AppPageHeader,
  AppPageBody,
} from "../../components/ui/app-shell";
import AppSkeleton from "../../components/ui/AppSkeleton";
import { useUrlTab } from "../../hooks/useUrlTab";
import { HrContentFrame, HrPrimaryTabs, HrSecondaryTabs } from "./components/HrTabLayout";
import { usePermission } from "../../hooks/permission/usePermission";
import { useHRView } from "../../hooks/permission/useHRView";

interface LeaveProps {
  isEmployeeView?: boolean;
}

interface EmployeeManagementProps {
  isEmployeeView?: boolean;
}

interface MyProfileProps {
  isPureEmployee?: boolean;
}

interface AttendanceTimesheetProps {
  mode?: "attendance" | "timesheet";
}

// ── Professional view lazy imports ────────────────────────────────────────────

const HrDashboard = lazy(() => import("./HrDashboard"));
const EmployeeManagement = lazy<ComponentType<EmployeeManagementProps>>(
  () => import("./EmployeeManagement/EmployeeManagement"),
);

const Leave = lazy<ComponentType<LeaveProps>>(
  () => import("./time_leave/LeaveManagementt"),
);
const PayrollManagement = lazy(
  () => import("./payroll-system/PayrollManagement"),
);
const HRSettingsPage = lazy(() => import("./hrsetup"));

// ── Employee view lazy imports ────────────────────────────────────────────────

const EmployeeDashboard = lazy(
  () => import("./EmployeeView/EmployeeDashboard"),
);
const EmployeeFinancials = lazy(
  () => import("./EmployeeView/EmployeeFinancials"),
);
const MyProfile = lazy<ComponentType<MyProfileProps>>(
  () => import("./EmployeeView/MyProfile"),
);
const EmployeeLeave = lazy<ComponentType<LeaveProps>>(
  () => import("./time_leave/LeaveManagementt"),
);
const EmployeeAttendanceTimesheet = lazy<ComponentType<AttendanceTimesheetProps>>(
  () => import("./EmployeeView/EmployeeTimesheetAttendance"),
);
const HrAttendanceTimesheet = lazy<ComponentType<AttendanceTimesheetProps>>(
  () => import("./HrView/HrTimesheetAttendance"),
);
const EmployeeDocuments = lazy(
  () => import("./EmployeeView/EmployeeDocuments"),
);
const EmployeeReports = lazy(() => import("./EmployeeView/EmployeeReports"));
const EmployeeCompliance = lazy(
  () => import("./EmployeeView/EmployeeCompliance"),
);
const PerformanceModule = lazy(() => import("../../views/hr/performace/PerformanceModule"));

const EmployeeExpenses = lazy(
  () => import("../ExpenseManagement/expenseManagemetTable"),
);
const TaskManagement = lazy(
  () => import("../project_management/task/table/HrTaskView"),
);
const EmployeeTaskTimesheet = lazy(
  () => import("./EmployeeView/project/EmployeeTaskTimesheet"),
);
// ─── Employee tab IDs — must stay in sync with EMPLOYEE_HR_TABS in Sidebar.tsx

const EMPLOYEE_TAB_IDS = [
  "emp-dashboard",
  "emp-financials",
  "emp-profile",
  "emp-leave",
  "emp-attendance",
  "emp-task-timesheet",
  "emp-documents",
  "emp-reports",
  "emp-performance-growth",
  "emp-reimburse",
  "emp-expenses",
  "emp-compliance",
  "emp-appraisals",
] as const;

type EmployeeTabId = (typeof EMPLOYEE_TAB_IDS)[number];

const LEAVE_CHILD_MODULES = [
  "Leave Type",
  "Leave Period",
  "Leave Policy",
  "Leave Policy Assignment",
  "Holiday List",
  "Shift Type",
] as const;

// ── Task & Timesheet merged tab: secondary sub-tabs ───────────────────────────
// Each sub-tab is guarded by its OWN permission module/action, kept fully
// separate from the other, so splitting them into independent primary tabs
// later (if ever needed) requires no permission-logic rework.
const TASK_TIMESHEET_SUB_TABS = [
  {
    id: "task",
    label: "Task",
    icon: <FaTasks size={14} />,
    module: "Task" as const,
    action: "read" as const,
  },
  {
    id: "timesheet",
    label: "Timesheet",
    icon: <FaRegClock size={14} />,
    module: "Timesheet" as const,
    action: "read" as const,
  },
] as const;

type TaskTimesheetSubTabId = (typeof TASK_TIMESHEET_SUB_TABS)[number]["id"];

// ─── Component ────────────────────────────────────────────────────────────────

const HrPayrollModule: React.FC = () => {
  const { can } = usePermission();
  const { viewMode, canSwitchView, isPureEmployee, switchToProfessional } =
    useHRView();
  const navigate = useNavigate();
  const isEmployeeView = viewMode === "employee";

  // ── Task & Timesheet merged sub-tab state (professional view "timesheet" tab) ─
  const [taskTimesheetSubTab, setTaskTimesheetSubTab] =
    useState<TaskTimesheetSubTabId>("task");

  // Sub-tabs filtered by each one's own permission — fully independent checks
  const visibleTaskTimesheetSubTabs = useMemo(
    () => TASK_TIMESHEET_SUB_TABS.filter((t) => can(t.module, t.action)),
    [can],
  );

  // If the currently-selected sub-tab is no longer permitted (or wasn't
  // permitted from the start), fall back to the first one the user can see.
  useEffect(() => {
    const exists = visibleTaskTimesheetSubTabs.some(
      (t) => t.id === taskTimesheetSubTab,
    );
    if (!exists && visibleTaskTimesheetSubTabs.length > 0) {
      setTaskTimesheetSubTab(visibleTaskTimesheetSubTabs[0].id);
    }
  }, [visibleTaskTimesheetSubTabs]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Professional view tabs ────────────────────────────────────────────────
  const professionalTabs = useMemo(
    () => [
      ...(can("Employee", "read")
        ? [{ id: "dashboard", label: "HR Dashboard", icon: <FaChartLine /> }]
        : []),
      ...(can("Employee", "read")
        ? [
          {
            id: "management",
            label: "Employee Management",
            icon: <FaUserFriends />,
          },
        ]
        : []),
      ...(can("Leave Application", "read")
        ? [
          {
            id: "leave",
            label: "Leave Management",
            icon: <FaClipboardList />,
          },
        ]
        : []),
      ...(can("Attendance", "read")
        ? [
          {
            id: "attendance",
            label: "Attendance",
            icon: <FaCalendarDay />,
          },
        ]
        : []),

      // ── Task + Timesheet merged into a single primary tab ──────────────────
      // Visible if the user has read access to EITHER child module — each
      // child still checks its own permission independently inside the tab.
      ...(TASK_TIMESHEET_SUB_TABS.some((t) => can(t.module, t.action))
        ? [
          {
            id: "timesheet",
            label: "Task & Timesheet",
            icon: <FaClipboardList />,
          },
        ]
        : []),
      ...(can("Performance", "read")
        ? [
          {
            id: "performance-growth",
            label: "Performance & Growth",
            icon: <FaChartLine />,
          },
        ]
        : []),
      ...(can("Payroll Entry", "create")
        ? [{ id: "payroll", label: "Payroll", icon: <FaMoneyCheckAlt /> }]
        : []),

      // ── HR Setup primary tab ──────────────────────────────────────────────
      ...(can("Employee", "create") ||
        can("Payroll Entry", "create") ||
        LEAVE_CHILD_MODULES.some((mod) => can(mod, "create"))
        ? [{ id: "setup", label: "HR Setup", icon: <FaSlidersH /> }]
        : []),
    ],
    [can],
  );

  const employeeTabs = useMemo(
    () => EMPLOYEE_TAB_IDS.map((id) => ({ id, label: id, icon: null })),
    [],
  );

  const visibleTabs = isEmployeeView ? employeeTabs : professionalTabs;

  const [tab, setTab] = useUrlTab({
    tabs: visibleTabs,
    defaultTab: isEmployeeView
      ? "emp-dashboard"
      : (professionalTabs[0]?.id ?? "dashboard"),
    basePath: "/hr",
    pathPrefix: "/hr",
  });

  // ── Reset tab on viewMode switch ──────────────────────────────────────────
  useEffect(() => {
    const exists = visibleTabs.some((t) => t.id === tab);
    if (!exists && visibleTabs.length > 0) {
      setTab(visibleTabs[0].id);
    }
  }, [viewMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Render content ────────────────────────────────────────────────────────
  const renderContent = () => {
    if (isEmployeeView) {
      switch (tab as EmployeeTabId) {
        case "emp-dashboard":
          return <EmployeeDashboard />;
        case "emp-financials":
          return <EmployeeFinancials />;
        case "emp-profile":
          return <MyProfile isPureEmployee={isPureEmployee} />;
        case "emp-leave":
          return <EmployeeLeave isEmployeeView={true} />;
        case "emp-attendance":
          return <EmployeeAttendanceTimesheet mode="attendance" />;
        case "emp-task-timesheet":
  return <EmployeeTaskTimesheet />;
        case "emp-documents":
          return <EmployeeDocuments />;
        case "emp-reports":
          return <EmployeeReports />;
        case "emp-compliance":
          return <EmployeeCompliance />;
        case "emp-appraisals":
          return <PerformanceModule />;
        case "emp-expenses":
          return <EmployeeExpenses />;
        case "emp-performance-growth":
          return <PerformanceModule />;
        default:
          return <EmployeeDashboard />;
      }
    }

    switch (tab) {
      case "dashboard":
        return <HrDashboard />;
      case "management":
        return <EmployeeManagement isEmployeeView={false} />;
      case "attendance":
        return <HrAttendanceTimesheet mode="attendance" />;
      case "timesheet":
        // ── Task & Timesheet merged tab: each child gated by its own permission ──
        return (
          <div className="flex min-h-0 flex-1 flex-col gap-3">
            {visibleTaskTimesheetSubTabs.length > 1 && (
              <HrSecondaryTabs
                tabs={visibleTaskTimesheetSubTabs as unknown as { id: string; label: string; icon?: React.ReactNode }[]}
                activeTab={taskTimesheetSubTab}
                onChange={(id) =>
                  setTaskTimesheetSubTab(id as TaskTimesheetSubTabId)
                }
              />
            )}
            {taskTimesheetSubTab === "task" &&
              can("Task", "read") && <TaskManagement />}
            {taskTimesheetSubTab === "timesheet" &&
              can("Timesheet", "read") && (
                <HrAttendanceTimesheet mode="timesheet" />
              )}
          </div>
        );
      case "performance-growth":
        return <PerformanceModule />;
      case "leave":
        return <Leave isEmployeeView={false} />;
      case "payroll":
        return <PayrollManagement />;
      case "setup":
        return <HRSettingsPage />;
      default:
        return <HrDashboard />;
    }
  };

  const isViewportLocked = tab === "dashboard" || tab === "emp-dashboard";

  // ─── EMPLOYEE VIEW ────────────────────────────────────────────────────────
  if (isEmployeeView) {
    return (
      <AppPage>
        <AppPageHeader
          title="Employee Portal"
          icon={<FaUserTie />}
        />
        <AppPageBody >
          <Suspense fallback={<AppSkeleton />}>
            <HrContentFrame>{renderContent()}</HrContentFrame>
          </Suspense>
        </AppPageBody>
      </AppPage>
    );
  }

  // ─── PROFESSIONAL VIEW ────────────────────────────────────────────────────
  return (
    <AppPage >
      <AppPageHeader
        title="Human Resources"
        icon={<FaUserTie />}
        description="Manage employees, payroll, attendance, and compliance"
      />
      <HrPrimaryTabs
        tabs={professionalTabs}
        activeTab={tab}
        onChange={setTab}
      />
      <AppPageBody >
        <Suspense fallback={<AppSkeleton />}>
          <HrContentFrame>{renderContent()}</HrContentFrame>
        </Suspense>
      </AppPageBody>
    </AppPage>
  );
};

export default HrPayrollModule;