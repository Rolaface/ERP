import React, { useEffect, useState, useCallback } from "react";
import ExpandableTreeTable from "../../components/ui/Table/ExpandableTreeTable";
import CustomerGroupModal from "../../components/customerGroup/CustomerGroupModal";
import { Users } from "lucide-react"
import type { Column } from "../../components/ui/Table/type";
import { getCustomerGroupTree } from "../../api/customerApi";
import { Folder, FolderOpen, Plus } from "lucide-react";
import {
  AppPage,
  AppPageHeader,
  AppPageBody,
} from "../../components/ui/app-shell";
import { usePermission } from "../../hooks/permission/usePermission";
import PermissionGate from "../PermissionGate";


const CUSTOMER_GROUP_MODULE = "Customer Group";

const CustomerGroup: React.FC = () => {
  const [treeData, setTreeData] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const { can } = usePermission();

  const normalizeCustomerGroups = (nodes: any[]): any[] => {
    return nodes.map((node) => ({
      id: node.name,
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
      const res = await getCustomerGroupTree();
      setTreeData(normalizeCustomerGroups(res));
    } catch (err) {
      console.error("Error fetching customer groups:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTree();
  }, [fetchTree]);

  const columns: Column<any>[] = [
    {
      key: "name",
      header: "Customer Groups",
      render: (row) => (
        <span className={row.isGroup ? "font-semibold" : ""}>
          {row.name}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (row) => (
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100">
          <PermissionGate
            module={CUSTOMER_GROUP_MODULE}
            action="write"
          >
            <button className="text-xs px-2 py-1 hover:bg-row-hover rounded">
              Edit
            </button>
          </PermissionGate>
          {row.isGroup &&
            can(CUSTOMER_GROUP_MODULE, "create") && (
              <button className="text-xs px-2 py-1 hover:bg-row-hover rounded">
                Add Child
              </button>
            )}
          <PermissionGate
            module={CUSTOMER_GROUP_MODULE}
            action="delete"
          >
            <button className="text-xs px-2 py-1 hover:bg-row-hover rounded text-red-500">
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
          defaultExpandDepth={0}
          indentSize={18}
          loading={loading}
          emptyMessage="No customer groups found"
          expandIconRender={expandIcon}
          extraFilters={
            can(CUSTOMER_GROUP_MODULE, "create") ? (
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded text-xs"
              >
                <Plus size={12} />
                Add
              </button>
            ) : null
          }
        />

        {showModal && (
          <CustomerGroupModal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            onSubmit={() => {
              setShowModal(false);
              fetchTree();
            }}
          />
        )}
      </AppPageBody>
    </AppPage>
  );
};

export default CustomerGroup;