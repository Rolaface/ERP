
import React, { useEffect, useState } from "react";
import {
  showApiError,
  showSuccess,
  showLoading,
  closeSwal,
} from "../../utils/alert";

import {
  getStockReport,
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

      const res = await getStockReport(page, pageSize, searchTerm);

      const list = res?.message?.data || [];

      const mapped = list.map((item: any) => ({
        id: item.item_code || "",
        itemCode: item.item_code || "",
        itemName: item.item_name || "",
        itemGroup: item.item_group || "",
        uom: item.stock_uom || "",

        // totals from top-level
        openingQty: item.total_opening_qty ?? 0,
        openingValue: Number(item.total_opening_value ?? 0),
        inQty: item.total_in_qty ?? 0,
        inValue: Number(item.total_in_value ?? 0),
        outQty: item.total_out_qty ?? 0,
        outValue: Number(item.total_out_value ?? 0),
        balQty: item.total_bal_qty ?? 0,
        balValue: Number(item.total_bal_val ?? 0),
        buyValue: Number(item.total_buy_value ?? 0),
        sellValue: Number(item.total_sell_value ?? 0),

        // from first batch
        warehouse: item.batches?.[0]?.warehouse || "",
        valuationRate: Number(item.batches?.[0]?.valuation_rate ?? 0),
        batchNo: item.batches?.[0]?.batch_no || "-",
        expiryDate: item.batches?.[0]?.expiry_date || null,
        manufacturingDate: item.batches?.[0]?.manufacturing_date || null,

        // raw batches for view modal
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
    key: "itemCode",
    header: "Item Code",
    align: "left",
  },
  {
    key: "itemName",
    header: "Item Name",
    align: "left",
  },
  {
    key: "itemGroup",
    header: "Item Group",
    align: "left",
  },

  {
    key: "openingQty",
    header: "Opening Qty",
    align: "right",
  },
  {
    key: "openingValue",
    header: "Opening Value",
    align: "right",
    render: (i) => `INR ${i.openingValue.toLocaleString()}`,
  },
  {
    key: "inQty",
    header: "In Qty",
    align: "right",
  },
  {
    key: "inValue",
    header: "In Value",
    align: "right",
    render: (i) => `INR ${i.inValue.toLocaleString()}`,
  },
  {
    key: "outQty",
    header: "Out Qty",
    align: "right",
  },
  {
    key: "outValue",
    header: "Out Value",
    align: "right",
    render: (i) => `INR ${i.outValue.toLocaleString()}`,
  },
  {
    key: "balQty",
    header: "Balance Qty",
    align: "right",
  },
  {
    key: "balValue",
    header: "Balance Value",
    align: "right",
    render: (i) => `INR ${i.balValue.toLocaleString()}`,
  },
  {
    key: "buyValue",
    header: "Buy Value",
    align: "right",
    render: (i) => `INR ${i.buyValue.toLocaleString()}`,
  },
  {
    key: "sellValue",
    header: "Sell Value",
    align: "right",
    render: (i) => `INR ${i.sellValue.toLocaleString()}`,
  },
    {
      key: "actions",
      header: "Actions",
      align: "center",
      render: (i) => (
        <ActionGroup>
          <ActionButton
            type="view"
            onClick={(e) => handleEdit(i.id, e)}
            iconOnly
          />
          <ActionMenu
            onEdit={() => {
              setEditItem(i);
              setShowModal(true);
            }}
            onDelete={(e) => handleDeleteClick(i, e)}
          />
        </ActionGroup>
      ),
    },
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