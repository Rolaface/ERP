import { useState } from "react";
import {
  AppPage,
  AppPageBody,
  AppSubTabs,
} from "../../components/ui/app-shell";

import GeneralSettingsTab from "./tabs/GeneralSettingsTab";
import SalaryStructureTab from "./tabs/SalaryStructureTab";
import PayrollConfigTab from "./tabs/payrollconfigtab";
import WorkScheduleTab from "./tabs/WorkScheduleTab";
import SalarySlipSetup from "./tabs/Salaryslipsetup";

const TABS = [
  { id: "general", label: "General Settings" },
  { id: "employee", label: "Employee Configuration" },
  { id: "payroll", label: "Payroll Configuration" },
  { id: "leave", label: "Leave Configuration" },
  { id: "slip", label: "Salary Slip Setup" },
];

export default function HRSetup() {
  const [activeTab, setActiveTab] = useState("general");

  const renderTab = () => {
    switch (activeTab) {
      case "general": return <GeneralSettingsTab />;
      case "employee": return <SalaryStructureTab />;
      case "payroll": return <PayrollConfigTab />;
      case "leave": return <WorkScheduleTab />;
      case "slip": return <SalarySlipSetup />;
      default: return null;
    }
  };

  return (
    <AppPage>

    
      <AppSubTabs
        tabs={TABS}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

   
      <AppPageBody>
        {renderTab()}
      </AppPageBody>

    </AppPage>
  );
}