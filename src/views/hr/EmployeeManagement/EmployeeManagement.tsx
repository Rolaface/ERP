import React from "react";
import { Users , UserCheck } from "lucide-react";
import { useUrlTab } from "../../../hooks/useUrlTab";
import { HrSectionFrame } from "../components/HrTabLayout";
import { usePermission } from "../../../hooks/permission/usePermission";
import EmployeeDirectory from "./EmployeeDirectory";
import Recruitment from "../Recruitment";

interface EmployeeManagementProps {
  isEmployeeView?: boolean;
}

const EmployeeManagement: React.FC<EmployeeManagementProps> = ({
  isEmployeeView = false,
}) => {
  const { can } = usePermission();

  // ── Permission-based flags ─────────────────────────────────────────────────
  // When isEmployeeView = true → all mutating actions hidden
  const canCreate = !isEmployeeView && can("Employee", "create");
  const canEdit   = !isEmployeeView && can("Employee", "write");
  const canDelete = !isEmployeeView && can("Employee", "delete");

  const tabs = [
    {
      id:    "directory",
      label: isEmployeeView ? "My Profile" : "Employee Directory",
      icon:  <Users size={15} />,
    },
    { id: "recruitment", label: "Recruitment", icon: <UserCheck size={15} /> },
  ];

  const [mainTab, setMainTab] = useUrlTab({
    tabs,
    defaultTab: "directory",
    param:      "employeeTab",
    basePath:   "/hr",
  });

  return (
    <HrSectionFrame
      tabs={tabs}
      activeTab={mainTab}
      onTabChange={setMainTab}
    >
      {mainTab === "directory" && (
        <EmployeeDirectory
          isEmployeeView={isEmployeeView}
          canCreate={canCreate}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      )}
      {mainTab === "recruitment" && <Recruitment />}
    </HrSectionFrame>
  );
};

export default EmployeeManagement;