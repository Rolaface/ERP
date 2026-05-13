
// It replaces <Dashboard /> directly in AppRoutes for the /dashboard route.
//   - viewMode === "employee"  → redirect to /hr/emp-dashboard (employee home)
//   - viewMode === "professional" or admin → render normal ERP Dashboard
//   - While auth/permissions still loading → render nothing (avoids flash-redirect)

import React from "react";
import { Navigate } from "react-router-dom";
import { useHRView } from "../../hooks/permission/useHRView";
import { usePermission } from "../../hooks/permission/usePermission";
import Dashboard from "../DashbBoard";

const DashboardRedirect: React.FC = () => {
  const { isLoading } = usePermission();
  const { viewMode }  = useHRView();

  // Wait for permissions to resolve so we don't flash-redirect incorrectly
  if (isLoading) return null;

  if (viewMode === "employee") {
    return <Navigate to="/hr/emp-dashboard" replace />;
  }

  return <Dashboard />;
};

export default DashboardRedirect;