import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import RFQsTable from "./Rfqs";
import PurchaseOrdersTable from "./PurchaseOrders";
import ApprovalsSection from "./Approvals";
import Dashboard from "./ProcurementDashboard";
import ApprovalModal from "../../components/procurement/ApprovalModal";
import {
  FaClipboardList,
  FaCheckCircle,
  FaShoppingBag,
  FaTachometerAlt,
  FaFileSignature,
  FaTruckLoading,
  FaLandmark,
  FaCreditCard,
} from "react-icons/fa";
import SupplierManagement from "./SupplierManagement";
import PurchaseInvoiceTable from "./PurchaseInvoice";
import Payments from "./SupplierPayment";
import PurchaseAnalytics from "./PurchaseAnalytics";

type OutletContextType = {
  // Sales
  openInvoiceCreate: () => void;
  openInvoiceEdit: (invoiceNumber: string, data: any) => void;
  openProformaCreate: () => void;
  openProformaEdit: (proformaId: string, data: any) => void;
  openQuotationCreate: () => void;
  openQuotationEdit: (quotationId: string, data: any) => void;
  // CRM
  openCustomerCreate: () => void;
  openCustomerEdit: (id: string, data: any) => void;
  // Procurement
  openSupplierCreate: () => void;
  openSupplierEdit: (id: string, data: any) => void;
  openPOCreate: () => void;
  openPOEdit: (poId: string | number) => void;
};

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
    { id: "payments", name: "Payments", icon: <FaCreditCard /> },
    { id: "rfqs", name: "RFQs", icon: <FaFileSignature /> },
    { id: "orders", name: "Purchase Orders", icon: <FaClipboardList /> },
    { id: "approvals", name: "Approvals", icon: <FaCheckCircle /> },
    // {
    //   id: "invoicematching",
    //   name: "Invoice Matching",
    //   icon: <FaFileInvoiceDollar />,
    // },
    { id: "purchase", name: "Purchase Invoice", icon: <FaTruckLoading /> },
    {
      id: "purchaseAnalytics",
      name: "Purchase Analytics",
      icon: <FaTruckLoading />,
    },
  ],
};

const Procurement: React.FC = () => {
  const [activeTab, setActiveTab] = useState(procurement.defaultTab);
  
  // ✅ GLOBAL MODAL CONTROL FROM APP LAYOUT
  const { openSupplierCreate, openSupplierEdit, openPOCreate } = useOutletContext<OutletContextType>();
  
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showGRModal, setShowGRModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  const handleAdd = () => {
    if (activeTab === "supplier") openSupplierCreate();
    else if (activeTab === "orders") openPOCreate();
    else if (activeTab === "approvals") setShowApprovalModal(true);
    else if (activeTab === "goodsreceipt") setShowGRModal(true);
    else if (activeTab === "invoicematching") setShowInvoiceModal(true);
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
        {activeTab === "supplier" && <SupplierManagement onAdd={handleAdd} />}
        {activeTab === "rfqs" && <RFQsTable onAdd={handleAdd} />}
        {activeTab === "orders" && <PurchaseOrdersTable onAdd={handleAdd} />}
        {activeTab === "approvals" && <ApprovalsSection onAdd={handleAdd} />}
        {activeTab === "purchase" && <PurchaseInvoiceTable onAdd={handleAdd} />}
        {activeTab === "procurementdashboard" && <Dashboard />}
        {activeTab === "payments" && <Payments />}
        {activeTab === "purchaseAnalytics" && <PurchaseAnalytics />}
      </div>

      {/* Modals */}
      <ApprovalModal
        isOpen={showApprovalModal}
        onClose={() => setShowApprovalModal(false)}
        onSubmit={(data) => console.log("New Approval:", data)}
      />
    </div>
  );
};

export default Procurement;
