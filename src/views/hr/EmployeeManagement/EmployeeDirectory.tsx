import React, { useEffect, useState,useCallback } from "react";

import {
  showApiError,
  showSuccess,
  showLoading,
  closeSwal,
} from "../../../utils/alert";
import { fireManagedSwal } from "../../../utils/swalManager";
import {
  getAllEmployees,
  getEmployeeById,
  deleteEmployeeById,
} from "../../../api/employeeapi";
import { AppPage , AppPageBody } from "../../../components/ui/app-shell";
import { openEmployeeModal } from "../../../store/modalStore";

import Table from "../../../components/ui/Table/Table";
import StatusBadge from "../../../components/ui/Table/StatusBadge";
import ActionButton, {
  ActionGroup,
  ActionMenu,
} from "../../../components/ui/Table/ActionButton";
import { REFRESH_KEYS, useDataRefreshStore } from "../../../store/dataRefreshStore";


import type { Column } from "../../../components/ui/Table/type";
import type { EmployeeSummary } from "../../../types/employee";
import EmployeeDetailView from "../EmployeeManagement/mployeeDetailView";

const unwrapEmployee = (res: any): any =>
  res?.message?.data ?? res?.data ?? res;

const EmployeeDirectory: React.FC = () => {
  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [viewMode, setViewMode] = useState<"table" | "detail">("table");
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const triggerRefresh = useDataRefreshStore(
  (state) => state.triggerRefresh
);

const subscribeToRefresh = useDataRefreshStore(
  (state) => state.subscribeToRefresh
);

  // ── View detail ──────────────────────────────────────────────────────────
  const handleViewEmployee = async (id: string) => {
    try {
      showLoading("Loading Employee...");
      const res = await getEmployeeById(id);
      setSelectedEmployee(unwrapEmployee(res));
      setViewMode("detail");
      closeSwal();
    } catch (error) {
      closeSwal();
      showApiError(error);
    }
  };

  const refreshSelectedEmployee = async () => {
    const id = selectedEmployee?.employee || selectedEmployee?.id;
    if (!id) return;
    const res = await getEmployeeById(id);
    setSelectedEmployee(unwrapEmployee(res));
  };

  // ── Fetch list ───────────────────────────────────────────────────────────
  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAllEmployees(page, pageSize, searchTerm);

      const mapped = (res.data || []).map((e: any) => ({
        id: e.name,
        employeeId: e.name,
        name: e.employee_name,
        jobTitle: e.designation,
        department: e.department || "-",
        workLocation: e.branch || "-",
        status: e.status,
      }));

      setEmployees(mapped);
      setTotalPages(res.pagination?.total_pages || 1);
      setTotalItems(res.pagination?.total_items || 0);
    } catch (error) {
      showApiError(error);
    } finally {
      setLoading(false);
    }
}, [page, pageSize, searchTerm]);

useEffect(() => {
  fetchEmployees();
}, [fetchEmployees]);
  useEffect(() => {
  const unsubscribe = subscribeToRefresh(
    REFRESH_KEYS.EMPLOYEE_LIST,
    fetchEmployees
  );

  return () => unsubscribe();
}, [subscribeToRefresh, fetchEmployees]);

  // ── Add ──────────────────────────────────────────────────────────────────
  const handleAdd = () => {
    openEmployeeModal(null, false, {
  onSuccess: () => {
    triggerRefresh(REFRESH_KEYS.EMPLOYEE_LIST);
  },
});
  };

  // ── Edit ─────────────────────────────────────────────────────────────────
  const handleEdit = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      showLoading("Fetching Employee...");
      const res = await getEmployeeById(id);
      const employeeData = unwrapEmployee(res); // flat data object
      closeSwal();

      
      openEmployeeModal(employeeData, true);
    } catch (error) {
      closeSwal();
      showApiError(error);
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();

    const result = await fireManagedSwal({
      title: "Are you sure?",
      text: "This employee will be permanently deleted.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete",
    });

    if (!result.isConfirmed) return;

    try {
      showLoading("Deleting Employee...");
      await deleteEmployeeById(id);
    
      closeSwal();
      showSuccess("Employee deleted successfully");
      triggerRefresh(REFRESH_KEYS.EMPLOYEE_LIST);
    } catch (error) {
      closeSwal();
      showApiError(error);
    }
  };

  // ── Columns ──────────────────────────────────────────────────────────────
  const columns: Column<EmployeeSummary>[] = [
    { key: "employeeId", header: "Employee ID", align: "left" },
    { key: "name",       header: "Name",        align: "left" },
    { key: "jobTitle",   header: "Job Title",   align: "left" },
    {
      key: "department",
      header: "Department",
      align: "left",
      render: (e) => (
        <code className="text-xs px-2 py-1 rounded bg-row-hover text-main">
          {e.department}
        </code>
      ),
    },
    { key: "workLocation", header: "Location", align: "left" },
    {
      key: "status",
      header: "Status",
      align: "left",
      render: (e) => <StatusBadge status={e.status} />,
    },
    {
      key: "actions",
      header: "Actions",
      align: "center",
      render: (e) => (
        <ActionGroup>
          <ActionButton
            type="view"
            onClick={() => handleViewEmployee(e.id)}
            iconOnly
          />
          <ActionMenu
            onEdit={(ev) => handleEdit(e.id, ev as any)}
            onDelete={(ev) => handleDelete(e.id, ev as any)}
          />
        </ActionGroup>
      ),
    },
  ];

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <AppPageBody>
      {viewMode === "table" ? (
        <Table
          loading={loading}
          columns={columns}
          data={employees}
          showToolbar
          searchValue={searchTerm}
          onSearch={setSearchTerm}
          enableAdd
          addLabel="Add Employee"
          onAdd={handleAdd}
          enableColumnSelector
          currentPage={page}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={totalItems}
          pageSizeOptions={[10, 25, 50, 100]}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
          onPageChange={setPage}
        />
      ) : selectedEmployee ? (
        <EmployeeDetailView
          employee={selectedEmployee}
          onBack={() => {
            setViewMode("table");
            setSelectedEmployee(null);
          }}
          onDocumentUploaded={refreshSelectedEmployee}
        />
      ) : null}
    </AppPageBody>
  );
};

export default EmployeeDirectory;