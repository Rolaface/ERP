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

const procurement = {
  name: "Procurement",
  icon: <FaShoppingBag />,
  defaultTab: "procurementdashboard",
  tabs: [
    { id: "procurementdashboard", label: "Dashboard", icon: <FaTachometerAlt /> },
    { id: "supplier", label: "Supplier Management", icon: <FaLandmark /> },
    { id: "payments", label: "Payments", icon: <FaCreditCard /> },
    { id: "rfqs", label: "RFQs", icon: <FaFileSignature /> },
    { id: "orders", label: "Purchase Orders", icon: <FaClipboardList /> },
    { id: "approvals", label: "Approvals", icon: <FaCheckCircle /> },
    { id: "purchase", label: "Purchase Invoice", icon: <FaTruckLoading /> },
    {
      id: "purchaseAnalytics",
      label: "Purchase Analytics",
      icon: <FaTruckLoading />,
    },
  ],
};

const Procurement: React.FC = () => {
  const [activeTab, setActiveTab] = useState(procurement.defaultTab);
  const isDashboardTab = activeTab === "procurementdashboard";
  const { openSupplierCreate, openPOCreate } =
    useOutletContext<OutletContextType>();

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
    <AppPage viewportLocked={isDashboardTab}>
      <AppPageHeader
        title={procurement.name}
        description="Supplier operations, approvals, and purchasing analytics in one layout system."
        icon={procurement.icon}
      />
      <AppTabs tabs={procurement.tabs} activeTab={activeTab} onChange={setActiveTab} />
      <AppPageBody viewportLocked={isDashboardTab}>
        {activeTab === "supplier" && <SupplierManagement onAdd={handleAdd} />}
        {activeTab === "rfqs" && <RFQsTable onAdd={handleAdd} />}
        {activeTab === "orders" && <PurchaseOrdersTable onAdd={handleAdd} />}
        {activeTab === "approvals" && <ApprovalsSection onAdd={handleAdd} />}
        {activeTab === "purchase" && <PurchaseInvoiceTable onAdd={handleAdd} />}
        {activeTab === "procurementdashboard" && <Dashboard />}
        {activeTab === "payments" && <Payments />}
        {activeTab === "purchaseAnalytics" && <PurchaseAnalytics />}
      </AppPageBody>

      <ApprovalModal
        isOpen={showApprovalModal}
        onClose={() => setShowApprovalModal(false)}
        onSubmit={(data) => console.log("New Approval:", data)}
      />
    </AppPage>
  );
};

export default Procurement;
