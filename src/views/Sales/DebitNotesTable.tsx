import React, { useState, useEffect } from "react";
import Table from "../../components/ui/Table/Table";
import type { Column } from "../../components/ui/Table/type";
import StatusBadge from "../../components/ui/Table/StatusBadge";
import CreateDebitNoteModal from "./createDebitNoteModal";
import { getAllDebitNotes } from "../../api/salesApi";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { showLoading, closeSwal, showSuccess, showApiError } from "../../utils/alert";
import InvoiceDetailsModal from "./InvoiceDetailsModal";
import ActionButton, { ActionGroup } from "../../components/ui/Table/ActionButton";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DebitNote = {
  noteNo:    string;
  invoiceNo: string;
  customer:  string;
  date:      string;
  amount:    number;
  status:    "Draft" | "Approved" | "Rejected";
  currency:  string;
};



const mapItem = (item: any): DebitNote => ({
  noteNo:    item.invoiceNumber,
  invoiceNo: item.receiptNumber,
  customer:  item.customerName,
  date:      item.dateOfInvoice,
  amount:    item.totalAmount,
  currency:  item.currency || item.currencyCode || item.currCd || "",
  status:    item.invoiceStatus ?? "Draft",
});


const DebitNotesTable: React.FC = () => {


  const [data, setData]               = useState<DebitNote[]>([]);
  const [loading, setLoading]         = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  // ── Pagination (server) ───────────────────────────────────────────────────
  const [page, setPage]             = useState(1);
  const [pageSize, setPageSize]     = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // ── Search (server) ───────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState("");

  // ── Sort (server) ─────────────────────────────────────────────────────────
  const [sortBy, setSortBy]       = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // ── Modals ────────────────────────────────────────────────────────────────
  const [createModals, setCreateModals] = useState<{ id: string }[]>([]);
  const [detailsOpen, setDetailsOpen]         = useState(false);
  const [detailsId, setDetailsId]             = useState<string | null>(null);

  // ── Reset page when search changes ───────────────────────────────────────
  useEffect(() => { setPage(1); }, [searchTerm]);

  // ── Fetch debit notes ─────────────────────────────────────────────────────
  const fetchDebitNotes = async () => {
    try {
      setLoading(true);

      const resp = await getAllDebitNotes(page, pageSize, sortBy, sortOrder, searchTerm);

      setData(resp.data.map(mapItem));
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
        return normalizedUrl.replace(/^(https?:\/\/[^\/]+):\d+(\/.*)?$/i, "$1$2");
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

  const fetchAllDebitNotesForExport = async (): Promise<DebitNote[]> => {
    try {
      let allData: DebitNote[] = [];
      let current = 1;
      let total   = 1;

      do {
        const resp = await getAllDebitNotes(current, 100, sortBy, sortOrder, searchTerm);

        allData = [...allData, ...resp.data.map(mapItem)];
        total   = resp.pagination.total_pages;
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
          "Receipt No":    r.invoiceNo,
          Customer:        r.customer,
          Date:            r.date,
          Amount:          r.amount,
          Currency:        r.currency,
          Status:          r.status,
        }))
      );

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Debit Notes");

      saveAs(
        new Blob(
          [XLSX.write(workbook, { bookType: "xlsx", type: "array" })],
          { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }
        ),
        "Debit_Notes.xlsx"
      );

      closeSwal();
      showSuccess("Debit notes exported successfully");
    } catch (error) {
      closeSwal();
      showApiError(error);
    }
  };


  const columns: Column<DebitNote>[] = [
    { key: "noteNo",    header: "Debit Invoice No", sortable: true },
    { key: "invoiceNo", header: "Receipt No" },
    { key: "customer",  header: "Customer", sortable: true },
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
    { key: "date",   header: "Date",   sortable: true },
    {
      key: "status",
      header: "Status",
      render: (r) => <StatusBadge status={r.status} />,
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
    <div className="h-full min-h-0">
      <Table
        columns={columns}
        data={data}
        tableId="sales-debitnote"
        rowKey={(row) => row.noteNo}
        loading={loading || initialLoad}
        showToolbar
        searchValue={searchTerm}
        onSearch={(q) => { setSearchTerm(q); setPage(1); }}
        enableAdd
        addLabel="Add Debit Note"
        onAdd={() => setCreateModals((prev) => [...prev, { id: `debit-note-create-${Date.now()}` }])}
        emptyMessage="No debit notes found"
        enableColumnSelector
        enableExport
        onExport={handleExportExcel}
        currentPage={page}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={totalItems}
        pageSizeOptions={[10, 25, 50, 100]}
        onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
        onPageChange={setPage}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
      />

      <InvoiceDetailsModal
        open={detailsOpen}
        invoiceId={detailsId}
        onClose={() => { setDetailsOpen(false); setDetailsId(null); }}
        onOpenReceiptPdf={handleOpenReceipt}
      />

      {createModals.map((modal) => (
        <CreateDebitNoteModal
          key={modal.id}
          isOpen={true}
          onClose={() => setCreateModals((prev) => prev.filter((m) => m.id !== modal.id))}
          onSubmit={(payload) => {
            console.log("Debit Note Payload:", payload);
            setCreateModals((prev) => prev.filter((m) => m.id !== modal.id));
            fetchDebitNotes();
          }}
          invoiceId={data.length > 0 ? data[0].invoiceNo : ""}
        />
      ))}
    </div>
  );
};

export default DebitNotesTable;
