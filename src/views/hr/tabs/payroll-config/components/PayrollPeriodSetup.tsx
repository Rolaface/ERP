import { useCallback, useMemo, useState } from "react";
import ModalTable from "../../../../../components/ui/Table/ModalTableInside";
import ActionButton, {
  ActionGroup,
  ActionMenu,
} from "../../../../../components/ui/Table/ActionButton";
import type { Column } from "../../../../../components/ui/Table/type";
import { confirmDelete } from "../../../../../api/utils/confirmDelete";
import {
  deletePayrollPeriod,
  type PayrollPeriod,
} from "../../../../../api/payrollConfigApi";
import { usePayrollPeriods } from "../hooks/usePayrollPeriods";
import { openPayrollPeriodModal } from "../../../../../store/modalStore";

const formatDate = (date: string | Date) => {
  if (!date) return "";

  const months = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
  ];

  if (typeof date === "string") {
    const [year, month, day] = date.split("T")[0].split("-").map(Number);
    return `${String(day).padStart(2, "0")}-${months[month - 1]}-${year}`;
  }

  // Date object — use local methods
  return `${String(date.getDate()).padStart(2, "0")}-${months[date.getMonth()]}-${date.getFullYear()}`;
};

export function PayrollPeriodSetup() {
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
    fetchDetail, sortBy, setSortBy, sortOrder, setSortOrder, 
  } = usePayrollPeriods();
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const handleEdit = useCallback(
    async (row: PayrollPeriod) => {
      const detail = await fetchDetail(row.name!);
      if (!detail) return;
      openPayrollPeriodModal(
        detail,
        true,
        { onSuccess: fetchAll },
        { title: "Edit Payroll Period" },
      );
    },
    [fetchDetail, fetchAll],
  );

  const handleDelete = useCallback(
    async (row: PayrollPeriod) => {
      if (!row.name) return;
      try {
        setActionLoadingId(row.name);
        const deleted = await confirmDelete({
          text: `Delete "${row.name}"?`,
          loadingText: "Deleting Payroll Period...",
          successMessage: "Payroll period deleted",
          action: async () => {
            await deletePayrollPeriod(row.name!);
          },
        });
        if (deleted) fetchAll();
      } finally {
        setActionLoadingId(null);
      }
    },
    [fetchAll],
  );

  const columns: Column<PayrollPeriod>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Name",
        sortable: true,
        render: (row) => (
          <span className="font-medium text-main">{row.name || "—"}</span>
        ),
        tooltip: (row) => row.name,
      },
      {
        key: "company",
        header: "Company",
        sortable: true,
        render: (row) => (
          <span className="text-sm text-main">{row.company || "—"}</span>
        ),
      },
      {
        key: "start_date",
        header: "Start Date",
        sortable: true,
        render: (row) => (
          <span className="text-sm text-main">
            {row.start_date ? formatDate(row.start_date) : "—"}
          </span>
        ),
      },
      {
        key: "end_date",
        header: "End Date",
        sortable: true,
        render: (row) => (
          <span className="text-sm text-main">
            {row.end_date ? formatDate(row.end_date) : "—"}
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
    [actionLoadingId, handleEdit, handleDelete],
  );

  return (
     <div className="h-[calc(100vh-220px)]"> 
    <ModalTable
      columns={columns}
      data={rows}
      loading={loading}
      rowKey={(row) => row.name ?? ""}
      showToolbar
      searchValue={search}
      onSearch={(v) => {
        setSearch(v);
        setPage(1);
      }}
       sortBy={sortBy}                                   
  sortOrder={sortOrder}                              
  onSortChange={({ sortBy: newSortBy, sortOrder: newSortOrder }) => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    setPage(1);
  }}
      enableAdd
      addLabel="Add Period"
      onAdd={() =>
        openPayrollPeriodModal(
          null,
          false,
          { onSuccess: fetchAll },
          { title: "New Payroll Period" },
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
      tableId="payroll-periods"
    />
    </div>
  );
}
