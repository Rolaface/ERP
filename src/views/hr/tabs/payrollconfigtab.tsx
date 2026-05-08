import { useState } from "react";

import { AppSetupLayout } from "../../../components/ui/app-shell";
import { SalaryComponentSetup } from "./payroll-config/components/SalaryComponentSetup";
import { SalaryStructureSetup } from "./payroll-config/components/SalaryStructureSetup";
import { TaxConfigurationSetup } from "./payroll-config/components/TaxConfigurationSetup";
import { PayrollPeriodSetup } from "./payroll-config/components/PayrollPeriodSetup";
import { SETUP_SECTIONS } from "./payroll-config/sections";

export default function PayrollConfigTab() {
  const [activeSection, setActiveSection] = useState<string>(
    SETUP_SECTIONS[0].key,
  );

  return (
    <AppSetupLayout
      sections={SETUP_SECTIONS}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
    >
      {activeSection === "component" && <SalaryComponentSetup />}
      {activeSection === "structure" && <SalaryStructureSetup />}
      {activeSection === "tax" && <TaxConfigurationSetup />}
       {activeSection === "payroll_period" && <PayrollPeriodSetup />}
    </AppSetupLayout>
  );
}

