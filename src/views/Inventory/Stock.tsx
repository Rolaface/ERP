import React, { useEffect, useState } from "react";
import {
  showApiError,
  showSuccess,
  showLoading,
  closeSwal,
} from "../../utils/alert";
import BatchTable from "./BatchTable";
import {
  getStockReport,
  getStockById,
  deleteStockEntry,
} from "../../api/stockApi";
import { ChevronRight, ChevronDown, Upload } from "lucide-react";
import StockModal      from "../../components/inventory/stock/Stockcorrectionmodal";
import BulkUploadModal from "../../components/inventory/stock/BulkUploadModal";
import ViewStockModal  from "../../components/inventory/ViewStockModal";
import DeleteModal     from "../../components/actionModal/DeleteModal";
import Table           from "../../components/ui/Table/Table";
import type { Column } from "../../components/ui/Table/type";
import type { ItemSummary, Item } from "../../types/item";

const Items: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const [showModal, setShowModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editItem, setEditItem] = useState<Item | null>(null);
  const [viewStockData, setViewStockData] = useState<any>(null);
  const [initialLoad, setInitialLoad] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ItemSummary | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ─── FETCH ──────────────────────────────────────────────────────────────────

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await getStockReport(page, pageSize, searchTerm);
      const list = res?.message?.data || [];

      const mapped = list.map((item: any) => ({
        id: item.item_code || "",
        itemCode: item.item_code || "",
        itemName: item.item_name || "",
        description: item.description ?? "-",
        packingUnit: item.packingUnit || "-",
        packingSize: item.packingSize || "-",
        totalQty: item.total_bal_qty ?? 0,
        totalBuyValue: Number(item.total_buy_value ?? 0),
        totalSellValue: Number(item.total_sell_value ?? 0),
        batches: item.batches || [],
      }));

      setItems(mapped);
      setTotalItems(res?.message?.pagination?.total_records ?? 0);
      setTotalPages(res?.message?.pagination?.total_pages ?? 1);
    } catch (err) {
      console.error(err);
      showApiError("Failed to load stock entries");
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [page, pageSize, searchTerm]);

  // ─── HANDLERS ───────────────────────────────────────────────────────────────

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleEdit = async (stockId: string, e?: React.MouseEvent<Element>) => {
    e?.stopPropagation();
    try {
      const res = await getStockById(stockId);
      const stockData = Array.isArray(res?.data?.data) ? res.data.data[0] : null;
      if (!stockData) { showApiError("Invalid stock data"); return; }
      setViewStockData(stockData);
      setShowViewModal(true);
    } catch (err) {
      console.error(err);
      showApiError("Unable to fetch stock entry details");
    }
  };

  const handleDeleteClick = (item: ItemSummary, e?: React.MouseEvent<Element>) => {
    e?.stopPropagation();
    setItemToDelete(item);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      setDeleting(true);
      showLoading("Deleting Stock Entry...");
      const res = await deleteStockEntry({ stock_entry_id: itemToDelete.id });
      if (res?.status_code !== 200 || res?.status !== "success") {
        closeSwal();
        showApiError(res?.message || "Delete failed");
        return;
      }
      closeSwal();
      showSuccess("Stock entry deleted successfully");
      setItems((prev) => prev.filter((i) => i.id !== itemToDelete.id));
      setDeleteModalOpen(false);
    } catch (error: any) {
      closeSwal();
      showApiError(error);
    } finally {
      setDeleting(false);
      setItemToDelete(null);
    }
  };

  const handleSaved = async () => {
    const wasEdit = !!editItem;
    setShowModal(false);
    setEditItem(null);
    try {
      await fetchItems();
      closeSwal();
      showSuccess(wasEdit ? "Stock entry updated" : "Stock entry created");
    } catch (err) {
      closeSwal();
      showApiError(err);
    }
  };

  const handleBulkSaved = async () => {
    setShowBulkModal(false);
    try {
      await fetchItems();
      closeSwal();
      showSuccess("Bulk stock corrections applied");
    } catch (err) {
      closeSwal();
      showApiError(err);
    }
  };

  // ─── COLUMNS ────────────────────────────────────────────────────────────────

  const columns: Column<any>[] = [
    {
      key: "expand",
      header: "",
      align: "center",
      render: (row) => (
        <span className="flex items-center justify-center w-7 h-7 rounded-md text-gray-400 transition-all duration-200">
          {expandedRows[row.id]
            ? <ChevronDown  size={16} strokeWidth={2.5} className="text-primary" />
            : <ChevronRight size={16} strokeWidth={2.5} />}
        </span>
      ),
    },
    {
      key: "itemCode",
      header: "Item Code",
      render: (row) => (
        <span className="font-mono text-xs font-medium text-main">
          {row.itemCode}
        </span>
      ),
    },
    {
      key: "itemName",
      header: "Item Name",
      render: (row) => row.itemName,
    },
    {
      key: "description",
      header: "Description",
      render: (row) => row.description,
    },
    {
      key: "packingUnit",
      header: "Packing Unit",
      render: (row) => `${row.packingUnit ?? "-"} × ${row.packingSize ?? "-"}`,
    },
    {
      key: "totalQty",
      header: "Qty",
      align: "right",
      render: (row) => row.totalQty,
    },
    {
      key: "totalBuyValue",
      header: "Total Buy Value",
      align: "right",
      render: (row) => `INR ${row.totalBuyValue.toLocaleString("en-IN")}`,
    },
    {
      key: "totalSellValue",
      header: "Total Sell Value",
      align: "right",
      render: (row) => `INR ${row.totalSellValue.toLocaleString("en-IN")}`,
    },
  ];

  // ─── RENDER ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-8">
      <Table
        loading={loading || initialLoad}
        columns={columns}
        data={items}
        onRowClick={(row) => toggleRow(row.id)}
        expandedRowRender={(row) =>
          expandedRows[row.id]
            ? <BatchTable batches={row.batches || []} />
            : null
        }
        enableColumnSelector
        showToolbar
        searchValue={searchTerm}
        onSearch={(value) => { setSearchTerm(value); setPage(1); }}
        extraFilters={
          <div className="flex items-center gap-2">
            {/* Bulk Upload — outlined */}
            <button
              onClick={() => setShowBulkModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap"
              style={{
                border: "1.5px solid var(--primary, #c97d2e)",
                color: "var(--primary, #c97d2e)",
                background: "transparent",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(201,125,46,0.06)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
            >
              <Upload size={12} />
              Bulk Upload
            </button>

            {/* Stock Correction — solid primary */}
            <button
              onClick={() => { setEditItem(null); setShowModal(true); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all whitespace-nowrap"
              style={{
                background: "var(--primary, #c97d2e)",
                color: "#fff",
                boxShadow: "0 4px 12px rgba(201,125,46,0.25)",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.9"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
            >
              Stock Correction
            </button>
          </div>
        }
        currentPage={page}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={totalItems}
        pageSizeOptions={[10, 25, 50, 100]}
        onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
        onPageChange={setPage}
      />

      <ViewStockModal
        isOpen={showViewModal}
        onClose={() => { setShowViewModal(false); setViewStockData(null); }}
        stockData={viewStockData}
      />

      {/* Manual stock correction */}
      <StockModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditItem(null); }}
        onSubmit={handleSaved}
        initialData={editItem}
        isEditMode={!!editItem}
      />

      {/* Bulk upload */}
      <BulkUploadModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        onSubmit={handleBulkSaved}
      />

      {deleteModalOpen && itemToDelete && (
        <DeleteModal
          entityName="Stock Item"
          entityId={itemToDelete.id}
          entityDisplayName={itemToDelete.id}
          isLoading={deleting}
          onClose={() => { setDeleteModalOpen(false); setItemToDelete(null); }}
          onDelete={confirmDelete}
        />
      )}
    </div>
  );
};

export default Items;