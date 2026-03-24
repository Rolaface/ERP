import React from "react";
import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute: React.FC = () => {
  // ✅ Read auth from localStorage
  const isAuthenticated = localStorage.getItem("isAuthenticated");

  // Optional: simulate loading if needed (you can remove later)
  if (isAuthenticated === null) {
    return <Navigate to="/login" replace />;
  }

  // ✅ Allow access if authenticated
  return isAuthenticated === "true" ? (
    <Outlet />
  ) : (
    <Navigate to="/login" replace />
  );
};

export default ProtectedRoute;