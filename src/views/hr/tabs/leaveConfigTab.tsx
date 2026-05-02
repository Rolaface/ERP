import { useState } from "react";
import { AppSetupLayout } from "../../../components/ui/app-shell";
import { LeaveTypeSetup } from "./leave-config/components/LeaveTypeSetup";
import { TaxConfigurationSetup } from "./payroll-config/components/TaxConfigurationSetup";
import { SETUP_SECTIONS } from "./leave-config/sections";
import { LeavePeriodSetup } from "./leave-config/components/LeavePeriodSetup";
import { LeavePolicySetup } from "./leave-config/components/LeavePolicySetup";
import { LeavePolicyAssignmentSetup } from "./leave-config/components/LeavePolicyAssignmentSetup";

export default function LeaveConfigTab() {
  const [activeSection, setActiveSection] = useState<string>(
    SETUP_SECTIONS[0].key,
  );

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
    </AppSetupLayout>
  );
}
