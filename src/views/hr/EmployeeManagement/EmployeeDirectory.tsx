import React, { useEffect, useState, useCallback, useRef } from "react";
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
  updateEmployeeStatus,
} from "../../../api/employeeapi";
import { openEmployeeModal } from "../../../store/modalStore";
import Table from "../../../components/ui/Table/Table";
import ActionButton, {
  ActionGroup,
  ActionMenu,
} from "../../../components/ui/Table/ActionButton";
import PermissionGate from "../../../views/PermissionGate";
import { usePermission } from "../../../hooks/permission/usePermission";
import {
  REFRESH_KEYS,
  useDataRefreshStore,
} from "../../../store/dataRefreshStore";
import EmployeeNameCell from "../../../components/ui/Table/Employeenamecell";
import type { Column } from "../../../components/ui/Table/type";
import type { EmployeeSummary } from "../../../types/employee";
import EmployeeDetailView from "./employeeDetailView";
import { useAuth } from "../../../context/AuthContext";
import { HrTableFrame } from "../components/HrTabLayout";
import { resolveLabel } from "../../../api/utils/labelResolver";

import {
  getAllDepartments,
  getallbranches,
} from "../../../api/utils/frappeUtilsApi";

const EMP_MODULE = "Employee";

interface EmployeeDirectoryProps {
  isEmployeeView?: boolean;
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}

const unwrapEmployee = (res: any): any =>
  res?.message?.data ?? res?.data ?? res;

const EmployeeDirectory: React.FC<EmployeeDirectoryProps> = ({
  isEmployeeView = false,
}) => {
  const { user } = useAuth();
  const { can } = usePermission();
  const mountedRef = useRef(true);

  const triggerRefresh = useDataRefreshStore((s) => s.triggerRefresh);
  const subscribeToRefresh = useDataRefreshStore((s) => s.subscribeToRefresh);

  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");

  const [viewMode, setViewMode] = useState<"table" | "detail">("table");
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  const fetchEmployees = useCallback(async () => {
    if (!mountedRef.current) return;
    setIsFetching(true);
    try {
      const searchParam = isEmployeeView
        ? user?.employeeId
        : searchTerm || undefined;
      const res = await getAllEmployees(page, pageSize, undefined, searchParam);
      if (!mountedRef.current) return;

    const mapped = await Promise.all(
  (res.data || []).map(
    async (e: any) => {
      const departmentLabel =
        await resolveLabel({
          value: e.department,
          fetcher:
            getAllDepartments,
        });

      const branchLabel =
        await resolveLabel({
          value: e.branch,
          fetcher:
            getallbranches,
        });

      return {
        id: e.name,
        employeeId: e.name,
        name: e.employee_name,
        image: e.image ?? null,
        jobTitle:
          e.designation,
        department:
          departmentLabel || "-",
        branch:
          branchLabel || "-",
        status: e.status,
      };
    },
  ),
);
      setEmployees(mapped);
      setTotalPages(res.pagination?.total_pages || 1);
      setTotalItems(res.pagination?.total || 0);
    } catch (error) {
      showApiError(error);
    } finally {
      if (mountedRef.current) {
        setIsFetching(false);
        setIsInitialLoad(false);
      }
    }
  }, [page, pageSize, searchTerm, isEmployeeView, user?.employeeId]);

  // Keep a stable ref to always call the latest fetchEmployees
  const fetchEmployeesRef = useRef(fetchEmployees);
  useEffect(() => {
    fetchEmployeesRef.current = fetchEmployees;
  }, [fetchEmployees]);

  // Initial fetch
  useEffect(() => {
    mountedRef.current = true;
    fetchEmployees();
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Refetch on pagination / search changes
  useEffect(() => {
    if (isInitialLoad) return;
    fetchEmployees();
  }, [page, pageSize, searchTerm]);

  // Subscribe once; always calls the latest fetchEmployees via ref
  useEffect(() => {
    const unsubscribe = subscribeToRefresh(
      REFRESH_KEYS.EMPLOYEE_LIST,
      () => fetchEmployeesRef.current(),
    );
    return unsubscribe;
  }, [subscribeToRefresh]);

  // ── Handlers ────────────────────────────────────────────────────

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

  const handleAdd = () => {
    openEmployeeModal(null, false, {
      onSuccess: () => triggerRefresh(REFRESH_KEYS.EMPLOYEE_LIST),
    });
  };

  // FIX: added onSuccess so status changes (Left, Suspended, etc.) trigger a refetch
  const handleEdit = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      showLoading("Fetching Employee...");
      const res = await getEmployeeById(id);
      const employeeData = unwrapEmployee(res);
      closeSwal();
      openEmployeeModal(employeeData, true, {
        onSuccess: () => triggerRefresh(REFRESH_KEYS.EMPLOYEE_LIST),
      });
    } catch (error) {
      closeSwal();
      showApiError(error);
    }
  };

  // FIX: added fetchEmployees() call so table updates immediately after disable
  const handleDisable = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const result = await fireManagedSwal({
      title: "Disable Employee?",
      text: "Employee will be marked as inactive.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Disable",
    });
    if (!result.isConfirmed) return;
    try {
      showLoading("Disabling Employee...");
      await updateEmployeeStatus(id, "Inactive");
      closeSwal();
      showSuccess("Employee disabled successfully");
      await fetchEmployees();
      triggerRefresh(REFRESH_KEYS.EMPLOYEE_LIST);
    } catch (error) {
      closeSwal();
      showApiError(error);
    }
  };

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
      await fetchEmployees();
      triggerRefresh(REFRESH_KEYS.EMPLOYEE_LIST);
    } catch (error) {
      closeSwal();
      showApiError(error);
    }
  };

  // ── Columns ─────────────────────────────────────────────────────

  const columns: Column<EmployeeSummary>[] = [
    {
      key: "employeeId",
      header: "Employee ID",
      align: "left",
      render: (e) => (
        <span className="font-medium text-xs whitespace-nowrap">
          {e.id ?? "—"}
        </span>
      ),
    },
    {
      key: "name",
      header: "Name",
      align: "left",
      render: (e) => (
        <EmployeeNameCell name={e.name} employeeId={e.id} image={e.image} />
      ),
    },
    {
      key: "jobTitle",
      header: "Job Title",
      align: "left",
      render: (e) => (
        <span className="text-xs text-muted whitespace-nowrap">
          {e.jobTitle ?? "—"}
        </span>
      ),
    },
    {
      key: "department",
      header: "Department",
      align: "left",
      render: (e) => (
        <span className="text-xs whitespace-nowrap">{e.department}</span>
      ),
    },
    {
      key: "branch",
      header: "Branch",
      align: "left",
      render: (e) => (
        <span className="text-xs whitespace-nowrap">{e.branch ?? "—"}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      align: "center",
      render: (e) => (
        <span
          className={`inline-flex items-center text-[11px] px-2 py-px rounded-full font-medium whitespace-nowrap ${
            e.status === "Active"
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {e.status}
        </span>
      ),
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
          {!isEmployeeView && (
            <PermissionGate module={EMP_MODULE} action="write">
              <ActionButton
                type="edit"
                onClick={(ev) => handleEdit(e.id, ev as React.MouseEvent)}
                iconOnly
              />
            </PermissionGate>
          )}
          {!isEmployeeView && (
            <ActionMenu
              {...(can(EMP_MODULE, "write") && e.status !== "Inactive"
                ? {
                    onDisable: (ev) =>
                      handleDisable(e.id, ev as React.MouseEvent),
                  }
                : {})}
              {...(can(EMP_MODULE, "delete")
                ? {
                    onDelete: (ev) =>
                      handleDelete(e.id, ev as React.MouseEvent),
                  }
                : {})}
            />
          )}
        </ActionGroup>
      ),
    },
  ];

  // ── Render ───────────────────────────────────────────────────────

  return (
    <HrTableFrame>
      {viewMode === "table" ? (
        <Table
          tableId="employee-directory"
          columns={columns}
          data={employees}
          rowKey={(row) => row.id}
          loading={isInitialLoad}
          isFetching={isFetching}
          showToolbar
          searchValue={searchTerm}
          onSearch={(q) => {
            setSearchTerm(q);
            setPage(1);
          }}
          enableAdd={!isEmployeeView && can(EMP_MODULE, "create")}
          addLabel="Add Employee"
          onAdd={handleAdd}
          enableColumnSelector
          currentPage={isEmployeeView ? 1 : page}
          totalPages={isEmployeeView ? 1 : totalPages}
          pageSize={isEmployeeView ? totalItems || 1 : pageSize}
          totalItems={totalItems}
          pageSizeOptions={isEmployeeView ? undefined : [10, 25, 50, 100]}
          onPageSizeChange={
            isEmployeeView
              ? undefined
              : (size) => {
                  setPageSize(size);
                  setPage(1);
                }
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
    </HrTableFrame>
  );
};

export default EmployeeDirectory;