import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";

import { showApiError, showSuccess } from "../../utils/alert";
import { FilterSelect } from "../../components/ui/modal/modalComponent";
import {
  getAllItems,
  getItemByItemCode,
  deleteItemByItemCode,
} from "../../api/itemApi";
import { ItemFilters } from "../../api/itemApi";

import DeleteModal from "../../components/actionModal/DeleteModal";
import ItemDetailView, {
  type SalesInvoice,
  type PurchaseInvoice,
  type StockRow,
} from "../../views/Inventory/Itemdetailmodal";
import Table from "../../components/ui/Table/Table";
import ActionButton, {
  ActionGroup,
  ActionMenu,
} from "../../components/ui/Table/ActionButton";

import type { Column } from "../../components/ui/Table/type";
import type { ItemSummary, Item } from "../../types/item";

type OutletContextType = {
  openItemCreate: () => void;
  openItemEdit: (id: string, data: any) => void;
};

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

const Items: React.FC = () => {
  const { openItemCreate, openItemEdit } =
    useOutletContext<OutletContextType>();

  /* ── Table / list state ── */
  const [items, setItems] = useState<ItemSummary[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [filters, setFilters] = useState<ItemFilters>({});

  /* ── View mode — "table" or "detail" (inline, like CustomerManagement) ── */
  const [viewMode, setViewMode] = useState<"table" | "detail">("table");
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeSummary, setActiveSummary] = useState<ItemSummary | null>(null);

  /* ── All items for sidebar (unpaginated) ── */
  const [allItems, setAllItems] = useState<ItemSummary[]>([]);

  /* ── Invoice / stock data — wire up your APIs here ── */
  const [salesInvoices, setSalesInvoices] = useState<SalesInvoice[]>([]);
  const [purchaseInvoices, setPurchaseInvoices] = useState<PurchaseInvoice[]>(
    [],
  );
  const [stockRows, setStockRows] = useState<StockRow[]>([]);
  const [loadingSales, setLoadingSales] = useState(false);
  const [loadingPurchase, setLoadingPurchase] = useState(false);
  const [loadingStock, setLoadingStock] = useState(false);

  /* ── Delete modal state ── */
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ItemSummary | null>(null);
  const [deleting, setDeleting] = useState(false);

  /* ── Search debounce ── */
  useEffect(() => {
    const t = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchTerm || undefined }));
      setPage(1);
    }, 600);
    return () => clearTimeout(t);
  }, [searchTerm]);

  /* ── Fetch item list ── */
  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await getAllItems(page, pageSize, filters);
      const rawList = Array.isArray(res?.data?.data) ? res.data.data : [];
      const pagination = res?.data?.pagination;

      const flat = rawList.map((it: any) => ({
        ...it,
        taxCategory: it.taxInfo?.taxCategory ?? "",
        taxPreference: it.taxInfo?.taxPreference ?? "",
        taxType: it.taxInfo?.taxType ?? "",
        taxCode: it.taxInfo?.taxCode ?? "",
        taxPerct: it.taxInfo?.taxPerct ?? "",
        preferredVendor: it.vendorInfo?.preferredVendor ?? "",
        salesAccount: it.vendorInfo?.salesAccount ?? "",
        purchaseAccount: it.vendorInfo?.purchaseAccount ?? "",
        minStockLevel: it.inventoryInfo?.minStockLevel ?? "",
        maxStockLevel: it.inventoryInfo?.maxStockLevel ?? "",
        reorderLevel: it.inventoryInfo?.reorderLevel ?? "",
        valuationMethod: it.inventoryInfo?.valuationMethod ?? "",
        trackingMethod: it.inventoryInfo?.trackingMethod ?? "",
      }));

      setItems(flat);
      setTotalPages(pagination?.total_pages ?? 1);
      setTotalItems(pagination?.total ?? 0);
    } catch (err) {
      console.error(err);
      setItems([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [page, pageSize, filters]);

  /* ── Fetch ALL items (no pagination) for the detail sidebar ── */
  const fetchAllItems = async () => {
    try {
      const res = await getAllItems(1, 1000, {});
      const rawList = Array.isArray(res?.data?.data) ? res.data.data : [];
      const flat = rawList.map((it: any) => ({
        ...it,
        taxCategory: it.taxInfo?.taxCategory ?? "",
        taxPreference: it.taxInfo?.taxPreference ?? "",
        taxType: it.taxInfo?.taxType ?? "",
        taxCode: it.taxInfo?.taxCode ?? "",
        taxPerct: it.taxInfo?.taxPerct ?? "",
        preferredVendor: it.vendorInfo?.preferredVendor ?? "",
        salesAccount: it.vendorInfo?.salesAccount ?? "",
        purchaseAccount: it.vendorInfo?.purchaseAccount ?? "",
        minStockLevel: it.inventoryInfo?.minStockLevel ?? "",
        maxStockLevel: it.inventoryInfo?.maxStockLevel ?? "",
        reorderLevel: it.inventoryInfo?.reorderLevel ?? "",
        valuationMethod: it.inventoryInfo?.valuationMethod ?? "",
        trackingMethod: it.inventoryInfo?.trackingMethod ?? "",
      }));
      setAllItems(flat);
    } catch (err) {
      console.error("Failed to fetch all items for sidebar", err);
    }
  };

  /* ── Row click → fetch full item + switch to detail view (inline) ── */
  const handleRowClick = async (summary: ItemSummary) => {
    setActiveSummary(summary);
    setViewMode("detail");
    setSelectedItem(null);

    /* Ensure sidebar has all items loaded */
    if (allItems.length === 0) fetchAllItems();

    try {
      setDetailLoading(true);
      const res = await getItemByItemCode(summary.id);
      const fullItem = res.data;

      /* Flatten nested fields */
      const flat: Item = {
        ...fullItem,
        taxCategory:
          fullItem.taxInfo?.taxCategory ?? fullItem.taxCategory ?? "",
        taxPreference:
          fullItem.taxInfo?.taxPreference ?? fullItem.taxPreference ?? "",
        taxType: fullItem.taxInfo?.taxType ?? fullItem.taxType ?? "",
        taxCode: fullItem.taxInfo?.taxCode ?? fullItem.taxCode ?? "",
        taxPerct: fullItem.taxInfo?.taxPerct ?? fullItem.taxPerct ?? "",
        preferredVendor:
          fullItem.vendorInfo?.preferredVendor ??
          fullItem.preferredVendor ??
          "",
        salesAccount:
          fullItem.vendorInfo?.salesAccount ?? fullItem.salesAccount ?? "",
        purchaseAccount:
          fullItem.vendorInfo?.purchaseAccount ??
          fullItem.purchaseAccount ??
          "",
        minStockLevel:
          fullItem.inventoryInfo?.minStockLevel ?? fullItem.minStockLevel ?? "",
        maxStockLevel:
          fullItem.inventoryInfo?.maxStockLevel ?? fullItem.maxStockLevel ?? "",
        reorderLevel:
          fullItem.inventoryInfo?.reorderLevel ?? fullItem.reorderLevel ?? "",
        valuationMethod:
          fullItem.inventoryInfo?.valuationMethod ??
          fullItem.valuationMethod ??
          "",
        trackingMethod:
          fullItem.inventoryInfo?.trackingMethod ??
          fullItem.trackingMethod ??
          "",
      };

      setSelectedItem(flat);

      // TODO: fetch invoice + stock data once APIs are ready
      // const [salesRes, purchaseRes] = await Promise.all([
      //   getSalesInvoicesByItem(summary.id),
      //   getPurchaseInvoicesByItem(summary.id),
      // ]);
      // setSalesInvoices(salesRes.data);
      // setPurchaseInvoices(purchaseRes.data);
    } catch (err) {
      console.error("Failed to load item detail", err);
      showApiError(err);
    } finally {
      setDetailLoading(false);
    }
  };

  /* ── Back to table ── */
  const handleBack = () => {
    setViewMode("table");
    setSelectedItem(null);
    setActiveSummary(null);
  };

  /* ── Edit ── */
  const handleEdit = async (itemCode: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await getItemByItemCode(itemCode);
      openItemEdit(itemCode, res.data);
    } catch {
      console.error("Unable to fetch item");
    }
  };

  /* ── Delete ── */
  const handleDeleteClick = (item: ItemSummary, e: React.MouseEvent) => {
    e.stopPropagation();
    setItemToDelete(item);
    setDeleteOpen(true);
  };

const confirmDelete = async () => {
  if (!itemToDelete) return;

  try {
    setDeleting(true);

    const res = await deleteItemByItemCode(itemToDelete.id);

    // ✅ Use HTTP status
    if (res.status !== 200) {
      showApiError(res);
      return;
    }

    setItems((prev) =>
      prev.filter((i) => i.id !== itemToDelete.id)
    );

    showSuccess("Item deleted successfully");
    setDeleteOpen(false);

    if (activeSummary?.id === itemToDelete.id) {
      handleBack();
    }

  } catch (err: any) {
    showApiError(err);
  } finally {
    setDeleting(false);
    setItemToDelete(null);
  }
};

  /* ── Detail view action handlers ── */
  const handleDetailEdit = async () => {
    if (!activeSummary) return;
    try {
      const res = await getItemByItemCode(activeSummary.id);
      (res.data);
      (true);
    } catch {
      showApiError("Unable to fetch item");
    }
  };

  const handleDetailDelete = () => {
    if (!activeSummary) return;
    setItemToDelete(activeSummary);
    setDeleteOpen(true);
  };

  /* ── Table columns ── */
  const columns: Column<ItemSummary>[] = [
    {
      key: "id",
      header: "Item Code",
      align: "left",
      render: (i) => (
        <span className="truncate block max-w-[120px]">{i.id}</span>
      ),
    },
    {
      key: "itemName",
      header: "Name",
      align: "left",
      render: (i) => (
        <span className="truncate block max-w-[150px]">{i.itemName}</span>
      ),
    },
    {
      key: "itemGroup",
      header: "Category",
      align: "left",
      render: (i) => (
        <span className="truncate block max-w-[120px]">{i.itemGroup}</span>
      ),
    },
    {
      key: "taxCategory",
      header: "Tax Category",
      align: "left",
      render: (i) => (
        <span className="truncate block max-w-[100px]">{i.taxCategory}</span>
      ),
    },
    { key: "minStockLevel", header: "Min Stock", align: "right" },
    { key: "maxStockLevel", header: "Max Stock", align: "right" },
    {
      key: "preferredVendor",
      header: "Supplier",
      align: "left",
      render: (i) => (
        <span className="truncate block max-w-[130px]">
          {i.preferredVendor}
        </span>
      ),
    },
    {
      key: "sellingPrice",
      header: "Price",
      align: "right",
      render: (i) => (
        <code className="text-xs px-2 py-1 rounded bg-row-hover text-main">
          {i.sellingPrice}
        </code>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "center",
      render: (i) => (
        <ActionGroup>
          {/* Eye icon → open detail */}
          <ActionButton
            type="view"
            iconOnly
            onClick={(e?: React.MouseEvent<HTMLButtonElement>) => {
              e?.stopPropagation();
              handleRowClick(i);
            }}
          />

          <ActionMenu
            onEdit={(e) => handleEdit(i.id, e as any)}
            onDelete={(e) => handleDeleteClick(i, e as any)}
          />
        </ActionGroup>
      ),
    },
  ];

  // ── RENDER ────────────────────────────────────────────────────────────────

  return (
    <>
      {viewMode === "table" ? (
        /* ── Normal table view ── */
        <div className="h-full min-h-0">
          <Table
            loading={loading || initialLoad}
            columns={columns}
            data={items}
            enableColumnSelector
            showToolbar
            searchValue={searchTerm}
            onSearch={setSearchTerm}
            enableAdd
            addLabel="Add Item"
            onAdd={openItemCreate}
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
            extraFilters={
              <div className="w-44">
                <FilterSelect
                  value={filters.taxCategory || ""}
                  onChange={(e) => {
                    setFilters((prev) => ({
                      ...prev,
                      taxCategory: e.target.value || undefined,
                    }));
                    setPage(1);
                  }}
                  options={[
                    { label: "Export", value: "Export" },
                    { label: "Non-Export", value: "Non-Export" },
                    { label: "LPO", value: "LPO" },
                  ]}
                />
              </div>
            }
          />
        </div>
      ) : (
        /* ── Inline detail view (no overlay, just like CustomerDetailView) ── */
        <div className="p-4 sm:p-8">
          <ItemDetailView
            isOpen={true}
            onClose={handleBack}
            allItems={allItems.length > 0 ? allItems : items}
            item={selectedItem}
            loadingDetail={detailLoading}
            onSelectItem={(summary) => handleRowClick(summary)}
            onEditItem={handleDetailEdit}
            onDeleteItem={handleDetailDelete}
            onAddItem={openItemCreate}
            salesInvoices={salesInvoices}
            purchaseInvoices={purchaseInvoices}
            stockRows={stockRows}
            loadingSales={loadingSales}
            loadingPurchase={loadingPurchase}
            loadingStock={loadingStock}
            onStockSearch={(from, to) => {
              // TODO: fetchStockSummary(activeSummary?.id, from, to)
              console.log("Stock search:", from, "→", to);
            }}
          />
        </div>
      )}

      {/* ── Delete modal ── */}
      {deleteOpen && itemToDelete && (
        <DeleteModal
          entityName="Item"
          entityId={itemToDelete.id}
          entityDisplayName={itemToDelete.itemName}
          isLoading={deleting}
          onClose={() => {
            setDeleteOpen(false);
            setItemToDelete(null);
          }}
          onDelete={confirmDelete}
        />
      )}
    </>
  );
};

export default Items;
