import React, { useState, useEffect, useCallback } from "react";
import ExpandableTreeTable from "../../components/ui/Table/ExpandableTreeTable";
import type { Column } from "../../components/ui/Table/type";
import { getChartOfAccounts } from "../../api/Accounting/AccountApi";
import { AlertCircle, Loader2, RefreshCw, FolderOpen, Folder, BookOpen } from "lucide-react";
import NewAccountModal from "../../components/Coa/NewAccountModal";
import type { COAAccount, COAResponse, COAResponseData } from "../../types/coa";

export interface COATabProps {
  searchTerm: string;
  setSearchTerm: (v: string) => void;
}

function normalizeAccounts(accounts: COAAccount[]): COAAccount[] {
  return accounts.map((acc) => ({
    ...acc,
    balance_in_account_currency: acc.balance_in_account_currency ?? acc.balance,
    children: Array.isArray(acc.children) ? normalizeAccounts(acc.children) : [],
  }));
}

function matchCOANode(node: COAAccount, term: string): boolean {
  const t = term.toLowerCase();
  return (
    node.account_name.toLowerCase().includes(t) ||
    node.name.toLowerCase().includes(t) ||
    (node.account_type || "").toLowerCase().includes(t) ||
    node.root_type.toLowerCase().includes(t)
  );
}

function coaExpandIcon(
  _node: COAAccount,
  isExpanded: boolean,
  hasChildren: boolean
): React.ReactNode {
  if (!hasChildren) return <BookOpen size={12} className="text-muted opacity-50" />;
  return isExpanded
    ? <FolderOpen size={13} className="text-muted" />
    : <Folder size={13} className="text-muted" />;
}

const COATab: React.FC<COATabProps> = ({ searchTerm, setSearchTerm }) => {
  const [coaData, setCoaData] = useState<COAResponseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewAccount, setShowNewAccount] = useState(false);
  const [selectedParent, setSelectedParent] = useState<COAAccount | null>(null);

  const fetchCOA = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res: COAResponse = await getChartOfAccounts();
      if (res?.message?.status_code === 200 && res.message.data) {
        const normalizedAccounts = normalizeAccounts(res.message.data.accounts);
        setCoaData({ ...res.message.data, accounts: normalizedAccounts });
      } else {
        setError(res?.message?.message || "Failed to load chart of accounts.");
      }
    } catch (err: any) {
      setError(err?.message || "An error occurred while fetching chart of accounts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCOA();
  }, [fetchCOA]);

  const handleNewAccount = () => {
    setSelectedParent(null);
    setShowNewAccount(true);
  };

  const handleAddChild = (row: COAAccount) => {
    setSelectedParent(row);
    setShowNewAccount(true);
  };

  const handleModalClose = () => {
    setShowNewAccount(false);
    setSelectedParent(null);
  };

  if (loading) {
    return (
      <div className="bg-card rounded-2xl border border-[var(--border)] flex flex-col items-center justify-center py-24 gap-3 shadow-sm">
        <Loader2 size={28} className="animate-spin text-primary" />
        <p className="text-xs font-bold text-muted uppercase tracking-widest opacity-40">
          Loading Chart of Accounts…
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card rounded-2xl border border-[var(--border)] flex flex-col items-center justify-center py-24 gap-4 shadow-sm">
        <AlertCircle size={28} className="text-danger" />
        <p className="text-xs font-bold text-danger uppercase tracking-widest">{error}</p>
        <button
          onClick={fetchCOA}
          className="flex items-center gap-2 px-5 py-2.5 text-[10px] font-black uppercase tracking-widest bg-primary rounded-xl transition-all hover:opacity-90"
        >
          <RefreshCw size={11} />
          Retry
        </button>
      </div>
    );
  }

  const coaColumns: Column<COAAccount>[] = [
    {
      key: "account_name",
      header: "Account Name",
      align: "left",
      render: (row: COAAccount) => (
        <span className={row.is_group ? "font-semibold text-main" : "font-normal text-main"}>
          {row.account_name}
          {row.disabled === 1 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-draft text-gray-300 ml-2">
              Disabled
            </span>
          )}
        </span>
      ),
    },
    {
      key: "account_type",
      header: "Account Type",
      align: "left",
      render: (row: COAAccount) => (
        <span className="text-xs text-muted">{row.account_type || "—"}</span>
      ),
    },
    {
      key: "root_type",
      header: "Root Type",
      align: "left",
      render: (row: COAAccount) => {
        const badgeClass: Record<string, string> = {
          Asset: "bg-info text-info",
          Liability: "bg-danger text-danger",
          Equity: "bg-warning text-warning",
          Income: "bg-success text-success",
          Expense: "bg-draft text-gray-100",
        };
        const badge = badgeClass[row.root_type] ?? "bg-info text-info";
        return row.root_type ? (
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${badge}`}>
            {row.root_type}
          </span>
        ) : (
          <span className="text-muted text-xs">—</span>
        );
      },
    },
    {
      key: "account_currency",
      header: "Currency",
      align: "center",
      render: (row: COAAccount) =>
        !row.is_group && row.account_currency ? (
          <code className="text-xs px-2 py-1 rounded bg-row-hover text-main">
            {row.account_currency}
          </code>
        ) : (
          <span className="text-muted text-xs">—</span>
        ),
    },
    {
      key: "balance",
      header: "Balance",
      align: "right",
      render: (row: COAAccount) => {
        if (row.is_group) return <span className="text-muted text-xs">—</span>;
        return (
          <code className="text-xs px-2 py-1 rounded bg-row-hover text-success">
            {row.account_currency} {row.balance_in_account_currency ?? row.balance}
          </code>
        );
      },
    },
    {
      key: "balance_in_account_currency",
      header: "Base Currency Balance",
      align: "right",
      render: (row: COAAccount) => {
        if (row.is_group) return <span className="text-muted text-xs">—</span>;
        return (
          <code className="text-xs px-2 py-1 rounded bg-row-hover text-main">
            {coaData?.base_currency} {row.balance}
          </code>
        );
      },
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (row: COAAccount) => (
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 justify-end">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); console.log("Edit", row.name); }}
            className="px-2.5 py-1 text-[10px] font-semibold text-primary bg-primary/10 hover:bg-primary/20 rounded transition"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); console.log("Delete", row.name); }}
            className="px-2.5 py-1 text-[10px] font-semibold text-danger bg-danger/10 hover:bg-danger/20 rounded transition"
          >
            Delete
          </button>
          {row.is_group === 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleAddChild(row); }}
              className="px-2.5 py-1 text-[10px] font-semibold text-main bg-row-hover hover:bg-row-hover/80 rounded transition"
            >
              Add Child
            </button>
          )}
          {row.is_group === 0 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); console.log("View Ledger", row.name); }}
              className="px-2.5 py-1 text-[10px] font-semibold text-main bg-row-hover hover:bg-row-hover/80 rounded transition"
            >
              View Ledger
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <NewAccountModal
        isOpen={showNewAccount}
        onClose={handleModalClose}
        onSuccess={fetchCOA}
        parentAccount={selectedParent}
      />
      <ExpandableTreeTable<COAAccount>
        columns={coaColumns}
        data={coaData?.accounts ?? []}
        childrenKey="children"
        nodeKey={(node) => node.name}
        showToolbar
        searchValue={searchTerm}
        onSearch={setSearchTerm}
        toolbarPlaceholder="Search accounts…"
        showExpandControls
        onRefresh={fetchCOA}
        matchNode={matchCOANode}
        defaultExpandDepth={0}
        indentSize={20}
        loading={loading}
        emptyMessage="No accounts found."
        expandIconRender={coaExpandIcon}
        extraFilters={
          <button
            type="button"
            onClick={handleNewAccount}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-medium hover:opacity-90 transition"
          >
            <span className="text-base leading-none">+</span>
            New
          </button>
        }
      />
    </>
  );
};

export default COATab;