import React, { useEffect, useState, useCallback } from "react";
import ExpandableTreeTable from "../../components/ui/Table/ExpandableTreeTable";
import CustomerGroupModal from "../../components/customerGroup/CustomerGroupModal";
import { FaUsersCog } from "react-icons/fa";
import type { Column } from "../../components/ui/Table/type";
import { getCustomerGroupTree } from "../../api/customerApi";
import { Folder, FolderOpen, Plus } from "lucide-react";

const CustomerGroup: React.FC = () => {
  const [treeData, setTreeData] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

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
      const normalized = normalizeCustomerGroups(res);
      setTreeData(normalized);
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
          <button className="text-xs px-2 py-1 hover:bg-row-hover rounded">
            Edit
          </button>

          {row.isGroup && (
            <button className="text-xs px-2 py-1 hover:bg-row-hover rounded">
              Add Child
            </button>
          )}

          <button className="text-xs px-2 py-1 hover:bg-row-hover rounded text-red-500">
            Delete
          </button>
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
    <div className="p-6">
      <h1 className="text-xl font-semibold flex items-center gap-2 mb-4">
        <FaUsersCog className="text-primary" />
        Customer Groups
      </h1>

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
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded text-xs"
          >
            <Plus size={12} />
            New
          </button>
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
    </div>
  );
};

export default CustomerGroup;