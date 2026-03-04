import React, { useState, useEffect } from "react";
import PurchaseOrderModal from "../../components/procurement/PurchaseOrderModal";
import toast from "react-hot-toast";
import PurchaseOrderView from "../../views/Procurement/purchaseorderview";

// Shared UI Table Components
import Table from "../../components/ui/Table/Table";
import ActionButton, {
  ActionGroup,
} from "../../components/ui/Table/ActionButton";
import type { Column } from "../../components/ui/Table/type";
import {
  showApiError,
  showSuccess,
  showLoading,
  closeSwal,
} from "../../utils/alert";
import {
  deletePurchaseOrder,
  getPurchaseOrders,
} from "../../api/procurement/PurchaseOrderApi";
import { getUserFriendlyErrorMessage } from "../../utils/alert";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { getPurchaseOrderById } from "../../api/procurement/PurchaseOrderApi";
import type { PurchaseOrderFilters } from "../../api/procurement/PurchaseOrderApi";
import DateRangeFilter from "../../components/ui/modal/DateRangeFilter";

interface PurchaseOrder {
  id: string;
  supplier: string;
  date: string;
  amount: number;
  deliveryDate: string;
}

interface PurchaseOrdersTableProps {
  onAdd?: () => void;
}

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
        deliveryDate: po.deliveryDate,
        amount: po.grandTotal,
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
      // SweetAlert Loader
      showLoading("Loading Purchase Order...");

      const res = await getPurchaseOrderById(order.id);

      if (res.status !== "success") {
        throw new Error(res.message || "Failed to load");
      }

      // Data set
      setSelectedOrder(res.data);

      // Close loader → open modal
      closeSwal();
      setViewModalOpen(true);
    } catch (error) {
      closeSwal();
      showApiError(error);
    }
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
    toast.dismiss();
    toast(
      (t) => (
        <div className="bg-card border border-[var(--border)] rounded-xl shadow-xl p-4 w-[320px]">
          <div className="text-sm font-semibold text-main">
            Delete Purchase Order
          </div>
          <div className="text-xs text-muted mt-1">
            Are you sure you want to delete "{order.id}"?
          </div>
          <div className="flex items-center justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={() => toast.dismiss(t.id)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-[var(--border)] text-main hover:bg-row-hover"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                (async () => {
                  try {
                    toast.dismiss(t.id);
                    const res = await deletePurchaseOrder(order.id);

                    if (
                      !res ||
                      res.status_code !== 200 ||
                      res.status !== "success"
                    ) {
                      toast.error(getUserFriendlyErrorMessage(res));
                      return;
                    }

                    toast.success(res.message || "Purchase Order deleted");
                    await fetchOrders();
                  } catch (err) {
                    toast.error(getUserFriendlyErrorMessage(err));
                  }
                })();
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500 text-white hover:bg-red-600"
            >
              Delete
            </button>
          </div>
        </div>
      ),
      { duration: Infinity },
    );
  };

  const handleCloseModal = () => setModalOpen(false);
  const handlePOSaved = async () => {
    await fetchOrders(); //  Refresh table
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

  const handleExportExcel = async () => {
    try {
      showLoading("Exporting Purchase Orders...");

      const dataToExport = await fetchAllPOsForExport();

      if (!dataToExport.length) {
        closeSwal();
        showApiError("No purchase orders to export");
        return;
      }

      const formattedData = dataToExport.map((po) => ({
        "PO ID": po.id,
        Supplier: po.supplier,
        Date: po.date,
        "Delivery Date": po.deliveryDate,
        Amount: po.amount,
      }));

      const worksheet = XLSX.utils.json_to_sheet(formattedData);
      const workbook = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(workbook, worksheet, "Purchase Orders");

      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });

      const fileData = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      saveAs(fileData, "All_Purchase_Orders.xlsx");

      closeSwal();
      showSuccess("Export completed successfully");
    } catch (error) {
      closeSwal();
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
          ZMW {Number(o.amount || 0).toFixed(2)}
        </code>
      ),
    },

    { key: "deliveryDate", header: "Delivery Date", align: "left" },

    {
      key: "actions",
      header: "Actions",
      align: "center",
      render: (o) => (
        <ActionGroup>
          <ActionButton type="view" onClick={() => handleView(o)} iconOnly />

          <ActionButton
            type="edit"
            onClick={(e) => handleEdit(o, e as any)}
            iconOnly
          />

          <ActionButton
            type="delete"
            onClick={(e) => handleDelete(o, e as any)}
            iconOnly
            variant="danger"
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
        onExport={handleExportExcel}
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
    </div>
  );
};

export default PurchaseOrdersTable;
