import React, { Suspense, lazy, useState, useMemo, useCallback } from "react";
import { useOutletContext, useSearchParams, useNavigate, useLocation } from "react-router-dom";
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
import {
  AppPage,
  AppPageBody,
  AppPageHeader,
  AppTabs,
} from "../../components/ui/app-shell";
import AppSkeleton from "../../components/ui/AppSkeleton";

const RFQsTable = lazy(() => import("./Rfqs"));
const PurchaseOrdersTable = lazy(() => import("./PurchaseOrders"));
const ApprovalsSection = lazy(() => import("./Approvals"));
const Dashboard = lazy(() => import("./ProcurementDashboard"));
const SupplierManagement = lazy(() => import("./SupplierManagement"));
const PurchaseInvoiceTable = lazy(() => import("./PurchaseInvoice"));
const Payments = lazy(() => import("./SupplierPayment"));
const PurchaseAnalytics = lazy(() => import("./PurchaseAnalytics"));

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

const procurementTabs = [
  { id: "procurementdashboard", label: "Dashboard", icon: <FaTachometerAlt /> },
  { id: "supplier", label: "Supplier Management", icon: <FaLandmark /> },
  { id: "payments", label: "Payments", icon: <FaCreditCard /> },
  { id: "rfqs", label: "RFQs", icon: <FaFileSignature /> },
  { id: "orders", label: "Purchase Orders", icon: <FaClipboardList /> },
  { id: "approvals", label: "Approvals", icon: <FaCheckCircle /> },
  { id: "purchase", label: "Purchase Invoice", icon: <FaTruckLoading /> },
  { id: "purchaseAnalytics", label: "Purchase Analytics", icon: <FaTruckLoading /> },
];

const DEFAULT_TAB = "procurementdashboard";

const Procurement: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = searchParams.get("tab") || DEFAULT_TAB;
  
  const isDashboardTab = activeTab === "procurementdashboard";
  const { openSupplierCreate, openPOCreate } =
    useOutletContext<OutletContextType>();

  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showGRModal, setShowGRModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  const handleTabChange = useCallback((tabId: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("tab", tabId);
    navigate(`${location.pathname}?${newParams.toString()}`, { replace: true });
  }, [navigate, location.pathname, searchParams]);

  const handleAdd = useCallback(() => {
    if (activeTab === "supplier") openSupplierCreate();
    else if (activeTab === "orders") openPOCreate();
    else if (activeTab === "approvals") setShowApprovalModal(true);
    else if (activeTab === "goodsreceipt") setShowGRModal(true);
    else if (activeTab === "invoicematching") setShowInvoiceModal(true);
  }, [activeTab, openSupplierCreate, openPOCreate]);

  // Stable tab components - NO remounting on tab switch
  const tabComponents = useMemo(() => ({
    procurementdashboard: <Dashboard />,
    supplier: <SupplierManagement onAdd={handleAdd} />,
    rfqs: <RFQsTable onAdd={handleAdd} />,
    orders: <PurchaseOrdersTable onAdd={handleAdd} />,
    approvals: <ApprovalsSection onAdd={handleAdd} />,
    purchase: <PurchaseInvoiceTable onAdd={handleAdd} />,
    payments: <Payments />,
    purchaseAnalytics: <PurchaseAnalytics />,
  }), [handleAdd]);

  const currentTabComponent = tabComponents[activeTab as keyof typeof tabComponents] || <Dashboard />;

  return (
    <AppPage viewportLocked={isDashboardTab}>
      <AppPageHeader
        title="Procurement"
        description="Supplier operations, approvals, and purchasing analytics in one layout system."
        icon={<FaShoppingBag />}
      />
      <AppTabs tabs={procurementTabs} activeTab={activeTab} onChange={handleTabChange} />
      <AppPageBody viewportLocked={isDashboardTab}>
        {currentTabComponent}
      </AppPageBody>

      {showApprovalModal && (
        <ApprovalModal
          isOpen={showApprovalModal}
          onClose={() => setShowApprovalModal(false)}
          onSubmit={(data) => console.log("New Approval:", data)}
        />
      )}
    </AppPage>
  );
};

export default Procurement;
