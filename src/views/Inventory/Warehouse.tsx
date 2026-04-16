import React, { useState, useEffect, useCallback, useRef } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import ExpandableTreeTable from "../../components/ui/Table/ExpandableTreeTable";
import type { Column } from "../../components/ui/Table/type";
import DeleteModal from "../../components/actionModal/DeleteModal";
import { showApiError, showSuccess } from "../../utils/alert";


import { getWarehouseTree, deleteWarehouseById } from "../../api/WarehouseApi";

import {
  AlertCircle,
  Loader2,
  RefreshCw,
  FolderOpen,
  Folder,
  Warehouse,
  MoreHorizontal,
  Pencil,
  Trash2,
  GitBranch,
  Plus,
  Boxes,
} from "lucide-react";

type OutletContextType = {
  openWarehouseCreate: (options?: {
    parent?: string;
    onSuccess?: () => void;
  }) => void;

  openWarehouseEdit: (id: string, data?: any) => void;
};
export interface WarehouseNode {
  name: string;
  warehouse_name: string;
  parent_warehouse: string | null;
  is_group: number;
  bin_count: number;
  company: string;
  children?: WarehouseNode[];
}

export interface WarehouseTreeResponse {
  status_code: number;
  message: string;
  data: {
    total: number;
    warehouses: WarehouseNode[];
  };
}

function normalizeWarehouses(nodes: WarehouseNode[]): WarehouseNode[] {
  return nodes.map((node) => ({
    ...node,
    children: Array.isArray(node.children)
      ? normalizeWarehouses(node.children)
      : [],
  }));
}

function matchWarehouseNode(node: WarehouseNode, term: string): boolean {
  const t = term.toLowerCase();
  return (
    node.name.toLowerCase().includes(t) ||
    node.warehouse_name.toLowerCase().includes(t) ||
    node.company.toLowerCase().includes(t)
  );
}

function warehouseExpandIcon(
  _node: WarehouseNode,
  isExpanded: boolean,
  hasChildren: boolean,
): React.ReactNode {
  if (!hasChildren)
    return <Warehouse size={12} className="text-muted opacity-50" />;
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
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative flex justify-end">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((p) => !p);
        }}
        className={`
          w-7 h-7 flex items-center justify-center rounded-md transition
          opacity-100
          ${
            open
              ? "bg-primary/10 text-primary"
              : "text-muted hover:bg-row-hover hover:text-main"
          }
        `}
      >
        <MoreHorizontal size={15} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-8 z-50 min-w-[160px] bg-card border border-theme rounded-xl shadow-xl py-1.5 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {actions.map((action, i) => (
            <React.Fragment key={i}>
              {action.dividerBefore && (
                <div className="border-t border-theme my-1" />
              )}
              <button
                type="button"
                onClick={() => {
                  action.onClick();
                  setOpen(false);
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
        </div>
      )}
    </div>
  );
};

interface WarehouseViewProps {
  openWarehouseCreate?: (initialData?: { parent: string }) => void;
  openWarehouseEdit?: (id: string, data?: any) => void;
}

const WarehouseView: React.FC<WarehouseViewProps> = ({
  openWarehouseCreate: propOpenWarehouseCreate,
  openWarehouseEdit: propOpenWarehouseEdit,
}) => {
  const outletContext = useOutletContext<OutletContextType>();
  const navigate = useNavigate();

  const openWarehouseCreate =
    propOpenWarehouseCreate || outletContext?.openWarehouseCreate;
  const openWarehouseEdit =
    propOpenWarehouseEdit || outletContext?.openWarehouseEdit;

  const [treeData, setTreeData] = useState<WarehouseNode[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [warehouseToDelete, setWarehouseToDelete] =
    useState<WarehouseNode | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchTree = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res: any = await getWarehouseTree();
      const responseBody = res?.message || res;

      if (responseBody?.status_code === 200 && responseBody?.data) {
        const normalizedNodes = normalizeWarehouses(
          responseBody.data.warehouses,
        );
        setTreeData(normalizedNodes);
      } else {
        const errorText =
          typeof responseBody?.message === "string"
            ? responseBody.message
            : "Failed to load warehouses.";

        setError(errorText);
      }
    } catch (err: any) {
      setError(
        typeof err?.message === "string"
          ? err.message
          : "An error occurred while fetching warehouses.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTree();
  }, [fetchTree]);

  const handleAddChild = (row: WarehouseNode) => {
    openWarehouseCreate({
      parent: row.name,
      onSuccess: fetchTree,
    });
  };
  const confirmDelete = async () => {
    if (!warehouseToDelete) return;

    try {
      setDeleting(true);
      const res = await deleteWarehouseById(warehouseToDelete.name);

      if (!res || ![200, 202].includes(res.status)) {
        showApiError(res);
        return;
      }

      showSuccess(
        res.message ||
          `Warehouse ${warehouseToDelete.warehouse_name} deleted successfully`,
      );
      setDeleteModalOpen(false);
      fetchTree();
    } catch (err: any) {
      showApiError(err);
    } finally {
      setDeleting(false);
      setWarehouseToDelete(null);
    }
  };

  if (loading && treeData.length === 0) {
    return (
      <div className="bg-card rounded-2xl border border-[var(--border)] flex flex-col items-center justify-center py-24 gap-3 shadow-sm">
        <Loader2 size={28} className="animate-spin text-primary" />
        <p className="text-xs font-bold text-muted uppercase tracking-widest opacity-40">
          Loading Warehouses…
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

  const columns: Column<WarehouseNode>[] = [
    {
      key: "warehouse_name",
      header: "Warehouse Name",
      align: "left",
      render: (row) => (
        <span
          className={
            row.is_group ? "font-semibold text-main" : "font-normal text-main"
          }
        >
          {row.warehouse_name}
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
      key: "company",
      header: "Company",
      align: "left",
      render: (row) => (
        <span className="text-xs text-muted">{row.company}</span>
      ),
    },
    {
      key: "bin_count",
      header: "Bins",
      align: "center",
      render: (row) => {
        if (row.bin_count === 0)
          return <span className="text-muted text-xs">—</span>;
        return (
          <code className="text-xs px-2 py-1 rounded bg-row-hover text-main">
            {row.bin_count} Bins
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
            onClick: () => openWarehouseEdit(row.name, row),
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
                  label: "View Stock",
                  icon: <Boxes size={12} />,
                  onClick: () =>
                    navigate("/stock-balance", {
                      state: { warehouse: row.name },
                    }),
                },
              ]),
          {
            label: "Delete",
            icon: <Trash2 size={12} />,
            onClick: () => {
              setWarehouseToDelete(row);
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
      <ExpandableTreeTable<WarehouseNode>
        columns={columns}
        data={treeData}
        childrenKey="children"
        nodeKey={(node) => node.name}
        showToolbar
        searchValue={searchTerm}
        onSearch={setSearchTerm}
        toolbarPlaceholder="Search warehouses…"
        showExpandControls
        onRefresh={fetchTree}
        matchNode={matchWarehouseNode}
        defaultExpandDepth={10}
        indentSize={20}
        loading={loading}
        emptyMessage="No warehouses found."
        expandIconRender={warehouseExpandIcon}
        extraFilters={
          <button
            type="button"
            onClick={() =>
              openWarehouseCreate({
                parent: treeData[0]?.name,
                onSuccess: fetchTree,
              })
            }
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-medium hover:opacity-90 transition"
          >
            <Plus size={13} />
            New Warehouse
          </button>
        }
      />

      {deleteModalOpen && warehouseToDelete && (
        <DeleteModal
          entityName="Warehouse"
          entityId={warehouseToDelete.name}
          entityDisplayName={warehouseToDelete.warehouse_name}
          isLoading={deleting}
          onClose={() => {
            setDeleteModalOpen(false);
            setWarehouseToDelete(null);
          }}
          onDelete={confirmDelete}
        />
      )}
    </div>
  );
};

export default WarehouseView;
