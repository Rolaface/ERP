import React, { Suspense, lazy, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import {
  LayoutDashboard,
  FileSignature,
  FileClock,
  Receipt,
  FileMinus,
  BarChart3,
  TrendingUp,
  ShoppingCart
} from "lucide-react";
import {
  AppPage,
  AppPageBody,
  AppPageHeader,
  AppTabs,
} from "../../components/ui/app-shell";
import AppSkeleton from "../../components/ui/AppSkeleton";
import { usePermission } from "../../hooks/permission/usePermission";
import { useUrlTab } from "../../hooks/useUrlTab";


const QuotationsTable = lazy(() => import("./Quotations"));
const InvoiceTable = lazy(() => import("./Invoices"));
const ReportTable = lazy(() => import("./Reports"));
const POS = lazy(() => import("./POS"));
const SalesDashboard = lazy(() => import("./SalesDashboard"));
const ProformaInvoicesTable = lazy(() => import("./ProformaInvoice"));
const CreditNotesTable = lazy(() => import("./CreditNotesTable"));
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

const ALL_SALES_TAB = [
  {
    id: "salesdashboard",
    label: "Dashboard",
    icon: <LayoutDashboard size={16} strokeWidth={1.75} />,
    module: null,
  },
  {
    id: "quotations",
    label: "Quotations",
    icon: <FileSignature size={16} strokeWidth={1.75} />,
    module: null,
    action: "read" as const,
  },
  {
    id: "proformaInvoice",
    label: "Proforma Invoice",
    icon: <FileClock size={16} strokeWidth={1.75} />,
    module: null,
    action: "read" as const,
  },
  {
    id: "invoices",
    label: "Invoices",
    icon: <Receipt size={16} strokeWidth={1.75} />,
    module: "Sales Invoice",
    action: "read" as const,
  },
  {
    id: "creditNotes",
    label: "Credit Notes",
    icon: <FileMinus size={16} strokeWidth={1.75} />,
    module: "Sales Invoice",
    action: "read" as const,
  },
  {
    id: "reports",
    label: "Reports",
    icon: <BarChart3 size={16} strokeWidth={1.75} />,
    module: "Sales Invoice",
    action: "report" as const,    // ← report action
  },
  {
    id: "salesAnalytics",
    label: "Sales Analytics",
    icon: <TrendingUp size={16} strokeWidth={1.75} />,
    module: "Sales Invoice",
    action: "report" as const,    // ← report action
  },
];

const DEFAULT_TAB = "salesdashboard";

const SalesModule: React.FC = () => {
  const { can } = usePermission();       
  
   const salesTabs = useMemo(
  () => ALL_SALES_TAB.filter((t) => !t.module || can(t.module, t.action)),
  [can]
);                                                       

  const { openInvoiceCreate, openProformaCreate, openQuotationCreate } =
    useOutletContext<OutletContextType>();
  

  const fallbackTab = salesTabs[0]?.id ?? DEFAULT_TAB;
  const [activeTab, handleTabChange] = useUrlTab({
    tabs: salesTabs,
    defaultTab: fallbackTab,
    basePath: "/sales",
  });
  const resolvedTab = activeTab;


  const isDashboardTab = resolvedTab === "salesdashboard";

  const renderTab = () => {
    switch (resolvedTab) {
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
          icon={<ShoppingCart size={20} strokeWidth={1.75} />}
      />
      <AppTabs tabs={salesTabs} activeTab={resolvedTab} onChange={handleTabChange} />
      <AppPageBody viewportLocked={isDashboardTab}>
        <Suspense fallback={<AppSkeleton />}>{renderTab()}</Suspense>
      </AppPageBody>
    </AppPage>
  );
};

export default SalesModule;
