import React, { lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoutes";
import LandingPage from "../views/LandingPage/LandingPage";
import SignupPage from "../views/SignupPage/SignupPage";
import Login from "../views/LoginPage";
import AppLayout from "../layout/AppLayout";
import GLView from "../views/Accounting/glview";
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
const BankAccountPage = lazy(() => import("../views/BankAccount/BankAccountPage"))
const ModeOfPaymentPage = lazy(
  () => import("../views/Mode of Payment/ModeOfPaymentSetup")
);
const PaymentEntry = lazy(
  () => import("../views/PaymentEntry/PaymentEntry")
);
const CurrencyConversion = lazy(
  () => import("../views/CurrencyConversion/currencyConversion")
);
const CustomerGroup = lazy(
  () => import("../views/Customergroup/CustomerGroup")
);
const TaxMaintenance = lazy(
  () => import("../views/TaxMaintaince/taxmaintaince")
)
const Bank = lazy(() => import("../views/BankAccount/Bank"))
import { Toaster } from "react-hot-toast";
import ResetPassword from "../ResetPassword";

const AppRoutes: React.FC = () => {
  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/reset" element={<ResetPassword />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />

            {/* Sales Module with sub-routes */}
            <Route path="/sales" element={<SalesModule />} />

            {/* Procurement Module */}
            <Route path="/procurement" element={<ProcurementModule />} />

            {/* Inventory Module */}
            <Route path="/inventory" element={<Navigate to="/inventory/dashboard" replace />} />
            <Route path="/inventory/:tab" element={<InventoryModule />} />

            {/* Accounting Module */}
            <Route path="/accounting" element={<AccountingModule />} />

            {/* CRM Module */}
            <Route path="/crm" element={<CrmModule />} />

            <Route path="/settings" element={<Settings />} />
            <Route path="/hr" element={<HrPayrollModule />} />
            <Route path="/fasset" element={<FixedAssets />} />
            <Route path="/companySetup" element={<Navigate to="/companySetup/basic" replace />} />
            <Route path="/companySetup/:tab" element={<CompanySetup />} />
            <Route path="/userManagement" element={<UserManagement />} />
            <Route path="/bank-account-setup" element={<BankAccountPage />} />
            <Route path="/mode-of-payment-setup" element={<ModeOfPaymentPage />} />
            <Route path="/payment-entry" element={<PaymentEntry />} />
            <Route path="/currency-conversion" element={<CurrencyConversion />} />
            <Route path="/customer-group" element={<CustomerGroup />} />
            <Route path="/ledger" element={<GLView />} />
            <Route path="/Tax-Maintenance" element={<TaxMaintenance />} />
            <Route path="/bank" element={<Bank />} />

            {/* Catch-all for unknown routes - redirect to dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Route>
      </Routes>
    </>
  );
};

export default AppRoutes;
