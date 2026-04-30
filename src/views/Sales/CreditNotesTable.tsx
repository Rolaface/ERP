import React, { useState, useEffect } from "react";
import Table from "../../components/ui/Table/Table";
import type { Column } from "../../components/ui/Table/type";
import StatusBadge from "../../components/ui/Table/StatusBadge";
import CreateCreditNoteModal from "./CreateCreditNoteModal";
import { getAllCreditNotes, deleteCreditNote } from "../../api/CreditNoteapi";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { showLoading, closeSwal, showSuccess, showApiError } from "../../utils/alert";
import InvoiceDetailsModal from "./InvoiceDetailsModal";
import ActionButton, { ActionGroup, ActionMenu } from "../../components/ui/Table/ActionButton";
import { fireManagedSwal } from "../../utils/swalManager";
import { getCreditNoteById, submitCreditNote, cancelCreditNote } from "../../api/CreditNoteapi";
import { CreditNote } from "../../types/sales/Creditnotes";


const CreditNotesTable: React.FC = () => {
  const [data, setData] = useState<CreditNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  // ── Pagination (server) ───────────────────────────────────────────────────
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [editData, setEditData] = useState<any | null>(null);

  // ── Search (server) ───────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState("");

  // ── Sort (server) ─────────────────────────────────────────────────────────
  const [sortBy, setSortBy] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // ── Modals ────────────────────────────────────────────────────────────────
  const [createModals, setCreateModals] = useState<{ id: string }[]>([]);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsId, setDetailsId] = useState<string | null>(null);

  // ── Reset page when search changes ───────────────────────────────────────
  useEffect(() => { setPage(1); }, [searchTerm]);

  // ── Fetch credit notes ────────────────────────────────────────────────────
  const fetchCreditNotes = async () => {
    try {
      setLoading(true);

      const resp = await getAllCreditNotes(page, pageSize, searchTerm);

      const mappedData: CreditNote[] = resp.data.map((item: any) => ({
        noteNo: item.name,
        invoiceNo: item.return_against || "-",
        customer: item.customer_name,
        date: item.posting_date,
        amount: Math.abs(item.grand_total),
        status: item.status ?? "-",
        currency: item.currency,
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
  }, [page, pageSize, sortBy, sortOrder, searchTerm]);

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

  const handleSubmit = async (noteNo: string) => {
    const result = await fireManagedSwal({
      icon: "question",
      title: "Submit Credit Note?",
      text: `Submit ${noteNo}? This action cannot be undone.`,
      showCancelButton: true,
      confirmButtonColor: "#22c55e",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, submit",
      reverseButtons: true,
    });
    if (!result.isConfirmed) return;

    try {
      showLoading("Submitting credit note...");
      await submitCreditNote(noteNo);
      closeSwal();
      showSuccess(`Credit note ${noteNo} submitted successfully`);
      fetchCreditNotes();
    } catch (error) {
      closeSwal();
      showApiError(error);
    }
  };

  const handleCancel = async (noteNo: string) => {
    const result = await fireManagedSwal({
      icon: "warning",
      title: "Cancel Credit Note?",
      text: `Cancel ${noteNo}? This cannot be undone.`,
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, cancel",
      reverseButtons: true,
    });
    if (!result.isConfirmed) return;

    try {
      showLoading("Cancelling credit note...");
      await cancelCreditNote(noteNo);
      closeSwal();
      showSuccess(`Credit note ${noteNo} cancelled successfully`);
      fetchCreditNotes();
    } catch (error) {
      closeSwal();
      showApiError(error);
    }
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

  const fetchAllCreditNotesForExport = async (): Promise<CreditNote[]> => {
    try {
      let allData: CreditNote[] = [];
      let current = 1;
      let total = 1;

      do {
        const resp = await getAllCreditNotes(current, 100, searchTerm);

        const mappedData: CreditNote[] = resp.data.map((item: any) => ({
          noteNo: item.name,
          invoiceNo: item.return_against || "-",
          customer: item.customer_name,
          date: item.posting_date,
          amount: Math.abs(item.grand_total),
          status: item.status ?? "Draft",
          currency: item.currency,
        }));

        allData = [...allData, ...mappedData];
        total = resp.pagination.total_pages;
        current++;
      } while (current <= total);

      return allData;
    } catch (error) {
      showApiError(error);
      return [];
    }
  };

  const handleDelete = async (noteNo: string) => {
    const result = await fireManagedSwal({
      icon: "warning",
      title: "Are you sure?",
      text: `Delete credit note ${noteNo}?`,
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      showLoading("Deleting credit note...");
      await deleteCreditNote(noteNo);
      closeSwal();
      setData((prev) => prev.filter((item) => item.noteNo !== noteNo)); // optimistic remove
      showSuccess("Credit note deleted successfully");
    } catch (error) {
      closeSwal();
      showApiError(error);
    }
  };

  const handleEdit = async (note: CreditNote, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      showLoading("Loading Credit Note...");
      const res = await getCreditNoteById(note.noteNo);
      console.log("RAW res:", res);
      closeSwal();

      const doc = res?.data;
      if (!doc) {
        showApiError("Credit Note data could not be loaded");
        return;
      }
      setEditData(doc);
    } catch (err) {
      closeSwal();
      showApiError(err);
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
          "Receipt No": r.invoiceNo,
          Customer: r.customer,
          Date: r.date,
          Amount: r.amount,
          Status: r.status,
          Currency: r.currency,
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

  const columns: Column<CreditNote>[] = [
    {
      key: "noteNo", header: "Credit Invoice No",
      render: (o) => (
        <div className="py-1.5">
        <span className="block">
          {o.noteNo || "—"}
        </span>
        </div>
      ),
    },
    {
      key: "invoiceNo", header: "Receipt No", render: (o) => (
        <div className="py-1.5">
          <span className="block">
            {o.invoiceNo || "—"}
          </span>
        </div>
      ),
    },
    {
      key: "customer", header: "Customer",
      align: "center",
      render: (o) => (
        <div className="py-1.5">
          <span className="block">
            {o.customer || "—"}
          </span>
        </div>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      render: (r) => (
        <div className="py-1.5">
        <code className="block whitespace-nowrap">
          {r.amount.toLocaleString()} {r.currency}
        </code>
        </div>
      ),
    },
    {
      key: "date", header: "Date", render: (o) => (
        <div className="py-1.5">
        <span className="block">
          {o.date || "—"}
        </span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <div className="py-1.5">
          <StatusBadge status={r.status} />
        </div>
      ),
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
            onClick={() => {
              setDetailsId(r.noteNo);
              setDetailsOpen(true);
            }}
          />
          <ActionButton
            type="edit"
            onClick={(e) => handleEdit(r, e)}
            iconOnly
            disabled={r.status !== "Draft"}
            title={
              r.status !== "Draft"
                ? "Only Draft invoices can be edited"
                : "Edit Credit Note"
            }
          />
          <ActionMenu
            customActions={[
              ...(r.status === "Draft"
                ? [{
                  label: "Submit",
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ),
                  onClick: () => handleSubmit(r.noteNo),
                }]
                : []),
              ...(!["Draft", "Cancelled"].includes(r.status)
                ? [{
                  label: "Cancel",
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  ),
                  onClick: () => handleCancel(r.noteNo),
                  danger: true,
                }]
                : []),
            ]}
            onDelete={(e) => {
              e?.stopPropagation();
              handleDelete(r.noteNo);
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
            fetchCreditNotes();
          }}
          invoiceId={data.length > 0 ? data[0].invoiceNo : ""}
        />
      ))}

      {editData && (
        <CreateCreditNoteModal
          isOpen={true}
          isEdit={true}
          initialData={editData}
          onClose={() => setEditData(null)}
          onSubmit={() => {
            setEditData(null);
            fetchCreditNotes();
          }}
        />
      )}
    </div>
  );
};

export default CreditNotesTable;