import { useCallback, useMemo, useState } from "react";

import Table from "../../../../../components/ui/Table/Table";
import ActionButton, {
  ActionGroup,
  ActionMenu,
} from "../../../../../components/ui/Table/ActionButton";
import type { Column } from "../../../../../components/ui/Table/type";
import {
  deleteSalaryStructure,
  type SalaryStructure,
} from "../../../../../api/payrollConfigApi";
import { showApiError, showSuccess } from "../../../../../utils/alert";
import { useSalaryStructures } from "../hooks/useSalaryStructures";
import { openSalaryStructureModal } from "../../../../../store/modalStore";

export function SalaryStructureSetup() {
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
    fetchDetail,
  } = useSalaryStructures();
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);


  const handleEdit = useCallback(
    async (row: SalaryStructure) => {
      const detail = await fetchDetail(row.name!);
      if (!detail) return;
      openSalaryStructureModal(
  detail,
  true,
  {
    onSuccess: fetchAll,
  },
  {
    title: "Edit Salary Structure",
  },
);
    },
    [fetchDetail],
  );

  const handleDelete = useCallback(
    async (row: SalaryStructure) => {
      if (!row.name) return;
      if (!confirm(`Delete "${row.name}"?`)) return;
      try {
        setActionLoadingId(row.name);
        await deleteSalaryStructure(row.name);
        showSuccess("Structure deleted");
        fetchAll();
      } catch (err: any) {
        showApiError(err?.message ?? "Failed to delete");
      } finally {
        setActionLoadingId(null);
      }
    },
    [fetchAll],
  );

  const columns: Column<SalaryStructure>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Structure Name",
        render: (row) => (
          <span className="font-medium text-main">{row.name || "—"}</span>
        ),
        tooltip: (row) => row.name ?? "",
      },
      {
        key: "is_active",
        header: "Status",
        render: (row) => (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              row.is_active === "Yes"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            {row.is_active === "Yes" ? "Active" : "Inactive"}
          </span>
        ),
      },
      {
        key: "docstatus",
        header: "Doc Status",
        render: (row) => {
          const labels: Record<number, string> = {
            0: "Draft",
            1: "Submitted",
            2: "Cancelled",
          };
          const colors: Record<number, string> = {
            0: "text-amber-600",
            1: "text-blue-600",
            2: "text-red-500",
          };
          const status = row.docstatus ?? 0;
          return (
            <span className={`text-xs font-semibold ${colors[status]}`}>
              {labels[status] ?? "—"}
            </span>
          );
        },
      },
      {
        key: "description",
        header: "Description",
        render: (row) => (
          <span className="text-sm text-sub line-clamp-1">
            {row.description || "—"}
          </span>
        ),
        tooltip: (row) => row.description ?? "",
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
              onClick={() => handleEdit(row)}
              disabled={actionLoadingId === row.name}
            />
            <ActionMenu
              customActions={[
                {
                  label: "Delete",
                  onClick: () => handleDelete(row),
                  disabled: actionLoadingId === row.name,
                },
              ]}
            />
          </ActionGroup>
        ),
      },
    ],
    [actionLoadingId, handleEdit, handleDelete],
  );

  return (
    <>
      <Table
        columns={columns}
        data={rows}
        loading={loading}
        rowKey={(row) => row.name ?? ""}
        showToolbar
        searchValue={search}
        onSearch={(v) => {
          setSearch(v);
          setPage(1);
        }}
        enableAdd
        addLabel="Add Structure"
        onAdd={() =>
  openSalaryStructureModal(
    null,
    false,
    {
      onSuccess: fetchAll,
    },
    {
      title: "New Salary Structure",
    },
  )
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
        tableId="salary-structures"
      />

   
    </>
  );
}
