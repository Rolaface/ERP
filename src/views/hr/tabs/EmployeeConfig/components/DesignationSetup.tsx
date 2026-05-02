import { useCallback, useEffect, useMemo, useState } from "react";

import Table from "../../../../../components/ui/Table/Table";
import ActionButton, {
  ActionGroup,
  ActionMenu,
} from "../../../../../components/ui/Table/ActionButton";
import type { Column } from "../../../../../components/ui/Table/type";
import {
  deleteDesignation,
  getAllDesignations,
  getDesignation,
  type Designation,
} from "../../../../../api/employeeConfigApi";
import { showApiError, showSuccess } from "../../../../../utils/alert";
import { DesignationModal } from "../../../../../components/empployeesetupmodal/DesignationModal";

export function DesignationSetup() {
  const [rows, setRows] = useState<Designation[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Designation | null>(null);
  const MODAL_ID = "designation-modal";

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const start = (page - 1) * pageSize;
      const response = await getAllDesignations(start, pageSize, search);

      setRows(response.data);
      setTotalItems(response.pagination.total);
      setTotalPages(response.pagination.total_pages);
    } catch (err: any) {
      showApiError(err?.message ?? "Failed to load designations");
    } finally {
      setLoading(false);
    }
  }, [search, page, pageSize]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleEdit = useCallback(async (row: Designation) => {
    if (!row.name) return;
    try {
      const detail = await getDesignation(row.name);
      setEditTarget(detail);
      setModalOpen(true);
    } catch (err: any) {
      showApiError(err?.message ?? "Failed to load designation details");
    }
  }, []);

  const handleDelete = useCallback(
    async (row: Designation) => {
      if (!row.name) return;
      if (!confirm(`Delete "${row.designation_name ?? row.name}"?`)) return;
      try {
        setActionLoadingId(row.name);
        await deleteDesignation(row.name);
        showSuccess("Designation deleted");
        fetchAll();
      } catch (err: any) {
        showApiError(err?.message ?? "Failed to delete");
      } finally {
        setActionLoadingId(null);
      }
    },
    [fetchAll],
  );

  const columns: Column<Designation>[] = useMemo(
    () => [
      {
        key: "designation_name",
        header: "Designation",
        render: (row) => (
          <span className="font-medium text-main">
            {row.designation_name || row.name || "-"}
          </span>
        ),
        tooltip: (row) => row.designation_name ?? row.name ?? "",
      },
      {
        key: "description",
        header: "Description",
        render: (row) => (
          <span className="text-sm text-sub line-clamp-1">
            {row.description || "-"}
          </span>
        ),
        tooltip: (row) => row.description ?? "",
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
      <Table columns={columns} data={rows} loading={loading} rowKey={(row) => row.name ?? row.designation_name} showToolbar searchValue={search} onSearch={(v) => { setSearch(v); setPage(1); }} enableAdd addLabel="Add Designation" onAdd={() => { setEditTarget(null); setModalOpen(true); }} currentPage={page} totalPages={totalPages} totalItems={totalItems} pageSize={pageSize} pageSizeOptions={[10, 25, 50]} onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} enableColumnSelector tableId="employee-designations" />
      <DesignationModal modalId={MODAL_ID} isOpen={modalOpen} onClose={() => setModalOpen(false)} initialData={editTarget} onSuccess={fetchAll} />
    </>
  );
}
