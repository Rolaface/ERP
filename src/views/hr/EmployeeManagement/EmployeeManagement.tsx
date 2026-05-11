import React from "react";
import { Users, UserCheck } from "lucide-react";
import { useUrlTab } from "../../../hooks/useUrlTab";
import { HrSectionFrame } from "../components/HrTabLayout";

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
    <HrSectionFrame
      tabs={tabs}
      activeTab={mainTab}
      onTabChange={setMainTab}
    >
      {mainTab === "directory" && <EmployeeDirectory />}
      {mainTab === "recruitment" && <Recruitment />}
    </HrSectionFrame>
  );
};

export default EmployeeManagement;
