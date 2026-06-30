import React, { useState, useEffect, useCallback } from "react";
import Table from "../../components/ui/Table/Table";
import StatusBadge from "../../components/ui/Table/StatusBadge";
import {
  getAssetCategories as fetchAssetCategoriesAPI,
  deleteAssetCategory,
} from "../../api/faapi";

import ActionButton, {
  ActionGroup,
  ActionMenu,
} from "../../components/ui/Table/ActionButton";
import type { Column } from "../../components/ui/Table/type";
import {
  showApiError,
  showSuccess,
  showLoading,
  closeSwal,
} from "../../utils/alert";
import { fireManagedSwal } from "../../utils/swalManager";
import { Copy } from "lucide-react";
import { useModalStore } from "../../store/modalStore";
import { usePermission } from "../../hooks/permission/usePermission";
import { useDataRefreshStore, REFRESH_KEYS } from "../../store/dataRefreshStore";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AssetCategory {
  id: string;
  assetCategoryName: string;
  enableCapitalWorkInProgress: boolean;
  nonDepreciableCategory: boolean;
  financeBooks: any[];
  accounts: any[];
}

const getAssetCategories = async (
  page: number,
  pageSize: number,
  filters: any
) => {
  const data = await fetchAssetCategoriesAPI({
    fields: ["name", "asset_category_name", "non_depreciable_category"],
    page,
    page_size: pageSize,
    search: filters?.search,
  });

  return {
    data: data.map((item: any) => ({
      id: item.name,
      assetCategoryName: item.asset_category_name,
      enableCapitalWorkInProgress:
        item.enable_capital_work_in_progress === 1,
      nonDepreciableCategory: item.non_depreciable_category === 1,
      financeBooks: [],
      accounts: [],
    })),
    pagination: {
      total_pages: 1,
      total: data.length,
    },
  };
};



const ASSET_CATEGORY_MODULE = "Asset Category";

// ─── Component ────────────────────────────────────────────────────────────────

const AssetCategoryTable: React.FC = () => {
  const [rows, setRows] = useState<AssetCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const { can } = usePermission();
  const { openModal } = useModalStore();
  const { subscribeToRefresh } = useDataRefreshStore();

  // ── Debounced search ────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchTerm || undefined }));
      setPage(1);
    }, 600);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // ── Fetch ───────────────────────────────────────────────────
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAssetCategories(page, pageSize, filters);

      if (!res?.data || res.data.length === 0) {
        setRows([]);
        setTotalItems(0);
        setTotalPages(1);
        return;
      }

      setTotalPages(res.pagination?.total_pages || 1);
      setTotalItems(res.pagination?.total || 0);
      setRows(res.data);
    } catch (err) {
      showApiError(err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filters]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    const unsubscribe = subscribeToRefresh(
      REFRESH_KEYS.ASSET_CATEGORY_LIST,
      fetchCategories
    );
    return unsubscribe;
  }, [subscribeToRefresh, fetchCategories]);

  // ── Handlers ────────────────────────────────────────────────
  const handleAddClick = () => {
    openModal("assetCategory", null, false);
  };

  const handleEdit = (row: AssetCategory, e: React.MouseEvent) => {
    e.stopPropagation();
    openModal("assetCategory", row, true);
  };

  const handleView = (row: AssetCategory, e: React.MouseEvent) => {
    e.stopPropagation();
    openModal("assetCategory", row, true, { isViewMode: true });
  };

 const handleDelete = async (row: AssetCategory, e: React.MouseEvent) => {
  e.stopPropagation();

  const result = await fireManagedSwal({
    icon: "warning",
    title: "Are you sure?",
    text: `Delete Asset Category "${row.assetCategoryName}"?`,
    showCancelButton: true,
    confirmButtonColor: "#ef4444",
    cancelButtonColor: "#6b7280",
    confirmButtonText: "Yes, delete",
    reverseButtons: true,
  });

  if (!result.isConfirmed) return;

  try {
    showLoading("Deleting Asset Category...");

    await deleteAssetCategory(row.id);

    closeSwal();
    showSuccess("Asset Category deleted successfully");
    await fetchCategories();
  } catch (error) {
    closeSwal();
    showApiError(error);
  }
};

  // ── Columns ─────────────────────────────────────────────────
  const columns: Column<AssetCategory>[] = [
    {
      key: "id",
      header: "Name",
      align: "center",
      render: (o) => {
        const id = o.id || "";
        const handleCopy = (e: React.MouseEvent) => {
          e.stopPropagation();
          navigator.clipboard.writeText(id);
        };
        return (
          <div className="flex items-center justify-center gap-1 group">
            <span className="font-mono text-sm truncate max-w-[120px]">
              {id || "—"}
            </span>
            <button
              onClick={handleCopy}
              className="opacity-0 group-hover:opacity-100 transition text-gray-400 hover:text-blue-600"
              title="Copy full ID"
            >
              <Copy size={14} />
            </button>
          </div>
        );
      },
      tooltip: (o) => o.id || "—",
    },
    {
      key: "assetCategoryName",
      header: "Category Name",
      align: "center",
      render: (o) => (
        <div
          className="py-1.5 cursor-pointer hover:underline"
          onClick={(e) => handleView(o, e)}
        >
          <span className="block">{o.assetCategoryName || "—"}</span>
        </div>
      ),
      tooltip: (o) => o.assetCategoryName || "—",
    },
    {
      key: "enableCapitalWorkInProgress",
      header: "Capital WIP",
      align: "center",
      render: (o) => (
        <div className="py-1.5">
          <StatusBadge status={o.enableCapitalWorkInProgress ? "Enabled" : "Disabled"} />
        </div>
      ),
    },
    {
      key: "nonDepreciableCategory",
      header: "Non-Depreciable",
      align: "center",
      render: (o) => (
        <div className="py-1.5">
          <StatusBadge status={o.nonDepreciableCategory ? "Yes" : "No"} />
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "center",
      render: (o) => (
        <ActionGroup>
          {can(ASSET_CATEGORY_MODULE, "write") && (
            <ActionButton
              type="edit"
              onClick={(e) => handleEdit(o, e as any)}
              iconOnly
            />
          )}
          <ActionMenu
            {...(can(ASSET_CATEGORY_MODULE, "delete")
              ? { onDelete: (e) => handleDelete(o, e as any) }
              : {})}
          />
        </ActionGroup>
      ),
    },
  ];

  return (
    <div className="h-full min-h-0">
      <Table
        columns={columns}
        data={rows}
        showToolbar
        tableId="asset-categories"
        loading={loading}
        searchValue={searchTerm}
        onSearch={setSearchTerm}
        enableAdd={can(ASSET_CATEGORY_MODULE, "create")}
        addLabel="Add Asset Category"
        onAdd={handleAddClick}
        enableColumnSelector
        currentPage={page}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageChange={setPage}
        onPageSizeChange={(size) => setPageSize(size)}
        pageSizeOptions={[pageSize, 25, 50, 100, pageSize]}
      />
    </div>
  );
};

export default AssetCategoryTable;