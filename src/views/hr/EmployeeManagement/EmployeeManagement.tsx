import React from "react";
import { usePermission } from "../../../hooks/permission/usePermission";
import EmployeeDirectory from "./EmployeeDirectory";

interface EmployeeManagementProps {
  isEmployeeView?: boolean;
}

const EmployeeManagement: React.FC<EmployeeManagementProps> = ({
  isEmployeeView = false,
}) => {
  const { can } = usePermission();

  const canCreate = !isEmployeeView && can("Employee", "create");
  const canEdit = !isEmployeeView && can("Employee", "write");
  const canDelete = !isEmployeeView && can("Employee", "delete");

  // Hide entire page if user has no Employee read permission
  if (!can("Employee", "read")) return null;

  return (
    <EmployeeDirectory
      isEmployeeView={isEmployeeView}
      canCreate={canCreate}
      canEdit={canEdit}
      canDelete={canDelete}
    />
  );
};

export default EmployeeManagement;