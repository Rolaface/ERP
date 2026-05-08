import React from "react";
import { Users, UserCheck } from "lucide-react";
import { AppSubTabs } from "../../../components/ui/app-shell";
import { useUrlTab } from "../../../hooks/useUrlTab";

import EmployeeDirectory from "./EmployeeDirectory";
import Recruitment from "./Recruitment";

const EmployeeManagement: React.FC = () => {
  const tabs = [
    { id: "directory", label: "Employee Directory", icon: <Users size={15} /> },
    { id: "recruitment", label: "Recruitment", icon: <UserCheck size={15} /> },
  ];

  const [mainTab, setMainTab] = useUrlTab({
    tabs,
    defaultTab: "directory",
    param: "employeeTab",
    basePath: "/hr",
  });

  return (
    <div className="bg-app">
      <div className="space-y-6">
        <AppSubTabs tabs={tabs} activeTab={mainTab} onChange={setMainTab} />

        <div>
          {mainTab === "directory" && <EmployeeDirectory />}
          {mainTab === "recruitment" && <Recruitment />}
        </div>
      </div>
    </div>
  );
};

export default EmployeeManagement;
