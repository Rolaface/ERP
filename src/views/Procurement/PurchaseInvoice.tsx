import React, { useState, useEffect } from "react";
import PurchaseInvoiceView from "../../views/Procurement/PurchaseInvoiceView";
import PurchaseInvoiceModal from "../../components/procurement/PurchaseInvoiceModal";
// Shared UI Table Components
import Table from "../../components/ui/Table/Table";
import StatusBadge from "../../components/ui/Table/StatusBadge";
import ActionButton, {
  ActionGroup,
  ActionMenu,
} from "../../components/ui/Table/ActionButton";
import type { Column } from "../../components/ui/Table/type";
import { getPurchaseInvoices } from "../../api/procurement/PurchaseInvoiceApi";
import { updatePurchaseinvoiceStatus } from "../../api/procurement/PurchaseInvoiceApi";
import {
  showApiError,
  showSuccess,
  showLoading,
  closeSwal,
} from "../../utils/alert";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { getPurchaseInvoiceById } from "../../api/procurement/PurchaseInvoiceApi";
import { FilterSelect } from "../../components/ui/modal/modalComponent";
import DateRangeFilter from "../../components/ui/modal/DateRangeFilter";
import { PurchaseInvoiceFilters } from "../../api/procurement/PurchaseInvoiceApi";
import { generatePurchaseInvoicePDF } from "../../components/template/purchaseinvoicetemplete";
import { getCompanyById } from "../../api/companySetupApi";
const COMPANY_ID = import.meta.env.VITE_COMPANY_ID;
import PdfPreviewModal from ".././Sales/PdfPreviewModal";
import PurchaseInvoiceDetailModal, { type PurchaseInvoiceDetail } from "../../components/procurement/purchaseinvoice/PurchaseInvoiceDetailsModal";
import PaymentEntryModal from "../../views/PaymentEntry/PaymentEntryModal";


interface Purchaseinvoice {
  pId: string;
  supplier: string;
  podate: string;
  amount: number;
  status: string;
  deliveryDate: string;
  registrationType: string;
}

interface PurchaseinvoicesTableProps {
  onAdd?: () => void;
}

export type PIStatus =
  | "Draft"
  | "Return"
  | "Submitted"
  | "Paid"
  | "Party Paid"
  | "Cancelled"
  | "Internal Transfer"
  | "Debit Note Issued";

const STATUS_TRANSITIONS: Record<PIStatus, PIStatus[]> = {
  Draft: [
    "Submitted",
    "Cancelled",
    "Paid",
    "Party Paid",
    "Internal Transfer",
    "Debit Note Issued",
    "Return",
  ],
  Submitted: ["Paid", "Party Paid", "Cancelled", "Return"],
  Paid: ["Debit Note Issued", "Return"],
  "Party Paid": ["Paid", "Debit Note Issued"],
  Return: ["Debit Note Issued"],
  "Debit Note Issued": [],
  "Internal Transfer": [],
  Cancelled: [],
};

const invoiceStatusOptions = [
  { label: "Draft", value: "Draft" },
  { label: "Submitted", value: "Submitted" },
  { label: "Paid", value: "Paid" },
  { label: "Party Paid", value: "Party Paid" },
  { label: "Cancelled", value: "Cancelled" },
];

const CRITICAL_STATUSES: PIStatus[] = ["Debit Note Issued", "Cancelled"];

const PurchaseinvoicesTable: React.FC<PurchaseinvoicesTableProps> = ({ onAdd }) => {
  const [orders, setOrders] = useState<Purchaseinvoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [filters, setFilters] = useState<PurchaseInvoiceFilters>({});
  const [company, setCompany] = useState<any | null>(null);
   const [paymentModalOpen, setPaymentModalOpen] = useState(false);
const [selectedPI, setSelectedPI] = useState<any | null>(null);


  // ── PDF preview modal (kept — do not remove)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfOpen, setPdfOpen] = useState(false);

  // ── Drawer (same pattern as ProformaInvoicesTable)
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerData, setDrawerData] = useState<PurchaseInvoiceDetail | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [drawerPdfUrl, setDrawerPdfUrl] = useState<string | null>(null);
  const [drawerPdfLoading, setDrawerPdfLoading] = useState(false);
  const handleMakePayment = async (pId: string) => {
  try {
    showLoading("Opening payment...");

    const res = await getPurchaseInvoiceById(pId);
    closeSwal();

    if (!res || res.status !== "success") {
      showApiError("Failed to load invoice");
      return;
    }

    setSelectedPI(res.data);
    setPaymentModalOpen(true);

  } catch (err) {
    closeSwal();
    showApiError(err);
  }
};

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchTerm || undefined }));
      setPage(1);
    }, 600);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    getCompanyById(COMPANY_ID)
      .then((res) => {
        if (res?.status_code === 200) setCompany(res.data);
      })
      .catch(() => console.error("Failed to load company"));
  }, []);

  // ── Fetch invoices
  const fetchInvoice = async () => {
    try {
      setLoading(true);

      const res = await getPurchaseInvoices(page, pageSize, filters);

      if (!res?.data || res.data.length === 0) {
        setOrders([]);
        setTotalItems(0);
        setTotalPages(1);
        return;
      }

      setTotalPages(res.pagination?.total_pages || 1);
      setTotalItems(res.pagination?.total || 0);

      const mappedInvoice: Purchaseinvoice[] = res.data.map((pi: any) => ({
        pId: pi.pId,
        supplier: pi.supplierName,
        podate: pi.poDate,
        deliveryDate: pi.deliveryDate,
        amount: pi.grandTotal,
        status: pi.status,
        registrationType: pi.registrationType,
      }));

      setOrders(mappedInvoice);
    } catch (err) {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoice();
  }, [page, pageSize, filters]);

  // ── Drawer: open + fetch (same as proforma/PO handleView)
  const handleViewClick = async (pId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDrawerOpen(true);
    setDrawerLoading(true);
    setDrawerData(null);
    try {
      const res = await getPurchaseInvoiceById(pId);
      if (res?.status === "success") setDrawerData(res.data as PurchaseInvoiceDetail);
    } finally {
      setDrawerLoading(false);
    }
  };

  // ── Drawer: generate PDF inside drawer (same as proforma handleDrawerPdf)
  const handleDrawerPdf = async (pId: string) => {
    setDrawerPdfLoading(true);
    setDrawerPdfUrl(null);
    try {
      if (!company) return;
      const res = await getPurchaseInvoiceById(pId);
      if (!res || res.status !== "success") return;
      const blobUrl = await generatePurchaseInvoicePDF(res.data, company, "bloburl");
      setDrawerPdfUrl(blobUrl);
    } catch (err) {
      showApiError(err);
    } finally {
      setDrawerPdfLoading(false);
    }
  };

  // ── PDF preview modal (table row "View PDF" action — kept, do not remove)
  const handleOpenPDF = async (invoice: Purchaseinvoice, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      showLoading("Generating PDF...");

      if (!company) {
        closeSwal();
        showApiError("Company data not loaded");
        return;
      }

      const res = await getPurchaseInvoiceById(invoice.pId);
      if (!res || res.status !== "success") {
        closeSwal();
        showApiError(res?.message || "Failed to load invoice");
        return;
      }

      const blobUrl = await generatePurchaseInvoicePDF(res.data, company, "bloburl");
      closeSwal();
      setSelectedInvoice(res.data);
      setPdfUrl(blobUrl);
      setPdfOpen(true);
    } catch (error) {
      closeSwal();
      showApiError(error);
    }
  };

  // ── Modal handlers
  const handleAddClick = () => {
    setSelectedInvoice(null);
    setModalOpen(true);
    onAdd?.();
  };

  const handleEdit = (invoice: Purchaseinvoice, e: React.MouseEvent) => {
    e.stopPropagation();

    if (invoice.status !== "Draft") {
      showApiError("Only Draft purchase invoices can be edited");
      return;
    }

    setSelectedInvoice(invoice);
    setModalOpen(true);
  };

  const handleDelete = (invoice: Purchaseinvoice, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Delete Purchase Invoice "${invoice.pId}"?`)) {
    }
  };

  const handleCloseModal = () => setModalOpen(false);
  const handlePISaved = async () => { await fetchInvoice(); };

  // ── Export
  const fetchAllPIForExport = async () => {
    try {
      let allData: Purchaseinvoice[] = [];
      let currentPage = 1;
      let totalPagesLocal = 1;

      do {
        const res = await getPurchaseInvoices(currentPage, 100, filters);

        if (res?.status_code === 200) {
          const mapped = res.data.map((pi: any) => ({
            pId: pi.pId,
            supplier: pi.supplierName,
            podate: pi.poDate,
            deliveryDate: pi.deliveryDate,
            amount: pi.grandTotal,
            status: pi.status,
            registrationType: pi.registrationType,
          }));
          allData = [...allData, ...mapped];
          totalPagesLocal = res.pagination?.total_pages || 1;
        }

        currentPage++;
      } while (currentPage <= totalPagesLocal);

      return allData;
    } catch (error) {
      showApiError(error);
      return [];
    }
  };

  const handleExportExcel = async () => {
    try {
      showLoading("Exporting Purchase Invoices...");

      const dataToExport = await fetchAllPIForExport();

      if (!dataToExport.length) {
        closeSwal();
        showApiError("No purchase invoices to export");
        return;
      }

      const formattedData = dataToExport.map((pi) => ({
        "PI ID": pi.pId,
        Supplier: pi.supplier,
        "PO Date": pi.podate,
        "Delivery Date": pi.deliveryDate,
        "Registration Type": pi.registrationType,
        Amount: pi.amount,
        Status: pi.status,
      }));

      const worksheet = XLSX.utils.json_to_sheet(formattedData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Purchase Invoices");

      saveAs(
        new Blob(
          [XLSX.write(workbook, { bookType: "xlsx", type: "array" })],
          { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }
        ),
        "All_Purchase_Invoices.xlsx"
      );

      closeSwal();
      showSuccess("Export completed successfully");
    } catch (error) {
      closeSwal();
      showApiError(error);
    }
  };

  const handleStatusChange = async (pId: string, newStatus: PIStatus) => {
    try {
      const res = await updatePurchaseinvoiceStatus(pId, newStatus);

      if (!res || res.status_code !== 200) {
        showApiError({ message: "Failed to update Purchase Invoice status" });
        return;
      }

      setOrders((prev) =>
        prev.map((o) => (o.pId === pId ? { ...o, status: newStatus } : o))
      );

      showSuccess(`Purchase Invoice marked as ${newStatus}`);
    } catch (err) {
      showApiError({ message: "Failed to update Purchase Invoice status" });
    }
  };

  // ── Columns
  const columns: Column<Purchaseinvoice>[] = [
    { key: "pId", header: "PI ID", align: "left" },
    { key: "supplier", header: "Supplier", align: "left" },
    { key: "podate", header: "PI Date", align: "left" },
    { key: "registrationType", header: "Registration Type", align: "left" },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      render: (o) => (
        <code className="text-xs px-2 py-1 rounded bg-row-hover text-main">
          {Number(o.amount || 0).toFixed(2)}
        </code>
      ),
    },
    {
      key: "status",
      header: "Status",
      align: "left",
      render: (o) => <StatusBadge status={o.status} />,
    },
    { key: "deliveryDate", header: "Delivery Date", align: "left" },
    {
      key: "actions",
      header: "Actions",
      align: "center",
      render: (o) => (
        <ActionGroup>
          <ActionButton
            type="view"
            onClick={(e) => handleViewClick(o.pId, e)}
            iconOnly
          />
          <ActionButton
            type="edit"
            onClick={(e) => handleEdit(o, e)}
            iconOnly
            disabled={o.status !== "Draft"}
            title={
              o.status !== "Draft"
                ? "Only Draft purchase invoices can be edited"
                : "Edit Purchase Invoice"
            }
          />
          <ActionMenu
            onDelete={(e) => handleDelete(o, e as any)}
            customActions={[
              {
                label: "View PDF",
                onClick: () => handleOpenPDF(o),
              },
              ...(o.status === "Submitted"
                ? [{ label: "Make Payment", onClick: () => handleMakePayment(o.pId) }]
                : []),

              ...(STATUS_TRANSITIONS[o.status as PIStatus] ?? []).map((status) => ({
                label: `Mark as ${status}`,
                danger: status === "Cancelled" || status === "Debit Note Issued",
                onClick: () => handleStatusChange(o.pId, status),
              })),
            ]}
          />
        </ActionGroup>
      ),
    },
  ];

  return (
    <div className="p-6">
      <Table
        columns={columns}
        data={orders}
        showToolbar
        loading={loading}
        searchValue={searchTerm}
        onSearch={setSearchTerm}
        enableAdd
        addLabel="Add Purchase Invoice"
        onAdd={handleAddClick}
        enableExport
        onExport={handleExportExcel}
        enableColumnSelector
        currentPage={page}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageChange={setPage}
        onPageSizeChange={(size) => setPageSize(size)}
        pageSizeOptions={[10, 25, 50, 100]}
        extraFilters={
          <>
            <FilterSelect
              value={filters.status}
              options={invoiceStatusOptions}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, status: e.target.value || undefined }));
                setPage(1);
              }}
            />
            <DateRangeFilter
              from={filters.from_date}
              to={filters.to_date}
              onChange={(range) => {
                setFilters((prev) => ({ ...prev, ...range }));
                setPage(1);
              }}
            />
          </>
        }
      />

      {/* ── Drawer modal (same as ProformaDetailModal usage) ── */}
      <PurchaseInvoiceDetailModal
        open={drawerOpen}
        data={drawerData}
        loading={drawerLoading}
        onClose={() => {
          setDrawerOpen(false);
          setDrawerData(null);
          setDrawerPdfUrl(null);
        }}
        pdfUrl={drawerPdfUrl}
        pdfLoading={drawerPdfLoading}
        onViewPdf={() => drawerData && handleDrawerPdf(drawerData.pId)}
        onDownload={() =>
          drawerData && company &&
          generatePurchaseInvoicePDF(drawerData, company, "save")
        }
        onClosePdf={() => {
          if (drawerPdfUrl?.startsWith("blob:")) URL.revokeObjectURL(drawerPdfUrl);
          setDrawerPdfUrl(null);
        }}
      />

      {/* ── PDF Preview modal — kept, used by handleOpenPDF ── */}
      <PdfPreviewModal
        open={pdfOpen}
        title="Purchase Invoice Preview"
        pdfUrl={pdfUrl}
        onClose={() => {
          if (pdfUrl?.startsWith("blob:")) URL.revokeObjectURL(pdfUrl);
          setPdfUrl(null);
          setPdfOpen(false);
        }}
        onDownload={() => {
          if (selectedInvoice && company) {
            generatePurchaseInvoicePDF(selectedInvoice, company, "save");
          }
        }}
      />

      {/* ── Add / Edit modal ── */}
      <PurchaseInvoiceModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        pId={selectedInvoice?.pId}
        onSubmit={handlePISaved}
      />

      {/* ── View modal — kept, do not remove ── */}
      {viewModalOpen && selectedInvoice && (
        <PurchaseInvoiceView
          piData={selectedInvoice}
          onClose={() => setViewModalOpen(false)}
          onEdit={() => {
            setViewModalOpen(false);
            setModalOpen(true);
          }}
        />
        
      )}
      <PaymentEntryModal
  isOpen={paymentModalOpen}
  onClose={() => {
    setPaymentModalOpen(false);
    setSelectedPI(null);
  }}
/>
    </div>
  );
};

export default PurchaseinvoicesTable;