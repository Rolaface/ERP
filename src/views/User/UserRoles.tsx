import React, { useState, useCallback, useEffect, useMemo } from "react";
import Table from "../../components/ui/Table/Table";
import type { Column } from "../../components/ui/Table/type";
import ActionButton, {
  ActionGroup,
  ActionMenu,
} from "../../components/ui/Table/ActionButton";
import { openUserRoleModal } from "../../store/modalStore";
import { useDataRefreshStore, REFRESH_KEYS } from "../../store/dataRefreshStore";
import type { UserRole, PermissionEntry } from "../../hooks/useUserRole";
import { getActiveModules } from "../../hooks/useUserRole";
import Swal from "sweetalert2";

// ─── Mock API (replace with real API calls) ───────────────────────────────────
// TODO: Replace these with real API calls when backend is ready

const fetchUserRoles = async (): Promise<UserRole[]> => {
  // Replace with: return api.get("/user-roles")
  return [
    {
      id: 1,
      roleName: "Admin",
      description: "Full system access with all permissions",
      permissions: [
        { module: "Sales", subModule: null, actions: ["Create", "Read", "Write", "Delete", "Report", "Import", "Export"] },
        { module: "Procurement", subModule: null, actions: ["Create", "Read", "Write", "Delete"] },
      ],
      status: "Active",
    },
    {
      id: 2,
      roleName: "Sales Manager",
      description: "Sales module access and management",
      permissions: [
        { module: "Sales", subModule: "Invoices", actions: ["Create", "Read", "Write"] },
        { module: "Sales", subModule: "Quotations", actions: ["Create", "Read"] },
        { module: "Customer", subModule: "Customer Management", actions: ["Read"] },
      ],
      status: "Active",
    },
    {
      id: 3,
      roleName: "Viewer",
      description: "Read-only access to reports",
      permissions: [
        { module: "Sales", subModule: "Reports", actions: ["Read", "Report"] },
        { module: "Accounting", subModule: "General Ledger", actions: ["Read"] },
      ],
      status: "Inactive",
    },
  ];
};

const deleteUserRole = async (id: number): Promise<void> => {
  // Replace with: return api.delete(`/user-roles/${id}`)
  console.log("Delete role:", id);
};

// ─── Permission badge helper ──────────────────────────────────────────────────

const PermissionSummary: React.FC<{ permissions: PermissionEntry[] }> = ({
  permissions,
}) => {
  const modules = getActiveModules(permissions);
  const display = modules.slice(0, 3);
  const extra = modules.length - 3;

  return (
    <div className="flex flex-wrap gap-1">
      {display.map((mod) => (
        <span
          key={mod}
          className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20"
        >
          {mod}
        </span>
      ))}
      {extra > 0 && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--row-hover)] text-muted border border-[var(--border)]">
          +{extra} more
        </span>
      )}
      {modules.length === 0 && (
        <span className="text-xs text-muted italic">No permissions</span>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const UserRolePage: React.FC = () => {
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<keyof UserRole | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const refreshKey = useDataRefreshStore(
    (state) => state.refreshFlags[REFRESH_KEYS.USER_ROLE_LIST]
  );

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchRoles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchUserRoles();
      setRoles(data);
    } catch (err) {
      console.error("Failed to fetch user roles:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles, refreshKey]);

  // ── Filter + Sort + Paginate ───────────────────────────────────────────────
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return roles;
    const q = searchQuery.toLowerCase();
    return roles.filter(
      (r) =>
        r.roleName.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q)
    );
  }, [roles, searchQuery]);

  const sortedData = useMemo(() => {
    if (!sortBy) return filteredData;
    return [...filteredData].sort((a, b) => {
      const valA = String(a[sortBy] ?? "");
      const valB = String(b[sortBy] ?? "");
      return sortOrder === "asc"
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    });
  }, [filteredData, sortBy, sortOrder]);

  const totalItems = sortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const paginatedData = useMemo(
    () => sortedData.slice((page - 1) * pageSize, page * pageSize),
    [sortedData, page, pageSize]
  );

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleView = (row: UserRole) => {
    openUserRoleModal({ roleId: row.id, ...row }, true);
  };

  const handleEdit = (row: UserRole, e: React.MouseEvent) => {
    e.stopPropagation();
    openUserRoleModal({ roleId: row.id, ...row }, true);
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();

    const result = await Swal.fire({
      title: "Delete Role?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#ef4444",
    });

    if (!result.isConfirmed) return;

    try {
      await deleteUserRole(id);
      fetchRoles();
      Swal.fire({ icon: "success", title: "Deleted", timer: 1500, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ icon: "error", title: "Failed to delete role" });
    }
  };

  const handleSortChange = ({
    sortBy: col,
    sortOrder: order,
  }: {
    sortBy: string;
    sortOrder: "asc" | "desc";
  }) => {
    setSortBy(col as keyof UserRole);
    setSortOrder(order);
    setPage(1);
  };

  // ── Columns ────────────────────────────────────────────────────────────────
  const columns: Column<UserRole>[] = [
    {
      key: "roleName",
      header: "Role Name",
      sortable: true,
      render: (row) => (
        <span className="font-semibold text-main text-sm">{row.roleName}</span>
      ),
    },
    {
      key: "description",
      header: "Description",
      render: (row) => (
        <span className="text-sm text-muted truncate max-w-xs block">
          {row.description || "—"}
        </span>
      ),
    },
    {
      key: "permissions",
      header: "Module Access",
      render: (row) => <PermissionSummary permissions={row.permissions} />,
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (row) => (
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${
            row.status === "Active"
              ? "bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]/20"
              : "bg-[var(--danger)]/10 text-[var(--danger)] border border-[var(--danger)]/20"
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <ActionGroup>
          <ActionButton
            type="view"
            onClick={() => handleView(row)}
            iconOnly
          />
          <ActionButton
            type="edit"
            onClick={(e) => handleEdit(row, e as React.MouseEvent)}
            iconOnly
            title="Edit Role"
          />
          <ActionMenu
            onDelete={(e) => handleDelete(row.id, e as React.MouseEvent)}
            customActions={[
              {
                label: "View Details",
                onClick: () => handleView(row),
              },
            ]}
          />
        </ActionGroup>
      ),
    },
  ];

  return (
    <div className="h-full min-h-0">
      <Table
        columns={columns}
        data={paginatedData}
        rowKey={(row) => String(row.id)} 
        tableId="user-roles"
        loading={loading}
        isFetching={false}
        showToolbar
        onSearch={(q) => {
          setSearchQuery(q);
          setPage(1);
        }}
        enableAdd
        addLabel="Add Role"
        onAdd={() => openUserRoleModal(null, false)}
        enableColumnSelector
        enableExport
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
    </div>
  );
};

export default UserRolePage;