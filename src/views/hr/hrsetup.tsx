import {
  AppPage,
  AppPageBody,
  AppSubTabs,
} from "../../components/ui/app-shell";
import { useUrlTab } from "../../hooks/useUrlTab";

import GeneralSettingsTab from "./tabs/GeneralSettingsTab";
import EmployeeConfigTab from "./tabs/EmployeeConfig";
import PayrollConfigTab from "./tabs/payrollconfigtab";
import LeaveConfigTab from "./tabs/leaveConfigTab";
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
  const [activeTab, setActiveTab] = useUrlTab({
    tabs: TABS,
    defaultTab: "general",
    param: "setupTab",
    basePath: "/hr",
  });

  const renderTab = () => {
    switch (activeTab) {
      case "general": return <GeneralSettingsTab />;
      case "employee": return <EmployeeConfigTab />;
      case "payroll": return <PayrollConfigTab />;
      case "leave": return <LeaveConfigTab />;
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
