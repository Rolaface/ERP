import { useCallback, useEffect, useMemo, useState } from "react";

import Table from "../../../../../components/ui/Table/Table";
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
import { EmployeeTypeModal } from "../../../../../components/empployeesetupmodal/EmployeeTypeModal";

export function EmployeeTypeSetup() {
  const [rows, setRows] = useState<EmployeeType[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<EmployeeType | null>(null);
  const MODAL_ID = "employee-type-modal";

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

  const handleEdit = useCallback(async (row: EmployeeType) => {
    if (!row.name) return;
    try {
      const detail = await getEmployeeType(row.name);
      setEditTarget(detail);
      setModalOpen(true);
    } catch (err: any) {
      showApiError(err?.message ?? "Failed to load employee type details");
    }
  }, []);

  const handleDelete = useCallback(
    async (row: EmployeeType) => {
      if (!row.name) return;
      if (!confirm(`Delete "${row.employee_type_name ?? row.name}"?`)) return;
      try {
        setActionLoadingId(row.name);
        await deleteEmployeeType(row.name);
        showSuccess("Employee type deleted");
        fetchAll();
      } catch (err: any) {
        showApiError(err?.message ?? "Failed to delete");
      } finally {
        setActionLoadingId(null);
      }
    },
    [fetchAll],
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
            <ActionButton type="edit" iconOnly onClick={() => handleEdit(row)} disabled={actionLoadingId === row.name} />
            <ActionMenu customActions={[{ label: "Delete", onClick: () => handleDelete(row), disabled: actionLoadingId === row.name }]} />
          </ActionGroup>
        ),
      },
    ],
    [actionLoadingId, handleDelete, handleEdit],
  );

  return (
    <>
      <Table columns={columns} data={rows} loading={loading} rowKey={(row) => row.name ?? row.employee_type_name} showToolbar searchValue={search} onSearch={(v) => { setSearch(v); setPage(1); }} enableAdd addLabel="Add Employee Type" onAdd={() => { setEditTarget(null); setModalOpen(true); }} currentPage={page} totalPages={totalPages} totalItems={totalItems} pageSize={pageSize} pageSizeOptions={[10, 25, 50]} onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} enableColumnSelector tableId="employee-types" />
      <EmployeeTypeModal modalId={MODAL_ID} isOpen={modalOpen} onClose={() => setModalOpen(false)} initialData={editTarget} onSuccess={fetchAll} />
    </>
  );
}
