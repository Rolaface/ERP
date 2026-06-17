import { useMemo } from "react";
import { AppSetupLayout } from "../../../components/ui/app-shell";
import { useUrlTab } from "../../../hooks/useUrlTab";
import { usePermission } from "../../../hooks/permission/usePermission";
import { LeaveTypeSetup } from "./leave-config/components/LeaveTypeSetup";
import { TaxConfigurationSetup } from "./payroll-config/components/TaxConfigurationSetup";
import { SETUP_SECTIONS } from "./leave-config/sections";
import { LeavePeriodSetup } from "./leave-config/components/LeavePeriodSetup";
import { LeavePolicySetup } from "./leave-config/components/LeavePolicySetup";
import { LeavePolicyAssignmentSetup } from "./leave-config/components/LeavePolicyAssignmentSetup";
import { HolidayListSetup } from "./leave-config/components/HolidayListSetup";
import { ShiftTypeSetup } from "./leave-config/components/ShiftTypeSetup";


const SECTION_PERMISSION_MODULE: Record<string, string> = {
  type: "Leave Type",
  period: "Leave Period",
  policy: "Leave Policy",
  assign: "Leave Policy Assignment",
  holiday: "Holiday List",
  shift: "Shift Type",
};

export default function LeaveConfigTab() {
  const { can } = usePermission();

  const visibleSections = useMemo(
    () =>
      SETUP_SECTIONS.filter((section) => {
        const module = SECTION_PERMISSION_MODULE[section.key];
        return module ? can(module, "create") : true;
      }),
    [can],
  );

  const [activeSection, setActiveSection] = useUrlTab({
    tabs: visibleSections.map((section) => ({ id: section.key })),
    defaultTab: visibleSections[0]?.key ?? SETUP_SECTIONS[0].key,
    param: "leaveSetup",
    basePath: "/hr",
  });

  if (visibleSections.length === 0) return null;

  return (
    <AppSetupLayout
      sections={visibleSections}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
    >
      {activeSection === "type" && <LeaveTypeSetup />}
      {activeSection === "period" && <LeavePeriodSetup />}
      {activeSection === "policy" && <LeavePolicySetup />}
      {activeSection === "assign" && <LeavePolicyAssignmentSetup />}
      {activeSection === "holiday" && <HolidayListSetup />}
      {activeSection === "shift" && <ShiftTypeSetup />}
    </AppSetupLayout>
  );
}