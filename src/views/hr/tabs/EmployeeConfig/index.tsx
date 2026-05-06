import { useState } from "react";

import { AppSetupLayout } from "../../../../components/ui/app-shell";
import { DepartmentSetup } from "./components/DepartmentSetup";
import { DesignationSetup } from "./components/DesignationSetup";
import { EmployeeTypeSetup } from "./components/EmployeeTypeSetup";
import { GradeSetup } from "./components/GradeSetup";
import { EMPLOYEE_SECTIONS } from "./config/employeeSections";

export default function EmployeeConfigTab() {
  const [activeSection, setActiveSection] = useState<string>(
    EMPLOYEE_SECTIONS[0].key,
  );

  return (
    <AppSetupLayout
      sections={EMPLOYEE_SECTIONS}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
    >
      {activeSection === "department" && <DepartmentSetup />}
      {activeSection === "designation" && <DesignationSetup />}
      {activeSection === "grade" && <GradeSetup />}
      {activeSection === "employeeType" && <EmployeeTypeSetup />}
    </AppSetupLayout>
  );
}
