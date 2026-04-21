import React, { useState, useEffect, useCallback, useRef } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import ExpandableTreeTable, { PortalDropdown } from "../../components/ui/Table/ExpandableTreeTable";
import type { Column } from "../../components/ui/Table/type";
import DeleteModal from "../../components/actionModal/DeleteModal";
import { showApiError, showSuccess } from "../../utils/alert";

import {
  getItemGroupTree,
  deleteItemGroupById,
} from "../../api/itemGroupApi";

import {
  AlertCircle,
  Loader2,
  RefreshCw,
  FolderOpen,
  Folder,
  Package,
  MoreHorizontal,
  Pencil,
  Trash2,
  GitBranch,
  Plus,
  PackageSearch
} from "lucide-react";


type OutletContextType = {
  openCategoryCreate: (options?: {
  parent?: string;
  onSuccess?: () => void;
}) => void;
  openCategoryEdit: (id: string, data?: any) => void; 
};

export interface ItemGroupNode {
  name: string;
  item_group_name: string;
  parent_item_group: string | null;
  is_group: number;
  item_count: number;
  children?: ItemGroupNode[];
}

export interface ItemGroupTreeResponse {
  status_code: number;
  message: string;
  data: {
    total: number;
    item_groups: ItemGroupNode[];
  };
}


function normalizeItemGroups(groups: ItemGroupNode[]): ItemGroupNode[] {
  return groups.map((g) => ({
    ...g,
    children: Array.isArray(g.children) ? normalizeItemGroups(g.children) : [],
  }));
}

function matchItemGroupNode(node: ItemGroupNode, term: string): boolean {
  const t = term.toLowerCase();
  return (
    node.name.toLowerCase().includes(t) ||
    node.item_group_name.toLowerCase().includes(t)
  );
}

function itemGroupExpandIcon(
  _node: ItemGroupNode,
  isExpanded: boolean,
  hasChildren: boolean,
): React.ReactNode {
  if (!hasChildren)
    return <Package size={12} className="text-muted opacity-50" />;
  return isExpanded ? (
    <FolderOpen size={13} className="text-muted" />
  ) : (
    <Folder size={13} className="text-muted" />
  );
}


interface MenuAction {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  dividerBefore?: boolean;
}

const RowActionMenu: React.FC<{ actions: MenuAction[] }> = ({ actions }) => {
  return (
    <div className="flex justify-end">
      <PortalDropdown
        align="right"
        trigger={
          <button
            type="button"
            className="w-7 h-7 flex items-center justify-center rounded-md transition text-muted hover:bg-row-hover hover:text-main"
          >
            <MoreHorizontal size={15} />
          </button>
        }
      >
        {actions.map((action, i) => (
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
                w-full px-3 py-2 text-left text-xs flex items-center gap-2.5 transition
                ${
                  action.danger
                    ? "text-danger hover:bg-danger/10"
                    : "text-main hover:bg-row-hover"
                }
              `}
            >
              <span className={action.danger ? "text-danger" : "text-muted"}>
                {action.icon}
              </span>
              {action.label}
            </button>
          </React.Fragment>
        ))}
      </PortalDropdown>
    </div>
  );
};


const ItemsCategory: React.FC = () => {
  const { openCategoryCreate, openCategoryEdit } = useOutletContext<OutletContextType>();
  const navigate = useNavigate();

  const [treeData, setTreeData] = useState<ItemGroupNode[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<ItemGroupNode | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchTree = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res: any = await getItemGroupTree(); 
      const responseBody = res?.message || res;

      if (responseBody?.status_code === 200 && responseBody?.data) {
        const normalizedGroups = normalizeItemGroups(responseBody.data.item_groups);
        setTreeData(normalizedGroups);
      } else {
        const errorText = typeof responseBody?.message === 'string' 
            ? responseBody.message 
            : "Failed to load item groups.";
            
        setError(errorText);
      }
    } catch (err: any) {
      setError(typeof err?.message === 'string' ? err.message : "An error occurred while fetching item groups.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTree();
  }, [fetchTree]);

const handleAddChild = (row: ItemGroupNode) => {
  openCategoryCreate({
    parent: row.name,
    onSuccess: fetchTree,
  });
};
  

  const confirmDelete = async () => {
    if (!groupToDelete) return;

    try {
      setDeleting(true);
      const res = await deleteItemGroupById(groupToDelete.name);
      if (!res || ![200,202].includes(res.status)) {
        showApiError(res);
        return;
      }

      showSuccess(res.message || `Item Group ${groupToDelete.item_group_name} deleted succesfully`);
      setDeleteModalOpen(false);
      fetchTree();
    } catch (err: any) {
      showApiError(err);
    } finally {
      setDeleting(false);
      setGroupToDelete(null);
    }
  };

  if (loading && treeData.length === 0) {
    return (
      <div className="bg-card rounded-2xl border border-[var(--border)] flex flex-col items-center justify-center py-24 gap-3 shadow-sm">
        <Loader2 size={28} className="animate-spin text-primary" />
        <p className="text-xs font-bold text-muted uppercase tracking-widest opacity-40">
          Loading Item Groups…
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card rounded-2xl border border-[var(--border)] flex flex-col items-center justify-center py-24 gap-4 shadow-sm">
        <AlertCircle size={28} className="text-danger" />
        <p className="text-xs font-bold text-danger uppercase tracking-widest">
          {error}
        </p>
        <button
          onClick={fetchTree}
          className="flex items-center gap-2 px-5 py-2.5 text-[10px] font-black uppercase tracking-widest bg-primary rounded-xl transition-all hover:opacity-90"
        >
          <RefreshCw size={11} />
          Retry
        </button>
      </div>
    );
  }

  const columns: Column<ItemGroupNode>[] = [
    {
      key: "item_group_name",
      header: "Group Name",
      align: "left",
      render: (row) => (
        <span
          className={
            row.is_group ? "font-semibold text-main" : "font-normal text-main"
          }
        >
          {row.item_group_name}
        </span>
      ),
    },
    {
      key: "name",
      header: "ID",
      align: "left",
      render: (row) => <span className="text-xs text-muted">{row.name}</span>,
    },
    {
      key: "item_count",
      header: "Item Count",
      align: "center",
      render: (row) => {
        if (row.item_count === 0) return <span className="text-muted text-xs">—</span>;
        return (
          <code className="text-xs px-2 py-1 rounded bg-row-hover text-main">
            {row.item_count}
          </code>
        );
      },
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (row) => {
        const actions: MenuAction[] = [
          {
            label: "Edit",
            icon: <Pencil size={12} />,
            onClick: () => openCategoryEdit(row.name, row),
          },
          ...(row.is_group === 1
            ? [
                {
                  label: "Add Child",
                  icon: <GitBranch size={12} />,
                  onClick: () => handleAddChild(row),
                },
              ]
            : [
                {
                  label: "View Items",
                  icon: <PackageSearch size={12} />,
                  onClick: () =>
                    navigate("/items", {
                      state: { item_group: row.name },
                    }),
                },
              ]),
          {
            label: "Delete",
            icon: <Trash2 size={12} />,
            onClick: () => {
              setGroupToDelete(row);
              setDeleteModalOpen(true);
            },
            danger: true,
            dividerBefore: true,
          },
        ];

        return <RowActionMenu actions={actions} />;
      },
    },
  ];

  return (
    <div className="h-full min-h-0">
      <ExpandableTreeTable<ItemGroupNode>
        columns={columns}
        data={treeData}
        childrenKey="children"
        nodeKey={(node) => node.name}
        showToolbar
        searchValue={searchTerm}
        onSearch={setSearchTerm}
        toolbarPlaceholder="Search item groups…"
        showExpandControls
        onRefresh={fetchTree}
        matchNode={matchItemGroupNode}
        defaultExpandDepth={10}
        indentSize={20}
        loading={loading}
        emptyMessage="No item groups found."
        expandIconRender={itemGroupExpandIcon}
        extraFilters={
          <button
            type="button"
            onClick={() =>
  openCategoryCreate({
    parent: treeData?.[0]?.name,
    onSuccess: fetchTree,
  })
}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-medium hover:opacity-90 transition"
          >
            <Plus size={13} />
            New Group
          </button>
        }
      />

      {deleteModalOpen && groupToDelete && (
        <DeleteModal
          entityName="Item Group"
          entityId={groupToDelete.name}
          entityDisplayName={groupToDelete.item_group_name}
          isLoading={deleting}
          onClose={() => {
            setDeleteModalOpen(false);
            setGroupToDelete(null);
          }}
          onDelete={confirmDelete}
        />
      )}
    </div>
  );
};

export default ItemsCategory;