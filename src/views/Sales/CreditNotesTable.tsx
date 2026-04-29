import React, { useState, useEffect } from "react";
import Table from "../../components/ui/Table/Table";
import type { Column } from "../../components/ui/Table/type";
import StatusBadge from "../../components/ui/Table/StatusBadge";
import CreateCreditNoteModal from "./CreateCreditNoteModal";
import { getAllCreditNotes,deleteCreditNote } from "../../api/CreditNoteapi";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { showLoading, closeSwal, showApiError, showSuccess } from "../../utils/alert";
import InvoiceDetailsModal from "./InvoiceDetailsModal";
import ActionButton, { ActionGroup } from "../../components/ui/Table/ActionButton";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CreditNote = {
  noteNo:    string;
  invoiceNo: string;
  customer:  string;
  date:      string;
  amount:    number;
  currency:  string;
  status:    "Draft" | "Approved" | "Refunded";
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const CreditNotesTable: React.FC = () => {

  // ── Data ──────────────────────────────────────────────────────────────────
  const [data, setData]           = useState<CreditNote[]>([]);
  const [loading, setLoading]     = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  // ── Pagination (server) ───────────────────────────────────────────────────
  const [page, setPage]           = useState(1);
  const [pageSize, setPageSize]   = useState(10);
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

  
  useEffect(() => { setPage(1); }, [searchTerm]);

 
  const fetchCreditNotes = async () => {
    try {
      setLoading(true);

     
      const resp = await getAllCreditNotes(page, pageSize, sortBy, sortOrder, searchTerm);

      const mappedData: CreditNote[] = resp.data.data.map((item: any) => ({
  noteNo:    item.name,
  invoiceNo: item.return_against || "-", 
  customer:  item.customer_name,
  date:      item.posting_date,
  amount:    Math.abs(item.grand_total),
  currency:  "INR",
  status:    item.status ?? "Draft",
}));

      setData(mappedData);
      setTotalPages(resp.pagination.total_pages);
      setTotalItems(resp.pagination.total);
    } catch (error: any) {
      console.error("Failed to load credit notes", error);
      showApiError(error);
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  useEffect(() => {
    fetchCreditNotes();
  }, [page, pageSize, sortBy, sortOrder, searchTerm]); // ← all server params included

  // ── Sort handler ──────────────────────────────────────────────────────────
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
  const handleDelete = async (noteNo: string) => {
  try {
    showLoading("Deleting credit note...");
    await deleteCreditNote(noteNo);
    closeSwal();
    showSuccess("Credit note deleted successfully");
    fetchCreditNotes();
  } catch (error) {
    closeSwal();
    showApiError(error);
  }
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

 
  const fetchAllCreditNotesForExport = async (): Promise<CreditNote[]> => {
    try {
      let allData: CreditNote[] = [];
      let current = 1;
      let total   = 1;

      do {
        const resp = await getAllCreditNotes(current, 100, sortBy, sortOrder, searchTerm);

        const mappedData: CreditNote[] = resp.data.data.map((item: any) => ({
          noteNo:    item.name,
          invoiceNo: "-", 
          customer:  item.customer,
          date:      item.posting_date,
          amount:    Math.abs(item.grand_total),
          currency:  "INR",
          status:    item.status ?? "Draft",
        }));

        allData = [...allData, ...mappedData];
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
      showLoading("Exporting Credit Notes...");

      const dataToExport = await fetchAllCreditNotesForExport();

      if (!dataToExport.length) {
        closeSwal();
        showApiError("No credit notes to export");
        return;
      }

      const worksheet = XLSX.utils.json_to_sheet(
        dataToExport.map((r) => ({
          "Credit Note No": r.noteNo,
          "Receipt No":     r.invoiceNo,
          Customer:         r.customer,
          Date:             r.date,
          Amount:           r.amount,
          Currency:         r.currency,
          Status:           r.status,
        }))
      );

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Credit Notes");

      saveAs(
        new Blob(
          [XLSX.write(workbook, { bookType: "xlsx", type: "array" })],
          { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }
        ),
        "Credit_Notes.xlsx"
      );

      closeSwal();
      showSuccess("Credit notes exported successfully");
    } catch (error) {
      closeSwal();
      showApiError(error);
    }
  };

  // ── Columns ───────────────────────────────────────────────────────────────

  const columns: Column<CreditNote>[] = [
    { key: "noteNo",    header: "Credit Invoice No", sortable: true },
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
  <ActionButton
    type="delete"
    iconOnly
    variant="secondary"
    onClick={() => handleDelete(r.noteNo)}
  />
</ActionGroup>
      ),
    },
  ];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="h-full min-h-0">
      <Table
        columns={columns}
        data={data}
        tableId="sales-creditnote"
        rowKey={(row) => row.noteNo}
        loading={loading || initialLoad}
        showToolbar
        searchValue={searchTerm}
        onSearch={(q) => { setSearchTerm(q); setPage(1); }}
        enableAdd
        addLabel="Add Credit Note"
        onAdd={() => setCreateModals((prev) => [...prev, { id: `credit-note-create-${Date.now()}` }])}
        emptyMessage="No credit notes found"
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
        <CreateCreditNoteModal
          key={modal.id}
          modalId={modal.id}
          isOpen={true}
          onClose={() => setCreateModals((prev) => prev.filter((m) => m.id !== modal.id))}
          onSubmit={(payload) => {
            console.log("Credit Note Payload:", payload);
            setCreateModals((prev) => prev.filter((m) => m.id !== modal.id));
          }}
          invoiceId={data.length > 0 ? data[0].invoiceNo : ""}
        />
      ))}
    </div>
  );
};

export default CreditNotesTable;
