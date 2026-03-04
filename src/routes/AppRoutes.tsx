import React, { lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoutes";
import Login from "../views/LoginPage";
import AppLayout from "../layout/AppLayout";
const Dashboard = lazy(() => import("../views/DashbBoard"));
const SalesModule = lazy(() => import("../views/Sales/Sales"));
const ProcurementModule = lazy(
  () => import("../views/Procurement/Procurement"),
);
const InventoryModule = lazy(() => import("../views/Inventory/Inventory"));
const AccountingModule = lazy(() => import("../views/Accounting/Accounting"));
const CrmModule = lazy(() => import("../views/Crm/Crm"));
const Settings = lazy(() => import("../views/Settings"));
const HrPayrollModule = lazy(() => import("../views/hr/HR"));
const CompanySetup = lazy(() => import("../views/CompanySetup/CompanySetup"));
const UserManagement = lazy(() => import("../views/User/UserModule"));
const FixedAssets = lazy(() => import("../views/FixedAssets/FixedAsset"));
import { Toaster } from "react-hot-toast";
import ResetPassword from "../ResetPassword";

const AppRoutes: React.FC = () => {
  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/reset" element={<ResetPassword />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/sales" element={<SalesModule />} />
            <Route path="/procurement" element={<ProcurementModule />} />
            <Route path="/inventory" element={<InventoryModule />} />
            <Route path="/accounting" element={<AccountingModule />} />
            <Route path="/crm" element={<CrmModule />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/hr" element={<HrPayrollModule />} />
            <Route path="/fasset" element={<FixedAssets />} />
            <Route path="/companySetup" element={<CompanySetup />} />
            <Route path="/userManagement" element={<UserManagement />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Route>

        {/* Root redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
};

export default AppRoutes;
