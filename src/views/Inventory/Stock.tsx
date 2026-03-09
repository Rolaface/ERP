
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
import { ChevronRight, ChevronDown } from "lucide-react";
import StockModal from "../../components/inventory/stock/Stockcorrectionmodal";
import ViewStockModal from "../../components/inventory/ViewStockModal";
import DeleteModal from "../../components/actionModal/DeleteModal";
import Table from "../../components/ui/Table/Table";

import ActionButton, {
  ActionGroup,
  ActionMenu,
} from "../../components/ui/Table/ActionButton";
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
  const [showViewModal, setShowViewModal] = useState(false);
  const [editItem, setEditItem] = useState<Item | null>(null);
  const [viewStockData, setViewStockData] = useState<any>(null);
  const [initialLoad, setInitialLoad] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ItemSummary | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  /*      HANDLERS
   */

  const handleAdd = () => {
    setEditItem(null);
    setShowModal(true);
  };

const toggleRow = (id: string) => {
  setExpandedRows((prev) => ({
    [id]: !prev[id],
  }));
};

  const handleEdit = async (stockId: string, e?: React.MouseEvent<Element>) => {
    e?.stopPropagation();

    try {
      const res = await getStockById(stockId);
      console.log("FULL RESPONSE:", res);

      const stockData = Array.isArray(res?.data?.data)
        ? res.data.data[0]
        : null;

      if (!stockData) {
        showApiError("Invalid stock data");
        return;
      }

      setViewStockData(stockData);
      setShowViewModal(true);
    } catch (err) {
      console.error(err);
      showApiError("Unable to fetch stock entry details");
    }
  };

  const handleDeleteClick = (
    item: ItemSummary,
    e?: React.MouseEvent<Element>,
  ) => {
    e?.stopPropagation();
    setItemToDelete(item);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      setDeleting(true);
      showLoading("Deleting Stock Entry...");

      const res = await deleteStockEntry({
        stock_entry_id: itemToDelete.id,
      });

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

  /*      COLUMNS
   */

const columns: Column<any>[] = [
{
  key: "expand",
  header: "",
  align: "center",
  render: (row) => {
    if (row.isBatchRow) return null;

    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleRow(row.id);
        }}
        className="flex items-center justify-center"
      >
        {expandedRows[row.id] ? (
          <ChevronDown size={18} />
        ) : (
          <ChevronRight size={18} />
        )}
      </button>
    );
  },
},

{
  key: "itemCode",
  header: "Item Code",
  render: (row) => {
    if (row.isBatchRow) {
      return (
        <div className="px-4 py-2">
          <BatchTable batches={row.batches || []} />
        </div>
      );
    }

    return row.itemCode;
  },
},
{
  key: "itemName",
  header: "Item Name",
  render: (row) => (row.isBatchRow ? null : row.itemName),
},
{
  key: "description",
  header: "Description",
  render: (row) => (row.isBatchRow ? null : row.description),
},
{
  key: "packingUnit",
  header: "Packing Unit",
  render: (row) => {
    if (row.isBatchRow) return null;

    const unit = row.packingUnit ?? "-";
    const size = row.packingSize ?? "-";

    return `${unit} × ${size}`;
  },
},
{
  key: "totalQty",
  header: "Qty",
  align: "right",
  render: (row) => (row.isBatchRow ? null : row.totalQty),
},
{
  key: "totalBuyValue",
  header: "Total Buy Value",
  align: "right",
  render: (row) =>
    row.isBatchRow
      ? null
      : `INR ${row.totalBuyValue.toLocaleString()}`,
},
{
  key: "totalSellValue",
  header: "Total Sell Value",
  align: "right",
  render: (row) =>
    row.isBatchRow
      ? null
      : `INR ${row.totalSellValue.toLocaleString()}`,
},
];

  /*      RENDER
   */

  return (
    <div className="p-8">
      <Table
        loading={loading || initialLoad}
       columns={columns}
    data={items.flatMap((item) => {
  const rows: any[] = [item];

  if (expandedRows[item.id]) {
    rows.push({
  id: `${item.id}-batch`,
  isBatchRow: true,
  batches: item.batches,
  itemCode: "",
});
  }

  return rows;
})}
        enableColumnSelector
        showToolbar
        searchValue={searchTerm}
        onSearch={(value) => {
  setSearchTerm(value);
  setPage(1);
}}
        enableAdd
        addLabel="Stock Correction"
        onAdd={handleAdd}
        currentPage={page}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={totalItems}
        pageSizeOptions={[10, 25, 50, 100]}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
        onPageChange={setPage}
      />

      {/* VIEW STOCK MODAL */}
      <ViewStockModal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setViewStockData(null);
        }}
        stockData={viewStockData}
      />

      {/* STOCK MODAL (for creating stock entries) */}
      <StockModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditItem(null);
        }}
        onSubmit={handleSaved}
        initialData={editItem}
        isEditMode={!!editItem}
      />

      {/* DELETE MODAL */}
      {deleteModalOpen && itemToDelete && (
        <DeleteModal
          entityName="Stock Item"
          entityId={itemToDelete.id}
          entityDisplayName={itemToDelete.id}
          isLoading={deleting}
          onClose={() => {
            setDeleteModalOpen(false);
            setItemToDelete(null);
          }}
          onDelete={confirmDelete}
        />
      )}
    </div>
  );
};

export default Items;