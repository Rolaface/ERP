import React, { useState } from "react";
import CustomerManagement from "./CustomerManagement";
import CRMDashboard from "./CRMDashboard";
import CRMReports from "./Reports";
import Leads from "./Leads";
import SupportTickets from "./Support-tickets";

import {
  FaUsers,
  // FaUser,
  // FaTicketAlt,
  FaChartBar,
  FaCalendarAlt,
  FaIdBadge,
} from "react-icons/fa";

const crmModule = {
  name: "CRM",
  icon: <FaUsers />,
  defaultTab: "dashboard",
  tabs: [
    { id: "dashboard", name: "Dashboard", icon: <FaCalendarAlt /> },
    {
      id: "customer-managment",
      name: "Customer Management",
      icon: <FaIdBadge />,
    },
    // { id: "leads", name: "Leads", icon: <FaUser /> },
    // { id: "tickets", name: "Support Tickets", icon: <FaTicketAlt /> },
    { id: "reports", name: "Reports", icon: <FaChartBar /> },
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
  opportunities: [
    {
      id: "OPP-001",
      name: "Enterprise Software Deal",
      customer: "Global Enterprises",
      value: 150000,
      stage: "Proposal",
      probability: 70,
    },
    {
      id: "OPP-002",
      name: "Startup Package",
      customer: "StartupCo",
      value: 50000,
      stage: "Qualification",
      probability: 30,
    },
    {
      id: "OPP-003",
      name: "Manufacturing Solution",
      customer: "Manufacturing Inc",
      value: 80000,
      stage: "Needs Analysis",
      probability: 50,
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

  const handleAddCustomer = () => {
    setActiveTab("customer-managment");
    console.warn("onAdd -> Customer (parent handler called)");
  };

  const handleAddLead = () => {
    setActiveTab("leads");
    console.warn("onAdd -> Lead (parent handler called)");
  };

  const handleAddTicket = () => {
    setActiveTab("tickets");
    console.warn("onAdd -> Ticket (parent handler called)");
  };

  return (
    <div className="bg-app min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between p-6 pb-0">
        <h2 className="text-2xl font-bold flex items-center gap-2 text-main">
          <span>{crmModule.icon}</span> {crmModule.name}
        </h2>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 px-6 mt-6">
        {crmModule.tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 font-medium flex items-center gap-2 transition-colors ${
              activeTab === tab.id
                ? "text-primary border-b-2 border-current"
                : "text-muted hover:text-main"
            }`}
          >
            <span>{tab.icon}</span> {tab.name}
          </button>
        ))}
      </div>

      <div className={activeTab === "customer-managment" ? "" : "p-8"}>
        <div>
          {activeTab === "dashboard" && <CRMDashboard />}

          {activeTab === "customer-managment" && (
            <CustomerManagement onAdd={handleAddCustomer} />
          )}

          {activeTab === "leads" && (
            <Leads leads={crmModule.leads} onAdd={handleAddLead} />
          )}

          {activeTab === "tickets" && (
            <SupportTickets
              tickets={crmModule.tickets}
              onAdd={handleAddTicket}
            />
          )}

          {activeTab === "reports" && <CRMReports />}
        </div>
      </div>
    </div>
  );
};

export default CRM;
