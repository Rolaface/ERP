// hrsetup.tsx (HRSettingsPage)
// Tab-level permission — exact Sales pattern (ALL_TABS array with module+action filter):
//
//   Employee tab   → can("Employee",         "create")
//   Payroll tab    → can("Payroll Entry",     "create")
//   Leave tab      → can("Leave Application", "create")
//   General tab    → can("HR Settings","write") || can("HR Settings","create")  [unchanged]
//   Salary Slip    → SKIPPED (per requirement — not gated here)
//
// Rule: HR Setup is configuration. Only users who can CREATE a resource
// should configure its setup. Read-only access (e.g. procurement role
// with Employee read) does NOT grant access to the Employee setup tab.

import { useMemo }          from "react";
import { CalendarDays, Settings2, SlidersHorizontal } from "lucide-react";
import { useUrlTab }        from "../../hooks/useUrlTab";
import { HrSectionFrame }   from "./components/HrTabLayout";
import { usePermission }    from "../../hooks/permission/usePermission";
import GeneralSettingsTab   from "./tabs/GeneralSettingsTab";
import EmployeeConfigTab    from "./tabs/EmployeeConfig";
import PayrollConfigTab     from "./tabs/payrollconfigtab";
import LeaveConfigTab       from "./tabs/leaveConfigTab";
import SalarySlipSetup      from "./tabs/Salaryslipsetup";

// ── Tab definitions with module + action guard (mirrors ALL_SALES_TAB shape) ─

const ALL_SETUP_TABS = [
  {
    id:     "general",
    label:  "General",
    icon:   <Settings2 size={15} />,
    // Visible if user can write OR create HR Settings
    // Handled specially below (canAny), so module is null to skip standard filter
    module: null as null,
    action: "write" as const,
    // Custom guard evaluated separately
    customGuard: true,
  },
  {
    id:     "employee",
    label:  "Employee",
    icon:   <Settings2 size={15} />,
    module: "Employee" as const,
    action: "create" as const,   // ← create gates the setup tab
    customGuard: false,
  },
  {
    id:     "payroll",
    label:  "Payroll",
    icon:   <SlidersHorizontal size={15} />,
    module: "Payroll Entry" as const,
    action: "create" as const,   // ← create gates the setup tab
    customGuard: false,
  },
  {
    id:     "leave",
    label:  "Leave",
    icon:   <CalendarDays size={15} />,
    module: "Leave Application" as const,
    action: "create" as const,   // ← create gates the setup tab
    customGuard: false,
  },
  // Salary Slip tab — NOT gated per requirement, keep existing behaviour
  {
    id:     "slip",
    label:  "Salary Slip",
    icon:   <CalendarDays size={15} />,
    module: null as null,
    action: "write" as const,
    customGuard: true,   // uses canAny below
  },
] as const;

// ─── Component ────────────────────────────────────────────────────────────────

export default function HRSetup() {
  const { can, canAny } = usePermission();

  // ── Tab-level filter (Sales pattern) ─────────────────────────────────────
  const visibleTabs = useMemo(() => {
    return ALL_SETUP_TABS.filter((tab) => {
      // General: write OR create on HR Settings
      if (tab.id === "general") {
        return (
          can("HR Settings", "write") ||
          can("HR Settings", "create")
        );
      }
      // Salary Slip: write OR create (existing behaviour, not changing)
      if (tab.id === "slip") {
        return (
          can("Salary Slip", "write") ||
          can("Salary Slip", "create")
        );
      }
      // Employee / Payroll / Leave: strictly "create" gates the setup tab
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

  // No tabs visible — user has no setup permissions at all
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