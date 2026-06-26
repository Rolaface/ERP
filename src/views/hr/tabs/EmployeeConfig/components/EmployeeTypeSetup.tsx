import { useCallback, useEffect, useMemo, useState } from "react";
import { useDataRefreshStore, REFRESH_KEYS } from "../../../../../store/dataRefreshStore";
import ModalTable from "../../../../../components/ui/Table/ModalTableInside";
import ActionButton, {
  ActionGroup,
  ActionMenu,
} from "../../../../../components/ui/Table/ActionButton";
import type { Column } from "../../../../../components/ui/Table/type";
import {
  deleteEmployeeType,
  getAllEmployeeTypes,
  getEmployeeType,
  type EmployeeType,
} from "../../../../../api/employeeConfigApi";
import { showApiError, showSuccess } from "../../../../../utils/alert";
import { confirmDelete } from "../../../../../api/utils/confirmDelete";
import { openEmployeeTypeModal } from "../../../../../store/modalStore";

export function EmployeeTypeSetup() {
  const [rows, setRows] = useState<EmployeeType[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const triggerRefresh = useDataRefreshStore((state) => state.triggerRefresh);
  const subscribeToRefresh = useDataRefreshStore((state) => state.subscribeToRefresh);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const start = (page - 1) * pageSize;
      const response = await getAllEmployeeTypes(start, pageSize, search);
      setRows(response.data);
      setTotalItems(response.pagination.total);
      setTotalPages(response.pagination.total_pages);
    } catch (err: any) {
      showApiError(err?.message ?? "Failed to load employee types");
    } finally {
      setLoading(false);
    }
  }, [search, page, pageSize]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    const unsubscribe = subscribeToRefresh(REFRESH_KEYS.EMPLOYEE_TYPE_LIST, () => {
      fetchAll();
    });
    return unsubscribe;
  }, [subscribeToRefresh, fetchAll]);

  const handleEdit = useCallback(
    async (row: EmployeeType) => {
      if (!row.name) return;
      try {
        const detail = await getEmployeeType(row.name);
        openEmployeeTypeModal(
          detail,
          true,
          {
            onSuccess: () => {
              triggerRefresh(REFRESH_KEYS.EMPLOYEE_TYPE_LIST);
            },
          },
          { title: "Edit Employee Type" },
        );
      } catch (err: any) {
        showApiError(err?.message ?? "Failed to load employee type details");
      }
    },
    [triggerRefresh],
  );

  const handleDelete = useCallback(
    async (row: EmployeeType) => {
      if (!row.name) return;
      try {
        setActionLoadingId(row.name);
        const deleted = await confirmDelete({
          text: `Delete "${row.employee_type_name ?? row.name}"?`,
          loadingText: "Deleting Employee Type...",
          successMessage: "Employee type deleted",
          action: async () => {
            await deleteEmployeeType(row.name!);
          },
        });
        if (deleted) triggerRefresh(REFRESH_KEYS.EMPLOYEE_TYPE_LIST);
      } finally {
        setActionLoadingId(null);
      }
    },
    [triggerRefresh],
  );

  const columns: Column<EmployeeType>[] = useMemo(
    () => [
      {
        key: "employee_type",
        header: "Employee Type",
        render: (row) => (
          <span className="font-medium text-main">
            {row.employee_type_name || row.name || "-"}
          </span>
        ),
        tooltip: (row) => row.employee_type_name ?? row.name ?? "",
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
              onClick={() => handleEdit(row)}
              disabled={actionLoadingId === row.name}
            />
            <ActionMenu
  onDelete={() => handleDelete(row)}
/>
          </ActionGroup>
        ),
      },
    ],
    [actionLoadingId, handleDelete, handleEdit],
  );

  return (
     <div className="h-[calc(100vh-220px)]"> 
    <ModalTable
      columns={columns}
      data={rows}
      loading={loading}
      rowKey={(row) => row.name ?? row.employee_type_name}
      showToolbar
      searchValue={search}
      onSearch={(v) => {
        setSearch(v);
        setPage(1);
      }}
      enableAdd
      addLabel="Add Employee Type"
      onAdd={() =>
        openEmployeeTypeModal(
          null,
          false,
          {
            onSuccess: () => {
              triggerRefresh(REFRESH_KEYS.EMPLOYEE_TYPE_LIST);
            },
          },
          { title: "New Employee Type" },
        )
      }
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
      tableId="employee-types"
    />
    </div>
  );
}