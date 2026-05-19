import React, { lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoutes";
import LandingPage from "../views/LandingPage/LandingPage";
import SignupPage from "../views/SignupPage/SignupPage";
import Login from "../views/LoginPage";
import AppLayout from "../layout/AppLayout";
import GLView from "../views/Accounting/glview";
import { usePermission } from "../hooks/permission/usePermission";
import type { PermissionAction } from "../store/permissionStore";
import { useHRView } from "../hooks/permission/useHRView";

const Dashboard = lazy(() => import("../views/DashbBoard"));
const SalesModule = lazy(() => import("../views/Sales/Sales"));
const ProcurementModule = lazy(() => import("../views/Procurement/Procurement"));
const InventoryModule = lazy(() => import("../views/Inventory/Inventory"));
const AccountingModule = lazy(() => import("../views/Accounting/Accounting"));
const CrmModule = lazy(() => import("../views/Crm/Crm"));
const Settings = lazy(() => import("../views/Settings"));
const HrPayrollModule = lazy(() => import("../views/hr/HR"));
const CompanySetup = lazy(() => import("../views/CompanySetup/CompanySetup"));
const UserManagement = lazy(() => import("../views/User/UserModule"));
const FixedAssets = lazy(() => import("../views/FixedAssets/FixedAsset"));
const BankModule = lazy(() => import("../views/BankAccount/BankModule"));
const ModeOfPaymentPage = lazy(() => import("../views/Mode of Payment/ModeOfPaymentSetup"));
const PaymentEntry = lazy(() => import("../views/PaymentEntry/PaymentEntry"));
const CurrencyConversion = lazy(() => import("../views/CurrencyConversion/currencyConversion"));
const CustomerGroup = lazy(() => import("../views/Customergroup/CustomerGroup"));
const TaxMaintenance = lazy(() => import("../views/TaxMaintaince/taxmaintaince"));
const ExpenseManagement = lazy(() => import("../views/ExpenseManagement/expenseManagement"));
const EmailTemplate = lazy(() => import("../views/Email/EmailTemplate"))

import { Toaster } from "react-hot-toast";
import ResetPassword from "../ResetPassword";


interface PermissionRouteProps {
  modules: string[];
  action?: PermissionAction;
  redirectTo?: string;
  children: React.ReactNode;
}

const PermissionRoute: React.FC<PermissionRouteProps> = ({
  modules,
  action = "read",
  redirectTo = "/dashboard",
  children,
}) => {
  const { canAccessAnyOf, can, isLoading } = usePermission();

  // While permissions are still loading, render nothing (avoid flash-redirect)
  if (isLoading) return null;

  const hasAccess =
    modules.length === 0
      ? true
      : modules.some((mod) => can(mod, action));

  return hasAccess ? <>{children}</> : <Navigate to={redirectTo} replace />;
};

const DashboardRedirect: React.FC = () => {
  const { isLoading } = usePermission();
  const { viewMode }  = useHRView();
  if (isLoading) return null;               // wait — no flash on hard refresh
  if (viewMode === "employee") return <Navigate to="/hr/emp-dashboard" replace />;
  return <Dashboard />;                     // professional/admin sees ERP dashboard
};

// ─── Routes ───────────────────────────────────────────────────────────────────

const AppRoutes: React.FC = () => {
  return (
    <>
      <Toaster position="top-right" />
      <Routes>

        {/* ── Public Routes ── */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/reset" element={<ResetPassword />} />

        {/* ── Protected Routes ── */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>

            {/* Dashboard — always accessible */}
            <Route path="/dashboard" element={<DashboardRedirect />} />

            {/* Sales — needs read on Sales Invoice */}
            <Route
              path="/sales"
              element={
                <PermissionRoute modules={["Sales Invoice"]}>
                  <SalesModule />
                </PermissionRoute>
              }
            />

            {/* CRM — needs read on Customer or Payment Entry */}
            <Route
              path="/crm"
              element={
                <PermissionRoute modules={["Customer", "Payment Entry"]}>
                  <CrmModule />
                </PermissionRoute>
              }
            />

            {/* Procurement — needs any procurement module */}
            <Route
              path="/procurement"
              element={
                <PermissionRoute
                  modules={["Supplier", "Request For Quotation", "Purchase Order", "Purchase Invoice", "Payment Entry"]}
                >
                  <ProcurementModule />
                </PermissionRoute>
              }
            />

            {/* Inventory */}
            <Route
              path="/inventory/*"
              element={
                <PermissionRoute modules={["Item", "Item Group", "Warehouse", "Stock Entry"]}>
                  <InventoryModule />
                </PermissionRoute>
              }
            />

            {/* Accounting */}
            <Route
              path="/accounting"
              element={
                <PermissionRoute modules={["GL Entry", "Journal Entry"]}>
                  <AccountingModule />
                </PermissionRoute>
              }
            />

            {/* Fixed Assets */}
            <Route
              path="/fasset"
              element={
                <PermissionRoute modules={["Asset Category", "Asset", "Asset Movement"]}>
                  <FixedAssets />
                </PermissionRoute>
              }
            />

            {/* HR */}
            <Route
              path="/hr/*"
              element={
                <PermissionRoute modules={["Employee", "Payroll Entry"]}>
                  <HrPayrollModule />
                </PermissionRoute>
              }
            />

            {/* GL ledger view — accounting read */}
            <Route
              path="/ledger"
              element={
                <PermissionRoute modules={["GL Entry", "Journal Entry"]}>
                  <GLView />
                </PermissionRoute>
              }
            />

            {/* ── Settings sub-pages ── */}

            {/* General settings — always accessible */}
            <Route path="/settings" element={<Settings />} />

            {/* Company Setup — needs Company read */}
            <Route
              path="/companySetup/*"
              element={
                <PermissionRoute modules={["Company"]}>
                  <CompanySetup />
                </PermissionRoute>
              }
            />

            {/* User Management — needs User read */}
            <Route
              path="/userManagement"
              element={
                <PermissionRoute modules={["User"]}>
                  <UserManagement />
                </PermissionRoute>
              }
            />

            {/* Bank Account */}
            <Route
              path="/bank-management"
              element={
                <PermissionRoute
                  modules={["Bank", "Bank Account"]}
                >
                  <BankModule />
                </PermissionRoute>
              }
            />


            {/* Mode of Payment */}
            <Route
              path="/mode-of-payment-setup"
              element={
                <PermissionRoute modules={["Mode of Payment"]}>
                  <ModeOfPaymentPage />
                </PermissionRoute>
              }
            />

            {/* Payment Entry */}
            <Route
              path="/payment-entry"
              element={
                <PermissionRoute modules={["Payment Entry"]}>
                  <PaymentEntry />
                </PermissionRoute>
              }
            />

            {/* Currency Exchange */}
            <Route
              path="/currency-conversion"
              element={
                <PermissionRoute modules={["Currency Exchange"]}>
                  <CurrencyConversion />
                </PermissionRoute>
              }
            />

            {/* Customer Group */}
            <Route
              path="/customer-group"
              element={
                <PermissionRoute modules={["Customer Group"]}>
                  <CustomerGroup />
                </PermissionRoute>
              }
            />

            {/* Tax Maintenance */}
            <Route
              path="/Tax-Maintenance"
              element={
                <PermissionRoute modules={["Item Tax Template", "Tax Category", "Sales Taxes and Charges Template"]}>
                  <TaxMaintenance />
                </PermissionRoute>
              }
            />
              <Route
              path="/Expense-Management"
              element={
                <PermissionRoute modules={["Expense History"]}>
                  <ExpenseManagement />
                </PermissionRoute>
              }
            />
             <Route
              path="/Email-Template"
              element={
                <PermissionRoute modules={["Expense History"]}>
                  <EmailTemplate />
                </PermissionRoute>
              }
            />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Route>

      </Routes>
    </>
  );
};

export default AppRoutes;
