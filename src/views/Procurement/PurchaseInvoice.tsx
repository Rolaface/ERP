import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
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
import PurchaseInvoiceDetailsModal from "../../components/procurement/purchaseinvoice/PurchaseInvoiceDetailsModal";
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

const PurchaseinvoicesTable: React.FC<PurchaseinvoicesTableProps> = ({
  onAdd,
}) => {
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
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfOpen, setPdfOpen] = useState(false);
  const [invoiceDetailsOpen, setInvoiceDetailsOpen] = useState(false);
  const [invoiceDetailsId, setInvoiceDetailsId] = useState<string | null>(null);
  const [company, setCompany] = useState<any | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({
        ...prev,
        search: searchTerm || undefined,
      }));
      setPage(1);
    }, 600);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    getCompanyById(COMPANY_ID)
      .then((res) => {
        if (res?.status_code === 200) {
          setCompany(res.data);
        }
      })
      .catch(() => console.error("Failed to load company"));
  }, []);
  //  FETCH ORDERS
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

  const handleView = async (invoice: Purchaseinvoice) => {
    try {
      // SweetAlert Loader
      showLoading("Loading Purchase Invoice...");

      const res = await getPurchaseInvoiceById(invoice.pId);

      if (res?.status !== "success") {
        throw new Error(res?.message || "Failed to load");
      }

      // Set full data
      setSelectedInvoice(res.data);

      closeSwal();
      setViewModalOpen(true);
    } catch (error) {
      closeSwal();
      showApiError(error);
    }
  };

  //  MODAL HANDLERS
  const handleAddClick = () => {
    setSelectedInvoice(null);
    setModalOpen(true);
    onAdd?.();
  };

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

      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });

      const fileData = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      saveAs(fileData, "All_Purchase_Invoices.xlsx");

      closeSwal();
      showSuccess("Export completed successfully");
    } catch (error) {
      closeSwal();
      showApiError(error);
    }
  };
  const handleOpenPDF = async (invoice: Purchaseinvoice) => {
    try {
      showLoading("Generating PDF...");

      const res = await getPurchaseInvoiceById(invoice.pId);

      if (!res || res.status !== "success") {
        throw new Error(res?.message || "Failed to load invoice");
      }

      const purchaseInvoice = res.data;

      const blobUrl = await generatePurchaseInvoicePDF(
        purchaseInvoice,
        company,
        "bloburl"
      );

      closeSwal();

      setSelectedInvoice(purchaseInvoice);
      setPdfUrl(blobUrl);
      setPdfOpen(true);

    } catch (error) {
      closeSwal();
      showApiError(error);
    }
  };
  const handleEdit = (Invoice: Purchaseinvoice, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedInvoice(Invoice);
    setModalOpen(true);
  };

  const handleViewClick = (pId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setInvoiceDetailsId(pId);
    setInvoiceDetailsOpen(true);
  };

  const handleDelete = (Invoice: Purchaseinvoice, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Delete Purchase Invoice "${Invoice.pId}"?`)) {
      toast.success("Delete");
    }
  };

  const handleCloseModal = () => setModalOpen(false);

  const handlePISaved = async () => {
    await fetchInvoice();
  };

  const handleStatusChange = async (pId: string, newStatus: PIStatus) => {
    try {
      const res = await updatePurchaseinvoiceStatus(pId, newStatus);

      if (!res || res.status_code !== 200) {
        showApiError({
          message: "Failed to update Purchase Invoice status",
        });

        return;
      }

      // OPTIMISTIC UPDATE
      setOrders((prev) =>
        prev.map((o) => (o.pId === pId ? { ...o, status: newStatus } : o)),
      );

      showSuccess(`Purchase Invoice marked as ${newStatus}`);
    } catch (err) {
      toast.error("Failed to update Purchase Invoice status");
    }
  };

  //  TABLE COLUMNS
  const columns: Column<Purchaseinvoice>[] = [
    { key: "pId", header: " PI ID", align: "left" },
    { key: "supplier", header: "Supplier", align: "left" },
    { key: "podate", header: "pi Date", align: "left" },
    {
      key: "registrationType",
      header: "Registration Type",
      align: "left",
    },
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

          <ActionMenu
            onDelete={(e) => handleDelete(o, e as any)}
            customActions={[
              {
                label: "View PDF",
                onClick: () => handleOpenPDF(o),
              },

              ...(STATUS_TRANSITIONS[o.status as PIStatus] ?? []).map((status) => ({
                label: `Mark as ${status}`,
                danger:
                  status === "Cancelled" || status === "Debit Note Issued",
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
                setFilters((prev) => ({
                  ...prev,
                  status: e.target.value || undefined,
                }));
                setPage(1);
              }}
            />

            <DateRangeFilter
              from={filters.from_date}
              to={filters.to_date}
              onChange={(range) => {
                setFilters((prev) => ({
                  ...prev,
                  ...range,
                }));
                setPage(1);
              }}
            />
          </>
        }
      />
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

      {/* MODAL */}
      <PurchaseInvoiceModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        pId={selectedInvoice?.pId}
        onSubmit={handlePISaved}
      />

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

      <PurchaseInvoiceDetailsModal
        open={invoiceDetailsOpen}
        invoiceId={invoiceDetailsId}
        onClose={() => {
          setInvoiceDetailsOpen(false);
          setInvoiceDetailsId(null);
        }}
        onViewPdf={(pId) => {
          const invoice = orders.find((o) => o.pId === pId);
          if (invoice) {
            setInvoiceDetailsOpen(false);
            handleOpenPDF(invoice);
          }
        }}
      />
    </div>
  );
};

export default PurchaseinvoicesTable;
