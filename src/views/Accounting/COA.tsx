import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  useReactTable,
  getCoreRowModel,
  getExpandedRowModel,
  flexRender,
  type ColumnDef,
  type ExpandedState,
} from "@tanstack/react-table";
import { PortalDropdown } from "../../components/ui/Table/ExpandableTreeTable";
import {
  getChartOfAccounts,
  deleteChartOfAccount,
  getCOAById,
} from "../../api/Accounting/AccountApi";
import {
  showConfirm,
  showLoading,
  showSuccess,
  showApiError,
  closeSwal,
} from "../../utils/alert";
import {
  AlertCircle,
  Loader2,
  RefreshCw,
  FolderOpen,
  Folder,
  BookOpen,
  MoreHorizontal,
  Pencil,
  Trash2,
  GitBranch,
  BookMarked,
  Eye,
  Layers,
  ChevronRight,
  Search,
} from "lucide-react";
import NewAccountModal from "../../components/Coa/NewAccountModal";
import type { COAAccount, COAResponse, COAResponseData } from "../../types/coa";
import ViewAccountModal from "../../components/Coa/ViewAccountModal";
import { getCurrencySymbol } from "../../utils/currency";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { Download } from "lucide-react";
export interface COATabProps {
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  onViewLedger?: (account: string) => void;
}

function normalizeAccounts(accounts: COAAccount[]): COAAccount[] {
  return accounts.map((acc) => ({
    ...acc,
    balance_in_account_currency: acc.balance_in_account_currency ?? acc.balance,
    children: Array.isArray(acc.children)
      ? normalizeAccounts(acc.children)
      : [],
  }));
}

function matchCOANode(node: COAAccount, term: string): boolean {
  const t = term.toLowerCase();
  return (
    node.name.toLowerCase().includes(t) ||
    (node.account_type || "").toLowerCase().includes(t) ||
    node.root_type.toLowerCase().includes(t)
  );
}

/* filters the tree to nodes that match the term OR have a descendant that matches,
   preserving ancestry chains so the result is still a valid tree */
function filterTree(nodes: COAAccount[], term: string): COAAccount[] {
  if (!term.trim()) return nodes;

  const walk = (list: COAAccount[]): COAAccount[] =>
    list.reduce<COAAccount[]>((acc, node) => {
      const children = Array.isArray(node.children) ? walk(node.children) : [];
      const selfMatch = matchCOANode(node, term);
      if (selfMatch || children.length) {
        acc.push({ ...node, children });
      }
      return acc;
    }, []);

  return walk(nodes);
}

/* builds the {rowId: true} map needed to expand the tree to N levels by default */
const buildExpandedToDepth = (
  nodes: COAAccount[],
  depth: number,
  path = "",
): Record<string, boolean> => {
  let state: Record<string, boolean> = {};
  nodes.forEach((node, i) => {
    const id = path ? `${path}.${i}` : `${i}`;
    if (depth > 0 && node.children?.length) {
      state[id] = true;
      Object.assign(state, buildExpandedToDepth(node.children, depth - 1, id));
    }
  });
  return state;
};

/* expand every ancestor chain so search results are visible */
const buildExpandedForSearch = (
  nodes: COAAccount[],
  path = "",
): Record<string, boolean> => {
  let state: Record<string, boolean> = {};
  nodes.forEach((node, i) => {
    const id = path ? `${path}.${i}` : `${i}`;
    if (node.children?.length) {
      state[id] = true;
      Object.assign(state, buildExpandedForSearch(node.children, id));
    }
  });
  return state;
};

/* ───────────────── ROW ACTION MENU ───────────────── */

interface MenuAction {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  dividerBefore?: boolean;
}

const RowActionMenu: React.FC<{ actions: MenuAction[] }> = ({ actions }) => (
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
            className={`w-full px-3 py-2 text-left text-xs flex items-center gap-2.5 transition ${action.danger
              ? "text-danger hover:bg-danger/10"
              : "text-main hover:bg-row-hover"
              }`}
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

/* ───────────────── FILTER BAR (AccountsPayable / TrialBalance style) ───────────────── */

function FilterBar({
  searchTerm,
  setSearchTerm,
  hideZero,
  setHideZero,
  onRefresh,
  loading,
  allExpanded,
  onToggleExpand,
  onExport,
}: {
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  hideZero: boolean;
  setHideZero: (v: boolean) => void;
  onRefresh: () => void;
  loading: boolean;
  allExpanded: boolean;
  onToggleExpand: () => void;
  onExport: () => void;
}) {
  const btnClass =
    "h-7 px-2.5 flex items-center gap-1.5 text-[11px] font-semibold border border-[var(--border)] bg-card text-muted hover:text-main hover:border-primary/40 rounded-md transition-all whitespace-nowrap";

  return (
    <div className="bg-card border border-[var(--border)] rounded-lg px-3 py-2 flex flex-wrap items-center gap-2">
      <div className="relative flex-1 min-w-[220px] max-w-sm">
        <Search
          size={12}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted"
        />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search accounts…"
          className="h-7 w-full pl-7 pr-2.5 text-[11px] border border-[var(--border)] bg-app rounded-md text-main focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <label className="flex items-center gap-1.5 text-[11px] font-medium text-muted cursor-pointer select-none">
          <input
            type="checkbox"
            checked={hideZero}
            onChange={(e) => setHideZero(e.target.checked)}
            className="rounded border-[var(--border)] text-primary focus:ring-primary/50 cursor-pointer"
          />
          Hide Zero Values
        </label>

        <div className="w-px self-stretch bg-[var(--border)]" />

        <button onClick={onToggleExpand} className={btnClass}>
          {allExpanded ? <ChevronRight size={11} /> : <Layers size={11} />}
          {allExpanded ? "Collapse" : "Expand All"}
        </button>

        <button onClick={onRefresh} className={btnClass}>
          <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>

        <button onClick={onExport} className={btnClass}>
          <Download size={11} />
          Export
        </button>
      </div>
    </div>
  );
}

/* ───────────────── COMPONENT ───────────────── */

const COATab: React.FC<COATabProps> = ({
  searchTerm,
  setSearchTerm,
  onViewLedger,
}) => {
  const [coaData, setCoaData] = useState<COAResponseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewAccount, setShowNewAccount] = useState(false);
  const [hideZero, setHideZero] = useState(false);
  const [viewAccount, setViewAccount] = useState<COAAccount | null>(null);
  const [selectedParent, setSelectedParent] = useState<COAAccount | null>(null);
  const [editAccount, setEditAccount] = useState<COAAccount | null>(null);
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [allExpanded, setAllExpanded] = useState(false);

  const handleToggleExpand = useCallback(() => {
    if (allExpanded) {
      setExpanded({});
      setAllExpanded(false);
    } else {
      setExpanded(true);
      setAllExpanded(true);
    }
  }, [allExpanded]);

  const fetchCOA = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res: COAResponse = await getChartOfAccounts(
        hideZero ? { balance_filter: "non_zero" } : {},
      );
      if (res?.message?.status_code === 200 && res.message.data) {
        setCoaData({
          ...res.message.data,
          accounts: normalizeAccounts(res.message.data.accounts),
        });
      } else {
        setError(res?.message?.message || "Failed to load chart of accounts.");
      }
    } catch (err: any) {
      setError(
        err?.message || "An error occurred while fetching chart of accounts.",
      );
    } finally {
      setLoading(false);
    }
  }, [hideZero]);

  useEffect(() => {
    fetchCOA();
  }, [fetchCOA]);

  // tree data: filtered by search term, same matching logic as before (matchCOANode)
  const tableData: COAAccount[] = useMemo(() => {
    const accounts = coaData?.accounts ?? [];
    return filterTree(accounts, searchTerm);
  }, [coaData, searchTerm]);

const handleExport = useCallback(() => {
  if (!coaData?.accounts) return;

  const rows: any[] = [];

  const flattenAccounts = (accounts: COAAccount[], depth = 0) => {
    accounts.forEach((acc) => {
      const indent = "    ".repeat(depth);
      const prefix = acc.is_group
        ? depth === 0 ? "▶ " : "▸ "
        : "• ";

      rows.push({
        "Account Name": indent + prefix + acc.account_name,
        "Account Type": acc.account_type || "—",
        "Root Type": acc.root_type || "—",
        "Category": acc.is_group ? "── GROUP ──" : "Account",
        "Balance": acc.is_group ? "" : (acc.balance_in_account_currency ?? acc.balance ?? ""),
        "Status": acc.disabled === 1 ? "Disabled" : "Active",
      });

      if (acc.children?.length) flattenAccounts(acc.children, depth + 1);
    });
  };

  flattenAccounts(tableData);

  const ws = XLSX.utils.json_to_sheet(rows);

  ws["!cols"] = [
    { wch: 50 },
    { wch: 18 },
    { wch: 12 },
    { wch: 14 },
    { wch: 18 },
    { wch: 10 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Chart of Accounts");

  saveAs(
    new Blob(
      [XLSX.write(wb, { bookType: "xlsx", type: "array" })],
      { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }
    ),
    "chart_of_accounts.xlsx"
  );
}, [coaData, tableData]);

  // default-collapsed (depth 0), matching original defaultExpandDepth={0}
  const isFirstLoad = useRef(true);

  useEffect(() => {
    if (!coaData) return;
    if (searchTerm.trim()) {
      setExpanded(buildExpandedForSearch(tableData));
      return;
    }
    // only reset expand state on first load, not on every refresh
    if (isFirstLoad.current) {
      setExpanded(buildExpandedToDepth(tableData, 0));
      isFirstLoad.current = false;
    }
  }, [coaData, searchTerm, tableData]);

  const handleAddChild = (row: COAAccount) => {
    setSelectedParent(row);
    setShowNewAccount(true);
  };

  const handleDeleteAccount = async (row: COAAccount) => {
    const confirmed = await showConfirm(
      `Are you sure you want to delete account "${row.account_name}"?`,
      { title: "Delete Account", confirmButtonText: "Delete" },
    );
    if (!confirmed) return;
    showLoading("Deleting Account...");
    try {
      await deleteChartOfAccount(row.name);
      await fetchCOA();
      showSuccess(`Account "${row.account_name}" deleted successfully.`);
    } catch (error) {
      showApiError(error);
    } finally {
      closeSwal();
    }
  };

  const handleModalClose = () => {
    setShowNewAccount(false);
    setSelectedParent(null);
    setEditAccount(null);
  };

  const handleEditAccount = async (row: COAAccount) => {
    try {
      showLoading("Loading account details...");
      const data = await getCOAById(row.name);
      closeSwal();
      if (!data) {
        showApiError("Failed to load account details.");
        return;
      }
      setEditAccount({ ...row, ...data });
      setShowNewAccount(true);
    } catch (err) {
      closeSwal();
      showApiError(err);
    }
  };

  const columns = useMemo<ColumnDef<COAAccount>[]>(
    () => [
      {
        id: "name",
        header: "Account Name",
        size: 280,
        cell: ({ row }) => {
          const node = row.original;
          const canExpand = row.getCanExpand();

          return (
            <div
              className="flex items-center gap-1.5"
              style={{ paddingLeft: `${row.depth * 18}px` }}
            >
              {canExpand ? (
                <button
                  type="button"
                  onClick={row.getToggleExpandedHandler()}
                  className="shrink-0 text-muted hover:text-main flex items-center gap-1"
                >
                  <ChevronRight
                    size={12}
                    className={`transition-transform duration-150 ${row.getIsExpanded() ? "rotate-90" : ""
                      }`}
                  />
                  {row.getIsExpanded() ? (
                    <FolderOpen size={13} />
                  ) : (
                    <Folder size={13} />
                  )}
                </button>
              ) : (
                <BookOpen
                  size={12}
                  className="text-muted opacity-50 shrink-0"
                />
              )}
              <span
                className={`text-xs truncate ${node.is_group ? "font-semibold text-main" : "font-normal text-main"}`}
              >
                {node.account_name}
              </span>
              {node.disabled === 1 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-draft text-gray-300 ml-1 shrink-0">
                  Disabled
                </span>
              )}
            </div>
          );
        },
      },
      {
        id: "account_type",
        header: "Account Type",
        size: 160,
        cell: ({ row }) => (
          <span className="text-xs text-muted">
            {row.original.account_type || "—"}
          </span>
        ),
      },
      {
        id: "root_type",
        header: "Root Type",
        size: 130,
        cell: ({ row }) => {
          const badgeClass: Record<string, string> = {
            Asset: "bg-info text-info",
            Liability: "bg-danger text-danger",
            Equity: "bg-warning text-warning",
            Income: "bg-success text-success",
            Expense: "bg-draft text-gray-100",
          };
          const rootType = row.original.root_type;
          const badge = badgeClass[rootType] ?? "bg-info text-info";
          return rootType ? (
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${badge}`}
            >
              {rootType}
            </span>
          ) : (
            <span className="text-muted text-xs">—</span>
          );
        },
      },
      {
        id: "balance",
        header: "Balance",
        size: 150,
        meta: { align: "right" },
        cell: ({ row }) => {
          const node = row.original;
          if (node.is_group)
            return <span className="text-muted text-xs">—</span>;
          return (
            <code className="text-xs px-2 py-1 rounded bg-row-hover text-success">
              {getCurrencySymbol()}{" "}
              {node.balance_in_account_currency ?? node.balance}
            </code>
          );
        },
      },
      {
        id: "balance_in_account_currency",
        header: `Balance (${getCurrencySymbol()})`,
        size: 150,
        meta: { align: "right" },
        cell: ({ row }) => {
          const node = row.original;
          if (node.balance === null || node.balance === undefined)
            return <span className="text-muted text-xs">—</span>;
          return (
            <code className="text-xs px-2 py-1 rounded bg-row-hover text-main">
              {node.balance}
            </code>
          );
        },
      },
      {
        id: "actions",
        header: "",
        size: 60,
        meta: { align: "right" },
        cell: ({ row }) => {
          const node = row.original;
          const actions: MenuAction[] = [
            {
              label: "Edit",
              icon: <Pencil size={12} />,
              onClick: () => handleEditAccount(node),
            },
            {
              label: "View",
              icon: <Eye size={12} />,
              onClick: () => setViewAccount(node),
            },
            ...(node.is_group === 1
              ? [
                {
                  label: "Add Child",
                  icon: <GitBranch size={12} />,
                  onClick: () => handleAddChild(node),
                },
              ]
              : [
                {
                  label: "View Ledger",
                  icon: <BookMarked size={12} />,
                  onClick: () => onViewLedger?.(node.name),
                },
              ]),
            {
              label: "Delete",
              icon: <Trash2 size={12} />,
              onClick: () => handleDeleteAccount(node),
              danger: true,
              dividerBefore: true,
            },
          ];
          return <RowActionMenu actions={actions} />;
        },
      },
    ],
    [onViewLedger],
  );

  const table = useReactTable({
    data: tableData,
    columns,
    state: { expanded },
    onExpandedChange: (updater) => {
      setExpanded(updater);
      setAllExpanded(false);
    },
    getSubRows: (row) => row.children,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  });

  if (error && !coaData) {
    return (
      <div className="bg-card rounded-2xl border border-[var(--border)] flex flex-col items-center justify-center py-24 gap-4">
        <AlertCircle size={28} className="text-danger" />
        <p className="text-xs font-bold text-danger uppercase tracking-widest">
          {error}
        </p>
        <button
          onClick={fetchCOA}
          className="flex items-center gap-2 px-5 py-2.5 text-[10px] font-black uppercase tracking-widest bg-primary rounded-xl transition-all hover:opacity-90"
        >
          <RefreshCw size={11} /> Retry
        </button>
      </div>
    );
  }

  return (
    <>
      <NewAccountModal
        isOpen={showNewAccount}
        onClose={handleModalClose}
        onSuccess={fetchCOA}
        parentAccount={selectedParent}
        editAccount={editAccount}
      />
      <ViewAccountModal
        isOpen={viewAccount !== null}
        onClose={() => setViewAccount(null)}
        account={viewAccount}
      />

      <div className="flex flex-col gap-3">
        <FilterBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          hideZero={hideZero}
          setHideZero={setHideZero}
          onRefresh={fetchCOA}
          loading={loading}
          allExpanded={allExpanded}
          onToggleExpand={handleToggleExpand}
          onExport={handleExport} 

        />

        <div className="bg-card border border-[var(--border)] rounded-xl overflow-hidden flex flex-col">
          <div className="overflow-x-auto overflow-y-auto relative max-h-[520px]">
            <table
              className="border-collapse"
              style={{
                tableLayout: "fixed",
                width: "max-content",
                minWidth: "100%",
              }}
            >
              <colgroup>
                {table.getAllLeafColumns().map((col) => (
                  <col key={col.id} style={{ width: col.getSize() }} />
                ))}
              </colgroup>
              <thead className="sticky top-0 z-10 border-b border-[var(--border)] bg-card">
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id}>
                    {hg.headers.map((header) => {
                      const align =
                        (header.column.columnDef.meta as any)?.align === "right"
                          ? "text-right"
                          : "text-left";
                      return (
                        <th
                          key={header.id}
                          className={`px-3 py-2 text-[9px] font-black uppercase tracking-widest text-muted whitespace-nowrap bg-card border-b border-[var(--border)] ${align}`}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>
              <tbody>
                {loading && !coaData ? (
                  <tr>
                    <td colSpan={columns.length} style={{ height: "300px" }}>
                      <div className="flex justify-center items-center h-full">
                        <Loader2
                          size={20}
                          className="animate-spin text-muted"
                        />
                      </div>
                    </td>
                  </tr>
                ) : table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="py-16 text-center text-xs text-muted"
                    >
                      No accounts found.
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-row-hover transition-colors h-[36px]"
                      style={{
                        borderBottom: "1px solid rgba(128,128,128,0.12)",
                      }}
                      onDoubleClick={() => {
                        if (!row.original.is_group) onViewLedger?.(row.original.name);
                      }}
                    >
                      {row.getVisibleCells().map((cell) => {
                        const align =
                          (cell.column.columnDef.meta as any)?.align === "right"
                            ? "text-right"
                            : "text-left";
                        return (
                          <td
                            key={cell.id}
                            className={`px-3 py-1 whitespace-nowrap ${align}`}
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {loading && coaData && (
              <div className="absolute inset-0 bg-card/60 backdrop-blur-[1px] flex items-center justify-center z-20">
                <Loader2 size={20} className="animate-spin text-primary" />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default COATab;
