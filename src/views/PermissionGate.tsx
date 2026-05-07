import React from "react";
import { usePermission } from "../hooks/permission/usePermission";
import type { PermissionAction } from "../store/permissionStore";

interface PermissionGateProps {
  module?: string;
  modules?: string[];
  action?: PermissionAction;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

const PermissionGate: React.FC<PermissionGateProps> = ({
  module,
  modules,
  action = "read",
  fallback = null,
  children,
}) => {
  const { can, isAdmin } = usePermission();  


  if (isAdmin) return <>{children}</>;     

  let hasAccess = false;

  if (modules && modules.length > 0) {
    hasAccess = modules.some((mod) => can(mod, action));
  } else if (module) {
    hasAccess = can(module, action);
  } else {
    hasAccess = true;
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
};

export default PermissionGate;