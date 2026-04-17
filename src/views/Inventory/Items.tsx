import React, { useCallback, useEffect, useState } from "react";
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
import {
  REFRESH_KEYS,
  useDataRefreshStore,
} from "../../store/dataRefreshStore";

type OutletContextType = {
  openItemCreate: (context?: { onSuccess?: () => void }) => void;
  openItemEdit: (
    id: string,
    data: any,
    context?: { onSuccess?: () => void },
  ) => void;
};

const flattenItemDetail = (fullItem: any): Item => {
  if (!fullItem) return {} as Item;

  const taxInfo = fullItem.taxInfo ?? [];

  return {
    ...fullItem,

    taxCategory: Array.isArray(taxInfo)
      ? (taxInfo[0]?.taxCategory ?? fullItem.taxCategory ?? "")
      : ((taxInfo as any)?.taxCategory ?? fullItem.taxCategory ?? ""),

    taxPreference:
      fullItem.taxInfo?.taxPreference ?? fullItem.taxPreference ?? "",
    taxType: fullItem.taxInfo?.taxType ?? fullItem.taxType ?? "",
    taxCode: fullItem.taxInfo?.taxCode ?? fullItem.taxCode ?? "",
    taxPerct: fullItem.taxInfo?.taxPerct ?? fullItem.taxPerct ?? "",

    preferredVendor:
      fullItem.vendorInfo?.preferredVendor ?? fullItem.preferredVendor ?? "",

    salesAccount:
      fullItem.vendorInfo?.salesAccount ?? fullItem.salesAccount ?? "",

    purchaseAccount:
      fullItem.vendorInfo?.purchaseAccount ?? fullItem.purchaseAccount ?? "",

    minStockLevel:
      fullItem.inventoryInfo?.minStockLevel ?? fullItem.minStockLevel ?? "",

    maxStockLevel:
      fullItem.inventoryInfo?.maxStockLevel ?? fullItem.maxStockLevel ?? "",

    reorderLevel:
      fullItem.inventoryInfo?.reorderLevel ?? fullItem.reorderLevel ?? "",

    valuationMethod:
      fullItem.inventoryInfo?.valuationMethod ?? fullItem.valuationMethod ?? "",

    trackingMethod:
      fullItem.inventoryInfo?.trackingMethod ?? fullItem.trackingMethod ?? "",
  };
};

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

const Items: React.FC = () => {
  const { openItemCreate, openItemEdit } =
    useOutletContext<OutletContextType>();

  const subscribeToRefresh = useDataRefreshStore(
    (state) => state.subscribeToRefresh,
  );
  const triggerRefresh = useDataRefreshStore((state) => state.triggerRefresh);

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

  /* ── View mode — "table" or "detail" ── */
  const [viewMode, setViewMode] = useState<"table" | "detail">("table");
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeSummary, setActiveSummary] = useState<ItemSummary | null>(null);

  /* ── All items for sidebar (unpaginated) ── */
  const [allItems, setAllItems] = useState<ItemSummary[]>([]);

  /* ── Invoice / stock data ── */
  const [salesInvoices] = useState<SalesInvoice[]>([]);
  const [purchaseInvoices] = useState<PurchaseInvoice[]>([]);
  const [stockRows] = useState<StockRow[]>([]);
  const [loadingSales] = useState(false);
  const [loadingPurchase] = useState(false);
  const [loadingStock] = useState(false);

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
  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAllItems(page, pageSize, filters);
      const rawList = Array.isArray(res?.data?.data) ? res.data.data : [];
      const pagination = res?.data?.pagination;

      const flat = rawList.map((it: any) => ({
        ...it,
        taxCategory: Array.isArray(it.taxInfo)
          ? (it.taxInfo[0]?.taxCategory ?? "")
          : (it.taxInfo?.taxCategory ?? ""),
        taxPreference: it.taxInfo?.taxPreference ?? "",
        taxType: it.taxInfo?.taxType ?? "",
        taxCode: it.taxInfo?.taxCode ?? "",
        taxPerct: it.taxInfo?.taxPerct ?? "",
        preferredVendor: it.vendorInfo?.preferredVendor ?? "",
        preferredVendorName: it.vendorInfo?.preferredVendorName ?? "",

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
  }, [filters, page, pageSize]);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    const unsubscribe = subscribeToRefresh(REFRESH_KEYS.ITEM_LIST, () => {
      fetchItems();
    });
    return () => unsubscribe();
  }, [subscribeToRefresh, fetchItems]);

  /* ── Fetch ALL items (no pagination) for the detail sidebar ── */
  const fetchAllItems = useCallback(async () => {
    try {
      const res = await getAllItems(1, 1000, {});
      const rawList = Array.isArray(res?.data?.data) ? res.data.data : [];
      const flat = rawList.map((it: any) => ({
        ...it,
        taxCategory: Array.isArray(it.taxInfo)
          ? (it.taxInfo[0]?.taxCategory ?? "")
          : (it.taxInfo?.taxCategory ?? ""),
        taxPreference: it.taxInfo?.taxPreference ?? "",
        taxType: it.taxInfo?.taxType ?? "",
        taxCode: it.taxInfo?.taxCode ?? "",
        taxPerct: it.taxInfo?.taxPerct ?? "",
        preferredVendor: it.vendorInfo?.preferredVendor ?? "",
        preferredVendorName: it.vendorInfo?.preferredVendorName ?? "",
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
  }, []);

  /* ── Re-fetch everything and refresh the selected item detail ── */
  const refetchItemData = useCallback(async () => {
    await Promise.all([fetchItems(), fetchAllItems()]);

    if (!activeSummary?.id) return;

    try {
      const res = await getItemByItemCode(activeSummary.id);
      // Defensively handle both { data: { data: item } } and { data: item }
      const raw = res?.data?.data ?? res?.data;
      if (!raw?.id) {
        console.error("refetchItemData: unexpected response shape", res);
        return;
      }
      setSelectedItem(flattenItemDetail(raw));
    } catch (err) {
      console.error("Failed to refetch selected item", err);
    }
  }, [activeSummary?.id, fetchAllItems, fetchItems]);

  const handleAddItem = useCallback(() => {
    openItemCreate({ onSuccess: refetchItemData });
  }, [openItemCreate, refetchItemData]);

  const handleRowClick = async (summary: ItemSummary) => {
    // ── 1. Synchronous state updates FIRST (before any await) ──────────────
    setActiveSummary(summary);
    setViewMode("detail"); // ← panel appears immediately
    setDetailLoading(true);
    setSelectedItem(null); // ← clears stale data while loading

    // ── 2. Sidebar population (fire-and-forget) ───────────────────────────
    if (allItems.length === 0) void fetchAllItems();

    // ── 3. Fetch full item detail ─────────────────────────────────────────
    try {
      const res = await getItemByItemCode(summary.id);

      // Defensive: API returns { data: { data: {...item} } } normally,
      // but fall back to res.data if the inner .data wrapper is missing.
      const raw = res?.data?.data ?? res?.data;

      if (!raw?.id) {
        // Print the full response so we can debug further if needed
        console.error(
          "handleRowClick: item not found in response. Full response:",
          JSON.stringify(res, null, 2),
        );
        showApiError("Could not load item details.");
        setViewMode("table");
        return;
      }

      setSelectedItem(flattenItemDetail(raw));
    } catch (err) {
      console.error("handleRowClick: API call failed", err);
      showApiError(err);
      setViewMode("table");
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
      const raw = res?.data?.data ?? res?.data;
      openItemEdit(itemCode, raw, { onSuccess: refetchItemData });
    } catch {
      console.error("Unable to fetch item for edit");
      showApiError("Unable to load item for editing.");
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

      if (res.status !== 200) {
        showApiError(res);
        return;
      }

      showSuccess("Item deleted successfully");
      setDeleteOpen(false);

      if (activeSummary?.id === itemToDelete.id) {
        handleBack();
      }

      triggerRefresh(REFRESH_KEYS.ITEM_LIST);
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
      const raw = res?.data?.data ?? res?.data;
      openItemEdit(activeSummary.id, raw, { onSuccess: refetchItemData });
    } catch {
      showApiError("Unable to fetch item for editing.");
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
      maxWidth: "100px",
      truncate: true,
      render: (i) => <span className="truncate block">{i.id}</span>,
    },
    {
      key: "itemName",
      header: "Name",
      align: "center",
      maxWidth: "200px",
      truncate: true,
      render: (i) => <span className="truncate block">{i.itemName}</span>,
    },
    {
      key: "itemGroup",
      header: "Category",
      align: "center",
      maxWidth: "90px",
      truncate: true,
      render: (i) => <span className="truncate block">{i.itemGroup}</span>,
    },

    {
      key: "minStockLevel",
      header: "Min",
      align: "center",
      maxWidth: "60px",
      truncate: true,
    },
    {
      key: "maxStockLevel",
      header: "Max",
      align: "center",
      maxWidth: "60px",
      truncate: true,
    },

    {
      key: "preferredVendorName",
      header: "Supplier",
      align: "center",
      maxWidth: "180px",
      truncate: true,
      render: (i) => (
        <span className="truncate block">{i.preferredVendorName}</span>
      ),
    },

    {
      key: "sellingPrice",
      header: "Price",
      align: "center",
      maxWidth: "90px",
      truncate: true,
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
      maxWidth: "100px",
      render: (i) => (
        <ActionGroup>
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
            onAdd={handleAddItem}
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
            onAddItem={handleAddItem}
            salesInvoices={salesInvoices}
            purchaseInvoices={purchaseInvoices}
            stockRows={stockRows}
            loadingSales={loadingSales}
            loadingPurchase={loadingPurchase}
            loadingStock={loadingStock}
            onStockSearch={(from, to) => {
              console.log("Stock search:", from, "→", to);
            }}
          />
        </div>
      )}

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
