import { useMemo } from "react";
import {
  CalendarDays,
  FileText,
  Settings2,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import { useUrlTab }      from "../../hooks/useUrlTab";
import { HrSectionFrame } from "./components/HrTabLayout";
import { usePermission }  from "../../hooks/permission/usePermission";
import GeneralSettingsTab from "./tabs/GeneralSettingsTab";
import EmployeeConfigTab  from "./tabs/EmployeeConfig";
import PayrollConfigTab   from "./tabs/payrollconfigtab";
import LeaveConfigTab     from "./tabs/leaveConfigTab";
import SalarySlipSetup    from "./tabs/Salaryslipsetup";
import type { PermissionAction } from "../../store/permissionStore";

const ALL_SETUP_TABS = [
  {
    id:    "general",
    label: "General",
    icon:  <Settings2 size={15} />,
    showWhen: (can: (m: string, a: PermissionAction) => boolean) =>
      can("HR Settings", "write") || can("HR Settings", "create"),
  },
  {
    id:    "employee",
    label: "Employee",
    icon:  <Users size={15} />,
    showWhen: (can: (m: string, a: PermissionAction) => boolean) =>
      can("Employee", "write") || can("Employee", "create"),
  },
  {
    id:    "payroll",
    label: "Payroll",
    icon:  <SlidersHorizontal size={15} />,
    showWhen: (can: (m: string, a: PermissionAction) => boolean) =>
      can("Payroll Entry", "write") || can("Payroll Entry", "create"),
  },
  {
    id:    "leave",
    label: "Leave",
    icon:  <CalendarDays size={15} />,
    showWhen: (can: (m: string, a: PermissionAction) => boolean) =>
      can("Leave Application", "write") || can("Leave Application", "create"),
  },
  {
    id:    "slip",
    label: "Salary Slip",
    icon:  <FileText size={15} />,
    showWhen: (can: (m: string, a: PermissionAction) => boolean) =>
      can("Salary Slip", "write") || can("Salary Slip", "create"),
  },
] as const;
// ─── Component ────────────────────────────────────────────────────────────────

export default function HRSetup() {
  const { can } = usePermission();

  const visibleTabs = useMemo(
    () => ALL_SETUP_TABS.filter((tab) => tab.showWhen(can)),
    [can]
  );

  const [activeTab, setActiveTab] = useUrlTab({
    tabs:       visibleTabs,
    defaultTab: visibleTabs[0]?.id ?? "general",
    param:      "setupTab",
    basePath:   "/hr",
  });

  // Safety: if no tabs visible (e.g. direct URL access),
  // render nothing — parent should have blocked access already
  if (visibleTabs.length === 0) return null;

  const renderTab = () => {
    switch (activeTab) {
      case "general":  return <GeneralSettingsTab />;
      case "employee": return <EmployeeConfigTab />;
      case "payroll":  return <PayrollConfigTab />;
      case "leave":    return <LeaveConfigTab />;
      case "slip":     return <SalarySlipSetup />;
      default:         return null;
    }
  };

  return (
    <HrSectionFrame
      tabs={visibleTabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {renderTab()}
    </HrSectionFrame>
  );
}