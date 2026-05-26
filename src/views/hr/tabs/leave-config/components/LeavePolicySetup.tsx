import { useCallback, useMemo, useState } from "react";
import ModalTable from "../../../../../components/ui/Table/ModalTableInside";
import ActionButton, {
  ActionGroup,
  ActionMenu,
} from "../../../../../components/ui/Table/ActionButton";
import type { Column } from "../../../../../components/ui/Table/type";
import {
  deleteLeavePolicy,
  updateLeavePolicy,
  type LeavePolicy,
} from "../../../../../api/leaveConfigApi";
import { showApiError, showSuccess } from "../../../../../utils/alert";
import { parseFrappeError } from "../hooks/parseFrappeError";
import { useLeavePolicies } from "../hooks/useLeavePolicies";
import { confirmDelete } from "../../../../../api/utils/confirmDelete";
import { openLeavePolicyModal } from "../../../../../store/modalStore";

export function LeavePolicySetup() {
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
  } = useLeavePolicies();

  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const handleDelete = useCallback(
    async (row: LeavePolicy) => {
      if (!row.name) return;
      if (row.docstatus === 1) {
        showApiError("Cannot delete a submitted policy. Cancel it first.");
        return;
      }
      try {
        setActionLoadingId(row.name);
        const deleted = await confirmDelete({
          text: `Delete leave policy "${row.title || row.name}"?`,
          loadingText: "Deleting Policy...",
          successMessage: "Leave policy deleted",
          action: async () => {
            await deleteLeavePolicy(row.name!);
          },
        });
        if (deleted) fetchAll();
      } finally {
        setActionLoadingId(null);
      }
    },
    [fetchAll],
  );

  const handleStatusChange = useCallback(
    async (row: LeavePolicy, newStatus: 1 | 2) => {
      if (!row.name) return;
      const actionText = newStatus === 1 ? "submit" : "cancel";
      try {
        setActionLoadingId(row.name);
        await updateLeavePolicy(row.name, { docstatus: newStatus });
        showSuccess(
          `Leave policy ${newStatus === 1 ? "submitted" : "cancelled"} successfully`,
        );
        fetchAll();
      } catch (err: any) {
        showApiError(
          parseFrappeError(err) || `Failed to ${actionText} leave policy`,
        );
      } finally {
        setActionLoadingId(null);
      }
    },
    [fetchAll],
  );

  const columns: Column<LeavePolicy>[] = useMemo(
    () => [
      {
        key: "title",
        header: "Policy Title",
        render: (row) => (
          <span className="font-medium text-main">
            {row.title || row.name || "—"}
          </span>
        ),
      },
      {
        key: "details_count",
        header: "Configured Leave Types",
        render: (row) => (
          <span className="text-sm text-sub">
            {row.leave_policy_details?.length || 0} types assigned
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
          const dropdownActions = [];
          if (row.docstatus === 0) {
            dropdownActions.push({
              label: "Submit",
              onClick: () => handleStatusChange(row, 1),
              disabled: actionLoadingId === row.name,
            });
            dropdownActions.push({
              label: "Delete",
              onClick: () => handleDelete(row),
              disabled: actionLoadingId === row.name,
            });
          } else if (row.docstatus === 1) {
            dropdownActions.push({
              label: "Cancel Policy",
              onClick: () => handleStatusChange(row, 2),
              disabled: actionLoadingId === row.name,
            });
          } else if (row.docstatus === 2) {
            dropdownActions.push({
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
                 openLeavePolicyModal(
                   { ...row, _isView: true } as any,  
                   true,                             
                   { onSuccess: fetchAll }           
                 )
               }
             />
              {dropdownActions.length > 0 && (
                <ActionMenu customActions={dropdownActions} />
              )}
            </ActionGroup>
          );
        },
      },
    ],
    [actionLoadingId, handleDelete, handleStatusChange, fetchAll],
  );

  return (
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
      addLabel="Add Leave Policy"
      onAdd={() => openLeavePolicyModal(null, false, { onSuccess: fetchAll })}
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
      tableId="leave-policies-table"
    />
  );
}