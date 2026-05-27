import React, { useEffect, useState, useCallback } from "react";
import ExpandableTreeTable from "../../components/ui/Table/ExpandableTreeTable";
import CustomerGroupModal from "../../components/customerGroup/CustomerGroupModal";
import { Users, Folder, FolderOpen, Plus } from "lucide-react";
import type { Column } from "../../components/ui/Table/type";
import {
  AppPage,
  AppPageHeader,
  AppPageBody,
} from "../../components/ui/app-shell";
import { usePermission } from "../../hooks/permission/usePermission";
import PermissionGate from "../PermissionGate";

import { showApiError, showSuccess } from "../../utils/alert";
import { confirmDelete } from "../../api/utils/confirmDelete";
import {
  getCustomerGroups,
  createCustomerGroup,
  updateCustomerGroup,
  deleteCustomerGroupById,
  type CustomerGroupPayload,
} from "../../api/customerGroupApi";

const CUSTOMER_GROUP_MODULE = "Customer Group";

type ModalMode = "create" | "edit" | "view";

const CustomerGroup: React.FC = () => {
  const [treeData, setTreeData] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    mode: ModalMode;
    data: any | null;
  }>({ isOpen: false, mode: "create", data: null });

  const { can } = usePermission();

  const normalizeCustomerGroups = (nodes: any[]): any[] => {
    if (!nodes) return [];
    return nodes.map((node) => ({
      ...node,
      id: node.id,
      name: node.customer_group_name,
      isGroup: node.is_group === 1,
      parent: node.parent_customer_group,
      children: Array.isArray(node.children)
        ? normalizeCustomerGroups(node.children)
        : [],
    }));
  };

  const fetchTree = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getCustomerGroups({ as_tree: 1 });
      const nodes = res.data || res;
      setTreeData(normalizeCustomerGroups(nodes));
    } catch (err: any) {
      console.error("Error fetching customer groups:", err);
      showApiError(err?.message || "Failed to fetch customer groups");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTree();
  }, [fetchTree]);

  const handleSaveCustomerGroup = async (payload: CustomerGroupPayload) => {
    try {
      setLoading(true);
      if (modalConfig.mode === "edit" && modalConfig.data) {
        await updateCustomerGroup(modalConfig.data.id, payload);
        showSuccess("Customer Group updated successfully");
      } else {
        await createCustomerGroup(payload);
        showSuccess("Customer Group created successfully");
      }

      setModalConfig({ isOpen: false, mode: "create", data: null });
      await fetchTree();
    } catch (err: any) {
      console.error("Failed to save customer group:", err);
      showApiError(err?.message || "Failed to save customer group");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const isDeleted = await confirmDelete({
      title: "Delete Customer Group?",
      text: "Are you sure you want to delete this customer group? This action cannot be undone.",
      loadingText: "Deleting Customer Group...",
      successMessage: "Customer Group deleted successfully",
      action: async () => {
        await deleteCustomerGroupById(id);
      },
    });

    if (isDeleted) {
      await fetchTree();
    }
  };

  const columns: Column<any>[] = [
    {
      key: "name",
      header: "Customer Groups",
      render: (row) => (
        <span className={row.isGroup ? "font-semibold" : ""}>{row.name}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (row) => (
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100">
          <PermissionGate module={CUSTOMER_GROUP_MODULE} action="read">
            <button
              onClick={() =>
                setModalConfig({ isOpen: true, mode: "view", data: row })
              }
              className="text-xs px-2 py-1 hover:bg-row-hover rounded"
            >
              View
            </button>
          </PermissionGate>
          <PermissionGate module={CUSTOMER_GROUP_MODULE} action="write">
            <button
              onClick={() =>
                setModalConfig({ isOpen: true, mode: "edit", data: row })
              }
              className="text-xs px-2 py-1 hover:bg-row-hover rounded"
            >
              Edit
            </button>
          </PermissionGate>
          {row.isGroup && can(CUSTOMER_GROUP_MODULE, "create") && (
            <button
              onClick={() =>
                setModalConfig({
                  isOpen: true,
                  mode: "create",
                  data: { parent_customer_group: row.id },
                })
              }
              className="text-xs px-2 py-1 hover:bg-row-hover rounded"
            >
              Add Child
            </button>
          )}
          <PermissionGate module={CUSTOMER_GROUP_MODULE} action="delete">
            <button
              onClick={() => handleDelete(row.id)}
              className="text-xs px-2 py-1 hover:bg-row-hover rounded text-red-500"
            >
              Delete
            </button>
          </PermissionGate>
        </div>
      ),
    },
  ];

  const expandIcon = (_: any, isExpanded: boolean, hasChildren: boolean) => {
    if (!hasChildren) return <span className="w-3" />;
    return isExpanded ? (
      <FolderOpen size={14} className="text-muted" />
    ) : (
      <Folder size={14} className="text-muted" />
    );
  };

  return (
    <AppPage>
      <AppPageHeader
        title="Customer Groups"
        description="Manage customer group hierarchy and structure."
        icon={<Users />}
      />
      <AppPageBody>
        <ExpandableTreeTable
          columns={columns}
          data={treeData}
          childrenKey="children"
          nodeKey={(node) => node.id}
          showToolbar
          searchValue={search}
          onSearch={setSearch}
          toolbarPlaceholder="Search customer groups..."
          showExpandControls
          onRefresh={fetchTree}
          defaultExpandDepth={99}
          indentSize={18}
          loading={loading}
          emptyMessage="No customer groups found"
          expandIconRender={expandIcon}
          extraFilters={
            can(CUSTOMER_GROUP_MODULE, "create") ? (
              <button
                onClick={() =>
                  setModalConfig({ isOpen: true, mode: "create", data: null })
                }
                className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded text-xs"
              >
                <Plus size={12} />
                Add
              </button>
            ) : null
          }
        />

        {modalConfig.isOpen && (
          <CustomerGroupModal
            isOpen={modalConfig.isOpen}
            mode={modalConfig.mode}
            initialData={modalConfig.data}
            onClose={() =>
              setModalConfig({ isOpen: false, mode: "create", data: null })
            }
            onSubmit={handleSaveCustomerGroup}
          />
        )}
      </AppPageBody>
    </AppPage>
  );
};

export default CustomerGroup;
