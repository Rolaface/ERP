import React, { useState } from "react";

import QuotationsTable from "./Quotations";
import InvoiceTable from "./Invoices";
import ReportTable from "./Reports";
import Pos from "./POS";
import SalesDashboard from "./SalesDashboard";
import ProformaInvoicesTable from "./ProformaInvoice";

import QuotationModal from "../../components/sales/QuotationModal";
import InvoiceModal from "../../components/sales/InvoiceModal";
import ProformaInvoiceModal from "../../components/sales/ProformaInvoiceModal";
import PosModal from "../../components/sales/PosModal";
import { showApiError, showSuccess } from "../../utils/alert";
import { createSalesInvoice } from "../../api/salesApi";
import { createQuotation } from "../../api/quotationApi";
import CreditNotesTable from "./CreditNotesTable";
import DebitNotesTable from "./DebitNotesTable";

import { Receipt } from "lucide-react";
import {
  FaCalendarAlt,
  FaFileInvoice,
  FaChartBar,
} from "react-icons/fa";

type ModalType = null | "quotation" | "invoice" | "proforma" | "pos";

const salesTabs = [
  { id: "salesdashboard", name: "Dashboard", icon: <FaCalendarAlt /> },
  { id: "quotations", name: "Quotations", icon: <FaFileInvoice /> },
  {
    id: "proformaInvoice",
    name: "Proforma Invoice",
    icon: <FaFileInvoice />,
  },
  { id: "invoices", name: "Invoices", icon: <FaFileInvoice /> },

  { id: "creditNotes", name: "Credit Notes", icon: <FaFileInvoice /> },
  { id: "debitNotes", name: "Debit Notes", icon: <FaFileInvoice /> },

  // { id: "pos", name: "POS", icon: <FaCashRegister /> },
  { id: "reports", name: "Reports", icon: <FaChartBar /> },
];

const SalesModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState("salesdashboard");
  const [openModal, setOpenModal] = useState<ModalType>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const TAB_CONFIG: Record<
    string,
    { component: React.ReactNode; onAdd?: () => void }
  > = {
    salesdashboard: {
      component: <SalesDashboard />,
    },
    quotations: {
      component: (
        <QuotationsTable
          key={refreshKey}
          onAddQuotation={() => setOpenModal("quotation")}
          onExportQuotation={() => {
            console.warn("Export quotations");
          }}
        />
      ),
    },
    proformaInvoice: {
      component: (
        <ProformaInvoicesTable
          refreshKey={refreshKey}
          onAddProformaInvoice={() => setOpenModal("proforma")}
          onExportProformaInvoice={() => {
            console.warn("Export proforma invoices");
          }}
        />
      ),
    },
    invoices: {
      component: (
        <InvoiceTable
          key={refreshKey}
          onAddInvoice={() => setOpenModal("invoice")}
          onExportInvoice={() => {
            console.warn("Export invoices");
          }}
        />
      ),
    },

    pos: {
      component: <Pos />,
      onAdd: () => setOpenModal("pos"),
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
  };

  const handleInvoiceSubmit = async (payload: any) => {
    try {
      const response = await createSalesInvoice(payload);

      if (!response || ![200, 201].includes(response.status_code)) {
        showApiError(response);
        return;
      }

      showSuccess(response.message || "Invoice created successfully");

      setOpenModal(null);
      setRefreshKey((prev) => prev + 1);
    } catch (error: any) {
      showApiError(error);
    }
  };

  const handleQuotationSubmit = async (payload: any) => {
    const response = await createQuotation(payload);

    if (!response || ![200, 201].includes(response.status_code)) {
      throw response;
    }

    setRefreshKey((prev) => prev + 1);
    setOpenModal(null);
  };

  const handleProformaCreated = () => {
    setRefreshKey((prev) => prev + 1);
    setOpenModal(null);
  };

  const tab = TAB_CONFIG[activeTab];

  return (
    <div className="p-6 bg-app min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2 text-main">
          <Receipt className="w-5 h-5 text-primary" /> Sales
        </h2>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-4">
        {salesTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 font-medium flex items-center gap-2 transition-colors ${
              activeTab === tab.id
                ? "text-primary border-b-2 border-current"
                : "text-muted hover:text-main"
            }`}
          >
            {tab.icon}
            {tab.name}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="">
        {tab?.onAdd && (
          <div className="flex items-center justify-end gap-4 mb-4">
            {/* Add button if needed */}
          </div>
        )}

        {tab?.component}
      </div>

      {/* Modals */}
      <QuotationModal
        isOpen={openModal === "quotation"}
        onClose={() => setOpenModal(null)}
        onSubmit={handleQuotationSubmit}
      />

      <InvoiceModal
        isOpen={openModal === "invoice"}
        onClose={() => setOpenModal(null)}
        onSubmit={handleInvoiceSubmit}
      />

      <ProformaInvoiceModal
        isOpen={openModal === "proforma"}
        onClose={() => setOpenModal(null)}
        onSubmit={handleProformaCreated}
      />

      <PosModal
        isOpen={openModal === "pos"}
        onClose={() => setOpenModal(null)}
        onSave={(data) => console.warn("POS", data)}
      />
    </div>
  );
};

export default SalesModule;
