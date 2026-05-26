import React, { useState, useEffect, useCallback } from "react";
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
  FileText,
  ChevronLeft,
  ChevronRight,
  CheckCircle
} from "lucide-react";

import { JournalEntriesModal } from "../../store/modalStore";
import Table from "../../components/ui/Table/Table";
import { PortalDropdown } from "../../components/ui/Table/ExpandableTreeTable";
import { 
  getJournalEntries, 
  deleteJournalEntryById, 
  updateJournalEntryStatus 
} from "../../api/Accounting/JournalEntryApi";
import { showApiError, showSuccess, showConfirm } from "../../utils/alert";
import ActionButton, { ActionGroup, ActionMenu } from "../../components/ui/Table/ActionButton";

export interface JETabProps {
  searchTerm: string;
  setSearchTerm: (v: string) => void;
}

export interface JournalEntry {
  name: string; 
  posting_date?: string;
  total_debit?: number;
  total_credit?: number;
  docstatus?: number; // 0 = Draft, 1 = Submitted, 2 = Cancelled
  user_remark?: string;
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
                ${action.danger
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

// ─── Main Component ────────────────────────────────────────────────────────
const JETab: React.FC<JETabProps> = ({ searchTerm, setSearchTerm }) => {
  const [jeData, setJeData] = useState<JournalEntry[]>([]);
  const [pageSize, setPageSize] = useState(10); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchJE = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fields = [
        "name",
        "posting_date",
        "total_debit",
        "total_credit",
        "docstatus",
        "user_remark"
      ];

      const limitStart = (currentPage - 1) * pageSize;

      const res = await getJournalEntries(fields, undefined, limitStart, pageSize);
      const entriesData = res?.data || res?.message?.data;

      if (Array.isArray(entriesData)) {
        setJeData(entriesData);
        setHasMore(entriesData.length === pageSize);
      } else {
        setError("Failed to load journal entries.");
        setJeData([]);
        setHasMore(false);
      }
    } catch (err: any) {
      setError(err?.message || "An error occurred while fetching journal entries.");
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    fetchJE();
  }, [fetchJE]);

  const handleSubmitEntry = async (id: string) => {
    try {
      setLoading(true);
      await updateJournalEntryStatus(id, "approved");
      showSuccess(`Entry ${id} has been submitted successfully.`);
      fetchJE();
    } catch (err: any) {
      showApiError(err?.response?.data?.message || err?.message || "Failed to submit entry.");
      setLoading(false);
    }
  };

  const handleCancelEntry = async (id: string) => {
   const isConfirmed = await showConfirm(
      `Are you sure you want to cancel entry ${id}?`,
      { 
        title: "Cancel Entry", 
        confirmButtonText: "Yes, Cancel", 
        confirmButtonColor: "#ef4444" 
      }
    );
    if (!isConfirmed) return;

    try {
      setLoading(true);
      await updateJournalEntryStatus(id, "cancelled");
      showSuccess(`Entry ${id} has been cancelled successfully.`);
      fetchJE();
    } catch (err: any) {
      showApiError(err?.response?.data?.message || err?.message || "Failed to cancel entry.");
      setLoading(false);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    const isConfirmed = await showConfirm(
      `Are you sure you want to delete entry ${id}?`,
      {
        title: "Delete Entry",
        confirmButtonText: "Yes, Delete",
        confirmButtonColor: "#ef4444",
      }
    );
    if (!isConfirmed) return;

    try {
      setLoading(true);
      await deleteJournalEntryById(id);
      showSuccess(`Entry ${id} has been successfully deleted.`);
      fetchJE();
    } catch (err: any) {
      showApiError(err?.response?.data?.message || err?.message || "Failed to delete entry.");
      setLoading(false);
    }
  };

  if (loading && jeData.length === 0) {
    return (
      <div className="bg-card rounded-2xl border border-[var(--border)] flex flex-col items-center justify-center py-24 gap-3 shadow-sm">
        <Loader2 size={28} className="animate-spin text-primary" />
        <p className="text-xs font-bold text-muted uppercase tracking-widest opacity-40">
          Loading Journal Entries…
        </p>
      </div>
    );
  }

  if (error && jeData.length === 0) {
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
const formatDate = (date?: string | Date) => {
  if (!date) return "";

  const months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];

  if (typeof date === "string") {
    const [year, month, day] = date.split("T")[0].split("-").map(Number);
    return `${String(day).padStart(2, "0")}-${months[month - 1]}-${year}`;
  }

  return `${String(date.getDate()).padStart(2, "0")}-${months[date.getMonth()]}-${date.getFullYear()}`;
};

const handleAdd = () => {
    JournalEntriesModal(null, false, { onSuccess: fetchJE });
  };

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
        <span className="text-xs text-muted">{formatDate(row.posting_date) || "—"}</span>
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
          {(row.total_debit || 0).toFixed(2)}
        </code>
      ),
    },
    {
      key: "total_credit",
      header: "Total Credit",
      align: "right",
      render: (row: JournalEntry) => (
        <code className="text-xs px-2 py-1 rounded bg-row-hover text-main">
          {(row.total_credit || 0).toFixed(2)}
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
      header: "Actions",
      align: "center", // Updated to center to match your new style
      render: (row: JournalEntry) => {
        const isDraft = row.docstatus === 0;
        const isSubmitted = row.docstatus === 1;

        // Dynamically build the menu actions for the dropdown
        const customMenuActions: MenuAction[] = [];

        // Submit action (only for Drafts)
        if (isDraft) {
          customMenuActions.push({
            label: "Submit",
            icon: <CheckCircle size={14} className="text-success" />,
            onClick: () => handleSubmitEntry(row.name),
          });
        }

        // Cancel or Delete action based on docstatus
        if (isSubmitted) {
          customMenuActions.push({
            label: "Cancel Entry",
            icon: <Trash2 size={14} />,
            danger: true,
            dividerBefore: isDraft, // Add divider if there are items above it
            onClick: () => handleCancelEntry(row.name),
          });
        } else {
          customMenuActions.push({
            label: "Delete",
            icon: <Trash2 size={14} />,
            danger: true,
            dividerBefore: isDraft, 
            onClick: () => handleDeleteEntry(row.name),
          });
        }

        return (
          <ActionGroup>
            {/* View is typically always available */}
            <ActionButton
              type="view"
              iconOnly
              onClick={() =>
                JournalEntriesModal(row.name, false, { isReadOnly: true } as any)
              }
            />

            {/* Edit is only available if it is a Draft (docstatus === 0) */}
            {isDraft && (
              <ActionButton
                type="edit"
                iconOnly
                onClick={() =>
                  JournalEntriesModal(row.name, true, { onSuccess: fetchJE })
                }
              />
            )}

            {/* Render action menu if there are options available */}
            {customMenuActions.length > 0 && (
              <ActionMenu customActions={customMenuActions} />
            )}
          </ActionGroup>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-4">
     <Table
        columns={jeColumns}
        data={jeData}
        rowKey={(row) => row.name}
        showToolbar
        searchValue={searchTerm}
        onSearch={setSearchTerm}
        toolbarPlaceholder="Search journal entries..."
        loading={loading}
        emptyMessage="No journal entries found."
        enableAdd
        addLabel="New Entry"
        onAdd={handleAdd}
        enableColumnSelector
        currentPage={currentPage}
        pageSize={pageSize}
        totalItems={(currentPage - 1) * pageSize + jeData.length}
        totalPages={hasMore ? currentPage + 1 : currentPage}
        pageSizeOptions={[10, 20, 50]}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setCurrentPage(1);
        }}
        onPageChange={setCurrentPage}
      />

      {/* Pagination Controls */}
      <div className="flex items-center justify-between px-2">
        <span className="text-xs text-muted">
          Showing page <span className="font-semibold text-main">{currentPage}</span>
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1 || loading}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md border border-gray-200 text-main hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none transition-colors"
          >
            <ChevronLeft size={14} /> Previous
          </button>
          <button
            onClick={() => setCurrentPage(p => p + 1)}
            disabled={!hasMore || loading}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md border border-gray-200 text-main hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none transition-colors"
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      </div>
      
    </div>
  );
};

export default JETab;