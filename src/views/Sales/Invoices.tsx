import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { useOutletContext } from "react-router-dom";
import { FilterSelect } from "../../components/ui/modal/modalComponent";
import DateRangeFilter from "../../components/ui/modal/DateRangeFilter";
import { openPaymentEntryModal } from "../../store/modalStore";
import {
  getAllSalesInvoices,
  updateInvoiceStatus,
  getSalesInvoiceById,
  deleteSalesInvoiceById,
  editSalesInvoice,
} from "../../api/salesApi";
import type { InvoiceSummary, Invoice } from "../../types/invoice";
import { generateInvoicePDF } from "../../components/template/invoice/invoiceTemplatRolaface";
import PdfPreviewModal from "./PdfPreviewModal";
import InvoiceDetailModal, { type InvoiceDetail } from "./InvoiceDetailsModal";
import {
  useDataRefreshStore,
  REFRESH_KEYS,
} from "../../store/dataRefreshStore";
const COMPANY_ID = import.meta.env.VITE_COMPANY_ID;
import Table from "../../components/ui/Table/Table";
import ActionButton, {
  ActionMenu,
} from "../../components/ui/Table/ActionButton";
import type { Column } from "../../components/ui/Table/type";
import StatusBadge from "../../components/ui/Table/StatusBadge";
import { getCompanyById } from "../../api/companySetupApi";
import type { Company } from "../../types/company";
import {
  showApiError,
  showSuccess,
  showLoading,
  closeSwal,
} from "../../utils/alert";
import type { InvoiceStatus } from "../../types/invoice";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { usePermission } from "../../hooks/permission/usePermission";
import PermissionGate from "../PermissionGate";
import { fireManagedSwal } from "../../utils/swalManager";
import SendEmailModal from "../../components/common/SendEmailModal";
import { getSalesInvoicePdf } from "../../api/PDF/pdfApi";
import {
  ACTION_ICONS,
  getStatusActionIcon,
} from "../../components/UI_Utils/statusActionIcons";

import { useCurrencySymbols } from "../../hooks/Usecurrencysymbols";
import { extractCurrencyCodesFlat } from "../../utils/Extractcurrencycodes";

type OutletContextType = {
  openInvoiceCreate: () => void;
  openInvoiceEdit: (invoiceNumber: string, data: any) => void;
};

const STATUS_TRANSITIONS: Record<InvoiceStatus, InvoiceStatus[]> = {
  Draft: ["Approved"],
  Paid: [],
  Cancelled: [],
  Approved: ["Paid", "Cancelled"],
  Unpaid: ["Cancelled"],
  Overdue: ["Cancelled"],
};
// const STATUS_TRANSITIONS: Record<InvoiceStatus, InvoiceStatus[]> = {
//   Draft: ["Rejected", "Approved"],
//   Rejected: ["Draft", "Approved"],
//   Paid: [],
//   Cancelled: ["Draft"],
//   Approved: ["Paid", "Cancelled"],
// };

const CRITICAL_STATUSES: InvoiceStatus[] = ["Paid", "Cancelled"];

const statusOptions = [
  { label: "Draft", value: "Draft" },
  { label: "Paid", value: "Paid" },
  { label: "Cancelled", value: "Cancelled" },
  { label: "Unpaid", value: "Unpaid" },
  { label: "Overdue", value: "Overdue" },
  { label: "Returned", value: "Return" },
];

interface InvoiceTableProps {
  onAddInvoice?: () => void;
  onExportInvoice?: () => void;
}

const SALES_MODULE = "Sales Invoice";
const PAYMENT_MODULE = "Payment Entry";

const InvoiceTable: React.FC<InvoiceTableProps> = ({ onAddInvoice }) => {
  const { openInvoiceEdit } = useOutletContext<OutletContextType>();
  const mountedRef = useRef(true);

  // ── Data with stale-while-revalidate pattern
  const [invoices, setInvoices] = useState<InvoiceSummary[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [company, setCompany] = useState<Company | null>(null);

  // ── PDF preview (kept — do not remove)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfOpen, setPdfOpen] = useState(false);
  const [pdfInvoiceNumber, setPdfInvoiceNumber] = useState<string | null>(null);

  //email
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailInvoice, setEmailInvoice] = useState<InvoiceSummary | null>(null);
  const [emailContactEmail, setEmailContactEmail] = useState<string | null>(
    null,
  );
  const [emailInvoiceAttachments, setEmailInvoiceAttachments] = useState<
    { name: string; file_name: string }[]
  >([]);

  const { can } = usePermission();
  // ── Drawer (same pattern as ProformaInvoicesTable)
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerData, setDrawerData] = useState<InvoiceDetail | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [drawerPdfUrl, setDrawerPdfUrl] = useState<string | null>(null);
  const [drawerPdfBlob, setDrawerPdfBlob] = useState<Blob | null>(null);
  const [drawerPdfLoading, setDrawerPdfLoading] = useState(false);
  const [filters, setFilters] = useState<{
    status?: string;
    from_date?: string;
    to_date?: string;
  }>({});

  // ── Pagination (server)
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // ── Search (server)
  const [searchTerm, setSearchTerm] = useState("");

  const [sortBy, setSortBy] = useState("invoiceNumber");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // ── Currency symbols + per-currency number formatting for the currencies
  // present in the currently loaded page of invoices (e.g. "GHS", "USD").
  // formatAmount("USD", 1234.5, { withSymbol: true }) → "$ 1,234.50"
  const currencyCodes = useMemo(
    () => extractCurrencyCodesFlat(invoices),
    [invoices],
  );
  const { formatAmount } = useCurrencySymbols(currencyCodes);

  // ── Reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  useEffect(() => {
    setPage(1);
  }, [filters]);

  // ── Fetch company once
  useEffect(() => {
    getCompanyById(COMPANY_ID)
      .then((res) => {
        if (res?.status_code === 200) setCompany(res.data);
      })
      .catch(() => console.error("Failed to load company data"));
  }, []);

  // ── Fetch invoices with stale-while-revalidate pattern
  const fetchInvoices = useCallback(async () => {
    if (!mountedRef.current) return;

    setIsFetching(true);
    try {
      const res = await getAllSalesInvoices(
        page,
        pageSize,
        sortBy,
        sortOrder,
        searchTerm,
        undefined,
        undefined,
        filters.status,
        filters.from_date,
        filters.to_date,
      );

      if (!res || res.status_code !== 200) {
        showApiError(res || "Failed to fetch invoices");

        setInvoices([]);
        setTotalPages(1);
        setTotalItems(0);

        return;
      }

      if (!mountedRef.current) return;

      const mapped: InvoiceSummary[] = res.data.map((inv: any) => ({
        invoiceNumber: inv.id,
        customerId: inv.customerId,
        customerName: inv.customerName,
        currency: inv.currency,
        exchangeRate: inv.exchangeRate,
        dueDate: inv.dueDate,
        dateOfInvoice: new Date(inv.invoiceDate),
        total: Number(inv.total),
        outstanding_amount: inv.outstanding_amount ?? 0,
        totalTax: inv.totalTax,
        invoiceStatus: inv.status,
        invoiceTypeParent: inv.invoiceTypeParent,
        invoiceType: inv.taxCategory,
      }));

      setInvoices(mapped);
      setTotalPages(res.pagination?.total_pages || 1);
      setTotalItems(res.pagination?.total || mapped.length);
    } catch (err) {
      showApiError(err);

      setInvoices([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      if (mountedRef.current) {
        setIsFetching(false);
        setIsInitialLoad(false);
      }
    }
  }, [page, pageSize, sortBy, sortOrder, searchTerm, filters]);

  useEffect(() => {
    mountedRef.current = true;
    fetchInvoices();
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Refetch on dependencies (not initial)
  useEffect(() => {
    if (isInitialLoad) return;
    fetchInvoices();
  }, [page, pageSize, sortBy, sortOrder, searchTerm, filters]);

  // Auto-refresh when invoice is created or edited from modal
  useEffect(() => {
    const unsubscribe = useDataRefreshStore
      .getState()
      .subscribeToRefresh(REFRESH_KEYS.INVOICE_LIST, () => {
        fetchInvoices();
      });
    return unsubscribe;
  }, [fetchInvoices]);

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

  const handleReceivePayment = async (inv: InvoiceSummary) => {
    const res = await getSalesInvoiceById(inv.invoiceNumber);
    closeSwal();
    const d = res?.message?.data;
    openPaymentEntryModal(
      {
        paymentType: "Receive",
        partyType: "Customer",
        partyName: inv.customerName,
        partyId: inv.customerId,
        amount: inv.outstanding_amount,
        referenceName: inv.invoiceNumber,
        referenceType: "Sales Invoice",
        glFrom: d?.gl_account ?? "",
        glFromDisplay: d?.gl_account_name ?? "",
        currencyFrom: d?.gl_account_currency ?? "",
        modeOfPayment: d?.paymentMode ?? "",
      },
      false,
      {
        onSuccess: (paymentId) => {
          fetchInvoices();
          showSuccess(`Payment ${paymentId} created`);
        },
      },
    );
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
          const mapped: InvoiceSummary[] = res.data.map((inv: any) => ({
            invoiceNumber: inv.invoiceNumber,
            customerName: inv.customerName,
            receiptNumber: inv.receiptNumber,
            currency: inv.currency,
            exchangeRate: inv.exchangeRate,
            dueDate: inv.dueDate,
            dateOfInvoice: new Date(inv.dateOfInvoice),
            total: Number(inv.totalAmount),
            totalTax: inv.totalTax,
            invoiceStatus: inv.invoiceStatus,
            invoiceTypeParent: inv.invoiceTypeParent,
            invoiceType: inv.invoiceType,
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

  const handleEdit = async (invoiceNumber: string, e?: React.MouseEvent) => {
    e?.stopPropagation();

    try {
      showLoading("Loading invoice...");

      const res = await getSalesInvoiceById(invoiceNumber);

      if (!res.message || res.message.status_code !== 200) {
        closeSwal();
        showApiError("Failed to load invoice");
        return;
      }

      closeSwal();

      openInvoiceEdit(invoiceNumber, res.message.data);
    } catch (err) {
      closeSwal();
      showApiError(err);
    }
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
          Date: inv.dateOfInvoice.toLocaleDateString(),
          "Due Date": inv.dueDate
            ? new Date(inv.dueDate).toLocaleDateString()
            : "",
          // Raw numeric values — kept as real numbers in Excel (not
          // pre-formatted strings) so the cells stay sortable/summable.
          Amount: inv.total,
          OutStanding: inv.outstanding_amount,
          Currency: inv.currency,
          Status: inv.invoiceStatus,
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

  // ── Drawer: open + fetch (same as proforma handleView)
  const handleView = async (invoiceNumber: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDrawerOpen(true);
    setDrawerLoading(true);
    setDrawerData(null);
    try {
      const res = await getSalesInvoiceById(invoiceNumber);
      if (res?.message.status_code === 200)
        setDrawerData(res.message.data as InvoiceDetail);
    } finally {
      setDrawerLoading(false);
    }
  };

  // ── Drawer: generate PDF inside drawer (same as proforma handleDrawerPdf)
  const handleDrawerPdf = async (invoiceNumber: string) => {
    setDrawerPdfLoading(true);
    setDrawerPdfUrl(null);

    try {
      const blob = await getSalesInvoicePdf(invoiceNumber);
      setDrawerPdfBlob(blob);
      const blobUrl = URL.createObjectURL(blob);
      setDrawerPdfUrl(blobUrl);
    } catch (err) {
      showApiError(err);
    } finally {
      setDrawerPdfLoading(false);
    }
  };

  // ── PDF preview modal (table row action — kept, do not remove)
  const handlePreviewPDF = async (
    inv: InvoiceSummary,
    e?: React.MouseEvent,
  ) => {
    e?.stopPropagation();
    try {
      showLoading("Preparing invoice preview...");
      const blob = await getSalesInvoicePdf(inv.invoiceNumber);
      const blobUrl = URL.createObjectURL(blob);
      closeSwal();
      setPdfUrl(blobUrl);
      setSelectedInvoice(null);
      setPdfInvoiceNumber(inv.invoiceNumber);
      setPdfOpen(true);
    } catch (err: any) {
      closeSwal();
      showApiError(err);
    }
  };
  const handleDrawerDownload = () => {
    if (!drawerPdfBlob || !drawerData) return;

    const url = URL.createObjectURL(drawerPdfBlob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${drawerData.id || "invoice"}.pdf`;

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
  };

  const handleClosePdf = () => {
    if (pdfUrl?.startsWith("blob:")) URL.revokeObjectURL(pdfUrl);
    setPdfUrl(null);
    setSelectedInvoice(null);
    setPdfInvoiceNumber(null);
    setPdfOpen(false);
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
    status: InvoiceStatus,
  ) => {
    if (status === "Approved") {
      const result = await fireManagedSwal({
        icon: "warning",
        title: "Approve Invoice?",
        text: `Are you sure you want to approve invoice ${invoiceNumber}?`,
        showCancelButton: true,
        confirmButtonColor: "#22c55e",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Yes, Approve",
        cancelButtonText: "No",
      });
      if (!result.isConfirmed) return;
    }

    if (CRITICAL_STATUSES.includes(status)) {
      const result = await fireManagedSwal({
        icon: "warning",
        title: "Confirm Status Change",
        text: `Mark invoice ${invoiceNumber} as ${status}?`,
        showCancelButton: true,
        confirmButtonColor: "#ef0000",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Yes",
        cancelButtonText: "Cancel",
      });
      if (!result.isConfirmed) return;
    }

    try {
      showLoading("Updating invoice status...");
      const res = await updateInvoiceStatus(invoiceNumber, status);
      closeSwal();
      if (!res.message || res.message.status_code !== 200) {
        showApiError(res?.message.message || "Failed to update invoice status");
        return;
      }
      const updatedStatus = res.message.data?.status;
      setInvoices((prev) =>
        prev.map((inv) =>
          inv.invoiceNumber === invoiceNumber
            ? { ...inv, invoiceStatus: updatedStatus }
            : inv,
        ),
      );
      showSuccess(`Invoice marked as ${status}`);
    } catch (err) {
      closeSwal();
      showApiError(err);
    }
  };
  const handleDelete = async (invoiceNumber: string, e?: React.MouseEvent) => {
    e?.stopPropagation();

    const result = await fireManagedSwal({
      icon: "warning",
      title: "Are you sure?",
      text: `Delete invoice ${invoiceNumber}?`,
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      showLoading("Deleting invoice...");

      const res = await deleteSalesInvoiceById(invoiceNumber);
      if (!res.message || res.message.status_code !== 200) {
        closeSwal();
        showApiError(res?.message.message || "Failed to delete invoice");
        return;
      }

      closeSwal();
      setInvoices((prev) =>
        prev.filter((inv) => inv.invoiceNumber !== invoiceNumber),
      );
      showSuccess("Invoice deleted successfully");
    } catch (err) {
      closeSwal();
      showApiError(err);
    }
  };

  // Memoize columns to prevent re-renders
  const columns: Column<InvoiceSummary>[] = useMemo(
    () => [
      {
        key: "invoiceNumber",
        header: "Invoice No",
        align: "left",
        sortable: true,
        render: (inv) => (
          <div className="py-1.5">
            <span className="block">{inv.invoiceNumber}</span>
          </div>
        ),
        tooltip: (inv) => `Invoice Number: ${inv.invoiceNumber}`,
      },
      {
        key: "invoiceType",
        header: "Tax Type",
        align: "center",
        render: (inv) => (
          <div className="py-1.5">
            <span className="block">{inv.invoiceType}</span>
          </div>
        ),
        tooltip: (inv) => `Invoice Type: ${inv.invoiceType}`,
      },
      {
        key: "customerName",
        header: "Customer",
        align: "left",
        sortable: true,
        render: (inv) => (
          <div className="py-1.5">
            <span className="block font-medium">{inv.customerName}</span>
          </div>
        ),
        tooltip: (inv) => `Customer: ${inv.customerName}`,
      },
      {
        key: "dateOfInvoice",
        header: "Date",
        align: "center",
        render: (inv) => (
          <div className="py-1.5">
            <span className="block">{formatDate(inv.dateOfInvoice)}</span>
          </div>
        ),
      },
      {
        key: "dueDate",
        header: "Due Date",
        align: "center",
        sortable: true,
        render: (inv) => (
          <div className="py-1.5">
            <span className="block">
              {inv.dueDate ? formatDate(inv.dueDate) : "—"}
            </span>
          </div>
        ),
      },
      {
        key: "total",
        header: "Amount",
        align: "center",
        sortable: true,
        render: (inv) => (
          <div className="py-1.5">
            <span className="block whitespace-nowrap">
              {formatAmount(inv.currency, inv.total, { withSymbol: true })}
            </span>
          </div>
        ),
        tooltip: (inv) =>
          `Total Amount: ${formatAmount(inv.currency, inv.total, { withSymbol: true })}`,
      },
      {
        key: "outstandingAmount",
        header: "Outstanding",
        align: "center",
        sortable: true,
        render: (inv) => (
          <div className="py-1.5">
            <span className="block whitespace-nowrap">
              {formatAmount(inv.currency, inv.outstanding_amount ?? 0, {
                withSymbol: true,
              })}
            </span>
          </div>
        ),
        tooltip: (inv) =>
          `Outstanding Amount: ${formatAmount(inv.currency, inv.outstanding_amount ?? 0, { withSymbol: true })}`,
      },
      {
        key: "invoiceStatus",
        header: "Status",
        align: "center",
        render: (inv) => (
          <div className="py-1.5">
            <StatusBadge status={inv.invoiceStatus} />
          </div>
        ),
      },
      {
        key: "actions",
        header: "Actions",
        align: "center",
        render: (inv) => (
          <div className="flex items-center justify-center gap-2">
            <ActionButton
              type="view"
              onClick={(e) => handleView(inv.invoiceNumber, e)}
              iconOnly
            />
            <PermissionGate module={SALES_MODULE} action="write">
              <ActionButton
                type="edit"
                onClick={(e) => handleEdit(inv.invoiceNumber, e)}
                iconOnly
                disabled={inv.invoiceStatus !== "Draft"}
                title={
                  inv.invoiceStatus !== "Draft"
                    ? "Only Draft invoices can be edited"
                    : "Edit Invoice"
                }
              />
            </PermissionGate>
            {(() => {
              const isCancelled = inv.invoiceStatus === "Cancelled";
              const hasDelete =
                can(SALES_MODULE, "delete") && inv.invoiceStatus === "Draft";

              const customActions = [
                ...(inv.invoiceStatus !== "Draft" &&
                inv.invoiceStatus !== "Cancelled" &&
                inv.outstanding_amount > 0 &&
                can(PAYMENT_MODULE, "create")
                  ? [
                      {
                        label: "Receive Payment",
                        icon: ACTION_ICONS.PAYMENT,
                        onClick: () => handleReceivePayment(inv),
                      },
                    ]
                  : []),

                ...(inv.invoiceStatus !== "Draft" && !isCancelled
                  ? [
                      {
                        label: "Compose Email",
                        icon: ACTION_ICONS.EMAIL,
                        onClick: async () => {
                          setEmailInvoice(inv);
                          setEmailContactEmail(null);
                          setEmailInvoiceAttachments([]);
                          setEmailModalOpen(true);
                          try {
                            const res = await getSalesInvoiceById(
                              inv.invoiceNumber,
                            );
                            if (res?.message?.status_code === 200) {
                              setEmailContactEmail(
                                res.message.data?.contact_email ?? null,
                              );
                              setEmailInvoiceAttachments(
                                res.message.data?.attachments ?? [],
                              );
                            }
                          } catch {}
                        },
                      },
                    ]
                  : []),

                ...(!isCancelled
                  ? [
                      {
                        label: "View PDF",
                        icon: ACTION_ICONS.PDF,
                        onClick: () => handlePreviewPDF(inv),
                      },
                    ]
                  : []),

                ...(can(SALES_MODULE, "write")
                  ? (STATUS_TRANSITIONS[inv.invoiceStatus] ?? []).map(
                      (status) => ({
                        label: status === "Approved" ? "Approve" : status,
                        icon: getStatusActionIcon(status),
                        danger: status === "Paid" || status === "Cancelled",
                        onClick: () =>
                          handleRowStatusChange(inv.invoiceNumber, status),
                      }),
                    )
                  : []),
              ];

              const isMenuEmpty = customActions.length === 0 && !hasDelete;

              return (
                <div
                  className={
                    isMenuEmpty ? "opacity-40 pointer-events-none" : ""
                  }
                >
                  <ActionMenu
                    showDownload
                    {...(hasDelete
                      ? { onDelete: (e) => handleDelete(inv.invoiceNumber, e) }
                      : {})}
                    customActions={customActions}
                  />
                </div>
              );
            })()}
          </div>
        ),
      },
    ],
    [
      handleEdit,
      handleDelete,
      handleView,
      handleReceivePayment,
      handleRowStatusChange,
      handlePreviewPDF,
      formatAmount,
    ],
  );

  return (
    <div className="h-full min-h-0">
      <Table
        columns={columns}
        data={invoices}
        rowKey={(row) => row.invoiceNumber}
        tableId="sales-invoices"
        loading={isInitialLoad}
        isFetching={isFetching}
        showToolbar
        searchValue={searchTerm}
        onSearch={(q) => {
          setSearchTerm(q);
          setPage(1);
        }}
        enableAdd={can(SALES_MODULE, "create")}
        addLabel="Add Invoice"
        onAdd={onAddInvoice}
        enableColumnSelector
        enableExport={can(SALES_MODULE, "export")}
        onExport={handleExportExcel}
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
        onRowDoubleClick={(inv) => handleView(inv.invoiceNumber)}
        extraFilters={
          <>
            <FilterSelect
              value={filters.status ?? ""}
              options={statusOptions}
              onChange={(e) => {
                setFilters((prev) => ({
                  ...prev,
                  status: e.target.value || undefined,
                }));
                setPage(1);
              }}
            />
            <DateRangeFilter
              from={filters.from_date}
              to={filters.to_date}
              onChange={(range) => {
                setFilters((prev) => ({ ...prev, ...range }));
                setPage(1);
              }}
            />
          </>
        }
      />

      {/* ── Drawer modal ── */}
      <InvoiceDetailModal
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

      {/* ── PDF Preview modal — kept, used by handleClosePdf ── */}
      <PdfPreviewModal
        open={pdfOpen}
        title="Invoice Preview"
        pdfUrl={pdfUrl}
        onClose={handleClosePdf}
        onDownload={() => {
          if (!pdfUrl || !pdfInvoiceNumber) return;
          const a = document.createElement("a");
          a.href = pdfUrl;
          a.download = `${pdfInvoiceNumber}.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }}
      />
      <SendEmailModal
        open={emailModalOpen}
        docType="Sales Invoice"
        invoiceNumber={emailInvoice?.invoiceNumber}
        contactEmail={emailContactEmail}
        customerName={emailInvoice?.customerName}
        invoiceAttachments={emailInvoiceAttachments}
        onClose={() => {
          setEmailModalOpen(false);
          setEmailInvoice(null);
          setEmailContactEmail(null);
          setEmailInvoiceAttachments([]);
        }}
      />
    </div>
  );
};

export default InvoiceTable;
