import React, { useEffect, useState } from "react";
import {
  getAllProformaInvoices,
  getProformaInvoiceById,
} from "../../api/proformaInvoiceApi";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import type { ProformaInvoiceSummary } from "../../types/proformaInvoice";
import Table from "../../components/ui/Table/Table";
import ActionButton, {
  ActionGroup,
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

// Column key → backend field mapping
// All keys are identical here so the map is 1:1,
// but keeping it explicit makes future changes safe
const SORT_FIELD_MAP: Record<string, string> = {
  proformaId: "proformaId",
  customerName: "customerName",
  createdAt: "createdAt",
  dueDate: "dueDate",
  totalAmount: "totalAmount",
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProformaInvoiceTableProps {
  onAddProformaInvoice?: () => void;
  onExportProformaInvoice?: () => void;
  refreshKey: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ProformaInvoicesTable: React.FC<ProformaInvoiceTableProps> = ({
  onAddProformaInvoice,
  refreshKey,
}) => {
  // ── Data ──────────────────────────────────────────────────────────────────
  const [invoices, setInvoices] = useState<ProformaInvoiceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);

  // ── Pagination (server) ───────────────────────────────────────────────────
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // ── Search (server) ───────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState("");

  // ── Sort (server) — always store column key, map to backend at call site ──
  const [sortBy, setSortBy] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // ── Modal ─────────────────────────────────────────────────────────────────
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsId, setDetailsId] = useState<string | null>(null);

  // ── Reset page when search changes ───────────────────────────────────────
  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

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
  const handleOpenReceipt = (receiptUrl: string) => {
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

  const handleView = (proformaId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDetailsId(proformaId);
    setDetailsOpen(true);
  };



  const mapProformaToInvoiceDetails = (raw: any): InvoiceDetails => {
    const items = Array.isArray(raw?.items)
      ? raw.items.map((it: any) => ({
          itemCode: it?.itemCode,
          itemName: it?.itemName,
          quantity: Number(it?.quantity ?? 0),
          description: it?.description,
          discount: Number(it?.discount ?? 0),
          price: Number(it?.price ?? 0),
          vatCode: it?.vatCode ?? it?.tax,
          vatTaxableAmount: it?.vatTaxableAmount ?? it?.itemTotal,
        }))
      : [];

    return {
      invoiceNumber: raw?.proformaId,
      invoiceType: raw?.invoiceType ?? "Proforma",
      customerName: raw?.customerName,
      customerTpin: raw?.customerTpin,
      currencyCode: raw?.currencyCode,
      exchangeRt: raw?.exchangeRt,
      dateOfInvoice: raw?.dateOfInvoice ?? raw?.dateofinvoice,
      dueDate: raw?.dueDate,
      discountPercentage:
        raw?.discountPercentage !== undefined &&
        raw?.discountPercentage !== null
          ? Number(raw.discountPercentage)
          : undefined,
      discountAmount:
        raw?.discountAmount !== undefined && raw?.discountAmount !== null
          ? Number(raw.discountAmount)
          : undefined,
      Receipt: raw?.Receipt ?? raw?.receipt,
      ReceiptNo: raw?.ReceiptNo ?? raw?.receiptNo,
      TotalAmount: raw?.TotalAmount ?? raw?.totalAmount,
      billingAddress: raw?.billingAddress,
      shippingAddress: raw?.shippingAddress,
      paymentInformation: raw?.paymentInformation,
      items,
      terms: raw?.terms,
    };
  };

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
        data={invoices}
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

      <InvoiceDetailsModal
        open={detailsOpen}
        invoiceId={detailsId}
        onClose={() => {
          setDetailsOpen(false);
          setDetailsId(null);
        }}
        onOpenReceiptPdf={handleOpenReceipt}
        fetchDetails={getProformaInvoiceById}
        mapDetails={mapProformaToInvoiceDetails}
      />
    </div>
  );
};

export default ProformaInvoicesTable;
