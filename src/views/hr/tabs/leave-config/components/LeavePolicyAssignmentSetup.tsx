// ─── LeavePolicyAssignmentSetup.tsx ──────────────────────────────────────────
import { useCallback, useMemo, useState } from "react";

import Table from "../../../../../components/ui/Table/Table";
import ActionButton, {
  ActionGroup,
  ActionMenu,
} from "../../../../../components/ui/Table/ActionButton";
import type { Column } from "../../../../../components/ui/Table/type";

import { LeavePolicyAssignmentModal } from "../../../../../components/Hr/hrsetupmodals/LeavePolicyAssignmentModal";
import {
  deleteLeavePolicyAssignment,
  type LeavePolicyAssignment,
} from "../../../../../api/leaveConfigApi";
import { showApiError, showSuccess } from "../../../../../utils/alert";
import { useLeavePolicyAssignments } from "../hooks/useLeavePolicyAssignments";

export function LeavePolicyAssignmentSetup() {
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
  } = useLeavePolicyAssignments();
  
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<LeavePolicyAssignment | null>(null);
  const MODAL_ID = "leave-policy-assignment-modal";

  const handleDelete = useCallback(
    async (row: LeavePolicyAssignment) => {
      if (!row.name) return;
      if (row.docstatus === 1) {
        showApiError("Cannot delete a submitted assignment. Cancel it first.");
        return;
      }
      if (!confirm(`Delete assignment for employee "${row.employee}"?`)) return;
      
      try {
        setActionLoadingId(row.name);
        await deleteLeavePolicyAssignment(row.name);
        showSuccess("Leave policy assignment deleted");
        fetchAll();
      } catch (err: any) {
        showApiError(err?.message ?? "Failed to delete leave policy assignment");
      } finally {
        setActionLoadingId(null);
      }
    },
    [fetchAll],
  );

  const columns: Column<LeavePolicyAssignment>[] = useMemo(
    () => [
      {
        key: "employee",
        header: "Employee",
        render: (row) => (
          <span className="font-medium text-main">
            {row.employee || "—"}
          </span>
        ),
      },
      {
        key: "leave_policy",
        header: "Leave Policy",
        render: (row) => (
          <span className="text-sm text-sub">
            {row.leave_policy || "—"}
          </span>
        ),
      },
      {
        key: "assignment_based_on",
        header: "Based On",
        render: (row) => (
          <span className="text-sm text-main">
            {row.assignment_based_on}
            {row.assignment_based_on === "Leave Period" && (
              <span className="ml-1 text-xs text-sub">({row.leave_period})</span>
            )}
          </span>
        ),
      },
      {
        key: "carry_forward",
        header: "Carry Forward",
        render: (row) => (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              row.carry_forward
                ? "bg-emerald-100 text-emerald-700"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {row.carry_forward ? "Yes" : "No"}
          </span>
        ),
      },
      {
        key: "docstatus",
        header: "Status",
        render: (row) => {
          const statusMap = {
            0: { label: "Draft", class: "bg-gray-100 text-gray-700" },
            1: { label: "Submitted", class: "bg-blue-100 text-blue-700" },
            2: { label: "Cancelled", class: "bg-red-100 text-red-700" },
          };
          const status = statusMap[row.docstatus as keyof typeof statusMap] || statusMap[0];
          return (
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${status.class}`}>
              {status.label}
            </span>
          );
        },
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
              disabled={actionLoadingId === row.name || row.docstatus === 1}
            />
            <ActionMenu
              customActions={[
                {
                  label: "Delete",
                  onClick: () => handleDelete(row),
                  disabled: actionLoadingId === row.name || row.docstatus === 1,
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
        rowKey={(row) => row.name!}
        showToolbar
        searchValue={search}
        onSearch={(v) => {
          setSearch(v);
          setPage(1);
        }}
        enableAdd
        addLabel="Add Assignment"
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
        tableId="leave-policy-assignments-table"
      />

      <LeavePolicyAssignmentModal
        modalId={MODAL_ID}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialData={editTarget}
        onSuccess={fetchAll}
      />
    </>
  );
}