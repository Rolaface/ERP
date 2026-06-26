import { useCallback, useMemo, useState } from "react";
import ModalTable from "../../../../../components/ui/Table/ModalTableInside";
import ActionButton, {
  ActionGroup,
  ActionMenu,
} from "../../../../../components/ui/Table/ActionButton";
import type { Column } from "../../../../../components/ui/Table/type";
import {
  updateLeavePeriod,
  deleteLeavePeriod,
  type LeavePeriod,
} from "../../../../../api/leaveConfigApi";
import { useLeavePeriods } from "../hooks/useLeavePeriod";
import { confirmDelete } from "../../../../../api/utils/confirmDelete";
import { openLeavePeriodModal } from "../../../../../store/modalStore";
import { showApiError } from "../../../../../utils/alert";
import { parseFrappeError } from "../hooks/parseFrappeError";
import { Shield, ShieldOff, Trash2 } from "lucide-react";
import { tr } from "date-fns/locale";

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

        if (deleted) {
          fetchAll();
        }
      } catch (err: any) {
        showApiError(parseFrappeError(err) || "Failed to delete Leave Period.");
      }
      finally {
        setActionLoadingId(null);
      }
    },
    [fetchAll],
  );

  const handleStatus = useCallback(
    async (row: LeavePeriod) => {
      if (!row.name) return;
      try {
        setActionLoadingId(row.name);

        const newStatus = row.is_active ? 0 : 1;
        await updateLeavePeriod(row.name, { is_active: newStatus });
        fetchAll();
      } catch (error) {
        showApiError(parseFrappeError(error) || "Failed to update status.");
      } finally {
        setActionLoadingId(null);
      }
    },
    [fetchAll]
  );

  const formatDate = (date: string | Date) => {
    if (!date) return "";

    const months = [
      "JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
    ];

    if (typeof date === "string") {
      const [year, month, day] = date.split("T")[0].split("-").map(Number);
      return `${String(day).padStart(2, "0")}-${months[month - 1]}-${year}`;
    }

    // Date object — use local methods
    return `${String(date.getDate()).padStart(2, "0")}-${months[date.getMonth()]}-${date.getFullYear()}`;
  };


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
          <span className="text-sm text-sub">{formatDate(row.from_date) || "—"}</span>
        ),
      },
      {
        key: "to_date",
        header: "To Date",
        render: (row) => (
          <span className="text-sm text-sub">{formatDate(row.to_date) || "—"}</span>
        ),
      },
      {
        key: "is_active",
        header: "Status",
        render: (row) => (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${row.is_active
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
              type="view"
              iconOnly
              onClick={() =>
                openLeavePeriodModal(
                  { ...row, _isView: true } as any,
                  true,
                  { onSuccess: fetchAll }
                )
              }
            />
            {/* Edit Button: Normal edit behavior */}
            <ActionButton
              type="edit"
              iconOnly
              onClick={() => openLeavePeriodModal(row, true, { onSuccess: fetchAll })}
              disabled={actionLoadingId === row.name}
            />
            <ActionMenu
              customActions={[
             {
  label: row.is_active ? "Inactive" : "Activate",
  onClick: () => handleStatus(row),
  icon: row.is_active ? (
    <ShieldOff size={14} />
  ) : (
    <Shield size={14} />
  ),
  disabled: actionLoadingId === row.name,
},
                 {
      label: "Delete",
      icon: <Trash2 size={14} className=" text-red-600" />,
      onClick: () => handleDelete(row),
      disabled: actionLoadingId === row.name, 
      danger: true,
    },
              ]}
            />
          </ActionGroup>
        ),
      },
    ],
    [actionLoadingId, handleDelete, fetchAll, handleStatus],
  );

  return (
    <div className="h-[calc(100vh-220px)]">
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
        pageSizeOptions={[20, 50, 100,200]}

        onPageChange={setPage}
        onPageSizeChange={(s) => {
          setPageSize(s);
          setPage(1);
        }}
        enableColumnSelector
        tableId="leave-periods-table"
        onRowDoubleClick={(row) =>
          openLeavePeriodModal(
            { ...row, _isView: true } as any,
            true,
            { onSuccess: fetchAll }
          )
        }
      />
    </div>
  );
}