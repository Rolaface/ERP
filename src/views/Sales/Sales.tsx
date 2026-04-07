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

import { showApiError, showSuccess } from "../../utils/alert";
import { createSalesInvoice } from "../../api/salesApi";
import { createQuotation } from "../../api/quotationApi";

import {
  FaMoneyBillWave,
  FaCalendarAlt,
  FaFileInvoice,
  FaFileInvoiceDollar,
  FaChartBar,
} from "react-icons/fa";

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

const salesTabs = [
  { id: "salesdashboard", name: "Dashboard", icon: <FaCalendarAlt /> },
  { id: "quotations", name: "Quotations", icon: <FaFileInvoice /> },
  {
    id: "proformaInvoice",
    name: "Proforma Invoice",
    icon: <FaFileInvoiceDollar />,
  },
  { id: "invoices", name: "Invoices", icon: <FaFileInvoiceDollar /> },
  { id: "creditNotes", name: "Credit Notes", icon: <FaFileInvoiceDollar /> },
  { id: "debitNotes", name: "Debit Notes", icon: <FaFileInvoiceDollar /> },
  { id: "reports", name: "Reports", icon: <FaChartBar /> },
  { id: "salesAnalytics", name: "Sales Analytics", icon: <FaChartBar /> },
];

const SalesModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState("salesdashboard");
  const [refreshKey, setRefreshKey] = useState(0);

  // ✅ GLOBAL MODAL CONTROL FROM APP LAYOUT
  const { 
    openInvoiceCreate, 
    openInvoiceEdit,
    openProformaCreate, 
    openProformaEdit,
    openQuotationCreate,
    openQuotationEdit,
  } = useOutletContext<OutletContextType>();

  // ================= API HANDLERS =================

 
  // ================= TAB CONFIG =================

  const TAB_CONFIG: Record<string, { component: React.ReactNode }> = {
    salesdashboard: {
      component: <SalesDashboard />,
    },

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
          onExportProformaInvoice={() =>
            console.log("Export proforma invoices")
          }
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

    pos: {
      component: <POS />,
    },

    creditNotes: {
      component: <CreditNotesTable />,
    },

    debitNotes: {
      component: <DebitNotesTable />,
    },

    reports: {
      component: <ReportTable />,
    },

    salesAnalytics: {
      component: <SalesAnalytics />,
    },
  };

  const tab = TAB_CONFIG[activeTab];

  // ================= UI =================

  return (
    <div className="p-6 bg-app">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2 text-main">
          <FaMoneyBillWave /> Sales
        </h2>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-4">
        {salesTabs.map((tabItem) => (
          <button
            key={tabItem.id}
            onClick={() => setActiveTab(tabItem.id)}
            className={`px-4 py-2 font-medium flex items-center gap-2 ${
              activeTab === tabItem.id
                ? "text-primary border-b-2 border-current"
                : "text-muted hover:text-main"
            }`}
          >
            {tabItem.icon}
            {tabItem.name}
          </button>
        ))}
      </div>

      {/* Content */}
      <div>{tab?.component}</div>
    </div>
  );
};

export default SalesModule;