// hrsetup.tsx (HRSettingsPage)
//   Employee tab   → can("Employee",         "create")
//   Payroll tab    → can("Payroll Entry",     "create")
//   Leave tab      → visible if "create" on ANY of the 6 leave-config child
//                     permissions (Leave Type, Period, Policy, Policy
//                     Assignment, Holiday List, Shift Type). NOT tied to
//                     "Leave Application" anymore.


import { useMemo }          from "react";
import { CalendarDays, Settings2, SlidersHorizontal } from "lucide-react";
import { useUrlTab }        from "../../hooks/useUrlTab";
import { HrSectionFrame }   from "./components/HrTabLayout";
import { usePermission }    from "../../hooks/permission/usePermission";
import EmployeeConfigTab    from "./tabs/EmployeeConfig";
import PayrollConfigTab     from "./tabs/payrollconfigtab";
import LeaveConfigTab       from "./tabs/leaveConfigTab";



const LEAVE_CHILD_MODULES = [
  "Leave Type",
  "Leave Period",
  "Leave Policy",
  "Leave Policy Assignment",
  "Holiday List",
  "Shift Type",
] as const;



const ALL_SETUP_TABS = [
  {
    id:     "employee",
    label:  "Employee",
    icon:   <Settings2 size={15} />,
    module: "Employee" as const,
    action: "create" as const,
    customGuard: false,
  },
  {
    id:     "leave",
    label:  "Leave",
    icon:   <CalendarDays size={15} />,
    module: null as null,
    action: "create" as const,
    customGuard: true,   // ← visible if any leave-config child has "create"
  },
  {
    id:     "payroll",
    label:  "Payroll",
    icon:   <SlidersHorizontal size={15} />,
    module: "Payroll Entry" as const,
    action: "create" as const,
    customGuard: false,
  },
] as const;

// ─── Component ────────────────────────────────────────────────────────────────

export default function HRSetup() {
  const { can, canAny } = usePermission();

  const visibleTabs = useMemo(() => {
    return ALL_SETUP_TABS.filter((tab) => {
      // Leave: visible if "create" on ANY of the 6 leave-config children
      if (tab.id === "leave") {
        return LEAVE_CHILD_MODULES.some((mod) => can(mod, "create"));
      }
      if (tab.module) {
        return can(tab.module, tab.action);
      }
      return true;
    });
  }, [can]);

  const [activeTab, setActiveTab] = useUrlTab({
    tabs:       visibleTabs,
    defaultTab: visibleTabs[0]?.id ?? "general",
    param:      "setupTab",
    basePath:   "/hr",
  });

  if (visibleTabs.length === 0) return null;

  const renderTab = () => {
    switch (activeTab) {
      case "employee": return <EmployeeConfigTab />;
      case "payroll":  return <PayrollConfigTab />;
      case "leave":    return <LeaveConfigTab />;
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