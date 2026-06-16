import { useCallback, useEffect, useMemo, useState } from "react";
import { useDataRefreshStore, REFRESH_KEYS } from "../../../../../store/dataRefreshStore";
import ModalTable from "../../../../../components/ui/Table/ModalTableInside";
import ActionButton, {
  ActionGroup,
  ActionMenu,
} from "../../../../../components/ui/Table/ActionButton";
import type { Column } from "../../../../../components/ui/Table/type";
import { confirmDelete } from "../../../../../api/utils/confirmDelete";
import {
  deleteEmployeeGrade,
  getAllEmployeeGrades,
  getEmployeeGrade,
  type EmployeeGrade,
} from "../../../../../api/employeeConfigApi";
import { showApiError, showSuccess } from "../../../../../utils/alert";
import { openGradeModal } from "../../../../../store/modalStore";

export function GradeSetup() {
  const [rows, setRows] = useState<EmployeeGrade[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const triggerRefresh = useDataRefreshStore((state) => state.triggerRefresh);
  const subscribeToRefresh = useDataRefreshStore((state) => state.subscribeToRefresh);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const start = (page - 1) * pageSize;
      const response = await getAllEmployeeGrades(start, pageSize, search);
      setRows(response.data);
      setTotalItems(response.pagination.total);
      setTotalPages(response.pagination.total_pages);
    } catch (err: any) {
      showApiError(err?.message ?? "Failed to load grades");
    } finally {
      setLoading(false);
    }
  }, [search, page, pageSize]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    const unsubscribe = subscribeToRefresh(REFRESH_KEYS.EMPLOYEE_GRADE_LIST, () => {
      fetchAll();
    });
    return unsubscribe;
  }, [subscribeToRefresh, fetchAll]);

  const handleEdit = useCallback(
    async (row: EmployeeGrade) => {
      if (!row.name) return;
      try {
        const detail = await getEmployeeGrade(row.name);
        openGradeModal(
          detail,
          true,
          {
            onSuccess: () => {
              triggerRefresh(REFRESH_KEYS.EMPLOYEE_GRADE_LIST);
            },
          },
          { title: "Edit Grade" },
        );
      } catch (err: any) {
        showApiError(err?.message ?? "Failed to load grade details");
      }
    },
    [triggerRefresh],
  );

  const handleDelete = useCallback(
    async (row: EmployeeGrade) => {
      if (!row.name) return;
      try {
        setActionLoadingId(row.name);
        const deleted = await confirmDelete({
          text: `Delete "${row.name}"?`,
          loadingText: "Deleting Grade...",
          successMessage: "Grade deleted",
          action: async () => {
            await deleteEmployeeGrade(row.name!);
          },
        });
        if (deleted) triggerRefresh(REFRESH_KEYS.EMPLOYEE_GRADE_LIST);
      } finally {
        setActionLoadingId(null);
      }
    },
    [triggerRefresh],
  );

  const columns: Column<EmployeeGrade>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Code",
        render: (row) => {
          const separatorIdx = row.name.indexOf(" | ");
          const code = separatorIdx !== -1 ? row.name.slice(0, separatorIdx) : row.name;
          return <span className="font-medium text-main">{code || "-"}</span>;
        },
        tooltip: (row) => row.name,
      },
      {
        key: "name" as any,
        header: "Description",
        render: (row) => {
          const separatorIdx = row.name.indexOf(" | ");
          const desc = separatorIdx !== -1 ? row.name.slice(separatorIdx + 3) : "";
          return (
            <span className="text-sm text-muted break-words whitespace-normal">
              {desc || "-"}
            </span>
          );
        },
      },
      {
        key: "default_salary_structure",
        header: "Default Salary Structure",
        render: (row) => (
          <span className="text-sm text-main">
            {row.default_salary_structure || "-"}
          </span>
        ),
        tooltip: (row) => row.default_salary_structure ?? "",
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
      rowKey={(row) => row.name}
      showToolbar
      searchValue={search}
      onSearch={(v) => {
        setSearch(v);
        setPage(1);
      }}
      enableAdd
      addLabel="Add Grade"
      onAdd={() =>
        openGradeModal(
          null,
          false,
          {
            onSuccess: () => {
              triggerRefresh(REFRESH_KEYS.EMPLOYEE_GRADE_LIST);
            },
          },
          { title: "New Grade" },
        )
      }
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
      tableId="employee-grades"
    />
    </div>
  );
}