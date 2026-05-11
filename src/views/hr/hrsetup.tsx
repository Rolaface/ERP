import { CalendarDays, FileText, Settings2, SlidersHorizontal, Users } from "lucide-react";
import { useUrlTab } from "../../hooks/useUrlTab";
import { HrSectionFrame } from "./components/HrTabLayout";

import GeneralSettingsTab from "./tabs/GeneralSettingsTab";
import EmployeeConfigTab from "./tabs/EmployeeConfig";
import PayrollConfigTab from "./tabs/payrollconfigtab";
import LeaveConfigTab from "./tabs/leaveConfigTab";
import WorkScheduleTab from "./tabs/WorkScheduleTab";
import SalarySlipSetup from "./tabs/Salaryslipsetup";

const TABS = [
  { id: "general", label: "General", icon: <Settings2 size={15} /> },
  { id: "employee", label: "Employee", icon: <Users size={15} /> },
  { id: "payroll", label: "Payroll", icon: <SlidersHorizontal size={15} /> },
  { id: "leave", label: "Leave", icon: <CalendarDays size={15} /> },
  { id: "slip", label: "Salary Slip", icon: <FileText size={15} /> },
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
    <HrSectionFrame
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {renderTab()}
    </HrSectionFrame>
  );
}
