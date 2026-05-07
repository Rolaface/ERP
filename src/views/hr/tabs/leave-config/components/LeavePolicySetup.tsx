// ─── LeavePolicySetup.tsx ──────────────────────────────────────────────────────
import { useCallback, useMemo, useState } from "react";

import Table from "../../../../../components/ui/Table/Table";
import ActionButton, {
  ActionGroup,
  ActionMenu,
} from "../../../../../components/ui/Table/ActionButton";
import type { Column } from "../../../../../components/ui/Table/type";

import { LeavePolicyModal } from "../../../../../components/Hr/hrsetupmodals/LeavePolicyModal";
import {
  deleteLeavePolicy,
  updateLeavePolicy, // <-- Make sure to import this
  type LeavePolicy,
} from "../../../../../api/leaveConfigApi";
import { showApiError, showSuccess } from "../../../../../utils/alert";
import { parseFrappeError } from "../hooks/parseFrappeError";
import { useLeavePolicies } from "../hooks/useLeavePolicies";

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
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<LeavePolicy | null>(null);
  const MODAL_ID = "leave-policy-modal";

  // ─── Delete Handler ────────────────────────────────────────────────────────
  const handleDelete = useCallback(
    async (row: LeavePolicy) => {
      if (!row.name) return;
      if (row.docstatus === 1) {
        showApiError("Cannot delete a submitted policy. Cancel it first.");
        return;
      }
      if (!confirm(`Delete leave policy "${row.title || row.name}"?`)) return;
      
      try {
        setActionLoadingId(row.name);
        await deleteLeavePolicy(row.name);
        showSuccess("Leave policy deleted");
        fetchAll();
      } catch (err: any) {
        showApiError(parseFrappeError(err) || "Failed to delete leave policy");
      } finally {
        setActionLoadingId(null);
      }
    },
    [fetchAll],
  );

  // ─── Status Update Handler (Submit / Cancel) ───────────────────────────────
  const handleStatusChange = useCallback(
    async (row: LeavePolicy, newStatus: 1 | 2) => {
      if (!row.name) return;
      const actionText = newStatus === 1 ? "submit" : "cancel";
      
      if (!confirm(`Are you sure you want to ${actionText} leave policy "${row.title || row.name}"?`)) return;

      try {
        setActionLoadingId(row.name);
        // Only sending the docstatus to update it
        await updateLeavePolicy(row.name, { docstatus: newStatus });
        showSuccess(`Leave policy ${newStatus === 1 ? "submitted" : "cancelled"} successfully`);
        fetchAll();
      } catch (err: any) {
        showApiError(parseFrappeError(err) || `Failed to ${actionText} leave policy`);
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
        render: (row) => {
          // Dynamically build dropdown menu based on docstatus
          const dropdownActions = [];

          if (row.docstatus === 0) {
            // Draft Actions
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
            // Submitted Actions
            dropdownActions.push({
              label: "Cancel Policy",
              onClick: () => handleStatusChange(row, 2),
              disabled: actionLoadingId === row.name,
            });
          } else if (row.docstatus === 2) {
            // Cancelled Actions
            dropdownActions.push({
              label: "Delete",
              onClick: () => handleDelete(row),
              disabled: actionLoadingId === row.name,
            });
          }

          return (
            <ActionGroup>
              <ActionButton
                type="edit"
                iconOnly
                onClick={() => {
                  setEditTarget(row);
                  setModalOpen(true);
                }}
                disabled={actionLoadingId === row.name || row.docstatus !== 0} // Disable edit if not Draft
              />
              {dropdownActions.length > 0 && (
                <ActionMenu customActions={dropdownActions} />
              )}
            </ActionGroup>
          );
        },
      },
    ],
    [actionLoadingId, handleDelete, handleStatusChange],
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
        addLabel="Add Leave Policy"
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
        tableId="leave-policies-table"
      />

      <LeavePolicyModal
        modalId={MODAL_ID}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialData={editTarget}
        onSuccess={fetchAll}
      />
    </>
  );
}