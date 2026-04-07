import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import CustomerManagement from "./CustomerManagement";
import CRMDashboard from "./CRMDashboard";
import CRMReports from "./Reports";
import Leads from "./Leads";
import SupportTickets from "./Support-tickets";
import Payments from "./CustomerPayments";
import {
  FaCreditCard,
  FaUsers,
  FaChartBar,
  FaCalendarAlt,
  FaIdBadge,
} from "react-icons/fa";
import {
  AppPage,
  AppPageBody,
  AppPageHeader,
  AppTabs,
} from "../../components/ui/app-shell";

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
    { id: "dashboard", label: "Dashboard", icon: <FaCalendarAlt /> },
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

  return (
    <AppPage viewportLocked={isDashboardTab}>
      <AppPageHeader
        title={crmModule.name}
        description="Customers and CRM reporting with a shared workspace rhythm."
        icon={crmModule.icon}
      />
      <AppTabs tabs={crmModule.tabs} activeTab={activeTab} onChange={setActiveTab} />
      <AppPageBody viewportLocked={isDashboardTab}>
        {activeTab === "dashboard" && <CRMDashboard />}
        {activeTab === "customer-managment" && (
          <CustomerManagement onAdd={handleAddCustomer} />
        )}
        {activeTab === "leads" && (
          <Leads leads={crmModule.leads} onAdd={handleAddLead} />
        )}
        {activeTab === "tickets" && (
          <SupportTickets tickets={crmModule.tickets} onAdd={handleAddTicket} />
        )}
        {activeTab === "payments" && <Payments />}
        {activeTab === "reports" && <CRMReports />}
      </AppPageBody>
    </AppPage>
  );
};

export default CRM;
