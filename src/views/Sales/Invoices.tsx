import React, { useEffect, useState } from "react";
import { getAllSalesInvoices } from "../../api/salesApi";

import type { InvoiceSummary, Invoice } from "../../types/invoice";
import { generateInvoicePDF } from "../../components/template/invoice/InvoiceTemplate1";
import PdfPreviewModal from "./PdfPreviewModal";
import InvoiceDetailsModal from "./InvoiceDetailsModal";
const COMPANY_ID = import.meta.env.VITE_COMPANY_ID;
import Table from "../../components/ui/Table/Table";
import ActionButton, {
  ActionGroup,
} from "../../components/ui/Table/ActionButton";
import type { Column } from "../../components/ui/Table/type";
import { getCompanyById } from "../../api/companySetupApi";
import type { Company } from "../../types/company";
import {
  showApiError,
  showSuccess,
  showLoading,
  closeSwal,
} from "../../utils/alert";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

interface InvoiceTableProps {
  onAddInvoice?: () => void;
  onExportInvoice?: () => void;
}

const InvoiceTable: React.FC<InvoiceTableProps> = ({
  onAddInvoice,
  onExportInvoice,
}) => {
  // ── Data ─────────────────────────────────────────────────────────────────
  const [invoices, setInvoices] = useState<InvoiceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [company, setCompany] = useState<Company | null>(null);

  // ── PDF preview (kept — do not remove) ───────────────────────────────────
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfOpen, setPdfOpen] = useState(false);

  // ── Invoice details modal ─────────────────────────────────────────────────
  const [invoiceDetailsOpen, setInvoiceDetailsOpen] = useState(false);
  const [invoiceDetailsId, setInvoiceDetailsId] = useState<string | null>(null);

  // ── Pagination (server) ──────────────────────────────────────────────────
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // ── Search (server) ──────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState("");

  // ── Sort (server) — always store column key ──────────────────────────────
  const [sortBy, setSortBy] = useState("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  // ── Reset page when search changes ───────────────────────────────────────
  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  // ── Fetch company once ────────────────────────────────────────────────────
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

      // NOTE: add `search` param to getAllSalesInvoices in salesApi.ts
      // signature: getAllSalesInvoices(page, page_size, sortBy, sortOrder, search)
      const res = await getAllSalesInvoices(
        page,
        pageSize,
        sortBy,
        sortOrder,
        searchTerm,
      );
      if (!res || res.status_code !== 200) return;

      const mapped: InvoiceSummary[] = (res?.data ?? []).map((inv: any) => {
        const dateIso = String(inv.dateOfInvoice ?? "").trim();
        const timeIso = String(inv.timeOfInvoice ?? "").trim();
        const dt = timeIso
          ? new Date(`${dateIso}T${timeIso}`)
          : new Date(dateIso);

        return {
          invoiceNumber: inv.invoiceNumber,
          customerName: inv.customerName,
          receiptNumber: inv.receiptNumber,
          currency: inv.currency,
          exchangeRate: inv.exchangeRate,
          dueDate: inv.dueDate,
          dateOfInvoice: new Date(inv.dateOfInvoice),
          timeOfInvoice: inv.timeOfInvoice,
          invoiceDateTime: Number.isNaN(dt.getTime()) ? undefined : dt,
          total: Number(inv.totalAmount),
          totalTax: inv.totalTax,
          invoiceTypeParent: inv.invoiceTypeParent,
          invoiceType: inv.invoiceType,
        };
      });

      mapped.sort(
        (a, b) =>
          (b.invoiceDateTime?.getTime() ?? 0) -
          (a.invoiceDateTime?.getTime() ?? 0),
      );

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
  }, [page, pageSize, sortBy, sortOrder, searchTerm]);

  const handleSortChange = ({
    sortBy: colKey,
    sortOrder: order,
  }: {
    sortBy: string;
    sortOrder: "asc" | "desc";
  }) => {
    setSortBy(colKey); // store column key, not a backend alias
    setSortOrder(order);
    setPage(1);
  };

  const fetchAllInvoicesForExport = async (): Promise<InvoiceSummary[]> => {
    try {
      let allData: InvoiceSummary[] = [];
      let current = 1;
      let total = 1;

      do {
        const res = await getAllSalesInvoices(
          current,
          100,
          sortBy,
          sortOrder,
          searchTerm,
        );

        if (res?.status_code === 200) {
          const mapped: InvoiceSummary[] = (res?.data ?? []).map((inv: any) => {
            const dateIso = String(inv.dateOfInvoice ?? "").trim();
            const timeIso = String(inv.timeOfInvoice ?? "").trim();
            const dt = timeIso
              ? new Date(`${dateIso}T${timeIso}`)
              : new Date(dateIso);

            return {
              invoiceNumber: inv.invoiceNumber,
              customerName: inv.customerName,
              receiptNumber: inv.receiptNumber,
              currency: inv.currency,
              exchangeRate: inv.exchangeRate,
              dueDate: inv.dueDate,
              dateOfInvoice: new Date(inv.dateOfInvoice),
              timeOfInvoice: inv.timeOfInvoice,
              invoiceDateTime: Number.isNaN(dt.getTime()) ? undefined : dt,
              total: Number(inv.totalAmount),
              totalTax: inv.totalTax,
              invoiceTypeParent: inv.invoiceTypeParent,
              invoiceType: inv.invoiceType,
            };
          });

          allData = [...allData, ...mapped];
          total = res.pagination?.total_pages || 1;
        }

        current++;
      } while (current <= total);

      allData.sort(
        (a, b) =>
          (b.invoiceDateTime?.getTime() ?? 0) -
          (a.invoiceDateTime?.getTime() ?? 0),
      );

      return allData;
    } catch (error) {
      showApiError(error);
      return [];
    }
  };

  const formatDateTime = (d?: Date, timeOfInvoice?: string) => {
    const dt = d instanceof Date && !Number.isNaN(d.getTime()) ? d : undefined;
    if (!dt) return "-";

    const datePart = dt.toLocaleDateString();
    const timePart =
      String(timeOfInvoice ?? "").trim() ||
      dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    return `${datePart} ${timePart}`;
  };

  const handleExportExcel = async () => {
    try {
      showLoading("Exporting Sales Invoices...");

      const dataToExport = await fetchAllInvoicesForExport();

      if (!dataToExport.length) {
        closeSwal();
        showApiError("No invoices to export");
        return;
      }

      const worksheet = XLSX.utils.json_to_sheet(
        dataToExport.map((inv) => ({
          "Invoice No": inv.invoiceNumber,
          Type: inv.invoiceType,
          Customer: inv.customerName,
          "Date/Time": formatDateTime(
            inv.invoiceDateTime ?? inv.dateOfInvoice,
            inv.timeOfInvoice,
          ),
          "Due Date": inv.dueDate
            ? new Date(inv.dueDate).toLocaleDateString()
            : "",
          Amount: inv.total,
          Currency: inv.currency,
        })),
      );

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sales Invoices");

      saveAs(
        new Blob([XLSX.write(workbook, { bookType: "xlsx", type: "array" })], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
        "Sales_Invoices.xlsx",
      );

      closeSwal();
      showSuccess("Invoices exported successfully");
    } catch (error) {
      closeSwal();
      showApiError(error);
    }
  };

  const handleViewClick = (invoiceNumber: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setInvoiceDetailsId(invoiceNumber);
    setInvoiceDetailsOpen(true);
  };

  const handleOpenReceiptPdf = (receiptUrl: string) => {
    try {
      const normalizedUrl = receiptUrl.startsWith("http://")
        ? receiptUrl.replace(/^http:\/\//i, "https://")
        : receiptUrl;

      const urlWithoutPort = (() => {
        try {
          const u = new URL(normalizedUrl);
          u.port = "";
          return u.toString();
        } catch {
          return normalizedUrl.replace(
            /^(https?:\/\/[^/]+):\d+(\/.*)?$/i,
            "$1$2",
          );
        }
      })();

      const a = document.createElement("a");
      a.href = urlWithoutPort;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      a.remove();

      setInvoiceDetailsOpen(false);
    } catch (err: any) {
      showApiError(err);
    }
  };

  // PDF preview modal close (kept — do not remove)
  const handleClosePdf = () => {
    if (pdfUrl?.startsWith("blob:")) URL.revokeObjectURL(pdfUrl);
    setPdfUrl(null);
    setSelectedInvoice(null);
    setPdfOpen(false);
  };

  const handleCloseInvoiceDetails = () => {
    setInvoiceDetailsOpen(false);
    setInvoiceDetailsId(null);
  };



  const columns: Column<InvoiceSummary>[] = [
    {
      key: "invoiceNumber",
      header: "Invoice No",
      align: "left",
      sortable: true,
      render: (inv) => (
        <span className="font-semibold text-main">{inv.invoiceNumber}</span>
      ),
    },
    {
      key: "invoiceDateTime",
      header: "Date/Time",
      align: "left",
      sortable: false,
      render: (inv) =>
        formatDateTime(
          inv.invoiceDateTime ?? inv.dateOfInvoice,
          inv.timeOfInvoice,
        ),
    },
    {
      key: "invoiceType",
      header: "Type",
      align: "left",
      render: (inv) => (
        <code className="text-xs px-2 py-1 rounded bg-row-hover text-main">
          {inv.invoiceType}
        </code>
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
      key: "receiptNumber",
      header: "Receipt No",
      align: "left",
      sortable: true,
      render: (inv) => (
        <span className="text-xs text-muted">{inv.receiptNumber || "—"}</span>
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
      key: "total",
      header: "Amount",
      align: "right",
      sortable: true,
      render: (inv) => (
        <code className="text-xs px-2 py-1 rounded bg-row-hover text-main font-semibold whitespace-nowrap">
          {inv.total.toLocaleString()} {inv.currency}
        </code>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "center",
      render: (inv) => (
        <ActionGroup>
          <ActionButton
            type="view"
            onClick={(e) => handleViewClick(inv.invoiceNumber, e)}
            iconOnly
          />
        </ActionGroup>
      ),
    },
  ];

  return (
    <div className="p-8">
      <Table
        columns={columns}
        data={invoices} // ← raw server data, no local filter
        rowKey={(row) => row.invoiceNumber}
        loading={loading || initialLoad}
        showToolbar
        searchValue={searchTerm}
        onSearch={(q) => {
          setSearchTerm(q);
          setPage(1);
        }}
        enableAdd
        addLabel="Add Invoice"
        onAdd={onAddInvoice}
        enableColumnSelector
        enableExport
        onExport={onExportInvoice ?? handleExportExcel}
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

      {/* PDF Preview modal — kept, used by handleClosePdf */}
      <PdfPreviewModal
        open={pdfOpen}
        title="Invoice Preview"
        pdfUrl={pdfUrl}
        onClose={handleClosePdf}
        onDownload={() =>
          selectedInvoice &&
          company &&
          generateInvoicePDF(selectedInvoice, company, "save")
        }
      />

      <InvoiceDetailsModal
        open={invoiceDetailsOpen}
        invoiceId={invoiceDetailsId}
        onClose={handleCloseInvoiceDetails}
        onOpenReceiptPdf={handleOpenReceiptPdf}
      />
    </div>
  );
};

export default InvoiceTable;
