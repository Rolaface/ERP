import { useState } from "react";
import { AppSetupLayout } from "../../../components/ui/app-shell";
import { LeaveTypeSetup } from "./leave-config/components/LeaveTypeSetup";
import { SalaryStructureSetup } from "./payroll-config/components/SalaryStructureSetup";
import { TaxConfigurationSetup } from "./payroll-config/components/TaxConfigurationSetup";
import { SETUP_SECTIONS } from "./leave-config/sections";

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
      {activeSection === "component" && <LeaveTypeSetup />}
      {activeSection === "structure" && <SalaryStructureSetup />}
      {activeSection === "tax" && <TaxConfigurationSetup />}
    </AppSetupLayout>
  );
}
