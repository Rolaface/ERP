// ─── LeaveTypeSetup.tsx ──────────────────────────────────────────────────────
import { useCallback, useMemo, useState } from "react";

import Table from "../../../../../components/ui/Table/Table";
import ActionButton, {
  ActionGroup,
  ActionMenu,
} from "../../../../../components/ui/Table/ActionButton";
import type { Column } from "../../../../../components/ui/Table/type";

import { LeaveTypeModal } from "../../../../../components/Hr/hrsetupmodals/LeaveTypeModal";
import {
  deleteLeaveType,
  type LeaveType,
} from "../../../../../api/leaveConfigApi";
import { showApiError, showSuccess } from "../../../../../utils/alert";
import { useLeaveTypes } from "../hooks/useLeaveTypes";

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
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<LeaveType | null>(null);
  const MODAL_ID = "leave-type-modal";

  const handleDelete = useCallback(
    async (row: LeaveType) => {
      if (!row.name) return;
      if (!confirm(`Delete leave type "${row.leave_type_name}"?`)) return;
      
      try {
        setActionLoadingId(row.name);
        await deleteLeaveType(row.name);
        showSuccess("Leave type deleted");
        fetchAll();
      } catch (err: any) {
        showApiError(err?.message ?? "Failed to delete leave type");
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
        header: "Leave Type",
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
        header: "Carry Forward",
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
        header: "Negative Balance",
        render: (row) => (
          <span className="text-sm text-sub">
            {row.allow_negative ? "Allowed" : "Not Allowed"}
          </span>
        ),
      },
      {
        key: "fraction_of_daily_salary_per_leave",
        header: "Salary Fraction",
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
              onClick={() => {
                setEditTarget(row);
                setModalOpen(true);
              }}
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
    [actionLoadingId, handleDelete],
  );

  return (
    <>
      <Table
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
        onAdd={() => {
          setEditTarget(null);
          setModalOpen(true);
        }}
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

      <LeaveTypeModal
        modalId={MODAL_ID}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialData={editTarget}
        onSuccess={fetchAll}
      />
    </>
  );
}