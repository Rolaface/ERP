// EmployeeDirectory.tsx
// Permission pattern mirrors Invoices.tsx:
//   enableAdd={can("Employee","create")}
//   <PermissionGate module="Employee" action="write"> wraps Edit button
//   Inline can() for Disable (write) and Delete (delete) in ActionMenu
//
// Props canCreate/canEdit/canDelete are still accepted from EmployeeManagement
// so employee view can suppress all mutations — both layers work together.

import React, { useEffect, useState, useCallback } from "react";
import {
  showApiError, showSuccess, showLoading, closeSwal,
} from "../../../utils/alert";
import { fireManagedSwal }   from "../../../utils/swalManager";
import {
  getAllEmployees, getEmployeeById,
  deleteEmployeeById, updateEmployeeStatus,
} from "../../../api/employeeapi";
import { AppPageBody }       from "../../../components/ui/app-shell";
import { openEmployeeModal } from "../../../store/modalStore";
import Table                 from "../../../components/ui/Table/Table";
import StatusBadge           from "../../../components/ui/Table/StatusBadge";
import ActionButton, {
  ActionGroup, ActionMenu,
}                            from "../../../components/ui/Table/ActionButton";
import PermissionGate        from "../../../views/PermissionGate"; 
import { usePermission }     from "../../../hooks/permission/usePermission";
import { REFRESH_KEYS, useDataRefreshStore } from "../../../store/dataRefreshStore";
import EmployeeNameCell      from "../../../components/ui/Table/Employeenamecell";
import type { Column }       from "../../../components/ui/Table/type";
import type { EmployeeSummary } from "../../../types/employee";
import EmployeeDetailView    from "../EmployeeManagement/mployeeDetailView";
import { useAuth }           from "../../../context/AuthContext";

// ── Module constant (mirrors SALES_MODULE in Invoices.tsx) ───────────────────
const EMP_MODULE = "Employee";

interface EmployeeDirectoryProps {
  isEmployeeView?: boolean;
  canCreate?:      boolean;  // from EmployeeManagement (employee-view guard)
  canEdit?:        boolean;
  canDelete?:      boolean;
}

const unwrapEmployee = (res: any): any =>
  res?.message?.data ?? res?.data ?? res;

const EmployeeDirectory: React.FC<EmployeeDirectoryProps> = ({
  isEmployeeView = false,
  canCreate      = false,
  canEdit        = false,
  canDelete      = false,
}) => {
  const { user }    = useAuth();
  const { can }     = usePermission();   // ← inline permission checks (Invoices pattern)

  const [employees,       setEmployees]       = useState<EmployeeSummary[]>([]);
  const [searchTerm,      setSearchTerm]      = useState("");
  const [loading,         setLoading]         = useState(true);
  const [page,            setPage]            = useState(1);
  const [pageSize,        setPageSize]        = useState(10);
  const [totalPages,      setTotalPages]      = useState(1);
  const [totalItems,      setTotalItems]      = useState(0);
  const [viewMode,        setViewMode]        = useState<"table" | "detail">("table");
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);

  const triggerRefresh    = useDataRefreshStore((s) => s.triggerRefresh);
  const subscribeToRefresh = useDataRefreshStore((s) => s.subscribeToRefresh);

  // ── View detail ───────────────────────────────────────────────────────────
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

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const searchParam = isEmployeeView
        ? user?.employeeId
        : searchTerm || undefined;

      const res = await getAllEmployees(page, pageSize, "Active", searchParam);

      const mapped = (res.data || []).map((e: any) => ({
        id:           e.name,
        employeeId:   e.name,
        name:         e.employee_name,
        image:        e.image ?? null,
        jobTitle:     e.designation,
        department:   e.department || "-",
        branch: e.branch     || "-",
        status:       e.status,
      }));

      setEmployees(mapped);
      setTotalPages(res.pagination?.total_pages || 1);
      setTotalItems(res.pagination?.total       || 0);
    } catch (error) {
      showApiError(error);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchTerm, isEmployeeView, user?.employeeId]);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);
  useEffect(() => { setPage(1); },      [searchTerm]);

  useEffect(() => {
    const unsub = subscribeToRefresh(REFRESH_KEYS.EMPLOYEE_LIST, fetchEmployees);
    return () => unsub();
  }, [subscribeToRefresh, fetchEmployees]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleAdd = () => {
    openEmployeeModal(null, false, {
      onSuccess: () => triggerRefresh(REFRESH_KEYS.EMPLOYEE_LIST),
    });
  };

  const handleEdit = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      showLoading("Fetching Employee...");
      const res          = await getEmployeeById(id);
      const employeeData = unwrapEmployee(res);
      closeSwal();
      openEmployeeModal(employeeData, true);
    } catch (error) {
      closeSwal();
      showApiError(error);
    }
  };

  const handleDisable = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const result = await fireManagedSwal({
      title:             "Disable Employee?",
      text:              "Employee will be marked as inactive.",
      icon:              "warning",
      showCancelButton:  true,
      confirmButtonText: "Yes, Disable",
    });
    if (!result.isConfirmed) return;
    try {
      showLoading("Disabling Employee...");
      await updateEmployeeStatus(id, "Inactive");
      closeSwal();
      showSuccess("Employee disabled successfully");
      triggerRefresh(REFRESH_KEYS.EMPLOYEE_LIST);
    } catch (error) {
      closeSwal();
      showApiError(error);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const result = await fireManagedSwal({
      title:               "Are you sure?",
      text:                "This employee will be permanently deleted.",
      icon:                "warning",
      showCancelButton:    true,
      confirmButtonColor:  "#ef4444",
      cancelButtonColor:   "#6b7280",
      confirmButtonText:   "Yes, delete",
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

  // ── Columns ───────────────────────────────────────────────────────────────
  const columns: Column<EmployeeSummary>[] = [
    { key: "employeeId", header: "Employee ID", align: "left" },
    {
      key:    "name",
      header: "Name",
      align:  "left",
      render: (e) => (
        <EmployeeNameCell name={e.name} employeeId={e.id} image={e.image} />
      ),
    },
    { key: "jobTitle", header: "Job Title", align: "left" },
    {
      key:    "department",
      header: "Department",
      align:  "left",
      render: (e) => (
        <code className="text-xs px-2 py-1 rounded bg-row-hover text-main">
          {e.department}
        </code>
      ),
    },
    { key: "branch", header: "Branch", align: "left" },
    {
      key:    "status",
      header: "Status",
      align:  "left",
      render: (e) => <StatusBadge status={e.status} />,
    },
    {
      key:    "actions",
      header: "Actions",
      align:  "center",
      render: (e) => (
        <ActionGroup>
          {/* View — always visible */}
          <ActionButton
            type="view"
            onClick={() => handleViewEmployee(e.id)}
            iconOnly
          />

          {/* Edit — PermissionGate (Invoices pattern) + employee-view guard */}
          {!isEmployeeView && (
            <PermissionGate module={EMP_MODULE} action="write">
              <ActionButton
                type="edit"
                onClick={(ev) => handleEdit(e.id, ev as React.MouseEvent)}
                iconOnly
              />
            </PermissionGate>
          )}

          {/* Disable / Delete — inline can() (Invoices pattern) */}
          {!isEmployeeView && (
            <ActionMenu
              {...(can(EMP_MODULE, "write") && e.status !== "Inactive"
                ? { onDisable: (ev) => handleDisable(e.id, ev as React.MouseEvent) }
                : {})}
              {...(can(EMP_MODULE, "delete")
                ? { onDelete: (ev) => handleDelete(e.id, ev as React.MouseEvent) }
                : {})}
            />
          )}
        </ActionGroup>
      ),
    },
  ];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <AppPageBody>
      {viewMode === "table" ? (
        <Table
          loading={loading}
          columns={columns}
          data={employees}
          rowKey={(row) => row.id}
          showToolbar
          searchValue={searchTerm}
          onSearch={(q) => { setSearchTerm(q); setPage(1); }}

          // ── Add button: enableAdd mirrors Invoices pattern ──────────────
          // In professional view: can("Employee","create")
          // In employee view:     always false (isEmployeeView guard)
          enableAdd={!isEmployeeView && can(EMP_MODULE, "create")}
          addLabel="Add Employee"
          onAdd={handleAdd}

          enableColumnSelector

          // Pagination: hidden in employee view
          currentPage={isEmployeeView ? 1          : page}
          totalPages={ isEmployeeView ? 1          : totalPages}
          pageSize={   isEmployeeView ? totalItems || 1 : pageSize}
          totalItems={totalItems}
          pageSizeOptions={isEmployeeView ? undefined : [10, 25, 50, 100]}
          onPageSizeChange={
            isEmployeeView
              ? undefined
              : (size) => { setPageSize(size); setPage(1); }
          }
          onPageChange={isEmployeeView ? undefined : setPage}
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