import React, {
  lazy,
  Suspense,
  useMemo,
  useEffect,
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
} from "react-icons/fa";
import { ArrowLeftRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  AppPage,
  AppPageHeader,
  AppPageBody,
} from "../../components/ui/app-shell";
import AppSkeleton from "../../components/ui/AppSkeleton";
import { useUrlTab } from "../../hooks/useUrlTab";
import { HrContentFrame, HrPrimaryTabs } from "./components/HrTabLayout";
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
const EmployeeAttendanceTimesheet = lazy(
  () => import("./EmployeeView/EmployeeTimesheetAttendance"),
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

// ─── Employee tab IDs — must stay in sync with EMPLOYEE_HR_TABS in Sidebar.tsx

const EMPLOYEE_TAB_IDS = [
  "emp-dashboard",
  "emp-financials",
  "emp-profile",
  "emp-leave",
  "emp-timesheet",
  "emp-documents",
  "emp-reports",
  "emp-performance-growth",
  "emp-reimburse",
  "emp-expenses",
  "emp-compliance",
  "emp-appraisals",
] as const;

type EmployeeTabId = (typeof EMPLOYEE_TAB_IDS)[number];

// ─── Component ────────────────────────────────────────────────────────────────

const HrPayrollModule: React.FC = () => {
  const { can } = usePermission();
  const { viewMode, canSwitchView, isPureEmployee, switchToProfessional } =
    useHRView();
  const navigate = useNavigate();
  const isEmployeeView = viewMode === "employee";

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
              label: "Timesheet & Attendance",
              icon: <FaCalendarDay />,
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
      ...(can("Payroll Entry", "read")
        ? [{ id: "payroll", label: "Payroll", icon: <FaMoneyCheckAlt /> }]
        : []),

      // ── HR Setup primary tab ──────────────────────────────────────────────
      // Visible if the user has write OR create on any of the modules that
      // have a sub-tab inside HRSettingsPage.  This mirrors the sub-tab
      // guards in hrsetup.tsx exactly:
      //   general → write|create on HR Settings
      //   employee → create on Employee
      //   payroll  → create on Payroll Entry
      //   leave    → create on Leave Application
      //   slip     → write|create on Salary Slip
      ...(can("HR Settings", "write") ||
      can("HR Settings", "create") ||
      can("Employee", "create") ||
      can("Payroll Entry", "create") ||
      can("Leave Application", "create") ||
      can("Salary Slip", "write") ||
      can("Salary Slip", "create")
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
        case "emp-timesheet":
          return <EmployeeAttendanceTimesheet />;
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
        return <EmployeeAttendanceTimesheet />;
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

  // ── Switch button — only in employee view header, only for dual-role users ─
  // On click: switch to professional view AND navigate to main dashboard.
  // const switchButton = canSwitchView ? (
  //   <button
  //     type="button"
  //     onClick={() => {
  //       switchToProfessional();
  //       navigate("/dashboard");
  //     }}
  //     className="
  //       flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold
  //       border transition-all duration-200
  //       border-[var(--primary)] bg-[color-mix(in_srgb,var(--primary)_10%,transparent)]
  //       text-[var(--primary)] hover:bg-[color-mix(in_srgb,var(--primary)_20%,transparent)]
  //     "
  //   >
  //     <ArrowLeftRight size={13} />
  //     Professional View
  //   </button>
  // ) : null;

  // ─── EMPLOYEE VIEW ────────────────────────────────────────────────────────
  if (isEmployeeView) {
    return (
      <AppPage viewportLocked={isViewportLocked}>
        <AppPageHeader
          title="Employee Portal"
          icon={<FaUserTie />}
          // actions={switchButton}
        />
        <AppPageBody viewportLocked={isViewportLocked}>
          <Suspense fallback={<AppSkeleton />}>
            <HrContentFrame>{renderContent()}</HrContentFrame>
          </Suspense>
        </AppPageBody>
      </AppPage>
    );
  }

  // ─── PROFESSIONAL VIEW ────────────────────────────────────────────────────
  return (
    <AppPage viewportLocked={isViewportLocked}>
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
      <AppPageBody viewportLocked={isViewportLocked}>
        <Suspense fallback={<AppSkeleton />}>
          <HrContentFrame>{renderContent()}</HrContentFrame>
        </Suspense>
      </AppPageBody>
    </AppPage>
  );
};

export default HrPayrollModule;
