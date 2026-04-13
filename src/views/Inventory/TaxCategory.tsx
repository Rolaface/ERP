import React, { useCallback, useEffect, useState } from "react";
import { showApiError, showLoading, showSuccess, closeSwal } from "../../utils/alert";
import Table from "../../components/ui/Table/Table";
import ActionButton, {
  ActionGroup,
  ActionMenu,
} from "../../components/ui/Table/ActionButton";
import type { Column } from "../../components/ui/Table/type";
import Tooltip from "../../components/Tooltip";
import { fireManagedSwal } from "../../utils/swalManager";
import { getAllTaxCategories } from "../../api/taxCategoryApi";
import { useTaxCategory } from "../../hooks/useTaxCategory";
import TaxCategoryModal from "../../components/inventory/TaxCategoryModal";
import type { TaxCategoryFormData } from "../../hooks/useTaxCategory";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TaxCategorySummary {
  name: string;
  title: string;
  disabled: 0 | 1;
}

// ─── Component ────────────────────────────────────────────────────────────────

const TaxCategory: React.FC = () => {
  const [categories, setCategories] = useState<TaxCategorySummary[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const { createTaxCategoryEntry, updateStatus, deleteTaxCategoryEntry } =
    useTaxCategory();

  // ─── Fetch ──────────────────────────────────────────────────────────────────

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAllTaxCategories(
        page,
        pageSize,
        searchTerm || undefined
      );

      // API response shape: { data: [...], pagination: { total_count, total_pages, page, page_size } }
      const list: TaxCategorySummary[] = res?.data ?? [];
      const pagination = res?.pagination;

      setCategories(list);
      setTotalPages(pagination?.total_pages ?? 1);
      setTotalItems(pagination?.total_count ?? list.length);
    } catch (error) {
      console.error("Error loading tax categories:", error);
      showApiError(error);
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  }, [page, pageSize, searchTerm]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // ─── Handlers ───────────────────────────────────────────────────────────────

const handleCreate = async (formData: TaxCategoryFormData) => {
  try {
    await createTaxCategoryEntry(formData);
    await fetchCategories();
    return true;
  } catch {
    return false;
  }
};
  // Status Toggle: Enable / Disable — replaces Edit in ActionMenu
  const handleToggleStatus = async (row: TaxCategorySummary) => {
    const newDisabled: 0 | 1 = row.disabled === 1 ? 0 : 1;

    const confirm = await fireManagedSwal({
      icon: "warning",
      title: newDisabled === 1 ? "Disable Category?" : "Enable Category?",
      text: `"${row.title}" will be ${newDisabled === 1 ? "disabled" : "enabled"}.`,
      showCancelButton: true,
      confirmButtonColor: newDisabled === 1 ? "#ef4444" : "#22c55e",
      cancelButtonColor: "#6b7280",
      confirmButtonText: newDisabled === 1 ? "Yes, Disable" : "Yes, Enable",
    });

    if (!confirm.isConfirmed) return;

    try {
      await updateStatus(row.name, newDisabled);
      await fetchCategories();
    } catch {
      // error already shown inside hook
    }
  };

  const handleDelete = async (name: string, e: React.MouseEvent) => {
    e.stopPropagation();

    const confirm = await fireManagedSwal({
      icon: "warning",
      title: "Are you sure?",
      text: `Delete tax category "${name}"?`,
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete",
    });

    if (!confirm.isConfirmed) return;

    try {
      await deleteTaxCategoryEntry(name);
      await fetchCategories();
    } catch {
      // error already shown inside hook
    }
  };

  // ─── Columns ────────────────────────────────────────────────────────────────

  const columns: Column<TaxCategorySummary>[] = [
    {
      key: "title",
      header: "Title",
      align: "left",
      render: (tc) => (
        <div className="inline-flex w-fit">
          <Tooltip content={tc.title}>
            <span className="cursor-pointer font-medium text-main text-xs">
              {tc.title}
            </span>
          </Tooltip>
        </div>
      ),
    },
    {
      key: "disabled",
      header: "Status",
      align: "left",
      render: (tc) => (
        <code
          className={[
            "text-xs px-2 py-1 rounded",
            tc.disabled
              ? "bg-danger/10 text-danger"
              : "bg-success/10 text-success",
          ].join(" ")}
        >
          {tc.disabled ? "Disabled" : "Active"}
        </code>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "center",
      render: (tc) => (
        <ActionGroup>
          <ActionMenu
            // No onEdit — edit is not supported; only status toggle is allowed
            onDelete={(e) => handleDelete(tc.name, e as React.MouseEvent)}
            customActions={[
              {
                label: tc.disabled ? "Enable" : "Disable",
                onClick: () => handleToggleStatus(tc),
                danger: !tc.disabled, // Disable action is red; Enable is normal
              },
            ]}
          />
        </ActionGroup>
      ),
    },
  ];

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <Table
        columns={columns}
        data={categories}
        showToolbar
        loading={loading || initialLoad}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
        pageSizeOptions={[10, 25, 50, 100]}
        searchValue={searchTerm}
        onSearch={(val) => {
          setSearchTerm(val);
          setPage(1);
        }}
        enableAdd
        addLabel="Add Tax Category"
        onAdd={() => setIsModalOpen(true)}
        enableColumnSelector
        currentPage={page}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageChange={setPage}
      />

      {/* Create Modal — no edit modal needed since only status toggle is supported */}
      <TaxCategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
       onSubmit={handleCreate} 
      />
    </>
  );
};

export default TaxCategory;