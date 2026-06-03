import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import PurchaseOrderView from "../../views/Procurement/purchaseorderview";
import Table from "../../components/ui/Table/Table";
import StatusBadge from "../../components/ui/Table/StatusBadge";
import { fireManagedSwal } from "../../utils/swalManager";
import ActionButton, {
  ActionGroup,
  ActionMenu,
} from "../../components/ui/Table/ActionButton";
import {
  ACTION_ICONS,
  getStatusActionIcon,
} from "../../components/UI_Utils/statusActionIcons";
import { FilterSelect } from "../../components/ui/modal/modalComponent";
import type { Column } from "../../components/ui/Table/type";
import type { PurchaseOrderDetail } from "../../types/Supply/purchaseOrder";
import { createPurchaseInvoiceFromPO } from "../../api/procurement/PurchaseOrderApi";
import { openPaymentEntryModal } from "../../store/modalStore";

import {
  showApiError,
  showSuccess,
  showLoading,
  closeSwal,
} from "../../utils/alert";
import {
  getPurchaseOrders,
  updatePurchaseOrderStatus,
  deletePo,
} from "../../api/procurement/PurchaseOrderApi";

import { getPurchaseOrderById } from "../../api/procurement/PurchaseOrderApi";
import type { PurchaseOrderFilters } from "../../api/procurement/PurchaseOrderApi";
import DateRangeFilter from "../../components/ui/modal/DateRangeFilter";
import { generatePurchaseOrderPDF } from "../../components/template/purchaseordertemplete";
import { getCompanyById } from "../../api/companySetupApi";
const COMPANY_ID = import.meta.env.VITE_COMPANY_ID;
import PdfPreviewModal from ".././Sales/PdfPreviewModal";
import {
  REFRESH_KEYS,
  useDataRefreshStore,
} from "../../store/dataRefreshStore";
import PermissionGate from "../PermissionGate";
import { usePermission } from "../../hooks/permission/usePermission";
import PurchaseOrderDetailModal from "../../components/procurement/purchaseorder/PurchaseOrderDetailsModal";

// ─── Types ────────────────────────────────────────────────────────────────────
import SendEmailModal from "../../components/common/SendEmailModal";

type OutletContextType = {
  openPOCreate: () => void;
  openPOEdit: (poId: string | number) => void;
};

interface PurchaseOrder {
  id: string;
  supplier: string;
  date: string;
  amount: number;
  status: string;
  currency?: string;
  supplierId: string;
  deliveryDate: string;
  referenceNumber: string;
}

interface PurchaseOrdersTableProps {
  onAdd?: () => void;
}

type POStatus = "Draft" | "Approved" | "Cancelled" | "Completed";

const STATUS_TRANSITIONS: Record<POStatus, POStatus[]> = {
  Draft: ["Approved"],
  Approved: ["Cancelled", "Completed"],
  Cancelled: [],
  Completed: [],
};

const statusOptions = [
  { label: "Draft", value: "Draft" },
  { label: "Approved", value: "Approved" },
  { label: "Cancelled", value: "Cancelled" },
  { label: "Completed", value: "Completed" },
];

const PO_MODULE = "Purchase Order";
const PAYMENT_MODULE = "Payment Entry";
const PI_MODULE = "Purchase Invoice";

const PurchaseOrdersTable: React.FC<PurchaseOrdersTableProps> = ({}) => {
  const { openPOEdit } = useOutletContext<OutletContextType>();
  const { can } = usePermission();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [, setModalOpen] = useState(false);

  const [selectedOrder, setSelectedOrder] =
    useState<PurchaseOrderDetail | null>(null);
  const [filters, setFilters] = useState<PurchaseOrderFilters>({});
  const [company, setCompany] = useState<any | null>(null);

  //email
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailPurchaseOrder, setEmailPurchaseOrder] =
    useState<PurchaseOrder | null>(null);
  const [emailContactEmail, setEmailContactEmail] = useState<string | null>(
    null,
  );
  const [emailPurchaseOrderAttachments, setEmailPurchaseOrderAttachments] =
    useState<{ name: string; file_name: string }[]>([]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerData, setDrawerData] = useState<PurchaseOrderDetail | null>(
    null,
  );
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [drawerPdfUrl, setDrawerPdfUrl] = useState<string | null>(null);
  const [drawerPdfLoading, setDrawerPdfLoading] = useState(false);

  // ── PDF preview modal (kept — do not remove)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfOpen, setPdfOpen] = useState(false);

  // ── Unused modal state (kept — do not remove)
  const [viewModalOpen, setViewModalOpen] = useState(false);

  // ── Debounced search → filters
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({
        ...prev,
        search: searchTerm || undefined,
      }));
      setPage(1);
    }, 600);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    getCompanyById(COMPANY_ID)
      .then((res) => {
        if (res?.status_code === 200) setCompany(res.data);
      })
      .catch(() => console.error("Failed to load company"));
  }, []);

  // ── Fetch orders
  const fetchOrders = async () => {
    try {
      setLoading(true);

      const res = await getPurchaseOrders(page, pageSize, filters);

      if (!res?.data || res.data.length === 0) {
        setOrders([]);
        setTotalItems(0);
        setTotalPages(1);
        return;
      }

      setTotalPages(res.pagination?.total_pages || 1);
      setTotalItems(res.pagination?.total || 0);

      const mappedOrders: PurchaseOrder[] = res.data.map((po: any) => ({
        id: po.poId,
        supplier: po.supplierName || po.supplier_name || po.partyName || "",
        date: po.poDate,
        supplierId: po.supplierId ?? po.partyId ?? po.supplier_id ?? "",
        deliveryDate: po.deliveryDate || po.items?.[0]?.requiredBy || "",
        amount: po.grandTotal,
        currency: po.currency,
        status: po.status,
        referenceNumber: po.referenceNumber,
      }));

      setOrders(mappedOrders);
    } catch (err) {
      showApiError(err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, pageSize, filters]);

  const subscribeToRefresh = useDataRefreshStore(
    (state) => state.subscribeToRefresh,
  );

  useEffect(() => {
    const unsubscribe = subscribeToRefresh(
      REFRESH_KEYS.PURCHASE_ORDER_LIST,
      () => {
        fetchOrders();
      },
    );
    return () => unsubscribe();
  }, [subscribeToRefresh, fetchOrders]);

  const handleMakePayment = async (order: PurchaseOrder) => {
    if (order.status !== "Approved") {
      showApiError("Only Approved purchase orders can have payments");
      return;
    }

    try {
      showLoading("Opening payment...");
      const res = await getPurchaseOrderById(order.id);
      closeSwal();

      if (!res || res.status !== "success") {
        showApiError("Failed to load purchase order");
        return;
      }

      const data = res.data ?? {};

      openPaymentEntryModal(
        {
          paymentType: "Pay",
          partyType: "Supplier",
          partyName:
            data.supplierName ||
            data.supplier_name ||
            data.partyName ||
            order.supplier,
          partyId:
            data.supplierId ??
            data.partyId ??
            data.supplier_id ??
            order.supplierId,
          amount: Number(data.grandTotal ?? order.amount ?? 0),
          referenceName: data.poId || order.id,
          referenceType: "Purchase Order",
        },
        false,
        {
          onSuccess: (paymentId) => {
            fetchOrders();
            showSuccess(`Payment ${paymentId} created`);
          },
        },
      );
    } catch (err) {
      closeSwal();
      showApiError(err);
    }
  };
  const handleCreateInvoiceFromPO = async (order: PurchaseOrder) => {
    try {
      showLoading("Creating Purchase Invoice...");

      const res = await createPurchaseInvoiceFromPO(order.id);

      if (!res || res.status_code !== 201) {
        throw new Error("Failed to create invoice");
      }

      closeSwal();
      showSuccess("Purchase Invoice created successfully");

      // OPTIONAL: refresh table
      fetchOrders();
    } catch (err: any) {
      closeSwal();
      showApiError(err);
    }
  };

  const handleDrawerPdf = async (poId: string) => {
    setDrawerPdfLoading(true);
    setDrawerPdfUrl(null);
    try {
      if (!company) return;
      const res = await getPurchaseOrderById(poId);
      if (!res || res.status !== "success") return;
      const blobUrl = await generatePurchaseOrderPDF(
        res.data,
        company,
        "bloburl",
      );
      setDrawerPdfUrl(blobUrl);
    } catch (err) {
      showApiError(err);
    } finally {
      setDrawerPdfLoading(false);
    }
  };

  // ── PDF preview modal (table row "View PDF" action — kept, do not remove)
  const handlePreviewPDF = async (
    order: PurchaseOrder,
    e?: React.MouseEvent,
  ) => {
    e?.stopPropagation();
    try {
      showLoading("Generating PDF...");

      if (!company) {
        closeSwal();
        showApiError("Company data not loaded");
        return;
      }

      const res = await getPurchaseOrderById(order.id);
      if (!res || res.status !== "success") {
        closeSwal();
        showApiError(res?.message || "Failed to load purchase order");
        return;
      }

      const blobUrl = await generatePurchaseOrderPDF(
        res.data,
        company,
        "bloburl",
      );
      closeSwal();
      setSelectedOrder(res.data);
      setPdfUrl(blobUrl);
      setPdfOpen(true);
    } catch (error) {
      closeSwal();
      showApiError(error);
    }
  };

  // ── Modal handlers
  const handleAddClick = () => {
    console.log("OPEN PURCHASE MODAL");
    openPOEdit(0);
  };

  const handleEdit = (order: PurchaseOrder, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (order.status !== "Draft") {
      showApiError("Only Draft purchase orders can be edited");
      return;
    }

    openPOEdit(order.id);
  };

  const handleDelete = async (order: PurchaseOrder, e: React.MouseEvent) => {
    e.stopPropagation();

    const confirm = await fireManagedSwal({
      icon: "warning",
      title: "Are you sure?",
      text: `Delete Purchase Order ${order.id}?`,
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete",
    });

    if (!confirm.isConfirmed) return;

    try {
      showLoading("Deleting Purchase Order...");

      const res = await deletePo(order.id);

      if (res.status < 200 || res.status >= 300) {
        throw new Error("Delete failed");
      }

      closeSwal();
      showSuccess("Purchase Order deleted successfully");

      await fetchOrders();
    } catch (error) {
      closeSwal();
      showApiError(error);
    }
  };

  // ── Export all pages
  const fetchAllPOsForExport = async () => {
    try {
      let allData: PurchaseOrder[] = [];
      let currentPage = 1;
      let totalPagesLocal = 1;

      do {
        const res = await getPurchaseOrders(currentPage, 100, filters);

        if (res?.status_code === 200) {
          const mapped = res.data.map((po: any) => ({
            id: po.poId,
            supplier: po.supplierName || po.supplier_name || po.partyName || "",
            date: po.poDate,
            deliveryDate: po.deliveryDate,
            amount: po.grandTotal,
            status: po.status,
            referenceNumber: po.referenceNumber,
          }));

          allData = [...allData, ...mapped];
          totalPagesLocal = res.pagination?.total_pages || 1;
        }

        currentPage++;
      } while (currentPage <= totalPagesLocal);

      return allData;
    } catch (error) {
      showApiError(error);
      return [];
    }
  };
  const handleExportCSV = async () => {
    try {
      showLoading("Exporting purchase orders...");

      const dataToExport = await fetchAllPOsForExport();

      if (!dataToExport.length) {
        closeSwal();
        showApiError("No purchase orders to export");
        return;
      }

      const headers = [
        "PO ID",
        "Supplier",
        "Reference No",
        "Date",
        "Delivery Date",
        "Amount",
        "Status",
      ];
      const rows = dataToExport.map((po) => [
        po.id ?? "",
        po.supplier ?? "",
        po.referenceNumber ?? "",
        po.date ?? "",
        po.deliveryDate ?? "",
        Number(po.amount || 0).toFixed(2),
        po.status ?? "",
      ]);

      const csvContent = [headers, ...rows]
        .map((row) =>
          row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
        )
        .join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "Purchase_Orders_Export.csv";
      link.click();
      URL.revokeObjectURL(url);

      closeSwal();
      showSuccess("CSV exported successfully");
    } catch (error) {
      closeSwal();
      showApiError(error);
    }
  };

  const handleView = async (poId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDrawerOpen(true);
    setDrawerLoading(true);
    setDrawerData(null);
    try {
      const res = await getPurchaseOrderById(poId);
      if (res?.status === "success")
        setDrawerData(res.data as PurchaseOrderDetail);
    } finally {
      setDrawerLoading(false);
    }
  };

  const handleStatusChange = async (poId: string, newStatus: POStatus) => {
    try {
      const res = await updatePurchaseOrderStatus(poId, newStatus);

      if (!res || res.status_code !== 200) {
        showApiError(res);
        return;
      }

      setOrders((prev) =>
        prev.map((o) =>
          o.id === poId ? { ...o, status: res.data?.status || newStatus } : o,
        ),
      );

      showSuccess(res.message || `Purchase Order marked as ${newStatus}`);
    } catch (error: any) {
      showApiError(error);
    }
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

  const columns: Column<PurchaseOrder>[] = [
    {
      key: "id",
      header: "PO ID",
      align: "left",
      render: (o) => (
        <div className="py-1.5">
          <span className="block">{o.id || "—"}</span>
        </div>
      ),
    },
    {
      key: "supplier",
      header: "Supplier",
      align: "center",
      render: (o) => (
        <div className="py-1.5">
          <span className="block">{o.supplier || "—"}</span>
        </div>
      ),
      tooltip: (o) => o.supplier || "—",
    },
    {
      key: "date",
      header: "Date",
      align: "center",
      render: (o) => (
        <div className="py-1.5">
          <span className="block">{o.date ? formatDate(o.date) : "—"}</span>
        </div>
      ),
      tooltip: (o) => o.date || "—",
    },
    {
      key: "amount",
      header: "Amount",
      align: "center",
      render: (o) => (
        <div className="py-1.5">
          <code className="inline-flex max-w-full rounded bg-row-hover px-2 py-0.5 text-xs text-main">
            {o.currency} {Number(o.amount || 0).toFixed(2)}
          </code>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      align: "center",
      render: (o) => (
        <div className="py-1.5">
          <StatusBadge status={o.status} />
        </div>
      ),
    },
    {
      key: "deliveryDate",
      header: "Required By",
      align: "center",
      render: (o) => (
        <div className="py-1.5">
          <span className="block">
            {o.deliveryDate ? formatDate(o.deliveryDate) : "—"}
          </span>
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "center",
      render: (o) => (
        <ActionGroup>
          <ActionButton
            type="view"
            onClick={(e) => handleView(o.id, e)}
            iconOnly
          />

          {/* Edit — needs write + must be Draft */}
          <PermissionGate module={PO_MODULE} action="write">
            <ActionButton
              type="edit"
              onClick={(e) => handleEdit(o, e)}
              iconOnly
              disabled={o.status !== "Draft"}
              title={
                o.status !== "Draft"
                  ? "Only Draft POs can be edited"
                  : "Edit Purchase Order"
              }
            />
          </PermissionGate>

          <ActionMenu
            {...(can(PO_MODULE, "delete")
              ? { onDelete: (e) => handleDelete(o, e as any) }
              : {})}
            customActions={[
              {
                label: "View PDF",
                icon: ACTION_ICONS.PDF,
                onClick: () => handlePreviewPDF(o),
              },

              ...(["Approved", "Completed"].includes(o.status)
                ? [
                    {
                      label: "Compose Email",
                      icon: ACTION_ICONS.EMAIL,
                      onClick: async () => {
                        setEmailPurchaseOrder(o);
                        setEmailContactEmail(null);
                        setEmailPurchaseOrderAttachments([]);
                        setEmailModalOpen(true);

                        try {
                          const res = await getPurchaseOrderById(o.id);
                          if (res?.status === "success") {
                            setEmailContactEmail(
                              res.data?.contact_email ?? null,
                            );
                            setEmailPurchaseOrderAttachments(
                              res.data?.attachments ?? [],
                            );
                          }
                        } catch {
                          // non-critical
                        }
                      },
                    },
                  ]
                : []),

              // Advance Payment — needs Payment Entry create + Approved status
              ...(can(PAYMENT_MODULE, "create") && o.status === "Approved"
                ? [
                    {
                      label: "Make Advance Payment",
                      icon: ACTION_ICONS.ADVANCE_PAYMENT,
                      onClick: () => handleMakePayment(o),
                    },
                  ]
                : []),

              // Make Purchase Invoice — needs Purchase Invoice create + Approved
              ...(can(PI_MODULE, "create") && o.status === "Approved"
                ? [
                    {
                      label: "Make Purchase Invoice",
                      icon: ACTION_ICONS.PURCHASE_INVOICE,
                      onClick: () => handleCreateInvoiceFromPO(o),
                    },
                  ]
                : []),

              ...(can(PO_MODULE, "write")
                ? (STATUS_TRANSITIONS[o.status as POStatus] ?? []).map(
                    (status) => ({
                      label: status === "Approved" ? "Approve" : status,

                      icon: getStatusActionIcon(status),

                      danger: status === "Completed" || status === "Cancelled",

                      onClick: () => handleStatusChange(o.id, status),
                    }),
                  )
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
        tableId="purchase-orders"
        data={orders}
        showToolbar
        loading={loading}
        searchValue={searchTerm}
        enableExport={can(PO_MODULE, "export")}
        onExport={handleExportCSV}
        onSearch={setSearchTerm}
        enableAdd={can(PO_MODULE, "create")}
        addLabel="Add Purchase Order"
        onAdd={handleAddClick}
        enableColumnSelector
        currentPage={page}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageChange={setPage}
        onPageSizeChange={(size) => setPageSize(size)}
        pageSizeOptions={[10, 25, 50, 100]}
        extraFilters={
          <>
            <FilterSelect
              value={filters.status}
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
      <PurchaseOrderDetailModal
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
        onViewPdf={() => drawerData?.poId && handleDrawerPdf(drawerData.poId)}
        onDownload={() =>
          drawerData &&
          company &&
          generatePurchaseOrderPDF(drawerData, company, "save")
        }
        onClosePdf={() => {
          if (drawerPdfUrl?.startsWith("blob:"))
            URL.revokeObjectURL(drawerPdfUrl);
          setDrawerPdfUrl(null);
        }}
      />

      <PdfPreviewModal
        open={pdfOpen}
        title="Purchase Order Preview"
        pdfUrl={pdfUrl}
        onClose={() => {
          if (pdfUrl?.startsWith("blob:")) URL.revokeObjectURL(pdfUrl);
          setPdfUrl(null);
          setPdfOpen(false);
        }}
        onDownload={() => {
          if (selectedOrder && company) {
            generatePurchaseOrderPDF(selectedOrder, company, "save");
          }
        }}
      />

      <SendEmailModal
        open={emailModalOpen}
        docType="Purchase Order"
        invoiceNumber={emailPurchaseOrder?.id}
        contactEmail={emailContactEmail}
        supplierName={emailPurchaseOrder?.supplier}
        invoiceAttachments={emailPurchaseOrderAttachments}
        onClose={() => {
          setEmailModalOpen(false);
          setEmailPurchaseOrder(null);
          setEmailContactEmail(null);
          setEmailPurchaseOrderAttachments([]);
        }}
      />

      {viewModalOpen && selectedOrder && (
        <PurchaseOrderView
          poData={selectedOrder as any}
          onClose={() => setViewModalOpen(false)}
          onEdit={() => {
            setViewModalOpen(false);
            setModalOpen(true);
          }}
        />
      )}
    </div>
  );
};

export default PurchaseOrdersTable;
