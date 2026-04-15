import React, { useState, useEffect, useCallback, useRef } from "react";
import ExpandableTreeTable from "../../components/ui/Table/ExpandableTreeTable";
import type { Column } from "../../components/ui/Table/type";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  Loader2,
  RefreshCw,
  MoreHorizontal,
  Pencil,
  Trash2,
  Plus,
  Eye,
  FileText
} from "lucide-react";

// Assuming you have this modal from the previous step
import JournalEntryModal from "../../components/JournalEntries/JournalEntriesModal";

// NOTE: You will need to import your actual API method and types
// import { getJournalEntries } from "../../api/Accounting/JournalEntryApi";

export interface JETabProps {
  searchTerm: string;
  setSearchTerm: (v: string) => void;
}

// --- Mock Types (Replace with your actual types) ---
export interface JournalEntry {
  name: string; // Usually the Document ID, e.g., "ACC-JV-2023-0001"
  posting_date: string;
  total_debit: number;
  total_credit: number;
  docstatus: number; // 0 = Draft, 1 = Submitted, 2 = Cancelled
  user_remark?: string;
}

export interface JEResponse {
  message: {
    status_code: number;
    data: JournalEntry[];
  };
}
// ---------------------------------------------------

function matchJENode(node: JournalEntry, term: string): boolean {
  const t = term.toLowerCase();
  return (
    node.name.toLowerCase().includes(t) ||
    (node.user_remark || "").toLowerCase().includes(t) ||
    node.posting_date.includes(t)
  );
}

// ─── Dropdown Menu Component ───────────────────────────────────────────────
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
          opacity-0 group-hover:opacity-100
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

// ─── Main Component ────────────────────────────────────────────────────────
const JETab: React.FC<JETabProps> = ({ searchTerm, setSearchTerm }) => {
  const [jeData, setJeData] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const navigate = useNavigate();

  const fetchJE = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // REPLACE WITH YOUR ACTUAL API CALL:
      // const res: JEResponse = await getJournalEntries();
      
      // Mocking an API response for now:
      const res = { message: { status_code: 200, data: [] } }; 
      
      if (res?.message?.status_code === 200 && res.message.data) {
        setJeData(res.message.data);
      } else {
        setError("Failed to load journal entries.");
      }
    } catch (err: any) {
      setError(
        err?.message || "An error occurred while fetching journal entries.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJE();
  }, [fetchJE]);

  if (loading) {
    return (
      <div className="bg-card rounded-2xl border border-[var(--border)] flex flex-col items-center justify-center py-24 gap-3 shadow-sm">
        <Loader2 size={28} className="animate-spin text-primary" />
        <p className="text-xs font-bold text-muted uppercase tracking-widest opacity-40">
          Loading Journal Entries…
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
          onClick={fetchJE}
          className="flex items-center gap-2 px-5 py-2.5 text-[10px] font-black uppercase tracking-widest bg-primary rounded-xl transition-all hover:opacity-90 text-white"
        >
          <RefreshCw size={11} />
          Retry
        </button>
      </div>
    );
  }

  const jeColumns: Column<JournalEntry>[] = [
    {
      key: "name",
      header: "Entry Number",
      align: "left",
      render: (row: JournalEntry) => (
        <span className="font-semibold text-main flex items-center gap-2">
          <FileText size={14} className="text-muted" />
          {row.name}
        </span>
      ),
    },
    {
      key: "posting_date",
      header: "Posting Date",
      align: "left",
      render: (row: JournalEntry) => (
        <span className="text-xs text-muted">{row.posting_date || "—"}</span>
      ),
    },
    {
      key: "docstatus",
      header: "Status",
      align: "left",
      render: (row: JournalEntry) => {
        let badge = "bg-draft text-gray-400";
        let label = "Draft";
        
        if (row.docstatus === 1) {
          badge = "bg-success text-success";
          label = "Submitted";
        } else if (row.docstatus === 2) {
          badge = "bg-danger text-danger";
          label = "Cancelled";
        }

        return (
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${badge}`}>
            {label}
          </span>
        );
      },
    },
    {
      key: "total_debit",
      header: "Total Debit",
      align: "right",
      render: (row: JournalEntry) => (
        <code className="text-xs px-2 py-1 rounded bg-row-hover text-main">
          {row.total_debit.toFixed(2)}
        </code>
      ),
    },
    {
      key: "total_credit",
      header: "Total Credit",
      align: "right",
      render: (row: JournalEntry) => (
        <code className="text-xs px-2 py-1 rounded bg-row-hover text-main">
          {row.total_credit.toFixed(2)}
        </code>
      ),
    },
    {
      key: "user_remark",
      header: "Remark",
      align: "left",
      render: (row: JournalEntry) => (
        <span className="text-xs text-muted truncate max-w-[200px] block">
          {row.user_remark || "—"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (row: JournalEntry) => {
        const actions: MenuAction[] = [
          {
            label: "View Entry",
            icon: <Eye size={12} />,
            onClick: () => console.log("View", row.name),
          },
          ...(row.docstatus === 0
            ? [
                {
                  label: "Edit",
                  icon: <Pencil size={12} />,
                  onClick: () => console.log("Edit", row.name),
                },
              ]
            : []),
          {
            label: row.docstatus === 1 ? "Cancel Entry" : "Delete",
            icon: <Trash2 size={12} />,
            onClick: () => console.log("Delete/Cancel", row.name),
            danger: true,
            dividerBefore: true,
          },
        ];

        return <RowActionMenu actions={actions} />;
      },
    },
  ];

  return (
    <>
      <JournalEntryModal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        onSuccess={fetchJE}
      />
      <ExpandableTreeTable<JournalEntry>
        columns={jeColumns}
        data={jeData}
        childrenKey="children" // Can remain even if flat, it will just ignore it
        nodeKey={(node) => node.name}
        showToolbar
        searchValue={searchTerm}
        onSearch={setSearchTerm}
        toolbarPlaceholder="Search journal entries..."
        showExpandControls={false} // Disabled since list is flat
        onRefresh={fetchJE}
        matchNode={matchJENode}
        loading={loading}
        emptyMessage="No journal entries found."
        extraFilters={
          <button
            type="button"
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-medium hover:opacity-90 transition"
          >
            <Plus size={13} />
            New Entry
          </button>
        }
      />
    </>
  );
};

export default JETab;