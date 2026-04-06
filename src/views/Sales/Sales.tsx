import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import QuotationsTable from "./Quotations";
import InvoiceTable from "./Invoices";
import ReportTable from "./Reports";
import POS from "./POS";
import SalesDashboard from "./SalesDashboard";
import ProformaInvoicesTable from "./ProformaInvoice";
import CreditNotesTable from "./CreditNotesTable";
import DebitNotesTable from "./DebitNotesTable";
import SalesAnalytics from "./SalesAnalytics";
import {
  FaMoneyBillWave,
  FaCalendarAlt,
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
  { id: "salesdashboard", label: "Dashboard", icon: <FaCalendarAlt /> },
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

  const tabConfig: Record<string, { component: React.ReactNode }> = {
    salesdashboard: { component: <SalesDashboard /> },
    quotations: {
      component: (
        <QuotationsTable
          key={refreshKey}
          onAddQuotation={() => openQuotationCreate()}
          onExportQuotation={() => console.log("Export quotations")}
        />
      ),
    },
    proformaInvoice: {
      component: (
        <ProformaInvoicesTable
          refreshKey={refreshKey}
          onAddProformaInvoice={() => openProformaCreate()}
          onExportProformaInvoice={() => console.log("Export proforma invoices")}
        />
      ),
    },
    invoices: {
      component: (
        <InvoiceTable
          key={refreshKey}
          onAddInvoice={() => openInvoiceCreate()}
          onExportInvoice={() => console.log("Export invoices")}
        />
      ),
    },
    pos: { component: <POS /> },
    creditNotes: { component: <CreditNotesTable /> },
    debitNotes: { component: <DebitNotesTable /> },
    reports: { component: <ReportTable /> },
    salesAnalytics: { component: <SalesAnalytics /> },
  };

  return (
    <AppPage viewportLocked={isDashboardTab}>
      <AppPageHeader
        title="Sales"
        description="Quotes, invoices, receivables, and sales analytics in one workflow."
        icon={<FaMoneyBillWave />}
      />
      <AppTabs tabs={salesTabs} activeTab={activeTab} onChange={setActiveTab} />
      <AppPageBody viewportLocked={isDashboardTab}>
        {tabConfig[activeTab]?.component}
      </AppPageBody>
    </AppPage>
  );
};

export default SalesModule;
