import React, { useState, useEffect, useMemo } from "react";
import Table from "../../components/ui/Table/Table";
import type { Column } from "../../components/ui/Table/type";
import StatusBadge from "../../components/ui/Table/StatusBadge";
import { openSalesDebitNoteModal } from "../../store/modalStore";
import {
  getAllSalesDebitNotes,
  deleteSalesDebitNote,
  submitSalesDebitNote,
  cancelSalesDebitNote,
} from "../../api/salesDebitNoteApi";
import { getSalesInvoiceById } from "../../api/salesApi";
import { getSalesInvoicePdf } from "../../api/PDF/pdfApi";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import {
  showLoading,
  closeSwal,
  showSuccess,
  showApiError,
} from "../../utils/alert";
import InvoiceDetailsModal, { type InvoiceDetail } from "./InvoiceDetailsModal";
import ActionButton, {
  ActionGroup,
  ActionMenu,
} from "../../components/ui/Table/ActionButton";
import { fireManagedSwal } from "../../utils/swalManager";
import { SalesDebitNote } from "../../types/sales/SalesDebitNotes"; 
import { usePermission } from "../../hooks/permission/usePermission";
import PermissionGate from "../PermissionGate";
import { ACTION_ICONS } from "../../components/UI_Utils/statusActionIcons";
import { useCurrencySymbols } from "../../hooks/Usecurrencysymbols";
import { extractCurrencyCodesFlat } from "../../utils/Extractcurrencycodes";
import {
  REFRESH_KEYS,
  useDataRefreshStore,
} from "../../store/dataRefreshStore";

const SALES_DEBIT_NOTE_MODULE = "Sales Invoice";

const SORT_FIELD_MAP: Record<string, string> = {
  noteNo: "name",
  invoiceNo: "return_against",
  customer: "customer_name",
  amount: "grand_total",
  date: "posting_date",
  status: "status",
};

const resolveSortField = (key: string) => SORT_FIELD_MAP[key] ?? key;

const formatDate = (date: string | Date) => {
  if (!date) return "";
  const months = [
    "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
    "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
  ];
  if (typeof date === "string") {
    const [year, month, day] = date.split("T")[0].split("-").map(Number);
    return `${String(day).padStart(2, "0")}-${months[month - 1]}-${year}`;
  }
  return `${String(date.getDate()).padStart(2, "0")}-${months[date.getMonth()]}-${date.getFullYear()}`;
};

const mapSalesDebitNote = (item: any, fallbackStatus = "-"): SalesDebitNote => ({
  noteNo: item.name,
  invoiceNo: item.return_against || "-",
  customer: item.customer_name,
  date: item.posting_date,
  amount: Math.abs(item.grand_total),
  status: item.status ?? fallbackStatus,
  currency: item.currency,
});

const SalesDebitNotesTable: React.FC = () => {
  const [data, setData] = useState<SalesDebitNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const { can } = usePermission();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerData, setDrawerData] = useState<InvoiceDetail | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [drawerPdfUrl, setDrawerPdfUrl] = useState<string | null>(null);
  const [drawerPdfBlob, setDrawerPdfBlob] = useState<Blob | null>(null);
  const [drawerPdfLoading, setDrawerPdfLoading] = useState(false);

  const currencyCodes = useMemo(() => extractCurrencyCodesFlat(data), [data]);
  const { formatAmount } = useCurrencySymbols(currencyCodes);

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  useEffect(() => {
    const unsubscribe = useDataRefreshStore
      .getState()
      .subscribeToRefresh(REFRESH_KEYS.SALES_DEBIT_NOTE_LIST, () => {
        fetchSalesDebitNotes();
      });
    return unsubscribe;
  }, []);

  const fetchSalesDebitNotes = async () => {
    try {
      setLoading(true);
      const resp = await getAllSalesDebitNotes(
        page,
        pageSize,
        searchTerm,
        resolveSortField(sortBy),
        sortOrder,
      );
      setData(resp.data.map((item: any) => mapSalesDebitNote(item)));
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
    fetchSalesDebitNotes();
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
      title: "Approve Sales Debit Note?",
      text: `Approve ${noteNo}? This action cannot be undone.`,
      showCancelButton: true,
      confirmButtonColor: "#22c55e",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, approve",
      reverseButtons: true,
    });
    if (!result.isConfirmed) return;

    try {
      showLoading("Approving sales debit note...");
      await submitSalesDebitNote(noteNo);
      closeSwal();
      showSuccess(`Sales debit note ${noteNo} approved successfully`);
      fetchSalesDebitNotes();
    } catch (error) {
      closeSwal();
      showApiError(error);
    }
  };

  const handleCancel = async (noteNo: string) => {
    const result = await fireManagedSwal({
      icon: "warning",
      title: "Cancel Sales Debit Note?",
      text: `Cancel ${noteNo}? This cannot be undone.`,
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, cancel",
      reverseButtons: true,
    });
    if (!result.isConfirmed) return;

    try {
      showLoading("Cancelling sales debit note...");
      await cancelSalesDebitNote(noteNo);
      closeSwal();
      showSuccess(`Sales debit note ${noteNo} cancelled successfully`);
      fetchSalesDebitNotes();
    } catch (error) {
      closeSwal();
      showApiError(error);
    }
  };

  const fetchAllSalesDebitNotesForExport = async (): Promise<SalesDebitNote[]> => {
    try {
      let allData: SalesDebitNote[] = [];
      let current = 1;
      let total = 1;

      do {
        const resp = await getAllSalesDebitNotes(
          current,
          100,
          searchTerm,
          resolveSortField(sortBy),
          sortOrder,
        );
        allData = [
          ...allData,
          ...resp.data.map((item: any) => mapSalesDebitNote(item, "Draft")),
        ];
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
      text: `Delete sales debit note ${noteNo}?`,
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete",
      reverseButtons: true,
    });
    if (!result.isConfirmed) return;

    try {
      showLoading("Deleting sales debit note...");
      await deleteSalesDebitNote(noteNo);
      closeSwal();
      setData((prev) => prev.filter((item) => item.noteNo !== noteNo));
      useDataRefreshStore
        .getState()
        .triggerRefresh(REFRESH_KEYS.SALES_DEBIT_NOTE_LIST);
      showSuccess("Sales debit note deleted successfully");
    } catch (error) {
      closeSwal();
      showApiError(error);
    }
  };

  const handleEdit = async (note: SalesDebitNote, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      showLoading("Loading Sales Debit Note...");
      const res = await getSalesInvoiceById(note.noteNo);
      if (!res.message || res.message.status_code !== 200) {
        closeSwal();
        showApiError("Sales Debit Note data could not be loaded");
        return;
      }
      closeSwal();
      openSalesDebitNoteModal(res.message.data, true);
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
      const res = await getSalesInvoiceById(noteNo);
      if (res?.message?.status_code === 200) {
        setDrawerData(res.message.data as InvoiceDetail);
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
      const blob = await getSalesInvoicePdf(noteNo);
      setDrawerPdfBlob(blob);
      setDrawerPdfUrl(URL.createObjectURL(blob));
    } catch (err) {
      showApiError(err);
    } finally {
      setDrawerPdfLoading(false);
    }
  };

  const handleDrawerDownload = () => {
    if (!drawerPdfBlob || !drawerData) return;
    const url = URL.createObjectURL(drawerPdfBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${drawerData.id || "sales-debit-note"}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportExcel = async () => {
    try {
      showLoading("Exporting Sales Debit Notes...");
      const dataToExport = await fetchAllSalesDebitNotesForExport();
      if (!dataToExport.length) {
        closeSwal();
        showApiError("No sales debit notes to export");
        return;
      }
      const worksheet = XLSX.utils.json_to_sheet(
        dataToExport.map((r) => ({
          "Debit Note No": r.noteNo,
          "Original Invoice No": r.invoiceNo,
          Customer: r.customer,
          Date: r.date,
          Amount: r.amount,
          Status: r.status,
          Currency: r.currency,
        })),
      );
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sales Debit Notes");
      saveAs(
        new Blob([XLSX.write(workbook, { bookType: "xlsx", type: "array" })], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
        "Sales_Debit_Notes.xlsx",
      );
      closeSwal();
      showSuccess("Sales Debit notes exported successfully");
    } catch (error) {
      closeSwal();
      showApiError(error);
    }
  };

  const columns: Column<SalesDebitNote>[] = useMemo(
    () => [
      {
        key: "noteNo",
        header: "Debit Note No",
        sortable: true,
        render: (o) => (
          <div className="py-1.5">
            <span className="block">{o.noteNo || "—"}</span>
          </div>
        ),
      },
      {
        key: "invoiceNo",
        header: "Original Invoice No",
        sortable: true,
        render: (o) => (
          <div className="py-1.5">
            <span className="block">{o.invoiceNo || "—"}</span>
          </div>
        ),
      },
      {
        key: "customer",
        header: "Customer",
        align: "center",
        sortable: true,
        render: (o) => (
          <div className="py-1.5">
            <span className="block">{o.customer || "—"}</span>
          </div>
        ),
      },
      {
        key: "amount",
        header: "Amount",
        align: "right",
        sortable: true,
        render: (r) => (
          <div className="py-1.5">
            <code className="block whitespace-nowrap">
              {formatAmount(r.currency, r.amount, { withSymbol: true })}
            </code>
          </div>
        ),
        tooltip: (r) =>
          `Amount: ${formatAmount(r.currency, r.amount, { withSymbol: true })}`,
      },
      {
        key: "date",
        header: "Date",
        sortable: true,
        render: (o) => (
          <div className="py-1.5">
            <span className="block">{formatDate(o.date) || "—"}</span>
          </div>
        ),
      },
      {
        key: "status",
        header: "Status",
        sortable: true,
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
            <PermissionGate module={SALES_DEBIT_NOTE_MODULE} action="write">
              <ActionButton
                type="edit"
                onClick={(e) => handleEdit(r, e)}
                iconOnly
                disabled={r.status !== "Draft"}
                title={
                  r.status !== "Draft"
                    ? "Only Draft invoices can be edited"
                    : "Edit Sales Debit Note"
                }
              />
            </PermissionGate>
            <ActionMenu
              {...((r.status === "Cancelled" || r.status === "Draft") &&
              can(SALES_DEBIT_NOTE_MODULE, "delete")
                ? {
                    onDelete: (e) => {
                      e?.stopPropagation();
                      handleDelete(r.noteNo);
                    },
                  }
                : {})}
              customActions={[
                ...(r.status === "Draft" && can(SALES_DEBIT_NOTE_MODULE, "write")
                  ? [
                      {
                        label: "Approve",
                        icon: ACTION_ICONS.APPROVE,
                        onClick: () => handleSubmit(r.noteNo),
                      },
                    ]
                  : []),
                ...(r.status === "Return" && can(SALES_DEBIT_NOTE_MODULE, "write")
                  ? [
                      {
                        label: "Cancel",
                        icon: ACTION_ICONS.CANCEL,
                        onClick: () => handleCancel(r.noteNo),
                        danger: true,
                      },
                    ]
                  : []),
              ]}
            />
          </ActionGroup>
        ),
      },
    ],
    [
      can,
      formatAmount,
      handleView,
      handleEdit,
      handleDelete,
      handleSubmit,
      handleCancel,
    ],
  );

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
        onSearch={(q) => {
          setSearchTerm(q);
          setPage(1);
        }}
        enableAdd={can(SALES_DEBIT_NOTE_MODULE, "create")}
        addLabel="Add Sales Debit Note"
        onAdd={() => openSalesDebitNoteModal()}
        emptyMessage="No sales debit notes found"
        enableColumnSelector
        enableExport={can(SALES_DEBIT_NOTE_MODULE, "export")}
        onExport={handleExportExcel}
        currentPage={page}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={totalItems}
        pageSizeOptions={[20, 50, 100, 200]}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
        onPageChange={setPage}
        onRowDoubleClick={(r) => handleView(r.noteNo)}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
      />

      <InvoiceDetailsModal
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
        onViewPdf={() => drawerData && handleDrawerPdf(drawerData.id)}
        onDownload={handleDrawerDownload}
        onClosePdf={() => {
          if (drawerPdfUrl?.startsWith("blob:"))
            URL.revokeObjectURL(drawerPdfUrl);
          setDrawerPdfUrl(null);
        }}
      />
    </div>
  );
};

export default SalesDebitNotesTable;