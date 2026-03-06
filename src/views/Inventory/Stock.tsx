/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import React, { useEffect, useState } from "react";
import {
  showApiError,
  showSuccess,
  showLoading,
  closeSwal,
} from "../../utils/alert";

import {
  getAllStockEntries,
  getStockById,
  deleteStockEntry,
} from "../../api/stockApi";

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
      const apiData = await getAllStockEntries(page, pageSize);

      // Map API data to ItemSummary[]
      const list = Array.isArray(apiData) ? apiData : apiData?.data || [];

      
const mapped = list.flatMap((entry: any) =>
  (entry.items || []).map((item: any) => ({
    id: entry.name || "",
    date: entry.posting_date || "",
    itemCode: item.item_code || "",
    qty: item.qty || 0,
    totalAmount: Number(item.custom_total_amount || 0),
  }))
);

setItems(mapped as any);


 

      setTotalItems(apiData?.totalItems ?? 0);
      setTotalPages(apiData?.totalPages ?? 1);
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
  }, [page, pageSize]);

  /*      HANDLERS
   */

  const handleAdd = () => {
    setEditItem(null);
    setShowModal(true);
  };

const handleEdit = async (stockId: string, e?: React.MouseEvent<Element>) => {
  e?.stopPropagation();

  try {
    const res = await getStockById(stockId);
    console.log("FULL RESPONSE:", res);

    const stockData =
      Array.isArray(res?.data?.data)
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

setItems((prev) =>
  prev.filter((i) => i.id !== itemToDelete.id)
);

setDeleteModalOpen(false);

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
    key: "id",
    header: "Stock ID",
    align: "left",
  },
  {
    key: "date",
    header: "Posting Date",
    align: "left",
    render: (i) =>
      i.date ? new Date(i.date).toLocaleDateString() : "—",
  },
  {
    key: "itemCode",
    header: "Item Code",
    align: "left",
  },
  {
    key: "qty",
    header: "Qty",
    align: "right",
  },
{
  key: "totalAmount",
  header: "Total Amount",
  align: "right",
  render: (i) => (
    <code className="text-xs px-2 py-1 rounded bg-row-hover text-main">
      INR {i.totalAmount.toLocaleString()}
    </code>
  ),
},
  {
  key: "actions",
  header: "Actions",
  align: "center",
  render: (i) => (
    <ActionGroup>
      {/* View Button Direct */}
      <ActionButton
        type="view"
        onClick={(e) => handleEdit(i.id, e)}
        iconOnly
      />

      {/* Dropdown Menu */}
      <ActionMenu
        onEdit={() => {
          setEditItem(i);
          setShowModal(true);
        }}
        onDelete={(e) => handleDeleteClick(i, e)}
      />
    </ActionGroup>
  ),
}
];
  /*      RENDER
   */

  return (
    <div className="p-8">
      <Table
        loading={loading || initialLoad}
      
        columns={columns}
        data={items}
        enableColumnSelector
        showToolbar
        searchValue={searchTerm}
        onSearch={setSearchTerm}
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
          setPage(1); // reset page
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
