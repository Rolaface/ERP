import { AppSetupLayout } from "../../../components/ui/app-shell";
import { useUrlTab } from "../../../hooks/useUrlTab";
import { LeaveTypeSetup } from "./leave-config/components/LeaveTypeSetup";
import { TaxConfigurationSetup } from "./payroll-config/components/TaxConfigurationSetup";
import { SETUP_SECTIONS } from "./leave-config/sections";
import { LeavePeriodSetup } from "./leave-config/components/LeavePeriodSetup";
import { LeavePolicySetup } from "./leave-config/components/LeavePolicySetup";
import { LeavePolicyAssignmentSetup } from "./leave-config/components/LeavePolicyAssignmentSetup";
import { HolidayListSetup } from "./leave-config/components/HolidayListSetup";
import { ShiftTypeSetup } from "./leave-config/components/ShiftTypeSetup";

export default function LeaveConfigTab() {
  const [activeSection, setActiveSection] = useUrlTab({
    tabs: SETUP_SECTIONS.map((section) => ({ id: section.key })),
    defaultTab: SETUP_SECTIONS[0].key,
    param: "leaveSetup",
    basePath: "/hr",
  });

  return (
    <AppSetupLayout
      sections={SETUP_SECTIONS}
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
