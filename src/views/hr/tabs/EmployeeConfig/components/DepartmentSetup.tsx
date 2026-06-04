import { useCallback, useEffect, useMemo, useState } from "react";
import ModalTable from "../../../../../components/ui/Table/ModalTableInside";
import ActionButton, {
  ActionGroup,
  ActionMenu,
} from "../../../../../components/ui/Table/ActionButton";
import type { Column } from "../../../../../components/ui/Table/type";

import {
  deleteDepartment,
  getAllDepartments,
  getDepartment,
  type Department,
} from "../../../../../api/employeeConfigApi";
import { confirmDelete } from "../../../../../api/utils/confirmDelete";
import { showApiError } from "../../../../../utils/alert";
import { openDepartmentModal } from "../../../../../store/modalStore";

export function DepartmentSetup() {
  const [rows, setRows]                   = useState<Department[]>([]);
  const [loading, setLoading]             = useState(false);
  const [search, setSearch]               = useState("");
  const [page, setPage]                   = useState(1);
  const [pageSize, setPageSize]           = useState(10);
  const [totalPages, setTotalPages]       = useState(1);
  const [totalItems, setTotalItems]       = useState(0);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const start    = (page - 1) * pageSize;
      const response = await getAllDepartments(start, pageSize, search);
      setRows(response.data);
      setTotalItems(response.pagination.total);
      setTotalPages(response.pagination.total_pages);
    } catch (err: any) {
      showApiError(err?.message ?? "Failed to load departments");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleEdit = useCallback(
    async (row: Department) => {
      if (!row.name) return;
      try {
        const detail = await getDepartment(row.name);
        openDepartmentModal(detail, true, { onSuccess: fetchAll }, { title: "Edit Department" });
      } catch (err: any) {
        showApiError(err?.message ?? "Failed to load department details");
      }
    },
    [fetchAll],
  );

  const handleDelete = useCallback(
    async (row: Department) => {
      if (!row.name) return;
      try {
        setActionLoadingId(row.name);
        const deleted = await confirmDelete({
          text: `Delete "${row.department_name ?? row.name}"?`,
          loadingText: "Deleting Department...",
          successMessage: "Department deleted",
          action: async () => { await deleteDepartment(row.name!); },
        });
        if (deleted) fetchAll();
      } finally {
        setActionLoadingId(null);
      }
    },
    [fetchAll],
  );

  const columns: Column<Department>[] = useMemo(
    () => [
      {
        key: "department_name",
        header: "Department",
        render: (row) => (
          <span className="font-medium text-main">
            {row.department_name || row.name || "-"}
          </span>
        ),
        tooltip: (row) => row.department_name ?? row.name ?? "",
      },
      {
        key: "parent_department",
        header: "Parent",
        render: (row) => (
          <span className="text-sm text-sub">{row.parent_department || "-"}</span>
        ),
        tooltip: (row) => row.parent_department ?? "",
      },
      {
        key: "is_group",
        header: "Type",
        render: (row) => (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              row.is_group
                ? "bg-blue-100 text-blue-700"
                : "bg-emerald-100 text-emerald-700"
            }`}
          >
            {row.is_group ? "Group" : "Working"}
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
    <ModalTable
      columns={columns}
      data={rows}
      loading={loading}
      rowKey={(row) => row.name ?? row.department_name}
      // Toolbar
      showToolbar
      searchValue={search}
      onSearch={(v) => { setSearch(v); setPage(1); }}
      enableAdd
      addLabel="Add Department"
      onAdd={() =>
        openDepartmentModal(null, false, { onSuccess: fetchAll }, { title: "New Department" })
      }
      enableColumnSelector
      tableId="employee-departments"
      // Pagination
      currentPage={page}
      totalPages={totalPages}
      totalItems={totalItems}
      pageSize={pageSize}
      pageSizeOptions={[10, 25, 50]}
      onPageChange={setPage}
      onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
    />
  );
}