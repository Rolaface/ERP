import React, { useEffect, useState } from "react";
import {
  getAllProformaInvoices,
  updateProformaInvoiceStatus,
  getProformaInvoiceById,
  deleteProformaInvoiceById,
} from "../../api/proformaInvoiceApi";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { getCompanyById } from "../../api/companySetupApi";
const COMPANY_ID = import.meta.env.VITE_COMPANY_ID;
import type { ProformaInvoiceSummary } from "../../types/proformaInvoice";
import { generateProformaInvoicePDF } from "../../components/template/proformatemplete/ProformaInvoiceTemplate";
import Table from "../../components/ui/Table/Table";
import StatusBadge from "../../components/ui/Table/StatusBadge";
import ActionButton, {
  ActionGroup,
  ActionMenu,
} from "../../components/ui/Table/ActionButton";
import type { Column } from "../../components/ui/Table/type";
import {
  showApiError,
  showSuccess,
  showLoading,
  closeSwal,
} from "../../utils/alert";
import Swal from "sweetalert2";
import InvoiceDetailsModal, {
  type InvoiceDetails,
} from "./InvoiceDetailsModal";
import PdfPreviewModal from "./PdfPreviewModal";
import ProformaDetailModal, {
  type ProformaDetail,
} from "./Proformadetailmodal";
import ProformaInvoiceModal from "../../components/sales/ProformaInvoiceModal";

// Constants

type InvoiceStatus = "Draft" | "Rejected" | "Paid" | "Cancelled" | "Approved";

const STATUS_TRANSITIONS: Record<InvoiceStatus, InvoiceStatus[]> = {
  Draft: ["Rejected", "Approved"],
  Rejected: ["Draft", "Approved"],
  Paid: [],
  Cancelled: ["Draft"],
  Approved: ["Paid", "Cancelled"],
};

const CRITICAL_STATUSES: InvoiceStatus[] = ["Paid"];

// Column key → backend field mapping
// All keys are identical here so the map is 1:1,
// but keeping it explicit makes future changes safe
const SORT_FIELD_MAP: Record<string, string> = {
  proformaId: "proformaId",
  customerName: "customerName",
  createdAt: "createdAt",
  dueDate: "dueDate",
  totalAmount: "totalAmount",
  status: "status",
};

// Types

interface ProformaInvoiceTableProps {
  onAddProformaInvoice?: () => void;
  onExportProformaInvoice?: () => void;
  refreshKey: number;
}

// Component

const ProformaInvoicesTable: React.FC<ProformaInvoiceTableProps> = ({
  onAddProformaInvoice,
  refreshKey,
}) => {
  // ── Data
  const [invoices, setInvoices] = useState<ProformaInvoiceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [company, setCompany] = useState<any>(null);

  // ── Pagination (server)
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // ── Search (server)
  const [searchTerm, setSearchTerm] = useState("");

  const [sortBy, setSortBy] = useState("proformaId");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // ── Modal
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerData, setDrawerData] = useState<ProformaDetail | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [drawerPdfUrl, setDrawerPdfUrl] = useState<string | null>(null);
  const [drawerPdfLoading, setDrawerPdfLoading] = useState(false);

  // ── Reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [searchTerm]);
  const [selectedProforma, setSelectedProforma] = useState<any>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfOpen, setPdfOpen] = useState(false);
  // Edit modal state
const [editOpen, setEditOpen] = useState(false);
const [editInvoice, setEditInvoice] = useState<any>(null);
  // ── Fetch company once
  useEffect(() => {
    getCompanyById(COMPANY_ID)
      .then((res) => {
        if (res?.status_code === 200) setCompany(res.data);
      })
      .catch(() => console.error("Failed to load company data"));
  }, []);

  // ── Fetch invoices ────────────────────────────────────────────────────────
  const fetchInvoices = async () => {
    try {
      setLoading(true);

      // NOTE: add `search` param to getAllProformaInvoices in proformaInvoiceApi.ts
      // signature: getAllProformaInvoices(page, page_size, sortBy, sortOrder, search)
      const res = await getAllProformaInvoices(
        page,
        pageSize,
        SORT_FIELD_MAP[sortBy] || sortBy, // ← map column key → backend field here
        sortOrder,
        searchTerm, // ← search sent to backend
      );

      if (!res || res.status_code !== 200) return;

      const mapped: ProformaInvoiceSummary[] = res.data.map((inv: any) => ({
        proformaId: inv.proformaId,
        customerName: inv.customerName,
        currency: inv.currency,
        exchangeRate: inv.exchangeRate,
        dueDate: inv.dueDate,
        totalAmount: Number(inv.totalAmount),
        status: inv.status as InvoiceStatus,
        createdAt: new Date(inv.createdAt.replace(" ", "T")),
      }));

      setInvoices(mapped);
      setTotalPages(res.pagination?.total_pages || 1);
      setTotalItems(res.pagination?.total || mapped.length);
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [page, pageSize, refreshKey, sortBy, sortOrder, searchTerm]); // ← searchTerm included

  const handleEdit = async (proformaId: string, e?: React.MouseEvent) => {
  e?.stopPropagation();

  try {
    showLoading("Loading proforma invoice...");

    const res = await getProformaInvoiceById(proformaId);

    if (!res || res.status_code !== 200) {
      closeSwal();
      showApiError("Failed to load proforma invoice");
      return;
    }

    closeSwal();

    setEditInvoice(res.data);
    setEditOpen(true);

  } catch (err) {
    closeSwal();
    showApiError(err);
  }
};

  // ── Sort handler — store column key, translate at API call site ───────────
  const handleSortChange = ({
    sortBy: colKey,
    sortOrder: order,
  }: {
    sortBy: string;
    sortOrder: "asc" | "desc";
  }) => {
    setSortBy(colKey); // ← store "proformaId", not "proformaId" (same here, but correct pattern)
    setSortOrder(order);
    setPage(1);
  };

  // ── Receipt URL opener (kept — do not remove) ─────────────────────────────
  const handlePreviewProformaPDF = async (proformaId: string) => {
    try {
      showLoading("Preparing proforma invoice preview...");

      if (!company) {
        closeSwal();
        showApiError("Company data not loaded");
        return;
      }

      const res = await getProformaInvoiceById(proformaId);

      if (!res || res.status_code !== 200) {
        closeSwal();
        showApiError("Failed to load proforma invoice");
        return;
      }

      const blobUrl = await generateProformaInvoicePDF(
        res.data,
        company,
        "bloburl",
      );

      closeSwal();

      setPdfUrl(blobUrl);
      setSelectedProforma(res.data);
      setPdfOpen(true);
    } catch (err) {
      closeSwal();
      showApiError(err);
    }
  };

  // ── Export all pages ──────────────────────────────────────────────────────
  const fetchAllInvoicesForExport = async (): Promise<
    ProformaInvoiceSummary[]
  > => {
    try {
      let allData: ProformaInvoiceSummary[] = [];
      let current = 1;
      let total = 1;

      do {
        const res = await getAllProformaInvoices(
          current,
          100,
          SORT_FIELD_MAP[sortBy] || sortBy, // ← same mapping for export
          sortOrder,
          searchTerm,
        );

        if (res?.status_code === 200) {
          const mapped = res.data.map((inv: any) => ({
            proformaId: inv.proformaId,
            customerName: inv.customerName,
            currency: inv.currency,
            exchangeRate: inv.exchangeRate,
            dueDate: inv.dueDate,
            totalAmount: Number(inv.totalAmount),
            status: inv.status as InvoiceStatus,
            createdAt: new Date(inv.createdAt.replace(" ", "T")),
          }));

          allData = [...allData, ...mapped];
          total = res.pagination?.total_pages || 1;
        }

        current++;
      } while (current <= total);

      return allData;
    } catch (error) {
      showApiError(error);
      return [];
    }
  };

  const handleExportExcel = async () => {
    try {
      showLoading("Exporting Proforma Invoices...");

      const dataToExport = await fetchAllInvoicesForExport();

      if (!dataToExport.length) {
        closeSwal();
        showApiError("No invoices to export");
        return;
      }

      const worksheet = XLSX.utils.json_to_sheet(
        dataToExport.map((inv) => ({
          "Proforma No": inv.proformaId,
          Customer: inv.customerName,
          Date: inv.createdAt.toLocaleDateString(),
          "Due Date": inv.dueDate
            ? new Date(inv.dueDate).toLocaleDateString()
            : "",
          Amount: inv.totalAmount,
          Currency: inv.currency,
          Status: inv.status,
        })),
      );

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Proforma Invoices");

      saveAs(
        new Blob([XLSX.write(workbook, { bookType: "xlsx", type: "array" })], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
        "Proforma_Invoices.xlsx",
      );

      closeSwal();
      showSuccess("Export completed successfully");
    } catch (error) {
      closeSwal();
      showApiError(error);
    }
  };

  // ── Actions ───────────────────────────────────────────────────────────────

  const handleView = async (proformaId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDrawerOpen(true);
    setDrawerLoading(true);
    setDrawerData(null);
    try {
      const res = await getProformaInvoiceById(proformaId);
      if (res?.status_code === 200) setDrawerData(res.data);
    } finally {
      setDrawerLoading(false);
    }
  };

  const handleDownload = async (proformaId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      showLoading("Preparing proforma invoice download...");

      if (!company) {
        closeSwal();
        console.error("Company data not loaded");
        return;
      }

      const res = await getProformaInvoiceById(proformaId);
      if (!res || res.status_code !== 200) {
        closeSwal();
        showApiError("Failed to load invoice");
        return;
      }

      await generateProformaInvoicePDF(res.data, company, "save");
      closeSwal();
      showSuccess("Proforma invoice downloaded");
    } catch (err: any) {
      closeSwal();
      showApiError(err);
    }
  };
  const handleDrawerPdf = async (proformaId: string) => {
    setDrawerPdfLoading(true);
    setDrawerPdfUrl(null);
    try {
      if (!company) return;
      const res = await getProformaInvoiceById(proformaId);
      if (!res || res.status_code !== 200) return;
      const blobUrl = await generateProformaInvoicePDF(
        res.data,
        company,
        "bloburl",
      );
      setDrawerPdfUrl(blobUrl);
    } catch (err) {
      showApiError(err);
    } finally {
      setDrawerPdfLoading(false);
    }
  };

  const handleDelete = async (proformaId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();

    const result = await Swal.fire({
      icon: "warning",
      title: "Are you sure?",
      text: `Delete proforma invoice ${proformaId}?`,
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete",
    });

    if (!result.isConfirmed) return;

    try {
      Swal.fire({
        title: "Deleting...",
        text: "Please wait while we delete the invoice.",
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => Swal.showLoading(),
      });

      const res = await deleteProformaInvoiceById(proformaId);
      Swal.close();

      if (!res || res.status_code !== 200) {
        showApiError(res?.message || "Delete failed");
        return;
      }

      // Optimistic remove from table
      setInvoices((prev) =>
        prev.filter((inv) => inv.proformaId !== proformaId),
      );
      showSuccess("Proforma invoice deleted successfully");
    } catch (err) {
      Swal.close();
      showApiError(err);
    }
  };

  const handleRowStatusChange = async (
    invoiceNumber: string,
    status: InvoiceStatus,
  ) => {
    if (
      CRITICAL_STATUSES.includes(status) &&
      !window.confirm(
        `Mark invoice ${invoiceNumber} as ${status}? This action cannot be undone.`,
      )
    ) {
      return;
    }

    const res = await updateProformaInvoiceStatus(invoiceNumber, status);
    if (!res || res.status_code !== 200) {
      showApiError(res?.message || "Failed to update proforma invoice status");
      return;
    }

    setInvoices((prev) =>
      prev.map((inv) =>
        inv.proformaId === invoiceNumber ? { ...inv, status } : inv,
      ),
    );

    showSuccess(`Invoice marked as ${status}`);
  };

  // ── Detail modal mapper (kept — do not remove) ────────────────────────────
  const mapProformaToInvoiceDetails = (raw: any): InvoiceDetails => {
    const items = Array.isArray(raw?.items)
      ? raw.items.map((it: any) => ({
          itemCode: it?.itemCode ?? it?.productName,
          quantity: Number(it?.quantity ?? 0),
          description: it?.description,
          discount: Number(it?.discount ?? 0),
          price: Number(it?.price ?? it?.listPrice ?? 0),
          vatCode: it?.vatCode,
        }))
      : [];

    return {
      invoiceNumber: raw?.invoiceNumber ?? raw?.proformaId ?? raw?.id,
      invoiceType: raw?.invoiceType ?? "Proforma",
      originInvoice: raw?.originInvoice ?? null,
      customerName: raw?.customerName ?? raw?.customer?.name,
      customerTpin: raw?.customerTpin ?? raw?.customer?.tpin,
      currencyCode: raw?.currencyCode ?? raw?.currency,
      exchangeRt: raw?.exchangeRt ?? raw?.exchangeRate,
      dateOfInvoice: raw?.dateOfInvoice ?? raw?.dateofinvoice ?? raw?.createdAt,
      dueDate: raw?.dueDate,
      invoiceStatus: raw?.invoiceStatus ?? raw?.status,

      TotalAmount: raw?.TotalAmount ?? raw?.totalAmount,
      discountPercentage: raw?.discountPercentage,
      discountAmount: raw?.discountAmount,
      lpoNumber: raw?.lpoNumber,
      destnCountryCd: raw?.destnCountryCd,
      billingAddress: raw?.billingAddress,
      shippingAddress: raw?.shippingAddress,
      paymentInformation: raw?.paymentInformation,
      items,
      terms: raw?.terms,
    };
  };

  // ── Columns ───────────────────────────────────────────────────────────────

  const columns: Column<ProformaInvoiceSummary>[] = [
    {
      key: "proformaId",
      header: "Proforma No",
      align: "left",
      sortable: true,
      render: (inv) => (
        <span className="font-semibold text-main">{inv.proformaId}</span>
      ),
    },
    {
      key: "customerName",
      header: "Customer",
      align: "left",
      sortable: true,
      render: (inv) => (
        <span className="text-sm text-main">{inv.customerName}</span>
      ),
    },
    {
      key: "createdAt",
      header: "Date",
      align: "left",
      sortable: true,
      render: (inv) => (
        <span className="text-xs text-muted">
          {inv.createdAt.toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "dueDate",
      header: "Due Date",
      align: "left",
      sortable: true,
      render: (inv) => (
        <span className="text-xs text-muted">
          {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "—"}
        </span>
      ),
    },
    {
      key: "totalAmount",
      header: "Amount",
      align: "right",
      sortable: true,
      render: (inv) => (
        <code className="text-xs px-2 py-1 rounded bg-row-hover text-main">
          {inv.currency} {inv.totalAmount.toLocaleString()}
        </code>
      ),
    },
    {
      key: "status",
      header: "Status",
      align: "left",
      render: (inv) => <StatusBadge status={inv.status} />,
    },
    {
      key: "actions",
      header: "Actions",
      align: "center",
      render: (inv) => (
        <ActionGroup>
          <ActionButton
            type="view"
            onClick={(e) => handleView(inv.proformaId, e)}
            iconOnly
          />
           <ActionButton
    type="edit"
    onClick={(e) => handleEdit(inv.proformaId, e)}
    iconOnly
    disabled={inv.status !== "Draft"}
    title={
      inv.status !== "Draft"
        ? "Only Draft proforma invoices can be edited"
        : "Edit Proforma Invoice"
    }
  />
          <ActionMenu
            customActions={[    
              {
                label: "View PDF",
                onClick: () => handlePreviewProformaPDF(inv.proformaId),
              },
              ...(STATUS_TRANSITIONS[inv.status] ?? []).map((status) => ({
                label: `Mark as ${status}`,
                danger: status === "Paid",
                onClick: () => handleRowStatusChange(inv.proformaId, status),
              })),
            ]}
            showDownload
            onDownload={(e) => handleDownload(inv.proformaId, e)}
            onDelete={(e) => handleDelete(inv.proformaId, e)}
          />
        </ActionGroup>
      ),
    },
  ];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-8">
      <Table
        loading={loading || initialLoad}
        columns={columns}
        data={invoices} // ← raw server data, no local filter
        rowKey={(row) => row.proformaId}
        showToolbar
        searchValue={searchTerm}
        onSearch={(q) => {
          setSearchTerm(q);
          setPage(1);
        }}
        enableAdd
        addLabel="Add Proforma Invoice"
        onAdd={onAddProformaInvoice}
        enableExport
        onExport={handleExportExcel}
        enableColumnSelector
        currentPage={page}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={totalItems}
        pageSizeOptions={[10, 25, 50, 100]}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
        onPageChange={setPage}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
      />

      <ProformaDetailModal
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
        onViewPdf={() => drawerData && handleDrawerPdf(drawerData.proformaId)}
        onDownload={() =>
          drawerData &&
          company &&
          generateProformaInvoicePDF(drawerData, company, "save")
        }
        onClosePdf={() => {
          if (drawerPdfUrl?.startsWith("blob:"))
            URL.revokeObjectURL(drawerPdfUrl);
          setDrawerPdfUrl(null);
        }}
      />
      <PdfPreviewModal
        open={pdfOpen}
        title="Proforma Invoice Preview"
        pdfUrl={pdfUrl}
        onClose={() => {
          if (pdfUrl?.startsWith("blob:")) URL.revokeObjectURL(pdfUrl);
          setPdfUrl(null);
          setSelectedProforma(null);
          setPdfOpen(false);
        }}
        onDownload={() =>
          selectedProforma &&
          company &&
          generateProformaInvoicePDF(selectedProforma, company, "save")
        }
      />
      <ProformaInvoiceModal
  isOpen={editOpen}
  onClose={() => {
    setEditOpen(false);
    setEditInvoice(null);
  }}
  initialData={editInvoice}
  mode="edit"
  onSubmit={() => {
    setEditOpen(false);
    fetchInvoices();
  }}
/>
    </div>
  );
};

export default ProformaInvoicesTable;
