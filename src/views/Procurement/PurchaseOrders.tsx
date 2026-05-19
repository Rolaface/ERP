import React, { useState, useEffect, useCallback, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import PurchaseOrderView from "../../views/Procurement/purchaseorderview";
import Table from "../../components/ui/Table/Table";
import { fireManagedSwal } from "../../utils/swalManager";
import ActionButton, {
  ActionGroup,
  ActionMenu,
} from "../../components/ui/Table/ActionButton";
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
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getPurchaseOrderById } from "../../api/procurement/PurchaseOrderApi";
import type { PurchaseOrderFilters } from "../../api/procurement/PurchaseOrderApi";
import DateRangeFilter from "../../components/ui/modal/DateRangeFilter";
import { generatePurchaseOrderPDF } from "../../components/template/purchaseordertemplete";
import { getCompanyById } from "../../api/companySetupApi";
const COMPANY_ID = import.meta.env.VITE_COMPANY_ID;
import PdfPreviewModal from ".././Sales/PdfPreviewModal";
import { REFRESH_KEYS, useDataRefreshStore } from "../../store/dataRefreshStore";
import PermissionGate from "../PermissionGate";
import { usePermission } from "../../hooks/permission/usePermission";
import SendEmailModal from "../../components/common/SendEmailModal";
import PurchaseOrderDetailModal from "../../components/procurement/purchaseorder/PurchaseOrderDetailsModal";

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Component ────────────────────────────────────────────────────────────────

const PurchaseOrdersTable: React.FC<PurchaseOrdersTableProps> = ({ onAdd }) => {
  const { openPOEdit } = useOutletContext<OutletContextType>();
  const { can } = usePermission();
  const mountedRef = useRef(true);

  const subscribeToRefresh = useDataRefreshStore((s) => s.subscribeToRefresh);

  // ── Data state — split loading so page changes don't flash skeleton
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  // ── Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // ── Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<PurchaseOrderFilters>({});

  // ── Company
  const [company, setCompany] = useState<any | null>(null);

  //email
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailPurchaseOrder, setEmailPurchaseOrder] = useState<PurchaseOrder | null>(null);
  const [emailContactEmail, setEmailContactEmail] = useState<string | null>(null);
  const [emailPurchaseOrderAttachments, setEmailPurchaseOrderAttachments] = useState<
    { name: string; file_name: string }[]
  >([]);

  // ── PDF preview modal (kept — do not remove)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfOpen, setPdfOpen] = useState(false);

  // ── Drawer (same pattern as ProformaInvoicesTable)
  // ── Detail modal (drawer)
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrderDetail | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerData, setDrawerData] = useState<PurchaseOrderDetail | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [drawerPdfUrl, setDrawerPdfUrl] = useState<string | null>(null);
  const [drawerPdfLoading, setDrawerPdfLoading] = useState(false);

  // ── Unused modal state (kept — do not remove)
  const [viewModalOpen, setViewModalOpen] = useState(false);

  // ── Debounced search → filters
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchTerm || undefined }));
      setPage(1);
    }, 600);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // ── Load company once
  useEffect(() => {
    getCompanyById(COMPANY_ID)
      .then((res) => {
        if (res?.status_code === 200) setCompany(res.data);
      })
      .catch(() => console.error("Failed to load company"));
  }, []);

  // ── Fetch orders — memoized with useCallback
  const fetchOrders = useCallback(async () => {
    if (!mountedRef.current) return;
    setIsFetching(true);

    try {
      const res = await getPurchaseOrders(page, pageSize, filters);

      if (!mountedRef.current) return;

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
      if (mountedRef.current) {
        setIsFetching(false);
        setIsInitialLoad(false);
      }
    }
  }, [page, pageSize, filters]);

  // Initial fetch
  useEffect(() => {
    mountedRef.current = true;
    fetchOrders();
    return () => { mountedRef.current = false; };
  }, []);

  // Refetch on dependency change (skip initial)
  useEffect(() => {
    if (isInitialLoad) return;
    fetchOrders();
  }, [page, pageSize, filters]);

  // Auto-refresh on external events
  useEffect(() => {
    const unsubscribe = subscribeToRefresh(REFRESH_KEYS.PURCHASE_ORDER_LIST, () => {
      fetchOrders();
    });
    return unsubscribe;
  }, [subscribeToRefresh, fetchOrders]);

  // ── Helpers
  const formatDate = (date: string | Date) => {
    if (!date) return "—";
    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    if (typeof date === "string") {
      const [year, month, day] = date.split("T")[0].split("-").map(Number);
      return `${String(day).padStart(2, "0")}-${months[month - 1]}-${year}`;
    }
    return `${String(date.getDate()).padStart(2, "0")}-${months[date.getMonth()]}-${date.getFullYear()}`;
  };

  // ── Action handlers
  const handleAddClick = () => openPOEdit(0);

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

      if (res.status < 200 || res.status >= 300) throw new Error("Delete failed");

      closeSwal();
      showSuccess("Purchase Order deleted successfully");
      await fetchOrders();
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
      if (res?.status === "success") setDrawerData(res.data as PurchaseOrderDetail);
    } finally {
      setDrawerLoading(false);
    }
  };

  const handlePreviewPDF = async (order: PurchaseOrder, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      showLoading("Generating PDF...");
      if (!company) { closeSwal(); showApiError("Company data not loaded"); return; }

      const res = await getPurchaseOrderById(order.id);
      if (!res || res.status !== "success") {
        closeSwal();
        showApiError(res?.message || "Failed to load purchase order");
        return;
      }

      const blobUrl = await generatePurchaseOrderPDF(res.data, company, "bloburl");
      closeSwal();
      setSelectedOrder(res.data);
      setPdfUrl(blobUrl);
      setPdfOpen(true);
    } catch (error) {
      closeSwal();
      showApiError(error);
    }
  };

  const handleDrawerPdf = async (poId: string) => {
    setDrawerPdfLoading(true);
    setDrawerPdfUrl(null);
    try {
      if (!company) return;
      const res = await getPurchaseOrderById(poId);
      if (!res || res.status !== "success") return;
      const blobUrl = await generatePurchaseOrderPDF(res.data, company, "bloburl");
      setDrawerPdfUrl(blobUrl);
    } catch (err) {
      showApiError(err);
    } finally {
      setDrawerPdfLoading(false);
    }
  };

  const handleMakePayment = async (order: PurchaseOrder) => {
    if (order.status !== "Approved") {
      showApiError("Only Approved purchase orders can have payments");
      return;
    }
    try {
      showLoading("Opening payment...");
      const res = await getPurchaseOrderById(order.id);
      closeSwal();

      if (!res || res.status !== "success") { showApiError("Failed to load purchase order"); return; }

      const data = res.data ?? {};
      openPaymentEntryModal(
        {
          paymentType: "Pay",
          partyType: "Supplier",
          partyName: data.supplierName || data.supplier_name || data.partyName || order.supplier,
          partyId: data.supplierId ?? data.partyId ?? data.supplier_id ?? order.supplierId,
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
      if (!res || res.status_code !== 201) throw new Error("Failed to create invoice");
      closeSwal();
      showSuccess("Purchase Invoice created successfully");
      fetchOrders();
    } catch (err: any) {
      closeSwal();
      showApiError(err);
    }
  };

  const handleStatusChange = async (poId: string, newStatus: POStatus) => {
    try {
      const res = await updatePurchaseOrderStatus(poId, newStatus);
      if (!res || res.status_code !== 200) { showApiError(res); return; }

      setOrders((prev) =>
        prev.map((o) => (o.id === poId ? { ...o, status: res.data?.status || newStatus } : o)),
      );
      showSuccess(res.message || `Purchase Order marked as ${newStatus}`);
    } catch (error: any) {
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

  const handleExportPDF = async () => {
    try {
      showLoading("Generating PDF...");
      const dataToExport = await fetchAllPOsForExport();
      if (!dataToExport.length) { closeSwal(); showApiError("No purchase orders to export"); return; }

      const doc = new jsPDF("p", "mm", "a4");
      doc.setFontSize(14);
      doc.text("Purchase Orders Report", 14, 15);

      const tableData = dataToExport.map((po, index) => [
        index + 1,
        po.id,
        po.supplier,
        po.referenceNumber || "-",
        po.date,
        po.deliveryDate,
        `INR ${Number(po.amount || 0).toFixed(2)}`,
        po.status,
      ]);

      autoTable(doc, {
        startY: 22,
        head: [["SN", "PO ID", "Supplier", "Date", "Delivery Date", "Amount", "Status"]],
        body: tableData,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] },
      });

      doc.save("Purchase_Orders_Report.pdf");
      closeSwal();
      showSuccess("PDF exported successfully");
    } catch (error) {
      closeSwal();
      showApiError(error);
    }
  };

  // ── Columns — styled to match CustomerManagement
  const columns: Column<PurchaseOrder>[] = [
    {
      key: "id",
      header: "PO ID",
      align: "left",
      render: (o) => (
        <span className="font-medium whitespace-nowrap">{o.id ?? "—"}</span>
      ),
    },
    {
      key: "supplier",
      header: "Supplier",
      align: "left",
      render: (o) => (
        <span className="font-medium block">{o.supplier ?? "—"}</span>
      ),
      tooltip: (o) => o.supplier,
    },
    {
      key: "date",
      header: "Date",
      align: "left",
      render: (o) => (
        <span className="text-muted whitespace-nowrap">
          {o.date ? formatDate(o.date) : "—"}
        </span>
      ),
    },
    {
      key: "deliveryDate",
      header: "Required By",
      align: "left",
      render: (o) => (
        <span className="text-muted whitespace-nowrap">
          {o.deliveryDate ? formatDate(o.deliveryDate) : "—"}
        </span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      align: "center",
      render: (o) => (
        <code className="text-xs px-2 py-0.5 rounded bg-row-hover text-main whitespace-nowrap">
          {o.currency} {Number(o.amount || 0).toFixed(2)}
        </code>
      ),
    },
    {
      key: "status",
      header: "Status",
      align: "center",
      render: (o) => {
        const statusColors: Record<string, string> = {
          Draft: "bg-yellow-100 text-yellow-700",
          Approved: "bg-green-100 text-green-700",
          Cancelled: "bg-red-100 text-red-600",
          Completed: "bg-blue-100 text-blue-700",
        };
        return (
          <span
            className={`inline-flex items-center justify-center text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${
              statusColors[o.status] ?? "bg-gray-100 text-gray-600"
            }`}
          >
            {o.status}
          </span>
        );
      },
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

          <PermissionGate module={PO_MODULE} action="write">
            <ActionButton
              type="edit"
              onClick={(e) => handleEdit(o, e)}
              iconOnly
              disabled={o.status !== "Draft"}
              title={o.status !== "Draft" ? "Only Draft POs can be edited" : "Edit Purchase Order"}
            />
          </PermissionGate>

          <ActionMenu
            {...(can(PO_MODULE, "delete")
              ? { onDelete: (e) => handleDelete(o, e as any) }
              : {})}
            customActions={[
              { label: "View PDF", onClick: () => handlePreviewPDF(o) },

              {
                label: "Send Email",
                onClick: async () => {
                  setEmailPurchaseOrder(o);
                  setEmailContactEmail(null);
                  setEmailPurchaseOrderAttachments([]);
                  setEmailModalOpen(true);
                  try {
                    const res = await getPurchaseOrderById(o.id);
                    if (res?.status === "success") {
                      setEmailContactEmail(res.data?.contact_email ?? null);
                      setEmailPurchaseOrderAttachments(res.data?.attachments ?? []);
                    }
                  } catch {
                    // non-critical
                  }
                },
              },

              // Advance Payment — needs Payment Entry create + Approved status
              ...(can(PAYMENT_MODULE, "create") && o.status === "Approved"
                ? [{ label: "Make Advance Payment", onClick: () => handleMakePayment(o) }]
                : []),
              ...(can(PI_MODULE, "create") && o.status === "Approved"
                ? [{ label: "Make Purchase Invoice", onClick: () => handleCreateInvoiceFromPO(o) }]
                : []),
              ...(can(PO_MODULE, "write")
                ? (STATUS_TRANSITIONS[o.status as POStatus] ?? []).map((status) => ({
                    label: status === "Approved" ? "Approve" : status,
                    danger: status === "Completed",
                    onClick: () => handleStatusChange(o.id, status),
                  }))
                : []),
            ]}
          />
        </ActionGroup>
      ),
    },
  ];

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="h-full min-h-0">
      <Table
        columns={columns}
        tableId="purchase-orders"
        data={orders}
        rowKey={(r) => r.id}
        loading={isInitialLoad}
        isFetching={isFetching}
        showToolbar
        searchValue={searchTerm}
        onSearch={(q) => {
          setSearchTerm(q);
          setPage(1);
        }}
        enableAdd={can(PO_MODULE, "create")}
        addLabel="Add Purchase Order"
        onAdd={handleAddClick}
        enableColumnSelector
        enableExport={can(PO_MODULE, "export")}
        onExport={handleExportPDF}
        currentPage={page}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={totalItems}
        pageSizeOptions={[10, 25, 50, 100]}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
        extraFilters={
          <>
            <FilterSelect
              value={filters.status}
              options={statusOptions}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, status: e.target.value || undefined }));
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
        onDownload={() => drawerData && company && generatePurchaseOrderPDF(drawerData, company, "save")}
        onClosePdf={() => {
          if (drawerPdfUrl?.startsWith("blob:")) URL.revokeObjectURL(drawerPdfUrl);
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
          if (selectedOrder && company) generatePurchaseOrderPDF(selectedOrder, company, "save");
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
          }}
        />
      )}
    </div>
  );
};

export default PurchaseOrdersTable;