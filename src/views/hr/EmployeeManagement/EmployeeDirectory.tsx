import React, { useEffect, useState } from "react";

import Swal from "sweetalert2";
import {
  showApiError,
  showSuccess,
  showLoading,
  closeSwal,
} from "../../../utils/alert";
import {
  getAllEmployees,
  getEmployeeById,
  getNapsaEmployeeById,
  deleteEmployeeById,
} from "../../../api/employeeapi";

import AddEmployeeModal from "../../../components/Hr/employeedirectorymodal/AddEmployeeModal";

import Table from "../../../components/ui/Table/Table";
import StatusBadge from "../../../components/ui/Table/StatusBadge";
import ActionButton, {
  ActionGroup,
} from "../../../components/ui/Table/ActionButton";
import { ERP_BASE } from "../../../config/api";
import { User } from "lucide-react";

import type { Column } from "../../../components/ui/Table/type";
import type { EmployeeSummary, Employee } from "../../../types/employee";
import EmployeeDetailView from "./EmployeeDetailView";

const toAbsoluteFileUrl = (base: string, filePath: string) => {
  const b = String(base ?? "").trim();
  const p = String(filePath ?? "").trim();
  if (!b || !p) return "";
  if (p.startsWith("http")) return p;

  const cleanBase = b.endsWith("/") ? b.slice(0, -1) : b;
  const cleanPath = p.startsWith("/") ? p : `/${p}`;
  return `${cleanBase}${cleanPath}`;
};

const EmployeeDirectory: React.FC = () => {
  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [showModal, setShowModal] = useState(false);
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  //state for detail view
  const [viewMode, setViewMode] = useState<"table" | "detail">("table");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null,
  );

  const fetchEmployee = async (id: string): Promise<any> => {
    const base = await getEmployeeById(id);
    const napsa = await getNapsaEmployeeById(id);
    if (base && napsa) {
      return {
        ...base,
        ...napsa,
        payrollInfo: napsa.payrollInfo ?? base.payrollInfo,
      };
    }
    return base ?? napsa;
  };

  //function to handle view employee details
  const handleViewEmployee = async (id: string) => {
    try {
      showLoading("Loading Employee...");
      const res = await fetchEmployee(id);
      setSelectedEmployee(res);
      setViewMode("detail");
      closeSwal();
    } catch (error) {
      closeSwal();
      showApiError(error);
    }
  };

  const refreshSelectedEmployee = async () => {
    if (!selectedEmployee?.id) return;

    const res = await fetchEmployee(selectedEmployee.id);
    setSelectedEmployee(res);
  };

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await getAllEmployees({
        page,
        page_size: pageSize,
        status: "Active",
        id: searchTerm,
      });

      setEmployees(res.employees);
      setTotalPages(res.pagination?.total_pages || 1);
      setTotalItems(res.pagination?.total || 0);
    } catch (error) {
      showApiError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [page, pageSize, searchTerm]);
  /* ===============================
     ACTION HANDLERS
  ================================ */

  const handleAdd = () => {
    setEditEmployee(null);
    setShowModal(true);
  };

  const handleEdit = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      showLoading("Fetching Employee...");
      const res = await fetchEmployee(id);
      setEditEmployee(res);
      setShowModal(true);
      closeSwal();
    } catch (error) {
      closeSwal();
      showApiError(error);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();

    const result = await Swal.fire({
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

      setEmployees((prev) => prev.filter((emp) => emp.id !== id));

      closeSwal();
      showSuccess("Employee deleted successfully");
    } catch (error) {
      closeSwal();
      showApiError(error);
    }
  };

  const handleSaved = async () => {
    setShowModal(false);
    setEditEmployee(null);
    await fetchEmployees();

    showSuccess(editEmployee ? "Employee updated" : "Employee added");
  };

  const uniqueDepartments = Array.from(
    new Set(employees.map((e) => e.department)),
  ).filter((d) => d !== "");

  /* ===============================
     TABLE COLUMNS
  ================================ */

  const columns: Column<EmployeeSummary>[] = [
    {
      key: "profile",
      header: "",
      align: "left",
      render: (e) => {
        const name = String((e as any)?.name ?? "").trim();
        const initial = (name[0] ?? "?").toUpperCase();
        const raw = String(
          (e as any)?.ProfilePicture ??
            (e as any)?.profilePicture ??
            (e as any)?.profile_picture ??
            (e as any)?.profilePictureUrl ??
            (e as any)?.profile_picture_url ??
            (e as any)?.photoUrl ??
            (e as any)?.imageUrl ??
            (e as any)?.avatarUrl ??
            "",
        ).trim();

        const src = raw ? toAbsoluteFileUrl(ERP_BASE, raw) : "";

        return (
          <div className="w-8 h-8 relative">
            {src ? (
              <img
                src={src}
                alt={name || "Employee"}
                className="w-8 h-8 rounded-full object-cover border border-theme"
                onError={(ev) => {
                  const img = ev.currentTarget as HTMLImageElement;
                  img.style.display = "none";
                  const fallback = img.nextElementSibling as HTMLElement | null;
                  if (fallback) fallback.style.display = "flex";
                }}
              />
            ) : null}
            <div
              className="w-8 h-8 rounded-full bg-app border border-theme items-center justify-center text-muted"
              style={{ display: src ? "none" : "flex" }}
              title={name || "Employee"}
            >
              <User className="w-4 h-4" />
            </div>
            {!src ? (
              <span className="sr-only">{initial}</span>
            ) : null}
          </div>
        );
      },
    },
    { key: "employeeId", header: "Employee ID", align: "left" },
    { key: "name", header: "Name", align: "left" },
    { key: "jobTitle", header: "Job Title", align: "left" },
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
          <ActionButton
            type="edit"
            onClick={(ev) => handleEdit(e.id, ev as any)}
            iconOnly
          />
          <ActionButton
            type="delete"
            variant="danger"
            onClick={(ev) => handleDelete(e.id, ev as any)}
            iconOnly
          />
        </ActionGroup>
      ),
    },
  ];

  /* ===============================
     RENDER
  ================================ */

  return (
    <div className="p-6">
      {viewMode === "table" ? (
        <Table
          loading={loading}
          columns={columns}
          data={employees}
          serverSide
          showToolbar
          searchValue={searchTerm}
          onSearch={(q) => {
            setSearchTerm(q);
            setPage(1);
          }}
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
            setPage(1); // reset page
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

      {/* Add / Edit Modal */}
      <AddEmployeeModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditEmployee(null);
        }}
        onSuccess={handleSaved}
        level={[]}
        editData={editEmployee}
        mode={editEmployee ? "edit" : "add"}
      />
    </div>
  );
};

export default EmployeeDirectory;
