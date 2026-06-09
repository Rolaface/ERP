import React, { useState, useEffect } from "react";
import Table from "../../components/ui/Table/Table";
import type { Column } from "../../components/ui/Table/type";
import StatusBadge from "../../components/ui/Table/StatusBadge";
import { openDebitNoteModal } from "../../store/modalStore";
import {
  getAllDebitNotes,
  deleteDebitNote,
  submitDebitNote,
  cancelDebitNote,
} from "../../api/DebitNoteapi";
import { getPurchaseInvoiceById } from "../../api/procurement/PurchaseInvoiceApi";
import { generatePurchaseInvoicePDF } from "../../components/template/purchaseinvoicetemplete";
import { getCompanyById } from "../../api/companySetupApi";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import {
  showLoading,
  closeSwal,
  showSuccess,
  showApiError,
} from "../../utils/alert";
import PurchaseInvoiceDetailModal, {
  type PurchaseInvoiceDetail,
} from "../../components/procurement/purchaseinvoice/PurchaseInvoiceDetailsModal";
import ActionButton, {
  ActionGroup,
  ActionMenu,
} from "../../components/ui/Table/ActionButton";
import { fireManagedSwal } from "../../utils/swalManager";
import { DebitNote } from "../../types/sales/Debitnotes";
import { usePermission } from "../../hooks/permission/usePermission";
import PermissionGate from "../PermissionGate";
import { ACTION_ICONS } from "../../components/UI_Utils/statusActionIcons";

const COMPANY_ID = import.meta.env.VITE_COMPANY_ID;

const mapItem = (item: any): DebitNote => ({
  noteNo: item.name,
  purchase_invoiceNo: item.return_against,
  supplier: item.supplier_name,
  date: item.posting_date,
  amount: item.grand_total,
  status: item.status,
  currency: item.currency,
});

const DEBIT_NOTE_MODULE = "Purchase Invoice Return";

const DebitNotesTable: React.FC = () => {
  const [data, setData] = useState<DebitNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const { can } = usePermission();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const [company, setCompany] = useState<any | null>(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerData, setDrawerData] = useState<PurchaseInvoiceDetail | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [drawerPdfUrl, setDrawerPdfUrl] = useState<string | null>(null);
  const [drawerPdfLoading, setDrawerPdfLoading] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  useEffect(() => {
    getCompanyById(COMPANY_ID)
      .then((res) => {
        if (res?.status_code === 200) setCompany(res.data);
      })
      .catch((err) => showApiError(err));
  }, []);

  const fetchDebitNotes = async () => {
    try {
      setLoading(true);
      const resp = await getAllDebitNotes(page, pageSize, searchTerm);
      setData(resp.data.map(mapItem));
      setTotalPages(resp.pagination.total_pages);
      setTotalItems(resp.pagination.total);
    } catch (error: any) {
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

  const handleSubmit = async (noteNo: string) => {
    const result = await fireManagedSwal({
      icon: "question",
      title: "Approve Debit Note?",
      text: `Approve ${noteNo}? This action cannot be undone.`,
      showCancelButton: true,
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, approve",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      showLoading("Approving debit note...");
      await submitDebitNote(noteNo);
      closeSwal();
      showSuccess("Debit note approved successfully");
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

  const handleEdit = async (note: DebitNote, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      showLoading("Loading Debit Note...");
      const res = await getPurchaseInvoiceById(note.noteNo);
      if (!res || res.status !== "success") {
        closeSwal();
        showApiError("Debit Note data could not be loaded");
        return;
      }
      closeSwal();
      openDebitNoteModal(res.data, true);
    } catch (err) {
      closeSwal();
      showApiError(err);
    }
  };

  const handleView = async (noteNo: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDrawerOpen(true);
    setDrawerLoading(true);
    setDrawerData(null);
    try {
      const res = await getPurchaseInvoiceById(noteNo);
      if (res?.status === "success") {
        setDrawerData(res.data as PurchaseInvoiceDetail);
      } else {
        showApiError(res);
      }
    } catch (error) {
      showApiError(error);
    } finally {
      setDrawerLoading(false);
    }
  };

  const handleDrawerPdf = async (noteNo: string) => {
    setDrawerPdfLoading(true);
    setDrawerPdfUrl(null);
    try {
      if (!company) {
        showApiError("Company data not loaded");
        return;
      }
      const res = await getPurchaseInvoiceById(noteNo);
      if (!res || res.status !== "success") {
        showApiError(res);
        return;
      }
      const blobUrl = await generatePurchaseInvoicePDF(res.data, company, "bloburl");
      setDrawerPdfUrl(blobUrl);
    } catch (err) {
      showApiError(err);
    } finally {
      setDrawerPdfLoading(false);
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
          Currency: r.currency,
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

  const formatDate = (date: string | Date) => {
    if (!date) return "";
    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    if (typeof date === "string") {
      const [year, month, day] = date.split("T")[0].split("-").map(Number);
      return `${String(day).padStart(2, "0")}-${months[month - 1]}-${year}`;
    }
    return `${String(date.getDate()).padStart(2, "0")}-${months[date.getMonth()]}-${date.getFullYear()}`;
  };

  const columns: Column<DebitNote>[] = [
    {
      key: "noteNo",
      header: "Debit Invoice No",
      render: (o) => (
        <div className="py-1.5">
          <span className="block">{o.noteNo || "—"}</span>
        </div>
      ),
    },
    {
      key: "purchase_invoiceNo",
      header: "Receipt No",
      render: (o) => (
        <div className="py-1.5">
          <span className="block">{o.purchase_invoiceNo || "—"}</span>
        </div>
      ),
    },
    {
      key: "supplier",
      header: "Supplier",
      render: (o) => (
        <div className="py-1.5">
          <span className="block">{o.supplier || "—"}</span>
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
      key: "date",
      header: "Date",
      render: (o) => (
        <div className="py-1.5">
          <span className="block">{formatDate(o.date) || "—"}</span>
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
            onClick={(e) => handleView(r.noteNo, e)}
          />

          <PermissionGate module={DEBIT_NOTE_MODULE} action="write">
            <ActionButton
              type="edit"
              onClick={(e) => handleEdit(r, e)}
              iconOnly
              disabled={r.status !== "Draft"}
              title={r.status !== "Draft" ? "Only Draft invoices can be edited" : "Edit Debit Note"}
            />
          </PermissionGate>

          <ActionMenu
            {...(can(DEBIT_NOTE_MODULE, "delete")
              ? { onDelete: (e) => { e?.stopPropagation(); handleDelete(r.noteNo); } }
              : {})}
            customActions={[
              ...(r.status === "Draft" && can(DEBIT_NOTE_MODULE, "write")
                ? [{ label: "Approve", icon: ACTION_ICONS.APPROVE, onClick: () => handleSubmit(r.noteNo) }]
                : []),
              ...(!["Draft", "Cancelled"].includes(r.status) && can(DEBIT_NOTE_MODULE, "write")
                ? [{ label: "Cancel", icon: ACTION_ICONS.CANCEL, onClick: () => handleCancel(r.noteNo), danger: true }]
                : []),
            ]}
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
        enableAdd={can(DEBIT_NOTE_MODULE, "create")}
        addLabel="Add Debit Note"
        onAdd={() => openDebitNoteModal()}
        emptyMessage="No debit notes found"
        enableColumnSelector
        enableExport={can(DEBIT_NOTE_MODULE, "export")}
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

      <PurchaseInvoiceDetailModal
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
        onViewPdf={() => drawerData && handleDrawerPdf(drawerData.piId)}
        onDownload={() =>
          drawerData &&
          company &&
          generatePurchaseInvoicePDF(drawerData, company, "save")
        }
        onClosePdf={() => {
          if (drawerPdfUrl?.startsWith("blob:")) URL.revokeObjectURL(drawerPdfUrl);
          setDrawerPdfUrl(null);
        }}
      />
    </div>
  );
};

export default DebitNotesTable;