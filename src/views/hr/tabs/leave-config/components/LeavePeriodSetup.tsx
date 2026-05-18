import { useCallback, useMemo, useState } from "react";
import ModalTable from "../../../../../components/ui/Table/ModalTableInside";
import ActionButton, {
  ActionGroup,
  ActionMenu,
} from "../../../../../components/ui/Table/ActionButton";
import type { Column } from "../../../../../components/ui/Table/type";
import {
  deleteLeavePeriod,
  type LeavePeriod,
} from "../../../../../api/leaveConfigApi";
import { useLeavePeriods } from "../hooks/useLeavePeriod";
import { confirmDelete } from "../../../../../api/utils/confirmDelete";
import { openLeavePeriodModal } from "../../../../../store/modalStore";

export function LeavePeriodSetup() {
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
  } = useLeavePeriods();

  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const handleDelete = useCallback(
    async (row: LeavePeriod) => {
      if (!row.name) return;
      try {
        setActionLoadingId(row.name);
        const deleted = await confirmDelete({
          text: `Delete "${row.name}"?`,
          loadingText: "Deleting Leave Period...",
          successMessage: "Leave Period deleted",
          action: async () => {
            await deleteLeavePeriod(row.name!);
          },
        });
        if (deleted) fetchAll();
      } finally {
        setActionLoadingId(null);
      }
    },
    [fetchAll],
  );

  const columns: Column<LeavePeriod>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Period Name",
        render: (row) => (
          <span className="font-medium text-main">{row.name || "—"}</span>
        ),
      },
      {
        key: "from_date",
        header: "From Date",
        render: (row) => (
          <span className="text-sm text-sub">{row.from_date || "—"}</span>
        ),
      },
      {
        key: "to_date",
        header: "To Date",
        render: (row) => (
          <span className="text-sm text-sub">{row.to_date || "—"}</span>
        ),
      },
      {
        key: "is_active",
        header: "Status",
        render: (row) => (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              row.is_active
                ? "bg-emerald-100 text-emerald-700"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {row.is_active ? "Active" : "Inactive"}
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
              onClick={() => openLeavePeriodModal(row, true, { onSuccess: fetchAll })}
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
    [actionLoadingId, handleDelete, fetchAll],
  );

  return (
    <ModalTable
      columns={columns}
      data={rows}
      loading={loading}
      rowKey={(row) => row.name}
      showToolbar
      searchValue={search}
      onSearch={(v) => {
        setSearch(v);
        setPage(1);
      }}
      enableAdd
      addLabel="Add Leave Period"
      onAdd={() => openLeavePeriodModal(null, false, { onSuccess: fetchAll })}
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
      tableId="leave-periods-table"
    />
  );
}