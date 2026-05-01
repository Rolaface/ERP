import React, { Suspense, lazy, useMemo } from "react";
import { useSearchParams, useNavigate, useLocation, useOutletContext } from "react-router-dom";
import {
  FaMoneyBillWave,
  FaTachometerAlt,
  FaFileInvoice,
  FaFileInvoiceDollar,
  FaChartBar,
} from "react-icons/fa";
import {
  AppPage,
  AppPageBody,
  AppPageHeader,
  AppTabs,
} from "../../components/ui/app-shell";
import AppSkeleton from "../../components/ui/AppSkeleton";

const QuotationsTable = lazy(() => import("./Quotations"));
const InvoiceTable = lazy(() => import("./Invoices"));
const ReportTable = lazy(() => import("./Reports"));
const POS = lazy(() => import("./POS"));
const SalesDashboard = lazy(() => import("./SalesDashboard"));
const ProformaInvoicesTable = lazy(() => import("./ProformaInvoice"));
const CreditNotesTable = lazy(() => import("./CreditNotesTable"));
const DebitNotesTable = lazy(() => import("./DebitNotesTable"));
const SalesAnalytics = lazy(() => import("./SalesAnalytics"));

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

const salesTabs = [
  { id: "salesdashboard", label: "Dashboard", icon: <FaTachometerAlt /> },
  { id: "quotations", label: "Quotations", icon: <FaFileInvoice /> },
  {
    id: "proformaInvoice",
    label: "Proforma Invoice",
    icon: <FaFileInvoiceDollar />,
  },
  { id: "invoices", label: "Invoices", icon: <FaFileInvoiceDollar /> },
  { id: "creditNotes", label: "Credit Notes", icon: <FaFileInvoiceDollar /> },
  { id: "reports", label: "Reports", icon: <FaChartBar /> },
  { id: "salesAnalytics", label: "Sales Analytics", icon: <FaChartBar /> },
];

const DEFAULT_TAB = "salesdashboard";

const SalesModule: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { openInvoiceCreate, openProformaCreate, openQuotationCreate } =
    useOutletContext<OutletContextType>();
  
  // Get active tab from URL query param, default to dashboard
  const activeTab = searchParams.get("tab") || DEFAULT_TAB;
  
  const isDashboardTab = activeTab === "salesdashboard";

  const handleTabChange = (tabId: string) => {
    // Update URL with new tab, preserving other query params
    const newParams = new URLSearchParams(searchParams);
    newParams.set("tab", tabId);
    navigate(`${location.pathname}?${newParams.toString()}`, { replace: true });
  };

  const renderTab = () => {
    switch (activeTab) {
      case "salesdashboard":
        return <SalesDashboard />;
      case "quotations":
        return (
          <QuotationsTable
            key={activeTab}
            onAddQuotation={() => openQuotationCreate()}
            onExportQuotation={() => console.log("Export quotations")}
          />
        );
      case "proformaInvoice":
        return (
          <ProformaInvoicesTable
            key={activeTab}
            onAddProformaInvoice={() => openProformaCreate()}
            onExportProformaInvoice={() => console.log("Export proforma invoices")}
          />
        );
      case "invoices":
        return (
          <InvoiceTable
            key={activeTab}
            onAddInvoice={() => openInvoiceCreate()}
            onExportInvoice={() => console.log("Export invoices")}
          />
        );
      case "pos":
        return <POS />;
      case "creditNotes":
        return <CreditNotesTable />;
      case "reports":
        return <ReportTable />;
      case "salesAnalytics":
        return <SalesAnalytics />;
      default:
        return <SalesDashboard />;
    }
  };

  return (
    <AppPage viewportLocked={isDashboardTab}>
      <AppPageHeader
        title="Sales"
        description="End-to-end sales management"
        icon={<FaMoneyBillWave />}
      />
      <AppTabs tabs={salesTabs} activeTab={activeTab} onChange={handleTabChange} />
      <AppPageBody viewportLocked={isDashboardTab}>
        <Suspense fallback={<AppSkeleton />}>{renderTab()}</Suspense>
      </AppPageBody>
    </AppPage>
  );
};

export default SalesModule;
