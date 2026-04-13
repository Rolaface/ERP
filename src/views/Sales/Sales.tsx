import React, { useState, Suspense, lazy } from "react";
import { useOutletContext } from "react-router-dom";
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
  { id: "salesdashboard", label: "Dashboard", icon: <FaTachometerAlt  /> },
  { id: "quotations", label: "Quotations", icon: <FaFileInvoice /> },
  {
    id: "proformaInvoice",
    label: "Proforma Invoice",
    icon: <FaFileInvoiceDollar />,
  },
  { id: "invoices", label: "Invoices", icon: <FaFileInvoiceDollar /> },
  { id: "creditNotes", label: "Credit Notes", icon: <FaFileInvoiceDollar /> },
  { id: "debitNotes", label: "Debit Notes", icon: <FaFileInvoiceDollar /> },
  { id: "reports", label: "Reports", icon: <FaChartBar /> },
  { id: "salesAnalytics", label: "Sales Analytics", icon: <FaChartBar /> },
];

const SalesModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState("salesdashboard");
  const [refreshKey] = useState(0);
  const isDashboardTab = activeTab === "salesdashboard";
  const { openInvoiceCreate, openProformaCreate, openQuotationCreate } =
    useOutletContext<OutletContextType>();

  const renderTab = () => {
    switch (activeTab) {
      case "salesdashboard":
        return <SalesDashboard />;
      case "quotations":
        return (
          <QuotationsTable
            key={refreshKey}
            onAddQuotation={() => openQuotationCreate()}
            onExportQuotation={() => console.log("Export quotations")}
          />
        );
      case "proformaInvoice":
        return (
          <ProformaInvoicesTable
            refreshKey={refreshKey}
            onAddProformaInvoice={() => openProformaCreate()}
            onExportProformaInvoice={() => console.log("Export proforma invoices")}
          />
        );
      case "invoices":
        return (
          <InvoiceTable
            key={refreshKey}
            onAddInvoice={() => openInvoiceCreate()}
            onExportInvoice={() => console.log("Export invoices")}
          />
        );
      case "pos":
        return <POS />;
      case "creditNotes":
        return <CreditNotesTable />;
      case "debitNotes":
        return <DebitNotesTable />;
      case "reports":
        return <ReportTable />;
      case "salesAnalytics":
        return <SalesAnalytics />;
      default:
        return null;
    }
  };

  return (
    <AppPage viewportLocked={isDashboardTab}>
      <AppPageHeader
        title="Sales"
        description="Quotes, invoices and sales analytics in one workflow."
        icon={<FaMoneyBillWave />}
      />
      <AppTabs tabs={salesTabs} activeTab={activeTab} onChange={setActiveTab} />
      <AppPageBody viewportLocked={isDashboardTab}>
        <Suspense fallback={<AppSkeleton />}>{renderTab()}</Suspense>
      </AppPageBody>
    </AppPage>
  );
};

export default SalesModule;
