import { useCallback, useMemo, useState } from "react";
import ModalTable from "../../../../../components/ui/Table/ModalTableInside";
import ActionButton, {
  ActionGroup,
  ActionMenu,
} from "../../../../../components/ui/Table/ActionButton";
import type { Column } from "../../../../../components/ui/Table/type";
import {
  deleteLeaveType,
  type LeaveType,
} from "../../../../../api/leaveConfigApi";
import { useLeaveTypes } from "../hooks/useLeaveTypes";
import { confirmDelete } from "../../../../../api/utils/confirmDelete";
import { openLeaveTypeModal } from "../../../../../store/modalStore";

export function LeaveTypeSetup() {
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
  } = useLeaveTypes();

  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const handleDelete = useCallback(
    async (row: LeaveType) => {
      if (!row.name) return;
      try {
        setActionLoadingId(row.name);
        const deleted = await confirmDelete({
          text: `Delete "${row.leave_type_name}"?`,
          loadingText: "Deleting Leave Type...",
          successMessage: "Leave type deleted",
          action: async () => {
            await deleteLeaveType(row.name!);
          },
        });
        if (deleted) fetchAll();
      } finally {
        setActionLoadingId(null);
      }
    },
    [fetchAll],
  );

  const columns: Column<LeaveType>[] = useMemo(
    () => [
      {
        key: "leave_type_name",
        header: "Type",
        render: (row) => (
          <span className="font-medium text-main">
            {row.leave_type_name || "—"}
          </span>
        ),
      },
      {
        key: "max_leaves_allowed",
        header: "Max Allowed",
        render: (row) => (
          <span className="text-sm font-semibold text-main">
            {row.max_leaves_allowed ?? "—"}
          </span>
        ),
      },
      {
        key: "is_lwp",
        header: "LWP",
        render: (row) => (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              row.is_lwp
                ? "bg-red-100 text-red-700"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {row.is_lwp ? "Yes" : "No"}
          </span>
        ),
      },
      {
        key: "is_carry_forward",
        header: "Carry Fwd",
        render: (row) => (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              row.is_carry_forward
                ? "bg-emerald-100 text-emerald-700"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {row.is_carry_forward ? "Yes" : "No"}
          </span>
        ),
      },
      {
        key: "allow_negative",
        header: "Neg Bal",
        render: (row) => (
          <span className="text-sm text-sub">
            {row.allow_negative ? "Allowed" : "Not Allowed"}
          </span>
        ),
      },
      {
        key: "fraction_of_daily_salary_per_leave",
        header: "Pay Fraction",
        render: (row) => (
          <code className="rounded bg-gray-100 px-2 py-0.5 text-xs font-mono text-gray-700">
            {row.fraction_of_daily_salary_per_leave ?? 1}
          </code>
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
              onClick={() => openLeaveTypeModal(row, true, { onSuccess: fetchAll })}
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
      rowKey={(row) => row.name ?? row.leave_type_name}
      showToolbar
      searchValue={search}
      onSearch={(v) => {
        setSearch(v);
        setPage(1);
      }}
      enableAdd
      addLabel="Add Leave Type"
      onAdd={() => openLeaveTypeModal(null, false, { onSuccess: fetchAll })}
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
      tableId="leave-types-table"
    />
  );
}