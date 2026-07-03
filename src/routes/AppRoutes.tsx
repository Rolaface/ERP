import React, { lazy, Suspense } from "react";
import { 
  Route, 
  Navigate, 
  createBrowserRouter, 
  createRoutesFromElements, 
  RouterProvider,
  Outlet,
  useRouteError
} from "react-router-dom";

// ── Context & Bootstraps ──
import { AuthProvider } from "../context/AuthContext";
import { PermissionBootstrap } from "../views/PermissionBootstrap";
import CompanyDefaultsBootstrap from "../views/CompanyDefaultsBootstrap";
import CurrencyBootstrap from "../views/Currencybootstrap";

import ProtectedRoute from "../components/ProtectedRoutes";
import LandingPage from "../views/LandingPage/LandingPage";
import SignupPage from "../views/SignupPage/SignupPage";
import Login from "../views/LoginPage";
import AppLayout from "../layout/AppLayout";
import GLView from "../views/Accounting/glview";
import { usePermission } from "../hooks/permission/usePermission";
import type { PermissionAction } from "../store/permissionStore";
import { useHRView } from "../hooks/permission/useHRView";
import { Toaster } from "react-hot-toast";
import ResetPassword from "../ResetPassword";
import { isMasterSite } from "../config/site";

// ── Lazy Modules ──
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
const TaxMaintenance = lazy(() => import("../views/TaxMaintaince/taxmaintaince"));
const ExpenseManagement = lazy(() => import("../views/ExpenseManagement/expenseManagement"));
const EmailTemplate = lazy(() => import("../views/Email/EmailTemplate"));
const Performance = lazy(() => import("../views/hr/performace/PerformanceModule"));
const Scheduler = lazy(() => import("../views/Scheduler/SchedulerTable"));

// ── Component Helpers ──
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
  const { can, isLoading } = usePermission();
  if (isLoading) return null;
  const hasAccess = modules.length === 0 ? true : modules.some((mod) => can(mod, action));
  return hasAccess ? <>{children}</> : <Navigate to={redirectTo} replace />;
};

const DashboardRedirect: React.FC = () => {
  const { isLoading } = usePermission();
  const { viewMode } = useHRView();
  if (isLoading) return null;
  if (viewMode === "employee") return <Navigate to="/hr/emp-dashboard" replace />;
  return <Dashboard />;
};

 const RELOAD_FLAG = "chunk-reload-attempted";

const GlobalErrorBoundary: React.FC = () => {
  const error = useRouteError() as Error;
  
  const isChunkLoadError =
    error?.message?.includes("Failed to fetch dynamically imported module") ||
    error?.message?.includes("Importing a module script failed") ||
    error?.message?.includes("error loading dynamically imported module");

  if (isChunkLoadError) {
    const alreadyTried = sessionStorage.getItem(RELOAD_FLAG);
    
    if (!alreadyTried) {
      sessionStorage.setItem(RELOAD_FLAG, "1");
      window.location.reload();
      return (
        <div className="flex h-screen w-full items-center justify-center bg-background text-main">
          <p>Updating application to the latest version...</p>
        </div>
      );
    }
    
     sessionStorage.removeItem(RELOAD_FLAG);
    return (
      <div className="flex flex-col h-screen w-full items-center justify-center bg-background p-4 text-center">
        <h1 className="text-2xl font-bold text-main mb-2">Update in progress</h1>
        <p className="text-muted max-w-md mb-6">
          We're deploying a new version. Please try again in a moment.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-5 py-2.5 rounded-lg bg-primary text-white"
        >
          Try Again
        </button>
      </div>
    );
  }

   return (
    <div className="flex flex-col h-screen w-full items-center justify-center bg-background p-4 text-center">
      <h1 className="text-2xl font-bold text-main mb-2">Oops! Something went wrong.</h1>
      <p className="text-muted max-w-md mb-6">We encountered an unexpected error.</p>
      <button
        onClick={() => window.location.reload()}
        className="px-5 py-2.5 rounded-lg bg-primary text-white"
      >
        Refresh Page
      </button>
    </div>
  );
};

// ── Root Layout ──
const RootLayout = () => {
  return (
    <AuthProvider>
      <PermissionBootstrap />
      <CompanyDefaultsBootstrap />
      <CurrencyBootstrap />
      <Outlet />
    </AuthProvider>
  );
};

 const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<RootLayout />}>
       <Route errorElement={<GlobalErrorBoundary />}>
        {/* ── Public Routes ── */}
        <Route path="/" element={isMasterSite() ? <LandingPage /> : <Navigate to="/login" replace />} />
        <Route path="/signup" element={isMasterSite() ? <SignupPage /> : <Navigate to="/" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/update-password" element={<ResetPassword />} />

        {/* ── Protected Routes ── */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardRedirect />} />
            <Route path="/sales" element={<PermissionRoute modules={["Sales Invoice"]}><SalesModule /></PermissionRoute>} />
            <Route path="/crm" element={<PermissionRoute modules={["Customer", "Payment Entry", "Customer Group"]}><CrmModule /></PermissionRoute>} />
            <Route path="/procurement" element={<PermissionRoute modules={["Supplier", "Request For Quotation", "Purchase Order", "Purchase Invoice", "Payment Entry"]}><ProcurementModule /></PermissionRoute>} />
            <Route path="/inventory/*" element={<PermissionRoute modules={["Item", "Item Group", "Warehouse", "Stock Entry"]}><InventoryModule /></PermissionRoute>} />
            <Route path="/accounting" element={<PermissionRoute modules={["GL Entry", "Journal Entry"]}><AccountingModule /></PermissionRoute>} />
            <Route path="/fasset" element={<PermissionRoute modules={["Asset Category", "Asset", "Asset Movement"]}><FixedAssets /></PermissionRoute>} />
            <Route path="/hr/*" element={<PermissionRoute modules={["Employee", "Payroll Entry"]}><HrPayrollModule /></PermissionRoute>} />
            <Route path="/ledger" element={<PermissionRoute modules={["GL Entry", "Journal Entry"]}><GLView /></PermissionRoute>} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/companySetup/*" element={<PermissionRoute modules={["Company"]}><CompanySetup /></PermissionRoute>} />
            <Route path="/userManagement" element={<PermissionRoute modules={["User"]}><UserManagement /></PermissionRoute>} />
            <Route path="/bank-management" element={<PermissionRoute modules={["Bank", "Bank Account", "Mode of Payment", "Currency Exchange"]}><BankModule /></PermissionRoute>} />
            <Route path="/Tax-Maintenance" element={<PermissionRoute modules={["Item Tax Template", "Tax Category", "Sales Taxes and Charges Template"]}><TaxMaintenance /></PermissionRoute>} />
            <Route path="/Expense-Management" element={<PermissionRoute modules={["Expense Claim", "Expense Claim Type", "Employee Advance"]}><ExpenseManagement /></PermissionRoute>} />
            <Route path="/Email-Template" element={<PermissionRoute modules={["Email Template"]}><EmailTemplate /></PermissionRoute>} />
            <Route path="/performance" element={<PermissionRoute modules={["Appraisal"]}><Performance /></PermissionRoute>} />
            <Route path="/scheduler" element={<PermissionRoute modules={["Scheduler"]}><Scheduler/></PermissionRoute>} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Route>
      </Route>
    </Route>
  )
);

// ── Main Render ──
const AppRoutes: React.FC = () => {
  React.useEffect(() => {
    sessionStorage.removeItem(RELOAD_FLAG);
  }, []);
  return (
    <>
      <Toaster position="top-right" />
      <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading Data...</div>}>
        <RouterProvider router={router} />
      </Suspense>
    </>
  );
};

export default AppRoutes;