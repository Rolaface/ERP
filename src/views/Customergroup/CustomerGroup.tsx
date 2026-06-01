import React, { useEffect, useState, useCallback, useRef } from "react";
import ExpandableTreeTable, { PortalDropdown } from "../../components/ui/Table/ExpandableTreeTable";
import CustomerGroupModal from "../../components/customerGroup/CustomerGroupModal";
import { 
  Users, 
  Folder, 
  Plus, 
  MoreVertical, 
  Edit,
  Eye,
  Trash2,
  FolderPlus,
  ChevronDown,
  ChevronUp
} from "lucide-react";
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

interface MenuAction {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  dividerBefore?: boolean;
  permission?: { module: string; action: "read" | "write" | "create" | "delete" };
}

const RowActionMenu: React.FC<{ actions: MenuAction[]; can: (module: string, action: string) => boolean }> = ({ actions, can }) => {
  return (
    <div className="flex justify-end">
      <PortalDropdown
        align="right"
        trigger={
          <button
            type="button"
            className="w-7 h-7 flex items-center justify-center rounded-md transition-all text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            aria-label="Row Actions"
          >
            <MoreVertical size={16} strokeWidth={1.5} />
          </button>
        }
      >
        {actions.map((action, i) => {
          if (action.permission && !can(action.permission.module, action.permission.action)) {
            return null;
          }

          return (
            <React.Fragment key={i}>
              {action.dividerBefore && (
                <div className="border-t border-[var(--border)] my-1" />
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  action.onClick();
                }}
                className={`
                  w-full px-3 py-2 text-left text-[13px] flex items-center gap-2.5 transition
                  ${action.danger
                    ? "text-red-600 hover:bg-red-50"
                    : "text-gray-700 hover:bg-gray-50"
                  }
                `}
              >
                <span className={action.danger ? "text-red-500" : "text-gray-400"}>
                  {action.icon}
                </span>
                {action.label}
              </button>
            </React.Fragment>
          );
        })}
      </PortalDropdown>
    </div>
  );
};

const CustomerGroup: React.FC = () => {
  const [treeData, setTreeData] = useState<any[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const tableRef = useRef<any>(null);

  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    mode: ModalMode;
    data: any | null;
  }>({ isOpen: false, mode: "create", data: null });

  const { can } = usePermission();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput), 250);
    return () => clearTimeout(timer);
  }, [searchInput]);

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
      header: "GROUP NAME",
      align: "left",
      render: (row) => (
        <span className={row.isGroup ? "font-medium text-gray-900" : "text-gray-600"}>
          {row.name}
        </span>
      ),
    },
    {
      key: "actions",
      header: "ACTIONS",
      align: "right",
      render: (row) => {
        const actions: MenuAction[] = [
          {
            label: "View",
            icon: <Eye size={14} strokeWidth={1.5} />,
            onClick: () => setModalConfig({ isOpen: true, mode: "view", data: row }),
            permission: { module: CUSTOMER_GROUP_MODULE, action: "read" }
          },
          {
            label: "Edit",
            icon: <Edit size={14} strokeWidth={1.5} />,
            onClick: () => setModalConfig({ isOpen: true, mode: "edit", data: row }),
            permission: { module: CUSTOMER_GROUP_MODULE, action: "write" }
          },
          ...(row.isGroup ? [
            {
              label: "Add Child",
              icon: <FolderPlus size={14} strokeWidth={1.5} />,
              onClick: () => setModalConfig({ isOpen: true, mode: "create", data: { parent_customer_group: row.id } }),
              permission: { module: CUSTOMER_GROUP_MODULE, action: "create" } as any
            }
          ] : []),
          {
            label: "Delete",
            icon: <Trash2 size={14} strokeWidth={1.5} />,
            onClick: () => handleDelete(row.id),
            danger: true,
            dividerBefore: true,
            permission: { module: CUSTOMER_GROUP_MODULE, action: "delete" }
          },
        ];

        return <RowActionMenu actions={actions} can={can} />;
      },
    },
  ];

  const expandIcon = (node: any, isExpanded: boolean, hasChildren: boolean) => {
    return null;
  };

  return (
    <AppPage>
      {/* <AppPageHeader
        title="Customer Groups"
        description="Manage customer group hierarchy and structure."
        icon={<Users />}
      /> */}
      <AppPageBody>
        <ExpandableTreeTable
          ref={tableRef}
          columns={columns}
          data={treeData}
          childrenKey="children"
          nodeKey={(node) => node.id}
          isGroupKey="isGroup"
          showToolbar
          searchValue={debouncedSearch} 
          onSearch={setSearchInput}     
          toolbarPlaceholder="Search groups..."
          showExpandControls={false}
          onRefresh={fetchTree}
          defaultExpandDepth={99}
          indentSize={24}
          loading={loading}
          emptyMessage="No customer groups found"
          expandIconRender={expandIcon}
          extraFilters={
            <div className="flex items-center gap-2">
              <button
                onClick={() => tableRef.current?.expandAll?.()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded text-xs font-medium transition-colors"
              >
                <ChevronDown size={14} className="text-gray-400" />
                Expand All
              </button>
              
              <button
                onClick={() => tableRef.current?.collapseAll?.()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded text-xs font-medium transition-colors"
              >
                <ChevronUp size={14} className="text-gray-400" />
                Collapse All
              </button>

              {can(CUSTOMER_GROUP_MODULE, "create") && (
                <button
                  onClick={() =>
                    setModalConfig({ isOpen: true, mode: "create", data: null })
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 ml-2 bg-[#0e1726] hover:bg-[#1a2942] text-white rounded text-xs font-medium transition-colors"
                >
                  <Plus size={14} />
                  Add Group
                </button>
              )}
            </div>
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