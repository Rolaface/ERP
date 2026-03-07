import React, { useState } from "react";
import { FaPlus, FaSearch } from "react-icons/fa";
import { useEffect } from "react";

// Reusable Components
import Table from "../../components/ui/Table/Table";
import type { Column } from "../../components/ui/Table/type";
import StatusBadge from "../../components/ui/Table/StatusBadge";
import ActionButton, {
  ActionGroup,
  ActionMenu,
} from "../../components/ui/Table/ActionButton";

// Modals
import IdentityVerificationModal from "../../components/Hr/employeedirectorymodal/IdentityVerificationModal";
import AddEmployeeModal from "../../components/Hr/employeedirectorymodal/AddEmployeeModal";
import { getAllEmployees } from "../../api/employeeapi";

// Types
type Employee = {
  id: string | null;
  name: string;
  jobTitle: string | null;
  department: string;
  workLocation: string | null;
  status: "Active" | "Inactive" | "On Leave";
  profilePictureUrl?: string | null;
};

const EmployeeDirectory: React.FC = () => {
  // Modal States
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [verifiedData, setVerifiedData] = useState<any>(null);

  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [department, setDepartment] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState("");

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const fetchEmployees = async () => {
    try {
      setLoading(true);

      const res = await getAllEmployees({
        page: currentPage,
        page_size: pageSize,
        status,
        department,
        jobTitle: searchTerm,
        workLocation: location,
      });

      setEmployees(res.employees || []);
      setTotalItems(res.pagination?.total || 0);
    } catch (err) {
      return;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [currentPage, pageSize, status, department, location, searchTerm]);

  const uniqueDepartments = Array.from(
    new Set(
      employees.map((e) => e.department).filter((d): d is string => Boolean(d)),
    ),
  );

  const uniqueLocations = Array.from(
    new Set(
      employees
        .map((e) => e.workLocation)
        .filter((l): l is string => Boolean(l)),
    ),
  );

  // --- HANDLERS ---
  const handleVerified = (data: any) => {
    setVerifiedData(data);
    setShowVerificationModal(false);
    setShowAddEmployee(true);
  };

  const handleManualEntry = () => {
    setVerifiedData(null);
    setShowVerificationModal(false);
    setShowAddEmployee(true);
  };

  const handleAddClick = () => {
    setVerifiedData(null);
    setShowAddEmployee(true);
  };

  const handleEdit = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    return;
  };

  const handleDelete = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    if (window.confirm(`Delete employee ${id}?`)) {
      return;
    }
  };

  const handleRowClick = (employee: Employee) => {
    return;
  };

  // --- COLUMNS DEFINITION ---
  const columns: Column<Employee>[] = [
    {
      key: "profile",
      header: "",
      align: "left",
      render: (emp) => {
        const name = String(emp.name ?? "").trim();
        const initial = (name[0] ?? "?").toUpperCase();
        const src = String(
          (emp as any)?.profilePictureUrl ??
            (emp as any)?.profile_picture_url ??
            (emp as any)?.photoUrl ??
            (emp as any)?.imageUrl ??
            (emp as any)?.avatarUrl ??
            "",
        ).trim();

        return src ? (
          <img
            src={src}
            alt={name || "Employee"}
            className="w-8 h-8 rounded-full object-cover border border-theme"
            onError={(ev) => {
              (ev.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-700)] flex items-center justify-center text-white text-xs font-bold border border-theme">
            {initial}
          </div>
        );
      },
    },
    {
      key: "name",
      header: "Name",
      align: "left",
      render: (emp) => (
        <div className="flex items-center gap-3">
          <span className="font-medium text-gray-800">{emp.name}</span>
        </div>
      ),
    },
    { key: "jobTitle", header: "Job Title", align: "left" },
    { key: "department", header: "Department", align: "left" },
    { key: "workLocation", header: "Location", align: "left" },

    {
      key: "status",
      header: "Status",
      align: "center",
      render: (emp) => <StatusBadge status={emp.status} />,
    },
    {
      key: "actions",
      header: "Actions",
      align: "center",
      render: (emp) => (
        <ActionGroup>
          <ActionButton
            type="view"
            iconOnly
            onClick={() => handleRowClick(emp)}
          />
          <ActionMenu
            onEdit={emp.id ? (e) => handleEdit(emp.id!, e) : undefined}
            onDelete={emp.id ? (e) => handleDelete(emp.id!, e) : undefined}
          />
        </ActionGroup>
      ),
    },
  ];
  const totalPages = Math.ceil(totalItems / pageSize);

  return (
    <div className="space-y-6">
      {/* --- CUSTOM FILTER BAR  --- */}
      <div className="bg-white rounded-lg shadow px-5 py-4">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative w-52">
            <FaSearch className="absolute left-3 top-2.5 text-gray-400 text-xs" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search name/job title"
              className="pl-8 pr-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 w-full"
            />
          </div>

          {/* Department */}
          <div className="relative w-40">
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="block w-full px-3 py-1 border border-gray-300 rounded-md bg-white text-gray-600 text-sm focus:ring-2 focus:ring-teal-500 appearance-none"
            >
              <option value="">Department</option>
              {uniqueDepartments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <FaSearch className="absolute right-3 top-2.5 text-gray-400 pointer-events-none text-xs" />
          </div>

          {/* Location */}
          <div className="relative w-36">
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="block w-full px-3 py-1 border border-gray-300 rounded-md bg-white text-gray-600 text-sm focus:ring-2 focus:ring-teal-500 appearance-none"
            >
              <option value="">Location</option>
              {uniqueLocations.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div className="relative w-28">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="block w-full px-3 py-1 border border-gray-300 rounded-md bg-white text-gray-600 text-sm focus:ring-2 focus:ring-teal-500 appearance-none"
            >
              <option value="">Status</option>
              <option value="Active">Active</option>
              <option value="On Leave">On Leave</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* Add Button */}
          <button
            onClick={handleAddClick}
            className="ml-auto flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition font-medium shadow-sm"
          >
            <FaPlus className="w-4 h-4" /> Add New Employee
          </button>
        </div>
      </div>
      {loading && (
        <div className="text-center py-4 text-gray-500">
          Loading employees...
        </div>
      )}
      {/* --- REUSABLE TABLE WRAPPED IN WHITE BG --- */}

      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
        <Table
          columns={columns}
          data={employees}
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={totalItems}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Modals */}
      {showVerificationModal && (
        <IdentityVerificationModal
          onVerified={handleVerified}
          onManualEntry={handleManualEntry}
          onClose={() => setShowVerificationModal(false)}
        />
      )}

      <AddEmployeeModal
        isOpen={showAddEmployee}
        onClose={() => setShowAddEmployee(false)}
        departments={uniqueDepartments}
        prefilledData={verifiedData}
      />
    </div>
  );
};

export default EmployeeDirectory;
