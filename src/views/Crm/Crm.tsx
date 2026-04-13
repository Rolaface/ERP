import React, { useState, Suspense, lazy } from "react";
import { useOutletContext } from "react-router-dom";
import {
  FaCreditCard,
  FaUsers,
  FaChartBar,
  FaTachometerAlt ,
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

const crmModule = {
  name: "CRM",
  icon: <FaUsers />,
  defaultTab: "dashboard",
  tabs: [
    { id: "dashboard", label: "Dashboard", icon: <FaTachometerAlt  /> },
    {
      id: "customer-managment",
      label: "Customer Management",
      icon: <FaIdBadge />,
    },
    { id: "payments", label: "Payments", icon: <FaCreditCard /> },
    { id: "reports", label: "Reports", icon: <FaChartBar /> },
  ],
  leads: [
    {
      id: "LEAD-001",
      name: "Global Enterprises",
      contact: "Jane Wilson",
      status: "Qualified",
      value: 150000,
      source: "Website",
    },
    {
      id: "LEAD-002",
      name: "StartupCo",
      contact: "Bob Chen",
      status: "New",
      value: 50000,
      source: "Referral",
    },
    {
      id: "LEAD-003",
      name: "Manufacturing Inc",
      contact: "Alice Johnson",
      status: "Contacted",
      value: 80000,
      source: "Cold Call",
    },
  ],
  tickets: [
    {
      id: "TICK-001",
      title: "System Login Issue",
      customer: "ABC Corporation",
      priority: "High",
      status: "Open",
      created: "2025-01-18",
    },
    {
      id: "TICK-002",
      title: "Report Generation Error",
      customer: "XYZ Industries",
      priority: "Medium",
      status: "In Progress",
      created: "2025-01-17",
    },
    {
      id: "TICK-003",
      title: "Feature Request - Export",
      customer: "Tech Solutions",
      priority: "Low",
      status: "Resolved",
      created: "2025-01-16",
    },
  ],
};

const CRM: React.FC = () => {
  const [activeTab, setActiveTab] = useState(crmModule.defaultTab);
  const isDashboardTab = activeTab === "dashboard";
  const { openCustomerCreate } = useOutletContext<OutletContextType>();

  const handleAddCustomer = () => {
    openCustomerCreate();
  };

  const handleAddLead = () => {
    setActiveTab("leads");
    console.log("onAdd -> Lead (parent handler called)");
  };

  const handleAddTicket = () => {
    setActiveTab("tickets");
    console.log("onAdd -> Ticket (parent handler called)");
  };

  const renderTab = () => {
    switch (activeTab) {
      case "dashboard":
        return <CRMDashboard />;
      case "customer-managment":
        return <CustomerManagement onAdd={handleAddCustomer} />;
      case "leads":
        return <Leads leads={crmModule.leads} onAdd={handleAddLead} />;
      case "tickets":
        return <SupportTickets tickets={crmModule.tickets} onAdd={handleAddTicket} />;
      case "payments":
        return <Payments />;
      case "reports":
        return <CRMReports />;
      default:
        return null;
    }
  };

  return (
    <AppPage viewportLocked={isDashboardTab}>
      <AppPageHeader
        title={crmModule.name}
        description="Customers and CRM reporting with a shared workspace rhythm."
        icon={crmModule.icon}
      />
      <AppTabs tabs={crmModule.tabs} activeTab={activeTab} onChange={setActiveTab} />
      <AppPageBody viewportLocked={isDashboardTab}>
        <Suspense fallback={<AppSkeleton />}>{renderTab()}</Suspense>
      </AppPageBody>
    </AppPage>
  );
};

export default CRM;
