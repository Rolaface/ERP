import React, { useState, useCallback, useEffect } from "react";
import Table from "../../components/ui/Table/Table";
import type { Column } from "../../components/ui/Table/type";
import ActionButton, { ActionGroup, ActionMenu } from "../../components/ui/Table/ActionButton";
import { openUserRoleModal } from "../../store/modalStore";
import { useDataRefreshStore, REFRESH_KEYS } from "../../store/dataRefreshStore";
import type { UserRole, PermissionEntry } from "../../types/RoleManagement/UserRole";
import { getActiveModules } from "../../hooks/useUserRole";
import { showConfirm, showSuccess, showApiError } from "../../utils/alert";
import { getUserRoles, getUserRoleById, updateUserRoleStatus } from "../../api/RoleManagement/UserRoleApi";
import { updateUserRoles } from "../../api/RoleManagement/UserRoleApi";
import type { UserRoleFormData } from "../../types/RoleManagement/UserRole";
import { useAuth } from "../../context/AuthContext";
import { usePermission } from "../../hooks/permission/usePermission";
import PermissionGate from "../PermissionGate";


const mapApiRoleToUserRole = (apiRole: {
  Id: string;
  roleName: string;
  disabled: 0 | 1;
}): UserRole => ({
  roleId: apiRole.Id,
  role: apiRole.roleName ?? "",
  permission: [],
  disabled: apiRole.disabled,
});

const USER_ROLE_MODULE = "User Role";
// const deleteUserRole = async (role: string): Promise<void> => {
//   console.log("Delete role:", role);
// };

const PermissionSummary: React.FC<{ permissions: PermissionEntry[] }> = ({ permissions }) => {
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
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const { refreshPermissions } = useAuth();
  const { can } = usePermission();

  const refreshKey = useDataRefreshStore(
    (state) => state.refreshFlags[REFRESH_KEYS.USER_ROLE_LIST]
  );


  const fetchRoles = async (search?: string, currentPage?: number, currentPageSize?: number) => {
    setLoading(true);
    try {
      const response = await getUserRoles(search, currentPage, currentPageSize);
      if (response.status !== "success") throw new Error(response.message ?? "Failed to fetch roles");
      setRoles(response.data.map(mapApiRoleToUserRole));
      setTotalItems(response.pagination.total);
      setTotalPages(response.pagination.total_pages);
    } catch (err) {
      showApiError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles(searchQuery, page, pageSize);
  }, [page, pageSize]);

  const subscribeToRefresh = useDataRefreshStore((state) => state.subscribeToRefresh);
  useEffect(() => {
    const unsubscribe = subscribeToRefresh(REFRESH_KEYS.USER_ROLE_LIST, () => {
      fetchRoles(searchQuery, page, pageSize);
    });
    return () => unsubscribe();
  }, [subscribeToRefresh]);

  const openRoleModal = async (row: UserRole, isEdit: boolean, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      const res = await getUserRoleById(row.roleId ?? row.role);
      if (res.message.status !== "success") throw new Error("Failed to fetch role details");
      const data = res.message.data;
      openUserRoleModal(
        {
          role: data.roleName,
          permission: data.permissions.map((p) => ({
            module: p.module,
            read: p.read ?? 0,
            write: p.write ?? 0,
            create: p.create ?? 0,
            delete: p.delete ?? 0,
            import: p.import ?? 0,
            export: p.export ?? 0,
            report: p.report ?? 0,
            submit: p.submit ?? 0,
            cancel: p.cancel ?? 0,
          })),
        },
        isEdit,
        {
          onSuccess: () => fetchRoles(searchQuery, page, pageSize),
          ...(isEdit && {
            onSubmit: async (data: unknown) => {
              await updateUserRoles(data as UserRoleFormData);
              await refreshPermissions();
            },
          }),
        }
      );
    } catch (err) {
      showApiError(err);
    }
  };

  const handleView = (row: UserRole) => openRoleModal(row, true);
  const handleEdit = (row: UserRole) => openRoleModal(row, true);

  const handleToggleStatus = async (row: UserRole) => {
    const id = row.roleId ?? row.role;
    setTogglingId(id);
    try {
      await updateUserRoleStatus(id, row.disabled ? 0 : 1);
      showSuccess(`Role ${row.disabled ? "enabled" : "disabled"} successfully`);
      fetchRoles(searchQuery, page, pageSize);
    } catch (err) {
      showApiError(err);
    } finally {
      setTogglingId(null);
    }
  };

  // const handleDelete = useCallback(
  //   async (role: string, e: React.MouseEvent) => {
  //     e.stopPropagation();
  //     const confirmed = await showConfirm("This action cannot be undone.", {
  //       title: "Delete Role?",
  //       confirmButtonText: "Delete",
  //       cancelButtonText: "Cancel",
  //     });
  //     if (!confirmed) return;
  //     try {
  //       await deleteUserRole(role);
  //       showSuccess("Role deleted successfully");
  //       fetchRoles(searchQuery, page, pageSize);
  //     } catch (err) {
  //       showApiError(err);
  //     }
  //   },
  //   [fetchRoles, searchQuery, page, pageSize] 
  // );


  // ── Columns ───────────────────────────────────────────────────────────────

  const columns: Column<UserRole>[] = [
    {
      key: "role",
      header: "Role Name",
      render: (row) => (
        <span className="font-semibold text-main text-sm">{row.role}</span>
      ),
    },
    {
      key: "disabled",
      header: "Status",
      render: (row) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${row.disabled
            ? "bg-red-50 text-red-600 border-red-200"
            : "bg-emerald-50 text-emerald-700 border-emerald-200"
            }`}
        >
          {row.disabled ? "Inactive" : "Active"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "center",
      render: (row) => (
        <ActionGroup>
          <PermissionGate module={USER_ROLE_MODULE} action="write">
            <ActionButton
              type="edit"
              onClick={() => handleEdit(row)}
              iconOnly
              title="Edit Role"
            />
          </PermissionGate>
          {(can(USER_ROLE_MODULE, "read") ||
            can(USER_ROLE_MODULE, "write")) && (
              <ActionMenu
                customActions={[
                  ...(can(USER_ROLE_MODULE, "read")
                    ? [
                      {
                        label: "View Details",
                        onClick: () => handleView(row),
                      },
                    ]
                    : []),

                  ...(can(USER_ROLE_MODULE, "write")
                    ? [
                      {
                        label:
                          togglingId === (row.roleId ?? row.role)
                            ? "Updating..."
                            : row.disabled
                              ? "Enable"
                              : "Disable",
                        onClick: () => {
                          handleToggleStatus(row);
                        },
                        disabled:
                          togglingId === (row.roleId ?? row.role),
                      },
                    ]
                    : []),
                ]}
              />
            )}
        </ActionGroup>
      ),
    },
  ];

  return (
    <div className="h-full min-h-0">
      <Table
        columns={columns}
        data={roles}
        rowKey={(row) => row.roleId ?? row.role}
        tableId="user-role-management"
        loading={loading}
        isFetching={false}
        showToolbar
        searchValue={searchQuery}
        onSearch={(q) => {
          setSearchQuery(q);
          setPage(1);
          fetchRoles(q, 1, pageSize);
        }}
        enableAdd={can(USER_ROLE_MODULE, "create")}
        addLabel="Add Role"
        onAdd={() =>
          openUserRoleModal(null, false, {
            onSuccess: () => fetchRoles(searchQuery, page, pageSize),
          })
        }
        enableColumnSelector
        enableExport={can(USER_ROLE_MODULE, "export")}
        currentPage={page}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={totalItems}
        pageSizeOptions={[10, 25, 50, 100]}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
          fetchRoles(searchQuery, 1, size);
        }}
        onPageChange={(p) => {
          setPage(p);
          fetchRoles(searchQuery, p, pageSize);
        }}
      />
    </div>
  );
};

export default UserRolePage;