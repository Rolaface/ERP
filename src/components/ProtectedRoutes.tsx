import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ROUTES } from "../routes/RoutesPath";
import { getModuleList } from "../utils/productClassifier";

const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  const modules = user?.subscribedModules;
  const has = (k: "ERP" | "HRMS" | "LMS" | "LOS") => getModuleList(modules, k).length > 0;
  const isPureLmsDual = !has("ERP") && !has("HRMS") && has("LMS") && has("LOS");

  if (isPureLmsDual && location.pathname !== "/select-lms-mode") {
    return <Navigate to="/select-lms-mode" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;