import React, { useState, useEffect } from "react";
import Table from "../../components/ui/Table/Table";
import type { Column } from "../../components/ui/Table/type";
import CreateDebitNoteModal from "./createDebitNoteModal";
import { getAllDebitNotes } from "../../api/salesApi";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

import {
  showLoading,
  closeSwal,
  showSuccess,
  showApiError,
} from "../../utils/alert";
import InvoiceDetailsModal from "./InvoiceDetailsModal";
import ActionButton, {
  ActionGroup,
} from "../../components/ui/Table/ActionButton";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DebitNoteRow = {
  noteNo: string;
  invoiceNo: string;
  customer: string;
  date: string;
  timeOfInvoice?: string;
  dateTime?: Date;
  amount: number;
  currency: string;
};

// ---------------------------------------------------------------------------
// Mapping
// ---------------------------------------------------------------------------

const mapRow = (item: any): DebitNoteRow => ({
  noteNo: item.invoiceNumber,
  invoiceNo: item.receiptNumber,
  customer: item.customerName,
  date: item.dateOfInvoice,
  timeOfInvoice: item.timeOfInvoice,
  amount: item.totalAmount,
  currency: item.currency || item.currencyCode || item.currCd || "",
});

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const DebitNotesTable: React.FC = () => {
  const buildDateTime = (dateIso?: string, timeOfInvoice?: string) => {
    const d = String(dateIso ?? "").trim();
    const t = String(timeOfInvoice ?? "").trim();
    if (!d) return undefined;
    const dt = t ? new Date(`${d}T${t}`) : new Date(d);
    return Number.isNaN(dt.getTime()) ? undefined : dt;
  };

  const formatDateTime = (dateIso?: string, timeOfInvoice?: string) => {
    const dt = buildDateTime(dateIso, timeOfInvoice);
    if (!dt) return "-";
    const timePart =
      String(timeOfInvoice ?? "").trim() ||
      dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return `${dt.toLocaleDateString()} ${timePart}`;
  };

  const [data, setData] = useState<DebitNoteRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  // ── Pagination (server) ───────────────────────────────────────────────────
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // ── Search (server) ───────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState("");

  // ── Sort (server) ─────────────────────────────────────────────────────────
  const [sortBy, setSortBy] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // ── Modals ────────────────────────────────────────────────────────────────
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsId, setDetailsId] = useState<string | null>(null);

  // ── Reset page when search changes ───────────────────────────────────────
  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  // ── Fetch debit notes ─────────────────────────────────────────────────────
  const fetchDebitNotes = async () => {
    try {
      setLoading(true);

      const resp = await getAllDebitNotes(
        page,
        pageSize,
        sortBy,
        sortOrder,
        searchTerm,
      );

      const mapped = resp.data.map((raw: any) => {
        const r = mapRow(raw);
        return { ...r, dateTime: buildDateTime(r.date, r.timeOfInvoice) };
      });

      mapped.sort(
        (a: DebitNoteRow, b: DebitNoteRow) =>
          (b.dateTime?.getTime() ?? 0) - (a.dateTime?.getTime() ?? 0),
      );

      setData(mapped);
      setTotalPages(resp.pagination.total_pages);
      setTotalItems(resp.pagination.total);
    } catch (error: any) {
      console.error("Failed to load debit notes", error);
      showApiError(error);
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  useEffect(() => {
    fetchDebitNotes();
  }, [page, pageSize, sortBy, sortOrder, searchTerm]); // ← all server params included

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

  const fetchAllDebitNotesForExport = async (): Promise<DebitNoteRow[]> => {
    try {
      let allData: DebitNoteRow[] = [];
      let current = 1;
      let total = 1;

      do {
        const resp = await getAllDebitNotes(
          current,
          100,
          sortBy,
          sortOrder,
          searchTerm,
        );

        const mapped = resp.data.map((raw: any) => {
          const r = mapRow(raw);
          return { ...r, dateTime: buildDateTime(r.date, r.timeOfInvoice) };
        });

        allData = [...allData, ...mapped];
        total = resp.pagination.total_pages;
        current++;
      } while (current <= total);

      allData.sort(
        (a: DebitNoteRow, b: DebitNoteRow) =>
          (b.dateTime?.getTime() ?? 0) - (a.dateTime?.getTime() ?? 0),
      );

      return allData;
    } catch (error) {
      showApiError(error);
      return [];
    }
  };

  const handleExportExcel = async () => {
    try {
      showLoading("Exporting Debit Notes...");

      const dataToExport = await fetchAllDebitNotesForExport();

      if (!dataToExport.length) {
        closeSwal();
        showApiError("No debit notes to export");
        return;
      }

      const worksheet = XLSX.utils.json_to_sheet(
        dataToExport.map((r) => ({
          "Debit Note No": r.noteNo,
          "Receipt No": r.invoiceNo,
          Customer: r.customer,
          "Date/Time": formatDateTime(r.date, r.timeOfInvoice),
          Amount: r.amount,
          Currency: r.currency,
        })),
      );

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Debit Notes");

      saveAs(
        new Blob([XLSX.write(workbook, { bookType: "xlsx", type: "array" })], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
        "Debit_Notes.xlsx",
      );

      closeSwal();
      showSuccess("Debit notes exported successfully");
    } catch (error) {
      closeSwal();
      showApiError(error);
    }
  };

  const columns: Column<DebitNoteRow>[] = [
    { key: "noteNo", header: "Debit Invoice No", sortable: true },
    { key: "invoiceNo", header: "Receipt No" },
    { key: "customer", header: "Customer", sortable: true },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      sortable: true,
      render: (r) => (
        <code className="text-xs px-2 py-1 rounded bg-row-hover text-main font-semibold whitespace-nowrap">
          {r.amount.toLocaleString()} {r.currency}
        </code>
      ),
    },
    {
      key: "dateTime",
      header: "Date/Time",
      sortable: false,
      render: (r) => formatDateTime(r.date, r.timeOfInvoice),
    },
    {
      key: "actions",
      header: "Actions",
      align: "center",
      render: (r) => (
        <ActionGroup>
          <ActionButton
            type="view"
            iconOnly
            variant="secondary"
            onClick={() => {
              setDetailsId(r.noteNo);
              setDetailsOpen(true);
            }}
          />
        </ActionGroup>
      ),
    },
  ];

  return (
    <div className="p-8">
      <Table
        columns={columns}
        data={data}
        rowKey={(row) => row.noteNo}
        loading={loading || initialLoad}
        showToolbar
        searchValue={searchTerm}
        onSearch={(q) => {
          setSearchTerm(q);
          setPage(1);
        }}
        enableAdd
        addLabel="Add Debit Note"
        onAdd={() => setOpenCreateModal(true)}
        emptyMessage="No debit notes found"
        enableColumnSelector
        enableExport
        onExport={handleExportExcel}
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
        mapDetails={(raw: any) => {
          const selling =
            raw?.terms?.selling ??
            raw?.terms?.terms?.selling ??
            raw?.terms?.terms ??
            raw?.terms ??
            undefined;

          return {
            ...raw,
            invoiceNumber: raw?.invoiceNumber ?? raw?.id,
            invoiceType: raw?.invoiceType ?? raw?.invoiceTypeParent,
            dateOfInvoice:
              raw?.dateOfInvoice ?? raw?.transactionDate ?? raw?.date,
            dueDate: raw?.dueDate ?? raw?.validUntil ?? raw?.validTill,
            TotalAmount:
              raw?.TotalAmount ??
              raw?.totalAmount ??
              raw?.grandTotal ??
              raw?.total,
            terms: selling ? { selling } : raw?.terms,
          };
        }}
      />

      <CreateDebitNoteModal
        isOpen={openCreateModal}
        onClose={() => setOpenCreateModal(false)}
        onSubmit={(payload) => {
          console.warn("Debit Note Payload:", payload);
          setOpenCreateModal(false);
          fetchDebitNotes();
        }}
        invoiceId={data.length > 0 ? data[0].invoiceNo : ""}
      />
    </div>
  );
};

export default DebitNotesTable;
