import React, { useEffect, useState, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import {
  getAllProformaInvoices,
  updateProformaInvoiceStatus,
  getProformaInvoiceById,
  deleteProformaInvoiceById,
  createSiFromQuotation
} from "../../api/proformaInvoiceApi";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { getCompanyById } from "../../api/companySetupApi";
const COMPANY_ID = import.meta.env.VITE_COMPANY_ID;
import type {
  ProformaInvoiceSummary,
  ProformaInvoice,
} from "../../types/proformaInvoice";
import { getPdf } from "../../api/PDF/pdfUtilApi";
import Table from "../../components/ui/Table/Table";
import StatusBadge from "../../components/ui/Table/StatusBadge";
import ActionButton, {
  ActionGroup,
  ActionMenu,
} from "../../components/ui/Table/ActionButton";
import type { Column } from "../../components/ui/Table/type";
import {
  REFRESH_KEYS,
  useDataRefreshStore,
} from "../../store/dataRefreshStore";
import {
  showApiError,
  showSuccess,
  showLoading,
  closeSwal,
  showConfirm,
} from "../../utils/alert";


import {  fireManagedSwal } from "../../utils/swalManager";
import PdfPreviewModal from "./PdfPreviewModal";
import ProformaDetailModal, {
  type ProformaDetail,
} from "./Proformadetailmodal";
import {
  ACTION_ICONS,
  getStatusActionIcon,
} from "../../components/UI_Utils/statusActionIcons";
import { openSendEmailModal } from "../../store/modalStore";

import { useCurrencySymbols } from "../../hooks/Usecurrencysymbols";
import { extractCurrencyCodesFlat } from "../../utils/Extractcurrencycodes";
import { useDocumentConversion } from "../../hooks/useDocumentConversion";

type OutletContextType = {
  openProformaCreate: () => void;
  openProformaEdit: (proformaId: string, data: any) => void;
};

type ProformaInvoiceStatus =
  | "Draft"
  | "Paid"
  | "Cancelled"
  | "Approved"
  | "Open";

const STATUS_TRANSITIONS: Record<
  ProformaInvoiceStatus,
  ProformaInvoiceStatus[]
> = {
  Draft: ["Approved"],
  Open: ["Cancelled"],
  Paid: [],
  Cancelled: ["Draft"],
  Approved: ["Paid", "Cancelled"],
};

const CRITICAL_STATUSES: ProformaInvoiceStatus[] = ["Paid"];

const SORT_FIELD_MAP: Record<string, string> = {
  proformaId: "name",
  customerName: "customer_name",
  createdAt: "transaction_date",
  dueDate: "valid_till",
  totalAmount: "grand_total",
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
  const { openProformaEdit } = useOutletContext<OutletContextType>();

  // ── Data
  const [invoices, setInvoices] = useState<ProformaInvoiceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [, setCompany] = useState<any>(null);


  // ── Pagination (server)
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // ── Search (server)
  const [searchTerm, setSearchTerm] = useState("");

  const [sortBy, setSortBy] = useState("proformaId");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerData, setDrawerData] = useState<ProformaDetail | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  // const [drawerPdfUrl, setDrawerPdfUrl] = useState<string | null>(null);
  const [drawerPdfUrl, setDrawerPdfUrl] = useState<string | null>(null);
  const [drawerPdfBlob, setDrawerPdfBlob] = useState<Blob | null>(null);
  const [drawerPdfLoading, setDrawerPdfLoading] = useState(false);
  const [previewPdfBlob, setPreviewPdfBlob] = useState<Blob | null>(null);
  const [previewPdfId, setPreviewPdfId] = useState<string | null>(null);
const createInvoiceFromProforma = useDocumentConversion("proformaToSi");

  // ── Currency symbols + per-currency number formatting for the currencies
  // present in the currently loaded page of invoices.
  const currencyCodes = useMemo(
    () => extractCurrencyCodesFlat(invoices),
    [invoices],
  );
  const { formatAmount } = useCurrencySymbols(currencyCodes);

  // ── Reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfOpen, setPdfOpen] = useState(false);
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

      const res = await getAllProformaInvoices(
        page,
        pageSize,
        SORT_FIELD_MAP[sortBy] || sortBy, // ← map column key → backend field here
        sortOrder,
        searchTerm, // ← search sent to backend
      );

      if (!res || res.status_code !== 200) return;
      const mapped: ProformaInvoiceSummary[] = res.data.map((inv: any) => ({
        proformaId: inv.name || inv.proformaId || inv.id,
        customerName: inv.customerName,
        currency: inv.currency,
        exchangeRate: inv.exchangeRate || 1,
        validTill: inv.validTill,
        totalAmount: Number(inv.total || 0),
        status: inv.status as ProformaInvoiceStatus,
        proformaInvoiceStatus: inv.status as ProformaInvoiceStatus,
        createdAt: inv.postingDate ? new Date(inv.postingDate) : new Date(),
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
  }, [page, pageSize, refreshKey, sortBy, sortOrder, searchTerm]);

  useEffect(() => {
    const unsubscribe = useDataRefreshStore
      .getState()
      .subscribeToRefresh(REFRESH_KEYS.PROFORMA_LIST, () => {
        // Replace this with the actual function you use to fetch your table data
        fetchInvoices();
      });

    return unsubscribe;
  }, []);

  const handleEdit = async (proformaId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();

    try {
      showLoading("Loading proforma invoice...");

      const res = await getProformaInvoiceById(proformaId);
      console.log("Proforma invoice details response:", res);
      console.log("Proforma Id", proformaId);
      const statusCode = res?.message?.status_code || res?.status_code;
      const data = res?.message?.data || res?.data;

      if (statusCode !== 200 || !data) {
        closeSwal();
        showApiError("Failed to load proforma invoice");
        return;
      }

      closeSwal();
      openProformaEdit(proformaId, data);
    } catch (err) {
      closeSwal();
      showApiError(err);
    }
  };

  const handleView = async (proformaId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDrawerOpen(true);
    setDrawerLoading(true);
    setDrawerData(null);
    try {
      const res = await getProformaInvoiceById(proformaId);
      const statusCode = res?.message?.status_code || res?.status_code;
      const data = res?.message?.data || res?.data;

      if (statusCode === 200 && data) {
        setDrawerData(data);
      }
    } finally {
      setDrawerLoading(false);
    }
  };

  const handleDrawerPdf = async (proformId: string) => {
    setDrawerPdfLoading(true);
    setDrawerPdfUrl(null);

    try {
      // const blob = await getPdf(proformId, "Proforma Invoice");
      const blob = await getPdf(proformId, "Quotation");
      console.log("PDF blob response for drawer:", blob);
      console.log("Proforma Id", proformId);
      setDrawerPdfBlob(blob);
      const blobUrl = URL.createObjectURL(blob);
      setDrawerPdfUrl(blobUrl);
    } catch (err) {
      showApiError(err);
    } finally {
      setDrawerPdfLoading(false);
    }
  };

  const handlePreviewPDF = async (
    inv: ProformaInvoiceSummary,
    e?: React.MouseEvent,
  ) => {
    e?.stopPropagation();
    try {
      showLoading("Preparing invoice preview...");

      // Make sure this is fetching the PDF correctly
      const blob = await getPdf(inv.proformaId, "Quotation");
      const blobUrl = URL.createObjectURL(blob);

      closeSwal();

      setPdfUrl(blobUrl);
      setPreviewPdfBlob(blob);
      setPreviewPdfId(inv.proformaId);

      setPdfOpen(true);
    } catch (err: any) {
      closeSwal();
      showApiError(err);
    }
  };

  const handleSortChange = ({
    sortBy: colKey,
    sortOrder: order,
  }: {
    sortBy: string;
    sortOrder: "asc" | "desc";
  }) => {
    setSortBy(colKey); 
    setSortOrder(order);
    setPage(1);
  };

const handleCreateInvoice = (proformaId: string, e?: React.MouseEvent) => {
  e?.stopPropagation();
  return createInvoiceFromProforma(proformaId);
};

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
          SORT_FIELD_MAP[sortBy] || sortBy, 
          sortOrder,
          searchTerm,
        );

        if (res?.status_code === 200) {
          const mapped = res.data.map((inv: any) => ({
            proformaId: inv.name || inv.proformaId || inv.id,
            customerName: inv.customerName,
            currency: inv.currency,
            exchangeRate: inv.exchangeRate,
            dueDate: inv.dueDate,
            totalAmount: Number(inv.totalAmount),
            status: inv.status as ProformaInvoiceStatus,
            proformaInvoiceStatus: inv.status as ProformaInvoiceStatus, 
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
          "Due Date": inv.validTill
            ? new Date(inv.validTill).toLocaleDateString()
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

  const formatDate = (date: string | Date) => {
    if (!date) return "";

    const months = [
      "JAN",
      "FEB",
      "MAR",
      "APR",
      "MAY",
      "JUN",
      "JUL",
      "AUG",
      "SEP",
      "OCT",
      "NOV",
      "DEC",
    ];

    if (typeof date === "string") {
      const [year, month, day] = date.split("T")[0].split("-").map(Number);
      return `${String(day).padStart(2, "0")}-${months[month - 1]}-${year}`;
    }

    // Date object — use local methods
    return `${String(date.getDate()).padStart(2, "0")}-${months[date.getMonth()]}-${date.getFullYear()}`;
  };

  const handleRowStatusChange = async (
    invoiceNumber: string,
    status: ProformaInvoiceStatus,
  ) => {
    if (status === "Cancelled") {
      const isConfirmed = await showConfirm(
        `Are you sure you want to cancel entry ${invoiceNumber}?`,
        {
          title: "Cancel Entry",
          confirmButtonText: "Yes, Cancel",
          confirmButtonColor: "#ef4444",
          cancelButtonText: "No, Keep",
        },
      );
      if (!isConfirmed) return;
    }
    if (CRITICAL_STATUSES.includes(status)) {
      const result = await fireManagedSwal({
        icon: "warning",
        title: "Confirm Status Change",
        text: `Mark proforma invoice ${invoiceNumber} as ${status}?`,
        showCancelButton: true,
        confirmButtonColor: "#22c55e",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Yes",
        cancelButtonText: "Cancel",
      });

      if (!result.isConfirmed) return;
    }

    try {
      showLoading("Updating invoice status...");

      const res = await updateProformaInvoiceStatus(invoiceNumber, status);

      // Handle both wrapped and unwrapped backend responses safely
      const statusCode = res?.message?.status_code || res?.status_code;

      if (statusCode !== 200) {
        closeSwal();
        showApiError(
          res?.message?.message ||
            res?.message ||
            "Failed to update proforma invoice status",
        );
        return;
      }

      closeSwal();

      // Safely get the updated status from backend, fallback to optimistic status
      const updatedStatus =
        res?.message?.data?.status || res?.data?.status || status;

      setInvoices((prev) =>
        prev.map((inv) =>
          inv.proformaId === invoiceNumber
            ? { ...inv, status: updatedStatus }
            : inv,
        ),
      );
      showSuccess(`Invoice marked as ${status}`);
      fetchInvoices(); // Refresh to get latest data and status
    } catch (err) {
      closeSwal();
      showApiError(err);
    }
  };

  const handleDelete = async (proformaId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();

    const result = await fireManagedSwal({
      icon: "warning",
      title: "Are you sure?",
      text: `Delete proforma invoice ${proformaId}?`,
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete",
      reverseButtons: true, // Matches your other table
    });

    if (!result.isConfirmed) return;

    try {
      showLoading("Deleting invoice...");

      const res = await deleteProformaInvoiceById(proformaId);

      // Handle both wrapped and unwrapped backend responses safely
      const statusCode = res?.message?.status_code || res?.status_code;

      if (statusCode !== 200) {
        closeSwal();
        showApiError(res?.message?.message || res?.message || "Delete failed");
        return;
      }

      closeSwal();

      // Optimistic remove from table
      setInvoices((prev) =>
        prev.filter((inv) => inv.proformaId !== proformaId),
      );
      showSuccess("Proforma invoice deleted successfully");
    } catch (err) {
      closeSwal();
      showApiError(err);
    }
  };

  const handleDrawerDownload = () => {
    // FIX: Changed 'detailData' to 'drawerData' so it stops failing silently
    if (!drawerPdfBlob || !drawerData) {
      // showApiError("The PDF file is not ready for download.");
      return;
    }

    try {
      const url = URL.createObjectURL(drawerPdfBlob);
      const a = document.createElement("a");
      a.href = url;

      // FIX: Dynamically grab the correct ID for the filename
      const fileNameId =
        drawerData.proformaId || drawerData.id || "Proforma_Invoice";
      a.download = `${fileNameId}.pdf`;

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      URL.revokeObjectURL(url);
    } catch (err) {
      showApiError("Something went wrong while downloading the PDF.");
    }
  };
  const handlePreviewDownload = () => {
    if (!previewPdfBlob) {
      // showApiError("The PDF file is not ready for download.");
      return;
    }
    if (!previewPdfId) {
      showApiError("The Document ID is missing.");
      return;
    }

    try {
      const url = URL.createObjectURL(previewPdfBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Proforma_${previewPdfId}.pdf`;

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      URL.revokeObjectURL(url);
    } catch (err) {
      showApiError("Something went wrong while downloading the PDF.");
    }
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
          {/* {inv.createdAt.toLocaleDateString()} */}
          {inv.createdAt ? formatDate(inv.createdAt) : "-"}
        </span>
      ),
    },
    {
      key: "validTill",
      header: "Due Date",
      align: "left",
      sortable: true,
      render: (inv) => (
        <span className="text-xs text-muted">
          {inv.validTill ? formatDate(inv.validTill) : "-"}
        </span>
      ),
    },
    {
      key: "total",
      header: "Amount",
      align: "right",
      sortable: true,
      render: (inv) => (
        <code className="text-xs px-2 py-1 rounded bg-row-hover text-main">
          {formatAmount(inv.currency, inv.totalAmount, { withSymbol: true })}
        </code>
      ),
    },
    {
      key: "status",
      header: "Status",
      align: "left",
      render: (q: any) => {
        const displayStatus =
          q.status === "Open" ? "Approved" : q.status || "Draft";
        return <StatusBadge status={displayStatus} />;
      },
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
          {/* <ActionMenu
            showDownload
            onDownload={() => handleDrawerPdf(inv.proformaId)}
            {...(inv.status === "Cancelled" ? { onDelete: (e) => handleDelete(inv.proformaId, e) } : {})}
            customActions={[    
              {
                label: "View PDF",
                icon: ACTION_ICONS.PDF,
                onClick: () => handlePreviewPDF(inv),
              },
              ...(STATUS_TRANSITIONS[inv.proformaInvoiceStatus as keyof typeof STATUS_TRANSITIONS] ?? []).map((status) => ({
                label: status === "Cancelled" ? "Cancel" : `Mark as ${status}`,
                icon: getStatusActionIcon(status),
                danger: status === "Paid" || status === "Cancelled",
                onClick: () => handleRowStatusChange(inv.proformaId, status),
              })),
            ]}
          /> */}
          <ActionMenu
            {...(inv.status === "Cancelled" || inv.status === "Draft"
              ? { onDelete: (e) => handleDelete(inv.proformaId, e) }
              : {})}
            customActions={[
              ...(inv.status !== "Draft"
                ? [
                    {
                      label: "Compose Email",
                      icon: ACTION_ICONS.EMAIL,
                      onClick: async () => {
                        let contactEmail: string | null = null;
                        let invoiceAttachments: { name: string; file_name: string }[] = [];
                        try {
                          const res = await getProformaInvoiceById(inv.proformaId);
                          const statusCode = res?.message?.status_code || res?.status_code;
                          const data = res?.message?.data || res?.data;
                          if (statusCode === 200 && data) {
                            contactEmail = data.contact_email ?? null;
                            invoiceAttachments = data.attachments ?? [];
                          }
                        } catch {
                          // non-critical: modal opens with empty To/attachments if fetch fails
                        }
                        openSendEmailModal({
                          docType: "Quotation",
                          isProforma: true,
                          invoiceNumber: inv.proformaId,
                          customerName: inv.customerName,
                          contactEmail,
                          invoiceAttachments,
                        });
                      },
                    },
                  ]
                : []),
              {
                label: "View PDF",
                icon: ACTION_ICONS.PDF,
                onClick: () => handlePreviewPDF(inv),
              },
                ...(inv.status !== "Draft" && inv.status !== "Cancelled"
                ? [
                    {
                      label: "Create Sales Invoice",
                      icon: ACTION_ICONS.SALES_INVOICE ,
                      onClick: () => handleCreateInvoice(inv.proformaId),
                    },
                  ]
                : []),
              ...(
                STATUS_TRANSITIONS[
                  inv.status as keyof typeof STATUS_TRANSITIONS
                ] ?? []
              )
                .filter((status) => status !== "Draft")
                .map((status) => ({
                  label:
                    status === "Cancelled"
                      ? "Cancel"
                      : ` ${status}` || status === "Approved"
                        ? "Approve"
                        : status,
                  icon: getStatusActionIcon(status),
                  danger: status === "Cancelled",
                  onClick: () => handleRowStatusChange(inv.proformaId, status),
                })),
            ]}
          />
        </ActionGroup>
      ),
    },
  ];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="h-full min-h-0">
      <Table
        loading={loading || initialLoad}
        columns={columns}
        data={invoices}
        tableId="sales-proformainvoices"
        rowKey={(row) => row.proformaId}
        showToolbar
        searchValue={searchTerm}
        onSearch={(q) => {
          setSearchTerm(q);
          setPage(1);
        }}
        defaultVisibleCount={7}
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
        pageSizeOptions={[20, 35, 45, 55, 100]}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
        onPageChange={setPage}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
        onRowDoubleClick={(inv) => handleView(inv.proformaId)}
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
        // onViewPdf={() => drawerData && handleDrawerPdf(drawerData.proformaId)}
        onViewPdf={() => drawerData?.id && handleDrawerPdf(drawerData.id)}
        // onDownload={() =>
        //   drawerData &&
        //   company &&
        //   generateProformaInvoicePDF(drawerData, company, "save")
        // }
        onDownload={handleDrawerDownload}
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
          setPreviewPdfBlob(null);
          setPreviewPdfId(null);
          setPdfOpen(false);
        }}
        onDownload={handlePreviewDownload}
      />
    </div>
  );
};

export default ProformaInvoicesTable;
