import React, { useState, useEffect, useCallback } from "react";
import Table from "../../components/ui/Table/Table";
import StatusBadge from "../../components/ui/Table/StatusBadge";
import { getAssetCategories as fetchAssetCategoriesAPI } from "../../api/faapi";
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
import AssetCategoryModal from "../../components/FixedAsset/AssetCategoryModal";

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
    fields: [
      "name",
      "asset_category_name",
     
      "non_depreciable_category",
    ],
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
      nonDepreciableCategory:
        item.non_depreciable_category === 1,
      financeBooks: [],
      accounts: [],
    })),
    pagination: {
      total_pages: 1, 
      total: data.length,
    },
  };
};

const getAssetCategoryById = async (_id: string) => {
  // replace with real API call
  return { status: "success", data: {} };
};

const deleteAssetCategory = async (_id: string) => {
  // replace with real API call
  return { status: 200 };
};

// ─── Component ────────────────────────────────────────────────────────────────

const AssetCategoryTable: React.FC = () => {
  const [rows, setRows] = useState<AssetCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [filters, setFilters] = useState<Record<string, any>>({});

  // ── Modal state ─────────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | undefined>(undefined);

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

  // ── Handlers ────────────────────────────────────────────────
  const handleAddClick = () => {
    setEditId(undefined);
    setModalOpen(true);
  };

  const handleEdit = (row: AssetCategory, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditId(row.id);
    setModalOpen(true);
  };

  const handleDelete = async (row: AssetCategory, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirm = await fireManagedSwal({
      icon: "warning",
      title: "Are you sure?",
      text: `Delete Asset Category "${row.assetCategoryName}"?`,
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete",
    });

    if (!confirm.isConfirmed) return;

    try {
      showLoading("Deleting Asset Category...");
      const res = await deleteAssetCategory(row.id);

      if (!res || (res.status < 200 || res.status >= 300)) {
        closeSwal();
        showApiError("Delete failed");
        return;
      }

      closeSwal();
      showSuccess("Asset Category deleted successfully");
      await fetchCategories();
    } catch (error) {
      closeSwal();
      showApiError(error);
    }
  };

  const handleModalSubmit = async (_data: any) => {
    // replace with real API call: createAssetCategory / updateAssetCategory
    showSuccess(editId ? "Asset Category updated" : "Asset Category created");
    setModalOpen(false);
    await fetchCategories();
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
      render: (o) => 
      <div className="py-1.5">
      <span className="block">{o.assetCategoryName || "—"}</span>
      </div>,
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
          <ActionButton
            type="edit"
            onClick={(e) => handleEdit(o, e as any)}
            iconOnly
          />
          <ActionMenu
            onDelete={(e) => handleDelete(o, e as any)}
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
        enableAdd
        addLabel="Add Asset Category"
        onAdd={handleAddClick}
        enableColumnSelector
        currentPage={page}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageChange={setPage}
        onPageSizeChange={(size) => setPageSize(size)}
        pageSizeOptions={[10, 25, 50, 100]}
      />

      {/* ── Asset Category Modal ── */}
      <AssetCategoryModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleModalSubmit}
        categoryId={editId}
      />
    </div>
  );
};

export default AssetCategoryTable;