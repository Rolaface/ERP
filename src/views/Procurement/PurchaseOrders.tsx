import React, { useState, useEffect } from "react";
import PurchaseOrderModal from "../../components/procurement/PurchaseOrderModal";
import PurchaseOrderView from "../../views/Procurement/purchaseorderview";
import Table from "../../components/ui/Table/Table";
import StatusBadge from "../../components/ui/Table/StatusBadge";
import ActionButton, {
  ActionGroup,
  ActionMenu,
} from "../../components/ui/Table/ActionButton";
import { FilterSelect } from "../../components/ui/modal/modalComponent";
import type { Column } from "../../components/ui/Table/type";
import {
  showApiError,
  showSuccess,
  showLoading,
  closeSwal,
} from "../../utils/alert";
import {
  getPurchaseOrders,
  updatePurchaseOrderStatus,
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
import PurchaseOrderDetailModal, {
  type PurchaseOrderDetail,
} from "../../components/procurement/purchaseorder/PurchaseOrderDetailsModal";
import PaymentEntryModal from "../PaymentEntry/PaymentEntryModal";
import Tooltip from "../../components/Tooltip";

interface PurchaseOrder {
  id: string;
  supplier: string;
  date: string;
  amount: number;
  status: string;
   supplierId: string;  
  deliveryDate: string;
  referenceNumber: string;
}

interface PurchaseOrdersTableProps {
  onAdd?: () => void;
}

type POStatus = "Draft" | "Approved" |  "Cancelled" | "Completed";

const STATUS_TRANSITIONS: Record<POStatus, POStatus[]> = {
  Draft: ["Approved"],
  Approved: ["Cancelled", "Completed"],
  Cancelled: [],
  Completed: [],
};

const CRITICAL_STATUSES: POStatus[] = ["Completed"];

const statusOptions = [
  { label: "Draft", value: "Draft" },
  { label: "Approved", value: "Approved" },
  { label: "Cancelled", value: "Cancelled" },
  { label: "Completed", value: "Completed" },
];

const PurchaseOrdersTable: React.FC<PurchaseOrdersTableProps> = ({ onAdd }) => {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [filters, setFilters] = useState<PurchaseOrderFilters>({});
  const [company, setCompany] = useState<any | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
const [selectedPOForPayment, setSelectedPOForPayment] = useState<any | null>(null);

  // ── PDF preview modal (kept — do not remove)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfOpen, setPdfOpen] = useState(false);

  // ── Drawer (same pattern as ProformaInvoicesTable)
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerData, setDrawerData] = useState<PurchaseOrderDetail | null>(
    null,
  );
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [drawerPdfUrl, setDrawerPdfUrl] = useState<string | null>(null);
  const [drawerPdfLoading, setDrawerPdfLoading] = useState(false);

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
        supplier: po.supplierName,
        date: po.poDate,
        supplierId: po.supplierId ?? po.partyId ?? po.supplier_id,
        deliveryDate: po.deliveryDate || po.items?.[0]?.requiredBy || "",
        amount: po.grandTotal,
        status: po.status,
        referenceNumber: po.referenceNumber,
      }));

      setOrders(mappedOrders);
    } catch (err) {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, pageSize, filters]);

  const handleMakePayment = (order: PurchaseOrder) => {
  if (order.status !== "Approved") {
    showApiError("Only Approved purchase orders can have payments");
    return;
  }

  setSelectedPOForPayment(order);
  setPaymentModalOpen(true);
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
    setSelectedOrder(null);
    setModalOpen(true);
    onAdd?.();
  };

  const handleEdit = (order: PurchaseOrder, e: React.MouseEvent) => {
    e.stopPropagation();

    if (order.status !== "Draft") {
      showApiError("Only Draft purchase orders can be edited");
      return;
    }

    setSelectedOrder(order);
    setModalOpen(true);
  };

  const handleDelete = (order: PurchaseOrder, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Delete Purchase Order "${order.id}"?`)) {
    }
  };

  const handleCloseModal = () => setModalOpen(false);
  const handlePOSaved = async () => {
    await fetchOrders();
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
            supplier: po.supplierName,
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

      if (!dataToExport.length) {
        closeSwal();
        showApiError("No purchase orders to export");
        return;
      }

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
        head: [
          [
            "SN",
            "PO ID",
            "Supplier",
            "Date",
            "Delivery Date",
            "Amount",
            "Status",
          ],
        ],
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

  // ── Columns
  const columns: Column<PurchaseOrder>[] = [
    {
  key: "id",
  header: "PO ID",
  align: "left",
  render: (o) => (
    <Tooltip content={o.id}>
      <span className="truncate max-w-[120px] block">
        {o.id || "—"}
      </span>
    </Tooltip>
  ),
},
    {
  key: "referenceNumber",
  header: "Reference Code",
  align: "left",
  render: (o) => (
    <Tooltip content={o.referenceNumber}>
      <span className="truncate max-w-[140px] block">
        {o.referenceNumber || "—"}
      </span>
    </Tooltip>
  ),
},
   {
  key: "supplier",
  header: "Supplier",
  align: "left",
  render: (o) => (
    <Tooltip content={o.supplier}>
      <span className="truncate max-w-[160px] block">
        {o.supplier || "—"}
      </span>
    </Tooltip>
  ),
},
  {
  key: "date",
  header: "Date",
  align: "left",
  render: (o) => (
    <Tooltip content={o.date}>
      <span>{o.date || "—"}</span>
    </Tooltip>
  ),
},
    {
      key: "amount",
      header: "Amount",
      align: "right",
      render: (o) => (
        <Tooltip content={Number(o.amount || 0).toFixed(2)}>
          <code className="text-xs px-2 py-1 rounded bg-row-hover text-main">
            {Number(o.amount || 0).toFixed(2)}
          </code>
        </Tooltip>
      ),
    },
    {
      key: "status",
      header: "Status",
      align: "left",
      render: (o) => <StatusBadge status={o.status} />,
    },
   {
  key: "deliveryDate",
  header: "Delivery Date",
  align: "left",
  render: (o) => (
    <Tooltip content={o.deliveryDate}>
      <span>{o.deliveryDate || "—"}</span>
    </Tooltip>
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

          <ActionButton
            type="edit"
            onClick={(e) => handleEdit(o, e)}
            iconOnly
            disabled={o.status !== "Draft"}
            title={
              o.status !== "Draft"
                ? "Only Draft purchase orders can be edited"
                : "Edit Purchase Order"
            }
          />
          <ActionMenu
            onDelete={(e) => handleDelete(o, e as any)}
            customActions={[
              {
                label: "View PDF",
                onClick: () => handlePreviewPDF(o),
              },
              ...(o.status === "Approved"
    ? [
        {
          label: "Make Advance Payment",
          onClick: () => handleMakePayment(o),
        },
      ]
    : []),
              ...(STATUS_TRANSITIONS[o.status as POStatus] ?? []).map(
                (status) => ({
                  label: `Mark as ${status}`,
                  danger: status === "Completed",
                  onClick: () => handleStatusChange(o.id, status),
                }),
              ),
            ]}
          />
        </ActionGroup>
      ),
    },
  ];

  return (
    <div className="p-6">
      <Table
        columns={columns}
        data={orders}
        showToolbar
        loading={loading}
        searchValue={searchTerm}
        enableExport
        onExport={handleExportPDF}
        onSearch={setSearchTerm}
        enableAdd
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


      <PurchaseOrderModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        poId={selectedOrder?.id}
        onSubmit={handlePOSaved}
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
        onViewPdf={() => drawerData && handleDrawerPdf(drawerData.poId)}
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

      {/* ── View modal — kept, do not remove ── */}
      {viewModalOpen && selectedOrder && (
        <PurchaseOrderView
          poData={selectedOrder}
          onClose={() => setViewModalOpen(false)}
          onEdit={() => {
            setViewModalOpen(false);
            setModalOpen(true);
          }}
        />
      )}
<PaymentEntryModal
  isOpen={paymentModalOpen}
  onClose={() => {
    setPaymentModalOpen(false);
    setSelectedPOForPayment(null);
  }}
  defaultValues={{
    paymentType: "Pay",
    partyType: "Supplier",
    partyName: selectedPOForPayment?.supplier,   // display name for UI
    partyId: selectedPOForPayment?.supplierId,   // ← actual ID for API (add this field to your PurchaseOrder interface)
    amount: selectedPOForPayment?.amount,        // ← pre-fill amount
    referenceInvoice: selectedPOForPayment?.id,
  }}
/>
    </div>
  );
};

export default PurchaseOrdersTable;
