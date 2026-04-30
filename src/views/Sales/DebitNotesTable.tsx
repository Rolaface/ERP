import React, { useState, useEffect } from "react";
import Table from "../../components/ui/Table/Table";
import type { Column } from "../../components/ui/Table/type";
import StatusBadge from "../../components/ui/Table/StatusBadge";
import { openDebitNoteModal } from "../../store/modalStore";
import { getAllDebitNotes } from "../../api/DebitNoteapi";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { showLoading, closeSwal, showSuccess, showApiError } from "../../utils/alert";
import InvoiceDetailsModal from "./InvoiceDetailsModal";
import ActionButton, { ActionGroup, ActionMenu } from "../../components/ui/Table/ActionButton";
import { deleteDebitNote, submitDebitNote, cancelDebitNote } from "../../api/DebitNoteapi";
import { fireManagedSwal } from "../../utils/swalManager";
import { getDebitNotebyId } from "../../api/DebitNoteapi";
import { DebitNote } from "../../types/sales/Debitnotes";

const mapItem = (item: any): DebitNote => ({
  noteNo: item.name,
  purchase_invoiceNo: item.return_against,
  supplier: item.supplier_name,
  date: item.posting_date,
  amount: item.grand_total,
  status: item.status,
  currency: item.currency,
});

const DebitNotesTable: React.FC = () => {
  const [data, setData] = useState<DebitNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [editData, setEditData] = useState<any | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const [createModals, setCreateModals] = useState<{ id: string }[]>([]);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsId, setDetailsId] = useState<string | null>(null);

  useEffect(() => { setPage(1); }, [searchTerm]);

  const fetchDebitNotes = async () => {
    try {
      setLoading(true);
      const resp = await getAllDebitNotes(page, pageSize, searchTerm);
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
      let total = 1;
      do {
        const resp = await getAllDebitNotes(current, 100, searchTerm);
        allData = [...allData, ...resp.data.map(mapItem)];
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
      text: `Delete debit note ${noteNo}?`,
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      showLoading("Deleting debit note...");
      await deleteDebitNote(noteNo);
      closeSwal();
      setData((prev) => prev.filter((item) => item.noteNo !== noteNo));
      showSuccess("Debit note deleted successfully");
    } catch (error) {
      closeSwal();
      showApiError(error);
    }
  };

  const handleSubmit = async (noteNo: string) => {
    const result = await fireManagedSwal({
      icon: "question",
      title: "Submit Debit Note?",
      text: `Submit ${noteNo}? This action cannot be undone.`,
      showCancelButton: true,
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, submit",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      showLoading("Submitting debit note...");
      await submitDebitNote(noteNo);
      closeSwal();
      showSuccess("Debit note submitted successfully");
      fetchDebitNotes();
    } catch (error) {
      closeSwal();
      showApiError(error);
    }
  };

  const handleCancel = async (noteNo: string) => {
    const result = await fireManagedSwal({
      icon: "warning",
      title: "Cancel Debit Note?",
      text: `Cancel ${noteNo}? This action cannot be undone.`,
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, cancel",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      showLoading("Cancelling debit note...");
      await cancelDebitNote(noteNo);
      closeSwal();
      showSuccess("Debit note cancelled successfully");
      fetchDebitNotes();
    } catch (error) {
      closeSwal();
      showApiError(error);
    }
  };

  const handleEdit = async (note: DebitNote, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      showLoading("Loading Debit Note...");
      const res = await getDebitNotebyId(note.noteNo);
      closeSwal();
      const doc = res?.data;
      if (!doc) {
        showApiError("Debit Note data could not be loaded");
        return;
      }
      openDebitNoteModal(doc,true);
    } catch (err) {
      closeSwal();
      showApiError(err);
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
          "Receipt No": r.purchase_invoiceNo,
          Supplier: r.supplier,
          Date: r.date,
          Amount: r.amount,
          Status: r.status,
          currency: r.currency,
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
    { key: "noteNo", header: "Debit Invoice No",
       render: (o) => (
        <div className="py-1.5">
        <span className="block">
          {o.noteNo || "—"}
        </span>
        </div>
      ),
     },
    { key: "purchase_invoiceNo", header: "Receipt No",
       render: (o) => (
        <div className="py-1.5">
        <span className="block">
          {o.purchase_invoiceNo || "—"}
        </span>
        </div>
      ),
     },
    { key: "supplier", header: "Supplier" ,
       render: (o) => (
        <div className="py-1.5">
        <span className="block">
          {o.supplier || "—"}
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
          {r.amount.toLocaleString()}  {r.currency}
        </code>
        </div>
      ),
    },
    { key: "date", header: "Date" ,  render: (o) => (
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
                : "Edit DebitNote"
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
        tableId="sales-debitnote"
        rowKey={(row) => row.noteNo}
        loading={loading || initialLoad}
        showToolbar
        searchValue={searchTerm}
        onSearch={(q) => { setSearchTerm(q); setPage(1); }}
        enableAdd
        addLabel="Add Debit Note"
        onAdd={() => openDebitNoteModal()}
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

    </div>
  );
};

export default DebitNotesTable;