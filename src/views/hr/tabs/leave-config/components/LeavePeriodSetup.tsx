// ─── LeavePeriodSetup.tsx ──────────────────────────────────────────────────────
import { useCallback, useMemo, useState } from "react";

import Table from "../../../../../components/ui/Table/Table";
import ActionButton, {
  ActionGroup,
  ActionMenu,
} from "../../../../../components/ui/Table/ActionButton";
import type { Column } from "../../../../../components/ui/Table/type";
import { LeavePeriodModal } from "../../../../../components/Hr/hrsetupmodals/LeavePeriodModal";
import {
  deleteLeavePeriod,
  type LeavePeriod,
} from "../../../../../api/leaveConfigApi";
import { showApiError, showSuccess } from "../../../../../utils/alert";
import { useLeavePeriods } from "../hooks/useLeavePeriod";

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
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<LeavePeriod | null>(null);
  const MODAL_ID = "leave-period-modal";

  const handleDelete = useCallback(
    async (row: LeavePeriod) => {
      if (!row.name) return;
      if (!confirm(`Delete leave period "${row.name}"?`)) return;
      
      try {
        setActionLoadingId(row.name);
        await deleteLeavePeriod(row.name);
        showSuccess("Leave period deleted");
        fetchAll();
      } catch (err: any) {
        showApiError(err?.message ?? "Failed to delete leave period");
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
          <span className="font-medium text-main">
            {row.name || "—"}
          </span>
        ),
      },
      {
        key: "from_date",
        header: "From Date",
        render: (row) => (
          <span className="text-sm text-sub">
            {row.from_date || "—"}
          </span>
        ),
      },
      {
        key: "to_date",
        header: "To Date",
        render: (row) => (
          <span className="text-sm text-sub">
            {row.to_date || "—"}
          </span>
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
        rowKey={(row) => row.name}
        showToolbar
        searchValue={search}
        onSearch={(v) => {
          setSearch(v);
          setPage(1);
        }}
        enableAdd
        addLabel="Add Leave Period"
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
        tableId="leave-periods-table"
      />

      <LeavePeriodModal
        modalId={MODAL_ID}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialData={editTarget}
        onSuccess={fetchAll}
      />
    </>
  );
}