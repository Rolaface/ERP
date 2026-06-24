import React, { useState, useCallback, useEffect } from "react";
import Table from "../../components/ui/Table/Table";
import type { Column } from "../../components/ui/Table/type";
import ActionButton, { ActionGroup, ActionMenu } from "../../components/ui/Table/ActionButton";
import PermissionGate from "../PermissionGate";
import { usePermission } from "../../hooks/permission/usePermission";
import { openUserModal } from "../../store/modalStore";
import { useDataRefreshStore, REFRESH_KEYS } from "../../store/dataRefreshStore";
import { showConfirm, showSuccess, showApiError } from "../../utils/alert";
import { getUsers, updateUser, deleteUser, createUser } from "../../api/RoleManagement/CreateUserApi";
import type { UserRow } from "../../api/RoleManagement/CreateUserApi";
import type { CreateUserFormData } from "../../types/RoleManagement/CreateUser";

// The module name that controls User Management permissions
const USER_MODULE = "User";

// ─── Main Page ────────────────────────────────────────────────────────────────

const CreateUserPage: React.FC = () => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchQuery, setSearchQuery] = useState("");
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);


  const { can } = usePermission();

  const subscribeToRefresh = useDataRefreshStore((state) => state.subscribeToRefresh);

  const fetchUsers = async (search?: string, currentPage?: number, currentPageSize?: number) => {
    setLoading(true);
    try {
      const response = await getUsers(search, currentPage, currentPageSize);
      if (response.status !== "success") throw new Error(response.message ?? "Failed to fetch users");
      setUsers(response.data);
      setTotalItems(response.pagination.total);
      setTotalPages(response.pagination.total_pages);
    } catch (err) {
      showApiError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(searchQuery, page, pageSize);
  }, [page, pageSize]);

  useEffect(() => {
    const unsubscribe = subscribeToRefresh(REFRESH_KEYS.CREATE_USER_LIST, () => {
      fetchUsers(searchQuery, page, pageSize);
    });
    return () => unsubscribe();
  }, [subscribeToRefresh]);

  const handleAdd = () => {
    openUserModal(null, false, {
      onSuccess: () => fetchUsers(searchQuery, page, pageSize),
      onSubmit: async (data: unknown) => {
        await createUser(data as CreateUserFormData);
      },
    });
  };

  const handleEdit = (row: UserRow, e: React.MouseEvent) => {
    e.stopPropagation();
    openUserModal(row, true, {
      onSuccess: () => fetchUsers(searchQuery, page, pageSize),
      onSubmit: async (data: unknown) => {
        await updateUser(row.id, data as CreateUserFormData);
      },
    });
  };

 const handleView = (row: UserRow, e?: React.MouseEvent) => {
  e?.stopPropagation();
  openUserModal(row, true, { isViewMode: true });
};


  const handleDelete = async (userId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = await showConfirm("This action cannot be undone.", {
      title: "Delete User?",
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
    });
    if (!confirmed) return;
    try {
      await deleteUser(userId);
      showSuccess("User deleted successfully");
      fetchUsers(searchQuery, page, pageSize);
    } catch (err) {
      showApiError(err);
    }
  };

  // ── Columns ────────────────────────────────────────────────────────────────
  const columns: Column<UserRow>[] = [
    {
      key: "username",
      header: "Username",
      render: (row) => (
        <span className="font-semibold text-main text-sm">{row.username}</span>
      ),
    },
    {
      key: "email",
      header: "Email",
      render: (row) => <span className="text-sm text-muted">{row.email}</span>,
    },
    {
      key: "name",
      header: "Name",
      render: (row) => <span className="text-sm text-main">{row.name || "—"}</span>,
    },
    {
      key: "enabled",
      header: "Status",
      render: (row) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${row.enabled
            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
            : "bg-red-50 text-red-600 border-red-200"
            }`}
        >
          {row.enabled ? "Active" : "Inactive"}
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
            type="view"
            onClick={(e) => handleView(row, e as React.MouseEvent)}
            iconOnly
            title="View User"
          />
          {/* ── EDIT button — only if user has `write` on User module ── */}
          <PermissionGate module={USER_MODULE} action="write">


            <ActionButton
              type="edit"
              onClick={(e) => handleEdit(row, e as React.MouseEvent)}
              iconOnly
              title="Edit User"
            />
          </PermissionGate>

          {/* 
          <ActionMenu
            customActions={[
              // Delete — only if user has `delete`
              ...(can(USER_MODULE, "delete")
                ? [
                    {
                      label: "Delete",
                      onClick: (e: React.MouseEvent) => handleDelete(row.id, e),
                    },
                  ]
                : []),
            ]}
          /> */}
        </ActionGroup>
      ),
    },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="h-full min-h-0">
      <Table
        columns={columns}
        data={users}
        rowKey={(row) => row.id}
        tableId="create-user-management"
        loading={loading}
        isFetching={false}
        showToolbar
        searchValue={searchQuery}
        onSearch={(q) => {
          setSearchQuery(q);
          setPage(1);
          fetchUsers(q, 1, pageSize);
        }}
        // ── Add button: only show if user can create ──────────────────────
        enableAdd={can(USER_MODULE, "create")}
        addLabel="Add User"
        onAdd={handleAdd}
        enableColumnSelector
        // ── Export: only show if user has export permission ───────────────
        enableExport={can(USER_MODULE, "export")}
        currentPage={page}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={totalItems}
         pageSizeOptions={[20, 50, 100,200]}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
          fetchUsers(searchQuery, 1, size);
        }}
        onPageChange={(p) => {
          setPage(p);
          fetchUsers(searchQuery, p, pageSize);
        }}
        onRowDoubleClick={(row) => handleView(row)}
      />
    </div>
  );
};

export default CreateUserPage;
