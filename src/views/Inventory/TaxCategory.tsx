import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { showApiError } from "../../utils/alert";
import Table from "../../components/ui/Table/Table";
import ActionButton, {
  ActionGroup,
  ActionMenu,
} from "../../components/ui/Table/ActionButton";
import type { Column } from "../../components/ui/Table/type";
import Tooltip from "../../components/Tooltip";
import { fireManagedSwal } from "../../utils/swalManager";
import { getAllTaxCategories } from "../../api/taxCategoryApi";
import { TaxCategoryFormData } from "../../types/tax/taxTemplate";
import { useTaxCategory } from "../../hooks/useTaxCategory";
import { openTaxCategoryModal } from "../../store/modalStore";
import { usePermission } from "../../hooks/permission/usePermission";
import { ACTION_ICONS } from "../../components/UI_Utils/statusActionIcons";
// ─── Types ────────────────────────────────────────────────────────────────────

interface TaxCategorySummary {
  name: string;
  title: string;
  disabled: 0 | 1;
}

const TAX_CATEGORY_MODULE = "Tax Category";

// ─── Component ────────────────────────────────────────────────────────────────

const TaxCategory: React.FC = () => {
  const [categories, setCategories] = useState<TaxCategorySummary[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const { can } = usePermission();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const mountedRef = useRef(true);
  const prevSearchTermRef = useRef(searchTerm);

  const { createTaxCategoryEntry, updateStatus, deleteTaxCategoryEntry } =
    useTaxCategory();

  // ─── Fetch ──────────────────────────────────────────────────────────────────

  const fetchCategories = useCallback(async () => {
    if (!mountedRef.current) return;

    setIsFetching(true);
    try {
      const res = await getAllTaxCategories(
        page,
        pageSize,
        searchTerm || undefined,
      );

      if (!mountedRef.current) return;

      const list: TaxCategorySummary[] = res?.data ?? [];
      const pagination = res?.pagination;

      setCategories(list);
      setTotalPages(pagination?.total_pages ?? 1);
      setTotalItems(pagination?.total_count ?? list.length);
    } catch (error) {
      if (mountedRef.current) {
        showApiError(error);
      }
    } finally {
      if (mountedRef.current) {
        setIsFetching(false);
        setIsInitialLoad(false);
      }
    }
  }, [page, pageSize, searchTerm]);

  // Initial fetch on mount only
  useEffect(() => {
    mountedRef.current = true;
    fetchCategories();
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Fetch on page/size/search changes - with debounce for search
  useEffect(() => {
    if (isInitialLoad) return;

    const timer = setTimeout(
      () => {
        fetchCategories();
      },
      searchTerm ? 300 : 0,
    );

    return () => clearTimeout(timer);
  }, [page, pageSize, searchTerm, isInitialLoad]);

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleToggleStatus = useCallback(
    async (row: TaxCategorySummary) => {
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
    },
    [updateStatus, fetchCategories],
  );

 const handleView = useCallback(
  (tc: TaxCategorySummary, e?: React.MouseEvent) => {
    e?.stopPropagation();
    openTaxCategoryModal(
      { title: tc.title, disabled: tc.disabled === 1 },
      false,
      { isViewMode: true }
    );
  },
  []
);

  const handleDelete = useCallback(
    async (name: string, e: React.MouseEvent) => {
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
    },
    [deleteTaxCategoryEntry, fetchCategories],
  );

  // ─── Columns ────────────────────────────────────────────────────────────────

  const columns: Column<TaxCategorySummary>[] = useMemo(
    () => [
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
            {/* View — always visible */}
            <ActionButton
              type="view"
              onClick={(e) => handleView(tc, e)}
              iconOnly
            />

            {(can(TAX_CATEGORY_MODULE, "delete") ||
              can(TAX_CATEGORY_MODULE, "write")) && (
                <ActionMenu
                  {...(can(TAX_CATEGORY_MODULE, "delete")
                    ? {
                      onDelete: (e) =>
                        handleDelete(tc.name, e as React.MouseEvent),
                    }
                    : {})}
                  customActions={
                    can(TAX_CATEGORY_MODULE, "write")
                      ? [
                        {
                          label: tc.disabled ? "Enable" : "Disable",
                          icon: tc.disabled
                            ? ACTION_ICONS.ENABLE
                            : ACTION_ICONS.DISABLE,
                          onClick: () => handleToggleStatus(tc),
                          danger: !tc.disabled,
                        },
                      ]
                      : []
                  }
                />
              )}
          </ActionGroup>
        ),
      },
    ],
    [handleDelete, handleToggleStatus],
  );

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <Table
        columns={columns}
        data={categories}
        showToolbar
        tableId="taxcategory"
        loading={isInitialLoad}
        isFetching={isFetching}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
         pageSizeOptions={[20, 50, 100,200]}
        searchValue={searchTerm}
        onSearch={(val) => {
          setSearchTerm(val);
          setPage(1);
        }}
        enableAdd={can(TAX_CATEGORY_MODULE, "create")}
        addLabel="Add Tax Category"
        onAdd={() =>
          openTaxCategoryModal(null, false, {
            onSuccess: async (data) => {
              try {
                await createTaxCategoryEntry(data as TaxCategoryFormData);
                await fetchCategories();
              } catch {
                // error hook ke andar show hoga
              }
            },
          })
        }
        enableColumnSelector
        currentPage={page}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageChange={setPage}
        onRowDoubleClick={(tc) => handleView(tc)}
      />


    </>
  );
};

export default TaxCategory;
