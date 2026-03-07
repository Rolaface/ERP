import React, { useState } from "react";
import PurchaseOrdersTable from "./PurchaseOrders";
import Dashboard from "./ProcurementDashboard";
import {
  FaClipboardList,
  FaShoppingBag,
  FaTachometerAlt,
  FaTruckLoading,
  FaLandmark,
} from "react-icons/fa";
import SupplierManagement from "./SupplierManagement";
import PurchaseInvoiceTable from "./PurchaseInvoice";

const procurement = {
  name: "Procurement",
  icon: <FaShoppingBag />,
  defaultTab: "procurementdashboard",
  tabs: [
    {
      id: "procurementdashboard",
      name: "Dashboard",
      icon: <FaTachometerAlt />,
    },
    { id: "supplier", name: "Supplier Management", icon: <FaLandmark /> },
    { id: "orders", name: "Purchase Orders", icon: <FaClipboardList /> },
    { id: "purchase", name: "Purchase Invoice", icon: <FaTruckLoading /> },
  ],
};

const Procurement: React.FC = () => {
  const [activeTab, setActiveTab] = useState(procurement.defaultTab);

  const handleAdd = () => {
    return;
  };

  return (
    <div className="p-6 bg-app ">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2 text-main">
          <span>{procurement.icon}</span> {procurement.name}
        </h2>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-4">
        {procurement.tabs.map((tab) => (
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

      {/* Content */}
      <div>
        {activeTab === "supplier" && <SupplierManagement />}
        {activeTab === "orders" && <PurchaseOrdersTable onAdd={handleAdd} />}
        {activeTab === "purchase" && <PurchaseInvoiceTable onAdd={handleAdd} />}
        {activeTab === "procurementdashboard" && <Dashboard />}
      </div>
    </div>
  );
};

export default Procurement;
