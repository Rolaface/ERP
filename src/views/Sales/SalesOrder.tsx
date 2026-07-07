import React, { useEffect, useState, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import {
  showApiError,
  showSuccess,
  showLoading,
  closeSwal,
  showConfirm,
} from "../../utils/alert";
import { getCompanyById } from "../../api/companySetupApi";
import { openSendEmailModal } from "../../store/modalStore";
import type { SalesOrderSummary } from "../../types/salesOrder";
import Table from "../../components/ui/Table/Table";
import ActionButton, {
  ActionGroup,
  ActionMenu,
} from "../../components/ui/Table/ActionButton";
import type { Column } from "../../components/ui/Table/type";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

import PdfPreviewModal from "./PdfPreviewModal";

import StatusBadge from "../../components/ui/Table/StatusBadge";

import QuotationDetailModal, { QuotationDetail } from "./Quotationdetailmodal";
import { fireManagedSwal } from "../../utils/swalManager";
import { usePermission } from "../../hooks/permission/usePermission";
import PermissionGate from "../PermissionGate";
import {
  getAllSalesOrders,
  getSalesOrderById,
  updateSalesOrderStatus,
  deleteSalesOrderById,
  createSalesSiFromSo,
} from "../../api/SalesOrder/salesOrderAPi";

import { getPdf } from "../../api/PDF/pdfUtilApi";
import { parseFrappeError } from "../hr/tabs/leave-config/hooks/parseFrappeError";
import { ACTION_ICONS, getStatusActionIcon } from "../../components/UI_Utils/statusActionIcons";
import { REFRESH_KEYS, useDataRefreshStore } from "../../store/dataRefreshStore";
import { useCurrencySymbols } from "../../hooks/Usecurrencysymbols";
import { extractCurrencyCodesFlat } from "../../utils/Extractcurrencycodes";
import SalesOrderDetailModal from "./SalesOrderDetailModal";

const COMPANY_ID = import.meta.env.VITE_COMPANY_ID;

type OutletContextType = {
  openSalesOrderCreate: () => void;
  openSalesOrderEdit: (salesOrderId: string, data: any) => void;
};

const SORT_FIELD_MAP: Record<string, string> = {
  orderNumber: "name",
  customerName: "customer_name",
  transactionDate: "transaction_date",
  deliveryDate: "delivery_date",
  grandTotal: "grand_total",
};

interface SalesOrderTableProps {
  onAddSalesOrder?: () => void;
  onExportSalesOrder?: () => void;
  refreshKey: number;
}

const SALES_ORDER_MODULE = "Sales Order";

type SalesOrderAction = "approved" | "cancelled" | "closed" | "reopened";

const STATUS_ACTIONS: Record<
  string,
  { label: string; action: SalesOrderAction; danger?: boolean }[]
> = {
  Draft: [{ label: "Approve", action: "approved" }],
  "To Deliver and Bill": [{ label: "Close", action: "closed", danger: true }],
  "To Bill": [{ label: "Close", action: "closed", danger: true }],
  "To Deliver": [{ label: "Close", action: "closed", danger: true }],
  Completed: [{ label: "Close", action: "closed", danger: true }],
  "On Hold": [{ label: "Close", action: "closed", danger: true }],
  Closed: [{ label: "Reopen", action: "reopened" }],
  Cancelled: [],
};

const SalesOrdersTable: React.FC<SalesOrderTableProps> = ({
  onAddSalesOrder,
  refreshKey,
}) => {
  const { openSalesOrderEdit } = useOutletContext<OutletContextType>();

  const [salesOrders, setSalesOrders] = useState<SalesOrderSummary[]>([]);
  const [isFetching] = useState(false);
  const [, setCompany] = useState<any>(null);
  const { can } = usePermission();

  // ── Pagination state (server)
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // ── Search state (server)
  const [searchTerm, setSearchTerm] = useState("");

  const [sortBy, setSortBy] = useState("orderNumber");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  const [, setSelectedSalesOrder] = useState<any>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfOpen, setPdfOpen] = useState(false);

  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [detailData, setDetailData] = useState<QuotationDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [drawerPdfLoading, setDrawerPdfLoading] = useState(false);
  const [drawerPdfUrl, setDrawerPdfUrl] = useState<string | null>(null);
  const [drawerPdfBlob, setDrawerPdfBlob] = useState<Blob | null>(null);
  const [previewPdfBlob, setPreviewPdfBlob] = useState<Blob | null>(null);
  const [previewPdfId, setPreviewPdfId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);

  const currencyCodes = useMemo(
    () => extractCurrencyCodesFlat(salesOrders),
    [salesOrders],
  );
  const { formatAmount } = useCurrencySymbols(currencyCodes);

  useEffect(() => {
    getCompanyById(COMPANY_ID)
      .then((res) => {
        if (res?.status_code === 200) setCompany(res.data);
      })
      .catch(() => console.error("Failed to load company data"));
  }, []);

  // ── Fetch Sales Orders ───────────────────────────────────────────────────
  const fetchSalesOrders = async () => {
    try {
      setLoading(true);

      const res = await getAllSalesOrders(
        page,
        pageSize,
        SORT_FIELD_MAP[sortBy] || sortBy,
        sortOrder,
        searchTerm,
      );

      if (!res || res.status_code !== 200) return;

      const mapped: SalesOrderSummary[] = res.data.map((so: any) => ({
        orderNumber: so.id || so.name,
        customerName: so.customerName,
        currency: so.currency,
        deliveryDate: so.deliveryDate,
        grandTotal: Number(so.total || 0),
        status: so.status,
        transactionDate: so.postingDate || "",
        perDelivered: so.perDelivered,
        perBilled: so.perBilled,
      }));

      setSalesOrders(mapped);
      setTotalPages(res.pagination?.total_pages || 1);
      setTotalItems(res.pagination?.total || mapped.length);
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  useEffect(() => {
    fetchSalesOrders();
  }, [page, pageSize, refreshKey, sortBy, sortOrder, searchTerm]);

  // Auto-refresh when a sales order is created or edited
  useEffect(() => {
    const unsubscribe = useDataRefreshStore
      .getState()
      .subscribeToRefresh(REFRESH_KEYS.SALES_ORDER_LIST, () => {
        fetchSalesOrders();
      });
    return unsubscribe;
  }, []);

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

  const handleRowStatusChange = async (
    orderNumber: string,
    action: SalesOrderAction,
  ) => {
    if (action === "cancelled" || action === "closed") {
      const isConfirmed = await showConfirm(
        `Are you sure you want to ${action === "cancelled" ? "cancel" : "close"} entry ${orderNumber}?`,
        {
          title: action === "cancelled" ? "Cancel Entry" : "Close Entry",
          confirmButtonText: `Yes, ${action === "cancelled" ? "Cancel" : "Close"}`,
          confirmButtonColor: "#ef4444",
          cancelButtonText: "No, Keep",
        },
      );
      if (!isConfirmed) return;
    }

    try {
      showLoading("Updating sales order status...");

      const res = await updateSalesOrderStatus(orderNumber, action);

      const statusCode = res?.message?.status_code || res?.status_code;

      if (statusCode !== 200) {
        closeSwal();
        showApiError(
          res?.message?.message || res?.message || "Failed to update status",
        );
        return;
      }

      closeSwal();
      const newStatus =
        res?.message?.data?.status || res?.data?.status || action;

      setSalesOrders((prev) =>
        prev.map((so) =>
          so.orderNumber === orderNumber ? { ...so, status: newStatus } : so,
        ),
      );

      showSuccess(`Sales Order updated to ${newStatus}`);
    } catch (err) {
      closeSwal();
      showApiError(err);
    }
  };

  const handleEdit = async (orderNumber: string, e?: React.MouseEvent) => {
    e?.stopPropagation();

    try {
      showLoading("Loading sales order...");

      const res = await getSalesOrderById(orderNumber);
      const statusCode = res?.message?.status_code || res?.status_code;
      const data = res?.message?.data || res?.data;

      if (statusCode !== 200 || !data) {
        closeSwal();
        showApiError("Failed to load sales order");
        return;
      }

      closeSwal();
      openSalesOrderEdit(orderNumber, data);
    } catch (err) {
      closeSwal();
      showApiError(err);
    }
  };

  const handleDrawerPdf = async (orderNumber: string) => {
    setDrawerPdfLoading(true);
    setDrawerPdfUrl(null);

    try {
      const blob = await getPdf(orderNumber, "Sales Order");
      setDrawerPdfBlob(blob);
      const blobUrl = URL.createObjectURL(blob);
      setDrawerPdfUrl(blobUrl);
    } catch (err) {
      showApiError(err);
    } finally {
      setDrawerPdfLoading(false);
    }
  };

  const handlePreviewSalesOrderPDF = async (
    orderNumber: string,
    e?: React.MouseEvent,
  ) => {
    e?.stopPropagation();
    try {
      showLoading("Preparing preview...");
      const blob = await getPdf(orderNumber, "Sales Order");

      const blobUrl = URL.createObjectURL(blob);
      closeSwal();
      setPdfUrl(blobUrl);
      setPreviewPdfBlob(blob);
      setPreviewPdfId(orderNumber);
      setSelectedSalesOrder(null);
      setPdfOpen(true);
    } catch (err: any) {
      closeSwal();
      showApiError(err);
    }
  };

  const handleDelete = async (
    orderNumber: string,
    e?: React.MouseEvent,
  ) => {
    e?.stopPropagation();

    const result = await fireManagedSwal({
      icon: "warning",
      title: "Are you sure?",
      text: `Delete sales order ${orderNumber}?`,
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      showLoading("Deleting sales order...");

      const res = await deleteSalesOrderById(orderNumber);

      const statusCode = res?.message?.status_code || res?.status_code;

      if (statusCode !== 200) {
        closeSwal();
        showApiError(
          parseFrappeError ||
            res?.message?.message ||
            res?.message ||
            "Failed to delete sales order",
        );
        return;
      }

      closeSwal();

      setSalesOrders((prev) =>
        prev.filter((so) => so.orderNumber !== orderNumber),
      );

      showSuccess("Sales Order deleted successfully");
    } catch (err) {
      closeSwal();
      showApiError(err);
    }
  };

  const handleCreateInvoice = async (
  orderNumber: string,
  e?: React.MouseEvent,
) => {
  e?.stopPropagation();

  const result = await fireManagedSwal({
    icon: "question",
    title: "Create Sales Invoice?",
    text: `Create a Sales Invoice from ${orderNumber}?`,
    showCancelButton: true,
    confirmButtonColor: "#22c55e",
    cancelButtonColor: "#6b7280",
    confirmButtonText: "Yes, create",
    reverseButtons: true,
  });

  if (!result.isConfirmed) return;

  try {
    showLoading("Creating Sales Invoice...");

    const res = await createSalesSiFromSo(orderNumber);
    const statusCode = res?.message?.status_code || res?.status_code;

    if (statusCode !== 201 && statusCode !== 200) {
      closeSwal();
      showApiError(
        res?.message?.message || res?.message || "Failed to create Sales Invoice",
      );
      return;
    }

    closeSwal();
    showSuccess(res?.message?.message || res?.message || "Sales Invoice created successfully");
  } catch (err) {
    closeSwal();
    showApiError(err);
  }
};

  const fetchAllForExport = async (): Promise<SalesOrderSummary[]> => {
    let allData: SalesOrderSummary[] = [];
    let current = 1;
    let total = 1;

    do {
      const res = await getAllSalesOrders(
        current,
        100,
        SORT_FIELD_MAP[sortBy] || sortBy,
        sortOrder,
        searchTerm,
      );

      if (res?.status_code === 200) {
        const raw = res.data?.salesOrders || res.data || [];
        allData = [
          ...allData,
          ...raw.map((so: any) => ({
            orderNumber: so.id || "",
            customerName: so.customerName,
            transactionDate: so.transactionDate || so.postingDate || "",
            deliveryDate: so.deliveryDate || "",
            grandTotal: Number(so.grandTotal ?? so.total ?? 0),
            currency: so.currency,
          })),
        ];
        total = res.data?.pagination?.totalPages || res.pagination?.total_pages || 1;
      }

      current++;
    } while (current <= total);

    return allData;
  };

  const handleExportExcel = async () => {
    try {
      showLoading("Exporting Sales Orders...");
      const data = await fetchAllForExport();

      if (!data.length) {
        closeSwal();
        showApiError("No sales orders to export");
        return;
      }

      const worksheet = XLSX.utils.json_to_sheet(
        data.map((so) => ({
          "Order No": so.orderNumber,
          Customer: so.customerName,
          Date: so.transactionDate,
          "Delivery Date": so.deliveryDate,
          Amount: so.grandTotal,
          Currency: so.currency,
        })),
      );

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sales Orders");

      saveAs(
        new Blob([XLSX.write(workbook, { bookType: "xlsx", type: "array" })], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
        "All_Sales_Orders.xlsx",
      );

      closeSwal();
      showSuccess("Export completed successfully");
    } catch (err) {
      closeSwal();
      showApiError(err);
    }
  };

  const handleView = async (orderNumber: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDetailDrawerOpen(true);
    setDetailLoading(true);
    setDetailData(null);
    try {
      const res = await getSalesOrderById(orderNumber);

      const statusCode = res?.message?.status_code || res?.status_code;
      const data = res?.message?.data || res?.data;

      if (statusCode === 200 && data) {
        setDetailData(data);
      }
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDrawerDownload = () => {
    if (!drawerPdfBlob || !detailData) return;

    const url = URL.createObjectURL(drawerPdfBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${detailData.id || "sales-order"}.pdf`;

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
  };

  const handlePreviewDownload = () => {
    if (!previewPdfBlob || !previewPdfId) return;

    const url = URL.createObjectURL(previewPdfBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${previewPdfId}.pdf`;

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
  };

  const columns: Column<SalesOrderSummary>[] = [
    {
      key: "orderNumber",
      header: "Order No",
      align: "left",
      sortable: true,
      render: (so) => (
        <span className="font-semibold text-main">{so.orderNumber}</span>
      ),
    },
    { key: "customerName", header: "Customer", align: "left", sortable: true },
    {
      key: "transactionDate",
      header: "Date",
      align: "left",
      sortable: true,
      render: (so: any) => (
        <span className="text-xs text-muted">
          {so.transactionDate ? formatDate(so.transactionDate) : "-"}
        </span>
      ),
    },
    {
      key: "deliveryDate",
      header: "Delivery Date",
      align: "left",
      sortable: true,
      render: (so) => (
        <span className="text-xs text-muted">
          {so.deliveryDate ? formatDate(so.deliveryDate) : "-"}
        </span>
      ),
    },
    {
      key: "total",
      header: "Amount",
      align: "right",
      sortable: true,
      render: (so) => (
        <code className="text-xs px-2 py-1 rounded bg-row-hover text-main">
          {formatAmount(so.currency, so.grandTotal, { withSymbol: true })}
        </code>
      ),
    },
    {
      key: "status",
      header: "Status",
      align: "left",
      render: (so: any) => <StatusBadge status={so.status || "Draft"} />,
    },
    {
      key: "actions",
      header: "Actions",
      align: "center",
      render: (so) => (
        <ActionGroup>
          <ActionButton
            type="view"
            onClick={(e) => handleView(so.orderNumber, e)}
            iconOnly
          />

          {/* Edit — needs write + Draft */}
          <PermissionGate module={SALES_ORDER_MODULE} action="write">
            <ActionButton
              type="edit"
              disabled={so.status !== "Draft"}
              onClick={(e) => handleEdit(so.orderNumber, e)}
              iconOnly
            />
          </PermissionGate>

          <ActionMenu
            {...(so.status === "Cancelled" || so.status === "Draft"
              ? { onDelete: (e) => handleDelete(so.orderNumber, e) }
              : {})}
            customActions={[
              ...(so.status !== "Draft"
                ? [
                    {
                      label: "Compose Email",
                      icon: ACTION_ICONS.EMAIL,
                      onClick: async () => {
                        let contactEmail: string | null = null;
                        let orderAttachments: { name: string; file_name: string }[] = [];
                        try {
                          const res = await getSalesOrderById(so.orderNumber);
                          const statusCode = res?.message?.status_code || res?.status_code;
                          const data = res?.message?.data || res?.data;
                          if (statusCode === 200 && data) {
                            contactEmail = data.contact_email ?? null;
                            orderAttachments = data.attachments ?? [];
                          }
                        } catch {
                          // non-critical: modal opens with empty To/attachments if fetch fails
                        }
                        openSendEmailModal({
                          docType: "Sales Order",
                          invoiceNumber: so.orderNumber,
                          customerName: so.customerName,
                          contactEmail,
                          invoiceAttachments: orderAttachments,
                        });
                      },
                    },
                  ]
                : []),
              {
                label: "View PDF",
                icon: ACTION_ICONS.PDF,
                onClick: () => handlePreviewSalesOrderPDF(so.orderNumber),
              },
              ...(so.status !== "Draft" && so.status !== "Cancelled"
  ? [
      {
        label: "Create Sales Invoice",
        icon: ACTION_ICONS.SALES_INVOICE, 
        onClick: () => handleCreateInvoice(so.orderNumber),
      },
    ]
  : []),
              ...(STATUS_ACTIONS[so.status as string] ?? []).map((entry) => ({
                label: entry.label,
                // icon: getStatusActionIcon(entry.action),
                icon: getStatusActionIcon(
    entry.action === "approved" ? "Approved" : 
    entry.action === "closed" ? "Cancelled" : 
    entry.action
  ),
                danger: entry.danger,
                onClick: () => handleRowStatusChange(so.orderNumber, entry.action),
              })),
            ]}
          />
        </ActionGroup>
      ),
    },
  ];

  return (
    <div className="h-full min-h-0">
      <Table
        loading={loading || initialLoad}
        columns={columns}
        data={salesOrders}
        tableId="sales-orders"
        rowKey={(row) => row.orderNumber}
        isFetching={isFetching}
        defaultVisibleCount={7}
        showToolbar
        searchValue={searchTerm}
        onSearch={(q) => {
          setSearchTerm(q);
          setPage(1);
        }}
        enableColumnSelector
        enableAdd={can(SALES_ORDER_MODULE, "create")}
        addLabel="Add Sales Order"
        onAdd={onAddSalesOrder}
        enableExport={can(SALES_ORDER_MODULE, "export")}
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
        onRowDoubleClick={(so) => handleView(so.orderNumber)}
      />

      <PdfPreviewModal
        open={pdfOpen}
        title="Sales Order Preview"
        pdfUrl={pdfUrl}
        onClose={() => {
          if (pdfUrl?.startsWith("blob:")) URL.revokeObjectURL(pdfUrl);
          setPdfUrl(null);
          setPreviewPdfBlob(null);
          setPreviewPdfId(null);
          setSelectedSalesOrder(null);
          setPdfOpen(false);
        }}
        onDownload={handlePreviewDownload}
      />
      <SalesOrderDetailModal
        // key={detailData?.id || "detail-drawer"}
        // title={`Sales Order: ${detailData?.id || ""}`}
        open={detailDrawerOpen}
        data={detailData}
        loading={detailLoading}
        onClose={() => {
          setDetailDrawerOpen(false);
          setDetailData(null);
          setDrawerPdfUrl(null);
        }}
        pdfUrl={drawerPdfUrl}
        pdfLoading={drawerPdfLoading}
        onViewPdf={() => detailData?.id && handleDrawerPdf(detailData.id)}
        onDownload={handleDrawerDownload}
        onClosePdf={() => {
          if (drawerPdfUrl?.startsWith("blob:")) {
            URL.revokeObjectURL(drawerPdfUrl);
          }
          setDrawerPdfUrl(null);
        }}
      />
    </div>
  );
};

export default SalesOrdersTable;