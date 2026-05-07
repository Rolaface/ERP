import React, { Suspense, lazy, useState, useMemo, useCallback } from "react";
import { useOutletContext, useSearchParams, useNavigate, useLocation } from "react-router-dom";
import ApprovalModal from "../../components/procurement/ApprovalModal";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  FileText,
  ClipboardList,
  CheckCircle2,
  Receipt,
  FileMinus,
  BarChart3,
  ShoppingBag
} from "lucide-react";
import {
  AppPage,
  AppPageBody,
  AppPageHeader,
  AppTabs,
} from "../../components/ui/app-shell";
import DebitNotesTable from "../Sales/DebitNotesTable";
import { usePermission } from "../../hooks/permission/usePermission";

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

const iconProps = {
  size: 16,
  strokeWidth: 1.75,
};

const ALL_PROCUREMENT_TABS = [
  {
    id: "procurementdashboard",
    label: "Dashboard",
    icon: <LayoutDashboard {...iconProps} />,
    module: null,
  },
  {
    id: "supplier",
    label: "Supplier Management",
    icon: <Users {...iconProps} />,
    module: "Supplier",
    action: "read" as const, 
  },
  {
    id: "payments",
    label: "Payments",
    icon: <CreditCard {...iconProps} />,
    module: "Payment Entry",
    action: "read" as const, 
  },
  {
    id: "rfqs",
    label: "RFQs",
    icon: <FileText {...iconProps} />,
    module: "Request For Quotation",
    action: "read" as const, 
  },
  {
    id: "orders",
    label: "Purchase Orders",
    icon: <ClipboardList {...iconProps} />,
    module: "Purchase Order",
    action: "read" as const, 
  },
  {
    id: "purchase",
    label: "Purchase Invoice",
    icon: <Receipt {...iconProps} />,
    module: "Purchase Invoice",
    action: "read" as const, 
  },
  {
    id: "debitNotes",
    label: "Debit Notes",
    icon: <FileMinus {...iconProps} />,
    module: "Debit Note",
    action: "read" as const, 
  },
  {
    id: "purchaseAnalytics",
    label: "Purchase Analytics",
    icon: <BarChart3 {...iconProps} />,
    module: "Purchase Invoice",
    action: "report" as const, 
  },
];
const DEFAULT_TAB = "procurementdashboard";

const Procurement: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { can } = usePermission();                          

  // Filter tabs based on permissions
  const procurementTabs = useMemo(
    () => ALL_PROCUREMENT_TABS.filter((t) => !t.module || can(t.module, t.action)),
    [can]
  );                                                        

  const activeTab = searchParams.get("tab") || DEFAULT_TAB;

  // If current tab not visible, fall back to first visible

  const resolvedTab =
    procurementTabs.find((t) => t.id === activeTab)?.id ??
    procurementTabs[0]?.id ??
    DEFAULT_TAB;      
          
  
  const isDashboardTab = resolvedTab === "procurementdashboard";
  const { openSupplierCreate, openPOCreate } = useOutletContext<OutletContextType>();

  const [showApprovalModal, setShowApprovalModal] = useState(false);

  const handleTabChange = useCallback((tabId: string) => {
    const newParams = new URLSearchParams(searchParams);

    newParams.set("tab", tabId);
    navigate(`${location.pathname}?${newParams.toString()}`, { replace: true });
  }, [navigate, location.pathname, searchParams]);

  const handleAdd = useCallback(() => {
    if (resolvedTab === "supplier") openSupplierCreate();
    else if (resolvedTab === "orders") openPOCreate();
    else if (resolvedTab === "approvals") setShowApprovalModal(true);
  }, [resolvedTab, openSupplierCreate, openPOCreate]);

  const tabComponents = useMemo(() => ({
    procurementdashboard: <Dashboard />,
    supplier:             <SupplierManagement onAdd={handleAdd} />,
    rfqs:                 <RFQsTable onAdd={handleAdd} />,
    orders:               <PurchaseOrdersTable onAdd={handleAdd} />,
    approvals:            <ApprovalsSection onAdd={handleAdd} />,
    purchase:             <PurchaseInvoiceTable onAdd={handleAdd} />,
    payments:             <Payments />,
    purchaseAnalytics:    <PurchaseAnalytics />,
    debitNotes:           <DebitNotesTable />,
  }), [handleAdd]);

  const currentTabComponent =
    tabComponents[resolvedTab as keyof typeof tabComponents] ?? <Dashboard />;

  return (
    <AppPage viewportLocked={isDashboardTab}>
      <AppPageHeader
        title="Procurement"
        description="Manage the full procurement cycle—from RFQs and POs to payments."
        icon={<ShoppingBag size={20} strokeWidth={1.75} />}
      />
      <AppTabs tabs={procurementTabs} activeTab={resolvedTab} onChange={handleTabChange} />
      <AppPageBody viewportLocked={isDashboardTab}>
        <Suspense fallback={null}>
          {currentTabComponent}
        </Suspense>
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
