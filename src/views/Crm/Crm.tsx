import React, { Suspense, lazy } from "react";
import { useOutletContext, useSearchParams, useNavigate, useLocation } from "react-router-dom";
import {
  FaCreditCard,
  FaUsers,
  FaChartBar,
  FaTachometerAlt,
  FaIdBadge,
} from "react-icons/fa";
import {
  AppPage,
  AppPageBody,
  AppPageHeader,
  AppTabs,
} from "../../components/ui/app-shell";
import AppSkeleton from "../../components/ui/AppSkeleton";

const CustomerManagement = lazy(() => import("./CustomerManagement"));
const CRMDashboard = lazy(() => import("./CRMDashboard"));
const CRMReports = lazy(() => import("./Reports"));
const Leads = lazy(() => import("./Leads"));
const SupportTickets = lazy(() => import("./Support-tickets"));
const Payments = lazy(() => import("./CustomerPayments"));

type OutletContextType = {
  openInvoiceCreate: () => void;
  openInvoiceEdit: (invoiceNumber: string, data: any) => void;
  openProformaCreate: () => void;
  openProformaEdit: (proformaId: string, data: any) => void;
  openQuotationCreate: () => void;
  openQuotationEdit: (quotationId: string, data: any) => void;
  openCustomerCreate: () => void;
  openCustomerEdit: (id: string, data: any) => void;
  openSupplierCreate: () => void;
  openSupplierEdit: (id: string, data: any) => void;
  openPOCreate: () => void;
  openPOEdit: (poId: string | number) => void;
};

const crmTabs = [
  { id: "dashboard", label: "Dashboard", icon: <FaTachometerAlt /> },
  { id: "customer-managment", label: "Customer Management", icon: <FaIdBadge /> },
  { id: "payments", label: "Payments", icon: <FaCreditCard /> },
  { id: "reports", label: "Reports", icon: <FaChartBar /> },
];

const DEFAULT_TAB = "dashboard";

const CRM: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = searchParams.get("tab") || DEFAULT_TAB;
  
  const isDashboardTab = activeTab === "dashboard";
  const { openCustomerCreate } = useOutletContext<OutletContextType>();

  const handleTabChange = (tabId: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("tab", tabId);
    navigate(`${location.pathname}?${newParams.toString()}`, { replace: true });
  };

  const handleAddCustomer = () => {
    openCustomerCreate();
  };

  const renderTab = () => {
    switch (activeTab) {
      case "dashboard":
        return <CRMDashboard />;
      case "customer-managment":
        return <CustomerManagement onAdd={handleAddCustomer} />;
      case "payments":
        return <Payments />;
      case "reports":
        return <CRMReports />;
      default:
        return <CRMDashboard />;
    }
  };

  return (
    <AppPage viewportLocked={isDashboardTab}>
      <AppPageHeader
        title="CRM"
        description="Customers and CRM reporting with a shared workspace rhythm."
        icon={<FaUsers />}
      />
      <AppTabs tabs={crmTabs} activeTab={activeTab} onChange={handleTabChange} />
      <AppPageBody viewportLocked={isDashboardTab}>
        <Suspense fallback={<AppSkeleton />}>{renderTab()}</Suspense>
      </AppPageBody>
    </AppPage>
  );
};

export default CRM;
