import React, { useState, useEffect } from "react";
import PurchaseOrderModal from "../../components/procurement/PurchaseOrderModal";
import toast from "react-hot-toast";
import PurchaseOrderView from "../../views/Procurement/purchaseorderview";

// Shared UI Table Components
import Table from "../../components/ui/Table/Table";
import StatusBadge from "../../components/ui/Table/StatusBadge";
import ActionButton, {
  ActionGroup,
  ActionMenu,
} from "../../components/ui/Table/ActionButton";
import { FilterSelect } from "../../components/ui/modal/modalComponent";
import type { Column } from "../../components/ui/Table/type";
import { showApiError, showSuccess, showLoading, closeSwal } from "../../utils/alert";
import { getPurchaseOrders, updatePurchaseOrderStatus } from "../../api/procurement/PurchaseOrderApi";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getPurchaseOrderById } from "../../api/procurement/PurchaseOrderApi";
import type { PurchaseOrderFilters } from "../../api/procurement/PurchaseOrderApi";
import DateRangeFilter from "../../components/ui/modal/DateRangeFilter";
import { generatePurchaseOrderPDF } from "../../components/template/purchasetOrderemplete";
import { getCompanyById } from "../../api/companySetupApi";
const COMPANY_ID = import.meta.env.VITE_COMPANY_ID;
import PdfPreviewModal from ".././Sales/PdfPreviewModal";
import PurchaseOrderDetailsModal from "../../components/procurement/purchaseorder/PurchaseOrderDetailsModal";
interface PurchaseOrder {
  id: string;
  supplier: string;
  date: string;
  amount: number;
  status: string;
  deliveryDate: string;
}

interface PurchaseOrdersTableProps {
  onAdd?: () => void;
}

type POStatus =
  | "Draft"
  | "Approved"
  | "Rejected"
  | "Cancelled"
  | "Completed";


const STATUS_TRANSITIONS: Record<POStatus, POStatus[]> = {
  Draft: ["Approved", "Rejected"],
  Approved: ["Cancelled", "Completed"],
  Rejected: [],
  Cancelled: [],
  Completed: [],
};

const CRITICAL_STATUSES: POStatus[] = ["Completed"];

const statusOptions = [
  { label: "Draft", value: "Draft" },
  { label: "Approved", value: "Approved" },
  { label: "Rejected", value: "Rejected" },
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
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfOpen, setPdfOpen] = useState(false);
  const [company, setCompany] = useState<any | null>(null);
  const [poDetailsOpen, setPoDetailsOpen] = useState(false);
  const [poDetailsId, setPoDetailsId] = useState<string | null>(null);
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
        if (res?.status_code === 200) {
          setCompany(res.data);
        }
      })
      .catch(() => console.error("Failed to load company"));
  }, []);
  //  FETCH ORDERS 
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
        deliveryDate:
          po.deliveryDate ||
          po.items?.[0]?.requiredBy ||
          "",
        amount: po.grandTotal,
        status: po.status,
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


  const handleView = async (order: PurchaseOrder) => {
    try {
      showLoading("Generating PDF...");

      const res = await getPurchaseOrderById(order.id);

      if (!res || res.status !== "success") {
        throw new Error(res?.message || "Failed to load invoice");
      }

      const purchaseInvoice = res.data;

      const blobUrl = await generatePurchaseOrderPDF(
        purchaseInvoice,
        company,
        "bloburl"
      );

      closeSwal();

      setSelectedOrder(purchaseInvoice);
      setPdfUrl(blobUrl);
      setPdfOpen(true);

    } catch (error) {
      closeSwal();
      showApiError(error);
    }
  };


  const handleViewClick = (poId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setPoDetailsId(poId);
    setPoDetailsOpen(true);
  };

  //  MODAL HANDLERS 
  const handleAddClick = () => {
    setSelectedOrder(null);
    setModalOpen(true);
    onAdd?.();
  };

  const handleEdit = (order: PurchaseOrder, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedOrder(order);
    setModalOpen(true);
  };

  const handleDelete = (order: PurchaseOrder, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Delete Purchase Order "${order.id}"?`)) {
      toast.success("Delete API ready — connect backend later");
    }
  };

  const handleCloseModal = () => setModalOpen(false);
  const handlePOSaved = async () => {
    await fetchOrders();   //  Refresh table
  };


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
        po.date,
        po.deliveryDate,
        `INR ${Number(po.amount || 0).toFixed(2)}`,
        po.status,
      ]);

      autoTable(doc, {
        startY: 22,
        head: [[
          "SN",
          "PO ID",
          "Supplier",
          "Date",
          "Delivery Date",
          "Amount",
          "Status",
        ]],
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



  const handleStatusChange = async (
    poId: string,
    newStatus: POStatus,
  ) => {
    try {
      const res = await updatePurchaseOrderStatus(
        poId,
        newStatus
      );


      if (!res || res.status_code !== 200) {
        showApiError(res);
        return;
      }


      setOrders((prev) =>
        prev.map((o) =>
          o.id === poId
            ? { ...o, status: res.data?.status || newStatus }
            : o,
        ),
      );


      showSuccess(
        res.message ||
        `Purchase Order marked as ${newStatus}`,
      );

    } catch (error: any) {
      showApiError(error);
    }
  };




  //  TABLE COLUMNS 
  const columns: Column<PurchaseOrder>[] = [
    { key: "id", header: "PO ID", align: "left" },
    { key: "supplier", header: "Supplier", align: "left" },
    { key: "date", header: "Date", align: "left" },

    {
      key: "amount",
      header: "Amount",
      align: "right",
      render: (o) => (
        <code className="text-xs px-2 py-1 rounded bg-row-hover text-main">
          INR {Number(o.amount || 0).toFixed(2)}
        </code>
      ),
    },

    {
      key: "status",
      header: "Status",
      align: "left",
      render: (o) => <StatusBadge status={o.status} />,
    },

    { key: "deliveryDate", header: "Delivery Date", align: "left" },

    {
      key: "actions",
      header: "Actions",
      align: "center",
      render: (o) => (
        <ActionGroup>
          <ActionButton
            type="view"
            onClick={(e) => handleViewClick(o.id, e)}
            iconOnly
          />

          <ActionMenu
            onDelete={(e) => handleDelete(o, e as any)}
            customActions={[
              {
                label: "View PDF",
                onClick: () => handleView(o),
              },

              ...(STATUS_TRANSITIONS[o.status as POStatus] ?? []).map((status) => ({
                label: `Mark as ${status}`,
                danger: status === "Completed",
                onClick: () => handleStatusChange(o.id, status),
              })),
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
                setFilters((prev) => ({
                  ...prev,
                  ...range,
                }));
                setPage(1);
              }}
            />
          </>
        }
      />

      {/* MODAL */}
      <PurchaseOrderModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        poId={selectedOrder?.poId}
        onSubmit={handlePOSaved}
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
      {/* VIEW MODAL */}
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

      <PurchaseOrderDetailsModal
        open={poDetailsOpen}
        poId={poDetailsId}
        onClose={() => {
          setPoDetailsOpen(false);
          setPoDetailsId(null);
        }}
        onViewPdf={(poId) => {
          const po = orders.find((o) => o.id === poId);
          if (po) {
            setPoDetailsOpen(false);
            handleView(po);
          }
        }}
      />
    </div>
  );
};

export default PurchaseOrdersTable;
