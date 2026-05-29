import { useCallback, useMemo, useState } from "react";

import ModalTable from "../../../../../components/ui/Table/ModalTableInside";
import ActionButton, { ActionGroup } from "../../../../../components/ui/Table/ActionButton";
import type { Column } from "../../../../../components/ui/Table/type";

import { deleteHolidayListByName } from "../../../../../api/holidayListApi";
import { showApiError } from "../../../../../utils/alert";
import { useHolidayLists, type HolidayList } from "../hooks/useHolidayLists";
import { confirmDelete } from "../../../../../api/utils/confirmDelete";
import { openHolidayListModal } from "../../../../../store/modalStore";

export function HolidayListSetup() {
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
  } = useHolidayLists();

  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // ─── Delete Handler ────────────────────────────────────────────────────────
  const handleDelete = useCallback(
    async (row: HolidayList) => {
      if (!row.name) return;

      try {
        setActionLoadingId(row.name);

        const deleted = await confirmDelete({
          text: `Delete holiday list "${row.holiday_list_name}"?`,
          loadingText: "Deleting...",
          successMessage: "Holiday list deleted successfully",
          action: async () => {
            await deleteHolidayListByName(row.name!);
          },
        });

        if (deleted) fetchAll();
      } catch (err: any) {
        showApiError(err?.message || "Failed to delete holiday list");
      } finally {
        setActionLoadingId(null);
      }
    },
    [fetchAll],
  );

  const columns: Column<HolidayList>[] = useMemo(
    () => [
      {
        key: "holiday_list_name",
        header: "Holiday List Name",
        render: (row) => (
          <span className="font-medium text-main">
            {row.holiday_list_name || row.name || "—"}
          </span>
        ),
      },
      {
        key: "from_date",
        header: "From Date",
        render: (row) => <span className="text-sm text-sub">{row.from_date}</span>,
      },
      {
        key: "to_date",
        header: "To Date",
        render: (row) => <span className="text-sm text-sub">{row.to_date}</span>,
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
              onClick={() => openHolidayListModal(row, true, { onSuccess: fetchAll })}
              disabled={actionLoadingId === row.name}
            />
            <ActionButton
              type="delete"
              iconOnly
              onClick={() => handleDelete(row)}
              disabled={actionLoadingId === row.name}
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
      rowKey={(row) => row.name!}
      tableId="holiday-lists-table"

      // Toolbar
      showToolbar
      toolbarPlaceholder="Search holiday lists..."
      searchValue={search}
      onSearch={(v) => {
        setSearch(v);
        setPage(1);
      }}
      enableAdd
      addLabel="+ Add Holiday List"
      onAdd={() => openHolidayListModal(null, false, { onSuccess: fetchAll })}
      enableColumnSelector
      defaultVisibleKeys={["holiday_list_name", "from_date", "to_date", "actions"]}

      // Pagination
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

      // Optional: constrain body height since it's a modal context
      bodyMaxHeight={400}
    />
  );
}