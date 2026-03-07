/* eslint-disable @typescript-eslint/no-misused-promises */

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

import StockModal from "../../components/inventory/StockModal";
import ViewStockModal from "../../components/inventory/ViewStockModal";
import DeleteModal from "../../components/actionModal/DeleteModal";

import Table from "../../components/ui/Table/Table";
import ActionButton, {
  ActionGroup,
  ActionMenu,
} from "../../components/ui/Table/ActionButton";

import type { Column } from "../../components/ui/Table/type";

import type { ItemSummary, Item } from "../../types/item";

const stockEntryTypeLabel: Record<string, string> = {
  "01": "Import",
  "02": "Purchase",
  "03": "Return",
  "04": "Stock Movement",
  "05": "Processing",
  "06": "Adjustment",
  "11": "Sale",
  "12": "Return",
  "13": "Stock Movement",
  "14": "Processing",
  "15": "Discarding",
  "16": "Adjustment",
};

const registrationTypeLabel: Record<string, string> = {
  A: "Automatic",
  M: "Manual",
};

const Items: React.FC = () => {
  const [items, setItems] = useState<ItemSummary[]>([]);
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

      const mapped = list.map((entry: any) => ({
        id: entry.id || entry.name || "",
        itemName: entry.item_name || "",
        itemGroup: entry.item_group || "",
        itemClassCode: entry.item_class_code || "",
        unitOfMeasureCd: entry.unit_of_measure_cd || "",
        sellingPrice: entry.selling_price || 0,
        preferredVendor: entry.preferred_vendor || "",
        minStockLevel: entry.min_stock_level || "",
        maxStockLevel: entry.max_stock_level || "",
        taxCategory: entry.tax_category || "",
        date: entry.date || entry.posting_date || "",
        orgSarNo:
          entry.orgSarNo ||
          entry.org_sar_no ||
          entry.org_sarNo ||
          entry.orgsarno ||
          "",
        registrationType:
          entry.registrationType ||
          entry.registration_type ||
          entry.registrationtype ||
          "",
        stockEntryType:
          entry.stockEntryType ||
          entry.stock_entry_type ||
          entry.stockentrytype ||
          "",
        totalTaxableAmount:
          entry.totalTaxableAmount ||
          entry.total_taxable_amount ||
          entry.totaltaxableamount ||
          0,
        warehouse: entry.warehouse || "",
      }));

      setItems(mapped);

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
      setViewStockData(res?.data || res);

      setShowViewModal(true);
    } catch {
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

      await deleteStockEntry({ id: itemToDelete.id });

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

  const columns: Column<ItemSummary>[] = [
    {
      key: "id",
      header: "Stock ID",
      align: "left",
      render: (i) => (
        <span className="whitespace-nowrap tabular-nums font-semibold text-main">
          {i.id}
        </span>
      ),
    },
    {
      key: "date",
      header: "Date",
      align: "left",
      render: (i) => (
        <span className="whitespace-nowrap text-xs text-muted">
          {i.date ? new Date(i.date).toLocaleDateString() : "—"}
        </span>
      ),
    },
    { key: "orgSarNo", header: "orgSarNo", align: "left" },
    {
      key: "registrationType",
      header: "Registration Type",
      align: "left",
      render: (i) =>
        registrationTypeLabel[String(i.registrationType ?? "")] ||
        i.registrationType,
    },
    {
      key: "stockEntryType",
      header: "Stock Entry Type",
      align: "left",
      render: (i) =>
        stockEntryTypeLabel[String(i.stockEntryType ?? "")] || i.stockEntryType,
    },
    {
      key: "totalTaxableAmount",
      header: "Total Taxable Amount",
      align: "right",
      render: (i) => (
        <code className="text-xs px-2 py-1 rounded bg-row-hover text-main">
          ZMW {Number(i.totalTaxableAmount || 0).toLocaleString()}
        </code>
      ),
    },

    { key: "warehouse", header: "Warehouse", align: "left" },
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
            onEdit={(e) => handleEdit(i.id, e)}
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
        serverSide
        columns={columns}
        data={items}
        enableColumnSelector
        showToolbar
        searchValue={searchTerm}
        onSearch={setSearchTerm}
        enableAdd
        addLabel="Add Stock Entry"
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
