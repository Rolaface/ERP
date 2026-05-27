import React, { useCallback, useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { getAllTaxCategories } from "../../api/taxCategoryApi";
import { showApiError, showSuccess } from "../../utils/alert";
import { FilterSelect } from "../../components/ui/modal/modalComponent";
import {
  getAllItems,
  getItemByItemCode,
  deleteItemByItemCode,
} from "../../api/itemApi";
import { ItemFilters } from "../../api/itemApi";
import { fireManagedSwal } from "../../utils/swalManager";
import { showLoading, closeSwal } from "../../utils/alert";
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
import { usePermission } from "../../hooks/permission/usePermission";
import PermissionGate from "../PermissionGate";


type OutletContextType = {
  openItemCreate: (context?: { onSuccess?: () => void }) => void;
  openItemEdit: (
    id: string,
    data: any,
    context?: { onSuccess?: () => void },
  ) => void;
};


const ITEM_MODULE = "Item";


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
  const { can } = usePermission();

  /* ── View mode — "table" or "detail" ── */
  const [viewMode, setViewMode] = useState<"table" | "detail">("table");
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeSummary, setActiveSummary] = useState<ItemSummary | null>(null);

  // tax cat filter
  const [taxCategories, setTaxCategories] = useState<{ label: string; value: string }[]>([]);

  /* ── All items for sidebar (unpaginated) ── */
  const [allItems, setAllItems] = useState<ItemSummary[]>([]);

  /* ── Invoice / stock data ── */
  const [salesInvoices] = useState<SalesInvoice[]>([]);
  const [purchaseInvoices] = useState<PurchaseInvoice[]>([]);
  const [stockRows] = useState<StockRow[]>([]);
  const [loadingSales] = useState(false);
  const [loadingPurchase] = useState(false);
  const [loadingStock] = useState(false);

  /* ── Search debounce ── */
  useEffect(() => {
    const t = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchTerm || undefined }));
      setPage(1);
    }, 600);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => {
  const fetchTaxCategories = async () => {
    try {
      const res = await getAllTaxCategories(1, 1000);
      const categories = Array.isArray(res?.data)
        ? res.data
            .filter((cat: any) => cat.disabled === 0)
            .map((cat: any) => ({ label: cat.title, value: cat.name }))
        : [];
      setTaxCategories(categories);
    } catch (err) {
      showApiError(err);
    }
  };
  void fetchTaxCategories();
}, []);

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
      showApiError(err);
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
       showApiError(err);
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
      showApiError(err)
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


  const handleDeleteClick = async (item: ItemSummary, e: React.MouseEvent) => {
    e.stopPropagation();

    const confirm = await fireManagedSwal({
      icon: "warning",
      title: "Are you sure?",
      text: `Delete Item ${item.itemName}?`,
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete",
    });

    if (!confirm.isConfirmed) return;

    try {
      showLoading("Deleting Item...");
      const res = await deleteItemByItemCode(item.id);

      if (res.status !== 200) {
        closeSwal();
        showApiError(res);
        return;
      }

      closeSwal();
      showSuccess("Item deleted successfully");

      if (activeSummary?.id === item.id) {
        handleBack();
      }

      triggerRefresh(REFRESH_KEYS.ITEM_LIST);
    } catch (err: any) {
      closeSwal();
      showApiError(err);
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

  const handleDetailDelete = async () => {
    if (!activeSummary) return;
    await handleDeleteClick(activeSummary, {} as React.MouseEvent);
  };
  const columns: Column<ItemSummary>[] = [
    {
      key: "id",
      header: "Item Code",
      align: "left",
      render: (i) => (
        <div className="py-1.5">
          <span className="block">
            {i.id}
          </span>
        </div>
      ),
      tooltip: (i) => i.id,
    },
    {
      key: "brand",
      header: "Brand",
      align: "center",
      render: (i) => (
        <div className="py-1.5">
          <span className="block">
            {i.brand || "-"}
          </span>
        </div>
      ),
      tooltip: (i) => i.brand || "-",
    },
    {
      key: "itemName",
      header: "Name",
      align: "center",
      render: (i) => (
        <div className="py-1.5">
          <span className="block font-medium">
            {i.itemName}
          </span>
        </div>
      ),
      tooltip: (i) => i.itemName,
    },
    {
      key: "itemGroup",
      header: "Category",
      align: "center",
      render: (i) => (
        <div className="py-1.5">
          <span className="block">
            {i.itemGroup}
          </span>
        </div>
      ),
      tooltip: (i) => i.itemGroup,
    },
    {
      key: "minStockLevel",
      header: "Min",
      align: "center",
      render: (i) => (
        <div className="py-1.5">
          <span className="block">
            {i.minStockLevel ?? "-"}
          </span>
        </div>
      ),
      tooltip: (i) => i.minStockLevel ?? "-",
    },
    {
      key: "maxStockLevel",
      header: "Max",
      align: "center",
      render: (i) => (
        <div className="py-1.5">
          <span className="block">
            {i.maxStockLevel ?? "-"}
          </span>
        </div>
      ),
      tooltip: (i) => i.maxStockLevel ?? "-",
    },
    {
      key: "preferredVendorName",
      header: "Supplier",
      align: "center",
      render: (i) => (
        <div className="py-1.5">
          <span className="block">
            {i.preferredVendorName || "-"}
          </span>
        </div>
      ),
      tooltip: (i) => i.preferredVendorName || "-",
    },
    {
      key: "sellingPrice",
      header: "Price",
      align: "center",
      render: (i) => (
        <div className="py-1.5">
          <span className="block">
            {i.sellingPrice}
          </span>
        </div>
      ),
      tooltip: (i) => i.sellingPrice,
    },
    {
      key: "actions",
      header: "Actions",
      align: "center",
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

          <PermissionGate module={ITEM_MODULE} action="write">
            <ActionButton
              type="edit"
              iconOnly
              title="Edit Item"
              onClick={(e?: React.MouseEvent<HTMLButtonElement>) => {
                e?.stopPropagation();
                handleEdit(i.id, e as any);
              }}
            />
          </PermissionGate>

          <ActionMenu
            {...(can(ITEM_MODULE, "delete")
              ? { onDelete: (e) => handleDeleteClick(i, e as any) }
              : {})}
          />
        </ActionGroup>
      ),
    },
  ];


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
            enableAdd={can(ITEM_MODULE, "create")}
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
                  options={taxCategories}
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

    </>
  );
};

export default Items;
