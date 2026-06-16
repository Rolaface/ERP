import { useCallback, useMemo, useState, useEffect } from "react";
import ModalTable from "../../../../../components/ui/Table/ModalTableInside";
import ActionButton, {
  ActionGroup,
  ActionMenu,
} from "../../../../../components/ui/Table/ActionButton";
import type { Column } from "../../../../../components/ui/Table/type";
import { useDataRefreshStore, REFRESH_KEYS } from "../../../../../store/dataRefreshStore";
import {
  deleteSalaryComponent,
  type SalaryComponent,
} from "../../../../../api/payrollConfigApi";
import { openSalaryComponentModal } from "../../../../../store/modalStore";
import { useSalaryComponents } from "../hooks/useSalaryComponents";
import { confirmDelete } from "../../../../../api/utils/confirmDelete";

export function SalaryComponentSetup() {
  const {
    rows,
    loading,
    search,
    setSearch,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    totalItems,
    fetchAll,
  } = useSalaryComponents();
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const triggerRefresh = useDataRefreshStore((state) => state.triggerRefresh);
  const subscribeToRefresh = useDataRefreshStore((state) => state.subscribeToRefresh);

  useEffect(() => {
    const unsubscribe = subscribeToRefresh(REFRESH_KEYS.SALARY_COMPONENT_LIST, () => {
      fetchAll();
    });
    return () => unsubscribe();
  }, [subscribeToRefresh, fetchAll]);

  const handleDelete = useCallback(
    async (row: SalaryComponent) => {
      if (!row.name) return;
      try {
        setActionLoadingId(row.name);
        const deleted = await confirmDelete({
          text: `Delete "${row.salary_component}"?`,
          loadingText: "Deleting Component...",
          successMessage: "Component deleted",
          action: async () => {
            await deleteSalaryComponent(row.name!);
          },
        });
        if (deleted) triggerRefresh(REFRESH_KEYS.SALARY_COMPONENT_LIST);
      } finally {
        setActionLoadingId(null);
      }
    },
    [triggerRefresh],
  );

  const columns: Column<SalaryComponent>[] = useMemo(
    () => [
      {
        key: "salary_component_abbr",
        header: "Code",
        render: (row) => (
          <span className="inline-block rounded bg-gray-100 px-2 py-0.5 font-mono text-xs font-semibold text-gray-700">
            {row.salary_component_abbr || "—"}
          </span>
        ),
      },
      {
        key: "salary_component",
        header: "Component",
        render: (row) => (
          <span className="font-medium text-main">{row.salary_component || "—"}</span>
        ),
        tooltip: (row) => row.salary_component,
      },
      {
        key: "type",
        header: "Type",
        render: (row) => (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              row.type === "Earning"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {row.type || "—"}
          </span>
        ),
      },
      {
        key: "amount_based_on_formula",
        header: "Basis",
        render: (row) => (
          <span className="text-sm text-main">
            {row.amount_based_on_formula ? "Formula" : "Fixed"}
          </span>
        ),
      },
      {
        key: "formula",
        header: "Formula",
        render: (row) =>
          row.amount_based_on_formula ? (
            <code className="rounded bg-gray-100 px-2 py-0.5 text-xs font-mono text-gray-700">
              {row.formula || "—"}
            </code>
          ) : (
            <span className="text-sm text-main">
              {row.amount != null ? row.amount : "—"}
            </span>
          ),
        tooltip: (row) => row.formula ?? String(row.amount ?? ""),
      },
      {
        key: "description",
        header: "Description",
        render: (row) => (
          <span className="text-sm text-main">
            {row.description || "—"}
          </span>
        ),
      },
      
      {
        key: "depends_on_payment_days",
        header: "Pay Days",
        render: (row) => (
          <span
            className={`text-xs font-semibold ${
              row.depends_on_payment_days ? "text-blue-600" : "text-gray-400"
            }`}
          >
            {row.depends_on_payment_days ? "Yes" : "No"}
          </span>
        ),
      },
      {
        key: "actions",
        header: "Actions",
        align: "center",
        render: (row) => (
          <ActionGroup>
            <ActionButton
              type="edit"
              iconOnly
              onClick={() =>
                openSalaryComponentModal(row, true, {
                  onSuccess: () => {
                    triggerRefresh(REFRESH_KEYS.SALARY_COMPONENT_LIST);
                  },
                })
              }
              disabled={actionLoadingId === row.name}
            />
           <ActionMenu
  onDelete={() => handleDelete(row)}
/>
          </ActionGroup>
        ),
      },
    ],
    [actionLoadingId, handleDelete, triggerRefresh],
  );

  return (
     <div className="h-[calc(100vh-220px)]"> 
    <ModalTable
      columns={columns}
      data={rows}
      loading={loading}
      rowKey={(row) => row.name ?? row.salary_component}
      showToolbar
      searchValue={search}
      onSearch={(v) => {
        setSearch(v);
        setPage(1);
      }}
      enableAdd
      addLabel="Add Component"
      onAdd={() =>
        openSalaryComponentModal(undefined, false, {
          onSuccess: () => {
            triggerRefresh(REFRESH_KEYS.SALARY_COMPONENT_LIST);
          },
        })
      }
      currentPage={page}
      totalPages={totalPages}
      totalItems={totalItems}
      pageSize={pageSize}
      pageSizeOptions={[10, 25, 50]}
      onPageChange={setPage}
      onPageSizeChange={(s) => {
        setPageSize(s);
        setPage(1);
      }}
      enableColumnSelector
      tableId="salary-components"
    />
    </div>
  );
}