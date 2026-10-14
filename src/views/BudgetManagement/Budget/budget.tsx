import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

import Table from "../../../components/ui/Table/Table";
import ActionButton, {
  ActionMenu,
} from "../../../components/ui/Table/ActionButton";
import type { Column } from "../../../components/ui/Table/type";
import StatusBadge from "../../../components/ui/Table/StatusBadge";
import {
  showApiError,
  showSuccess,
  showLoading,
  closeSwal,
} from "../../../utils/alert";
import { fireManagedSwal } from "../../../utils/swalManager";
import { usePermission } from "../../../hooks/permission/usePermission";
import PermissionGate from "../../PermissionGate";
import { useCurrencySymbols } from "../../../hooks/Usecurrencysymbols";
import { extractCurrencyCodesFlat } from "../../../utils/Extractcurrencycodes";
import {
  useDataRefreshStore,
  REFRESH_KEYS,
} from "../../../store/dataRefreshStore";


// ─── Types ────────────────────────────────────────────────────────────────────

export interface BudgetSummary {
  budgetId: string;
  budgetAgainst: string;
  budgetAgainstName: string; 
  fiscalYear: string;
  currency: string;
  totalBudget: number;
  actualSpent: number;
  status: string; // Draft | Submitted | Cancelled
}

interface BudgetProps {
  onAddBudget?: () => void;
  onEditBudget?: (budgetId: string) => void;
  onViewBudget?: (budgetId: string) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BUDGET_MODULE = "Budget";

// UI column key → backend field name. Adjust to match your API.
const SORT_FIELD_MAP: Record<string, string> = {
  budgetId: "name",
  budgetAgainstName: "cost_center",
  fiscalYear: "fiscal_year",
  totalBudget: "budget_amount",
};
const mapSortField = (field: string) => SORT_FIELD_MAP[field] ?? field;

const statusOptions = [
  { label: "Draft", value: "Draft" },
  { label: "Submitted", value: "Submitted" },
  { label: "Cancelled", value: "Cancelled" },
];

const budgetAgainstOptions = [
  { label: "Cost Center", value: "Cost Center" },
  { label: "Project", value: "Project" },
];

// ─── Component ────────────────────────────────────────────────────────────────

const Budget: React.FC<BudgetProps> = ({
  onAddBudget,
  onEditBudget,
  onViewBudget,
}) => {
  const mountedRef = useRef(true);
  const { can } = usePermission();

  // Data (stale-while-revalidate)
  const [budgets, setBudgets] = useState<BudgetSummary[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  // Filters
  const [filters, setFilters] = useState<{
    status?: string[];
    budgetAgainst?: string[];
  }>({});

  // Pagination (server)
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Search + sort (server)
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("creation");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Currency formatting
  const currencyCodes = useMemo(
    () => extractCurrencyCodesFlat(budgets),
    [budgets],
  );
  const { formatAmount } = useCurrencySymbols(currencyCodes);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, filters]);

  // ── Mapper (shared by table + export) ──────────────────────────────────────
  const mapBudget = (b: any): BudgetSummary => ({
    budgetId: b.id ?? b.name,
    budgetAgainst: b.budgetAgainst ?? b.budget_against ?? "",
    budgetAgainstName:
      b.budgetAgainstName ?? b.costCenter ?? b.project ?? b.cost_center ?? "",
    fiscalYear: b.fiscalYear ?? b.fiscal_year ?? "",
    currency: b.currency ?? "",
    totalBudget: Number(b.totalBudget ?? b.budget_amount ?? 0),
    actualSpent: Number(b.actualSpent ?? b.actual_spent ?? 0),
    status: b.status ?? "Draft",
  });

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchBudgets = useCallback(async () => {
    if (!mountedRef.current) return;
    setIsFetching(true);
    try {
      const res = await getAllBudgets({
        page,
        pageSize,
        sortBy: mapSortField(sortBy),
        sortOrder,
        search: searchTerm,
        status: filters.status?.join(","),
        budgetAgainst: filters.budgetAgainst?.join(","),
      });

      if (!res || res.status_code !== 200) {
        showApiError(res || "Failed to fetch budgets");
        setBudgets([]);
        setTotalPages(1);
        setTotalItems(0);
        return;
      }

      if (!mountedRef.current) return;

      const mapped = res.data.map(mapBudget);
      setBudgets(mapped);
      setTotalPages(res.pagination?.total_pages || 1);
      setTotalItems(res.pagination?.total || mapped.length);
    } catch (err) {
      showApiError(err);
      setBudgets([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      if (mountedRef.current) {
        setIsFetching(false);
        setIsInitialLoad(false);
      }
    }
  }, [page, pageSize, sortBy, sortOrder, searchTerm, filters]);

  useEffect(() => {
    mountedRef.current = true;
    fetchBudgets();
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (isInitialLoad) return;
    fetchBudgets();
  }, [page, pageSize, sortBy, sortOrder, searchTerm, filters]);

  // Auto-refresh after create/edit elsewhere
  useEffect(() => {
    const unsubscribe = useDataRefreshStore
      .getState()
      .subscribeToRefresh(REFRESH_KEYS.BUDGET_LIST, () => {
        fetchBudgets();
      });
    return unsubscribe;
  }, [fetchBudgets]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleSortChange = ({
    sortBy: colKey,
    sortOrder: order,
  }: {
    sortBy: string;
    sortOrder: "asc" | "desc";
  }) => {
    setSortBy(colKey);
    setSortOrder(order);
    setPage(1);
  };

  const handleDelete = async (budgetId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();

    const result = await fireManagedSwal({
      icon: "warning",
      title: "Are you sure?",
      text: `Delete budget ${budgetId}?`,
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete",
      reverseButtons: true,
    });
    if (!result.isConfirmed) return;

    try {
      showLoading("Deleting budget...");
      const res = await deleteBudgetById(budgetId);
      closeSwal();
      if (!res?.message || res.message.status_code !== 200) {
        showApiError(res?.message?.message || "Failed to delete budget");
        return;
      }
      setBudgets((prev) => prev.filter((b) => b.budgetId !== budgetId));
      showSuccess("Budget deleted successfully");
    } catch (err) {
      closeSwal();
      showApiError(err);
    }
  };

  const fetchAllForExport = async (): Promise<BudgetSummary[]> => {
    try {
      let all: BudgetSummary[] = [];
      let current = 1;
      let total = 1;
      do {
        const res = await getAllBudgets({
          page: current,
          pageSize: 100,
          sortBy: mapSortField(sortBy),
          sortOrder,
          search: searchTerm,
          status: filters.status?.join(","),
          budgetAgainst: filters.budgetAgainst?.join(","),
        });
        if (res?.status_code === 200) {
          all = [...all, ...res.data.map(mapBudget)];
          total = res.pagination?.total_pages || 1;
        }
        current++;
      } while (current <= total);
      return all;
    } catch (error) {
      showApiError(error);
      return [];
    }
  };

  const handleExportExcel = async () => {
    try {
      showLoading("Exporting Budgets...");
      const data = await fetchAllForExport();
      if (!data.length) {
        closeSwal();
        showApiError("No budgets to export");
        return;
      }

      const worksheet = XLSX.utils.json_to_sheet(
        data.map((b) => ({
          "Budget ID": b.budgetId,
          "Budget Against": b.budgetAgainst,
          Name: b.budgetAgainstName,
          "Fiscal Year": b.fiscalYear,
          Currency: b.currency,
          "Total Budget": b.totalBudget,
          "Actual Spent": b.actualSpent,
          Remaining: b.totalBudget - b.actualSpent,
          Status: b.status,
        })),
      );
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Budgets");
      saveAs(
        new Blob([XLSX.write(workbook, { bookType: "xlsx", type: "array" })], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
        "Budgets.xlsx",
      );

      closeSwal();
      showSuccess("Budgets exported successfully");
    } catch (error) {
      closeSwal();
      showApiError(error);
    }
  };

  // ── Columns ────────────────────────────────────────────────────────────────
  const columns: Column<BudgetSummary>[] = useMemo(
    () => [
      {
        key: "budgetId",
        header: "Budget ID",
        align: "left",
        sortable: true,
        render: (b) => (
          <div className="py-1.5">
            <span className="block">{b.budgetId}</span>
          </div>
        ),
        tooltip: (b) => `Budget: ${b.budgetId}`,
      },
      {
        key: "budgetAgainst",
        header: "Against",
        align: "center",
        render: (b) => (
          <div className="py-1.5">
            <span className="block">{b.budgetAgainst}</span>
          </div>
        ),
      },
      {
        key: "budgetAgainstName",
        header: "Cost Center / Project",
        align: "left",
        sortable: true,
        render: (b) => (
          <div className="py-1.5">
            <span className="block font-medium">
              {b.budgetAgainstName || "—"}
            </span>
          </div>
        ),
      },
      {
        key: "fiscalYear",
        header: "Fiscal Year",
        align: "center",
        sortable: true,
        render: (b) => (
          <div className="py-1.5">
            <span className="block">{b.fiscalYear}</span>
          </div>
        ),
      },
      {
        key: "totalBudget",
        header: "Budget",
        align: "center",
        sortable: true,
        render: (b) => (
          <div className="py-1.5">
            <span className="block whitespace-nowrap">
              {formatAmount(b.currency, b.totalBudget, { withSymbol: true })}
            </span>
          </div>
        ),
      },
      {
        key: "actualSpent",
        header: "Spent",
        align: "center",
        render: (b) => (
          <div className="py-1.5">
            <span className="block whitespace-nowrap">
              {formatAmount(b.currency, b.actualSpent, { withSymbol: true })}
            </span>
          </div>
        ),
      },
      {
        key: "remaining",
        header: "Remaining",
        align: "center",
        render: (b) => {
          const remaining = b.totalBudget - b.actualSpent;
          return (
            <div className="py-1.5">
              <span
                className={`block whitespace-nowrap ${
                  remaining < 0 ? "text-danger font-semibold" : ""
                }`}
              >
                {formatAmount(b.currency, remaining, { withSymbol: true })}
              </span>
            </div>
          );
        },
      },
      {
        key: "status",
        header: "Status",
        align: "center",
        render: (b) => (
          <div className="py-1.5 flex items-center justify-center">
            <StatusBadge status={b.status as any} />
          </div>
        ),
      },
      {
        key: "actions",
        header: "Actions",
        align: "center",
        render: (b) => {
          const isDraft = b.status === "Draft";
          const canDelete = can(BUDGET_MODULE, "delete") && isDraft;
          return (
            <div className="flex items-center justify-center gap-2">
              <ActionButton
                type="view"
                onClick={(e) => {
                  e?.stopPropagation();
                  onViewBudget?.(b.budgetId);
                }}
                iconOnly
              />
              <PermissionGate module={BUDGET_MODULE} action="write">
                <ActionButton
                  type="edit"
                  onClick={(e) => {
                    e?.stopPropagation();
                    onEditBudget?.(b.budgetId);
                  }}
                  iconOnly
                  disabled={!isDraft}
                  title={
                    isDraft ? "Edit Budget" : "Only Draft budgets can be edited"
                  }
                />
              </PermissionGate>
              <div className={!canDelete ? "opacity-40 pointer-events-none" : ""}>
                <ActionMenu
                  showDownload={false}
                  {...(canDelete
                    ? { onDelete: (e) => handleDelete(b.budgetId, e) }
                    : {})}
                  customActions={[]}
                />
              </div>
            </div>
          );
        },
      },
    ],
    [formatAmount, can, onViewBudget, onEditBudget],
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="h-full min-h-0">
      <Table
        columns={columns}
        data={budgets}
        rowKey={(row) => row.budgetId}
        tableId="budgets"
        loading={isInitialLoad}
        isFetching={isFetching}
        showToolbar
        searchValue={searchTerm}
        onSearch={(q) => {
          setSearchTerm(q);
          setPage(1);
        }}
        enableAdd={can(BUDGET_MODULE, "create")}
        addLabel="Add Budget"
        onAdd={onAddBudget}
        enableColumnSelector
        enableExport={can(BUDGET_MODULE, "export")}
        onExport={handleExportExcel}
        currentPage={page}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={totalItems}
        pageSizeOptions={[20, 35, 45, 55, 100]}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
        onPageChange={setPage}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
        onRowDoubleClick={(b) => onViewBudget?.(b.budgetId)}
        multiSelectFilters={[
          {
            key: "status",
            label: "Status",
            options: statusOptions,
            values: filters.status ?? [],
            onChange: (vals) => {
              setFilters((prev) => ({
                ...prev,
                status: vals.length > 0 ? vals : undefined,
              }));
              setPage(1);
            },
          },
          {
            key: "budgetAgainst",
            label: "Against",
            options: budgetAgainstOptions,
            values: filters.budgetAgainst ?? [],
            onChange: (vals) => {
              setFilters((prev) => ({
                ...prev,
                budgetAgainst: vals.length > 0 ? vals : undefined,
              }));
              setPage(1);
            },
          },
        ]}
      />
    </div>
  );
};

export default Budget;