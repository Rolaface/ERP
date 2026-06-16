import { useCallback, useMemo, useState } from "react";
import ModalTable from "../../../../../components/ui/Table/ModalTableInside";
import ActionButton, {
  ActionGroup,
  ActionMenu,
} from "../../../../../components/ui/Table/ActionButton";
import type { Column } from "../../../../../components/ui/Table/type";
import {
  deleteLeavePolicyAssignment,
  updateLeavePolicyAssignment,
  type LeavePolicyAssignment,
} from "../../../../../api/leaveConfigApi";
import { showApiError } from "../../../../../utils/alert";
import { useLeavePolicyAssignments } from "../hooks/useLeavePolicyAssignments";
import { confirmCancel } from "../../../../../api/utils/confirmCancel";
import { confirmDelete } from "../../../../../api/utils/confirmDelete";
import { openLeavePolicyAssignmentModal } from "../../../../../store/modalStore";

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

  const handleDelete = useCallback(
    async (row: LeavePolicyAssignment) => {
      if (!row.name) return;
      if (row.docstatus === 1) {
        showApiError("Cannot delete a submitted assignment. Cancel it first.");
        return;
      }
      try {
        setActionLoadingId(row.name);
        const deleted = await confirmDelete({
          text: `Delete "${row.name}"?`,
          loadingText: "Deleting Leave Policy Assignment..",
          successMessage: "Leave Policy Assignment deleted",
          action: async () => {
            await deleteLeavePolicyAssignment(row.name!);
          },
        });
        if (deleted) fetchAll();
      } finally {
        setActionLoadingId(null);
      }
    },
    [fetchAll],
  );

  const handleCancel = useCallback(
    async (row: LeavePolicyAssignment) => {
      if (!row.name) return;
      try {
        setActionLoadingId(row.name);
        const cancelled = await confirmCancel({
          text: `Cancel assignment for "${row.employee_name}"?`,
          loadingText: "Cancelling Leave Policy Assignment..",
          successMessage: "Leave Policy Assignment cancelled",
          action: async () => {
            await updateLeavePolicyAssignment(row.name!, { docstatus: 2 });
          },
        });
        if (cancelled) fetchAll();
      } catch (err) {
        showApiError("Failed to cancel assignment");
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
            {row.employee_name || "—"}
          </span>
        ),
      },
      {
        key: "leave_policy",
        header: "Leave Policy",
        render: (row) => (
          <span className="text-sm text-sub">{row.leave_policy || "—"}</span>
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
          const status =
            statusMap[row.docstatus as keyof typeof statusMap] || statusMap[0];
          return (
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${status.class}`}
            >
              {status.label}
            </span>
          );
        },
      },
      {
        key: "actions",
        header: "Actions",
        align: "center",
        render: (row) => {
          const menuActions = [];
          
          if (row.docstatus === 1) {
            menuActions.push({
              label: "Cancel",
              onClick: () => handleCancel(row),
              disabled: actionLoadingId === row.name,
            });
          }
          
          if (row.docstatus === 0 || row.docstatus === 2) {
            menuActions.push({
              label: "Delete",
              onClick: () => handleDelete(row),
              disabled: actionLoadingId === row.name,
            });
          }
          return (
            <ActionGroup>
              <ActionButton
                type="view"
                iconOnly
                onClick={() => 
                  openLeavePolicyAssignmentModal(
                    { ...row, _isView: true } as any,  
                    true,                             
                    { onSuccess: fetchAll }           
                  )
                }
              />
               {menuActions.length > 0 && (
                <ActionMenu customActions={menuActions} />
              )}
            </ActionGroup>
          );
        },
      },
    ],
    [actionLoadingId, handleDelete, fetchAll],
  );

  return (
     <div className="h-[calc(100vh-220px)]"> 
    <ModalTable
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
      onAdd={() => openLeavePolicyAssignmentModal(null, false, { onSuccess: fetchAll })}
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
    </div>
  );
}