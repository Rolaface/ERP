import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ROUTES } from "../routes/RoutesPath";


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

  // Pure lending+los account (no erp/hrms) must always be inside the
  // /select-lms-mode picker, never inside the ERP app itself — even if
  // they got here via back button, a typed URL, or a restored tab.
  const modules = user?.subscribedModules;
  const isPureLmsDual =
    modules?.erp?.enabled !== true &&
    modules?.hrms?.enabled !== true &&
    modules?.lending?.enabled === true &&
    modules?.los?.enabled === true;

  if (isPureLmsDual && location.pathname !== "/select-lms-mode") {
    return <Navigate to="/select-lms-mode" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;