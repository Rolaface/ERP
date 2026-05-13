import { AppSetupLayout } from "../../../components/ui/app-shell";
import { useUrlTab } from "../../../hooks/useUrlTab";
import { SalaryComponentSetup } from "./payroll-config/components/SalaryComponentSetup";
import { SalaryStructureSetup } from "./payroll-config/components/SalaryStructureSetup";
import { TaxConfigurationSetup } from "./payroll-config/components/TaxConfigurationSetup";
import { PayrollPeriodSetup } from "./payroll-config/components/PayrollPeriodSetup";
import { SETUP_SECTIONS } from "./payroll-config/sections";

export default function PayrollConfigTab() {
  const [activeSection, setActiveSection] = useUrlTab({
    tabs: SETUP_SECTIONS.map((section) => ({ id: section.key })),
    defaultTab: SETUP_SECTIONS[0].key,
    param: "payrollSetup",
    basePath: "/hr",
  });

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

