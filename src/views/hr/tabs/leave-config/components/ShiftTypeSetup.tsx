import { useCallback, useMemo, useState } from "react";
import ModalTable from "../../../../../components/ui/Table/ModalTableInside";
import ActionButton, {
  ActionGroup,
  ActionMenu
} from "../../../../../components/ui/Table/ActionButton";
import type { Column } from "../../../../../components/ui/Table/type";
import { deleteShiftType } from "../../../../../api/shiftTypeApi";
import { showApiError } from "../../../../../utils/alert";
import { useShiftTypes, type ShiftType } from "../hooks/useShiftTypes";
import { confirmDelete } from "../../../../../api/utils/confirmDelete";
import { openShiftTypeModal } from "../../../../../store/modalStore";

export function ShiftTypeSetup() {
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
  } = useShiftTypes();

  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const handleDelete = useCallback(
    async (row: ShiftType) => {
      if (!row.name) return;

      try {
        setActionLoadingId(row.name);

        const deleted = await confirmDelete({
          text: `Delete shift type "${row.name}"?`,
          loadingText: "Deleting...",
          successMessage: "Shift type deleted successfully",
          action: async () => {
            await deleteShiftType(row.name!);
          },
        });

        if (deleted) fetchAll();
      } catch (err: any) {
        showApiError(err?.message || "Failed to delete shift type");
      } finally {
        setActionLoadingId(null);
      }
    },
    [fetchAll],
  );

  const columns: Column<ShiftType>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Shift Name",
        render: (row) => (
          <span className="font-medium text-main">{row.name || "—"}</span>
        ),
      },
      {
        key: "start_time",
        header: "Start Time",
        render: (row) => <span className="text-sm text-sub">{row.start_time}</span>,
      },
      {
        key: "end_time",
        header: "End Time",
        render: (row) => <span className="text-sm text-sub">{row.end_time}</span>,
      },
      {
        key: "actions",
        header: "Actions",
        align: "center",
        render: (row) => (
          <ActionGroup>
            <ActionButton
              type="view"
              iconOnly
              onClick={() => openShiftTypeModal(
                row,
                true,
                { onSuccess: fetchAll, isViewMode: true },
                { title: "" },
              )}
            />
            <ActionButton
              type="edit"
              iconOnly
              onClick={() => openShiftTypeModal(row, true, { onSuccess: fetchAll })}
              disabled={actionLoadingId === row.name}
            />
            <ActionMenu
              onDelete={() => handleDelete(row)}
            />
          </ActionGroup>
        ),
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
        tableId="shift-types-table"
        showToolbar
        toolbarPlaceholder="Search shift types..."
        searchValue={search}
        onSearch={(v) => {
          setSearch(v);
          setPage(1);
        }}
        enableAdd
        addLabel="+ Add Shift Type"
        onAdd={() => openShiftTypeModal(null, false, { onSuccess: fetchAll })}
        enableColumnSelector
        defaultVisibleKeys={["name", "start_time", "end_time", "actions"]}
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        pageSizeOptions={[20, 50, 100,200]}

        onPageChange={setPage}
        onPageSizeChange={(s) => {
          setPageSize(s);
          setPage(1);
        }}
        onRowDoubleClick={(row) =>
          openShiftTypeModal(
            row,
            true,
            { onSuccess: fetchAll, isViewMode: true },
            { title: "" }
          )
        }
      />
    </div>
  );
}