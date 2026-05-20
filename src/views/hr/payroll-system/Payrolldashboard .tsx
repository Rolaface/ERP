import React, { useState, useMemo } from "react";
import type { PayrollRecord } from "../../../types/payrolltypes";

import Table from "../../../components/ui/Table/Table";
import type { Column } from "../../../components/ui/Table/type";
import { Play } from "lucide-react";
import {
  ActionButton,
  ActionGroup,
  ActionMenu,
} from "../../../components/ui/Table/ActionButton";
import PayrollEntryDetail from "./payrolldetail/payrollentrydetail";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  records: PayrollRecord[];
  loading?: boolean;
  onQuickCreate: () => void;
  onNewPayroll: () => void;
  onRunPayroll: (id: string) => void;
  onViewPayslip: (r: PayrollRecord) => void;
  onDeleteRecord?: (r: PayrollRecord) => void;
  onEditRecord: (r: PayrollRecord) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  // ── Permission flags passed from PayrollManagement ──────────────────────
  // canCreate → gates "New Payroll" button and "Run Payroll" action
  // canWrite  → gates "Edit Record" action
  canCreate?: boolean;
  canWrite?: boolean;
}

// ── Status color map (matches Customer badge pattern)
const STATUS_COLORS: Record<string, string> = {
  Draft: "bg-yellow-100 text-yellow-700",
  Submitted: "bg-blue-100 text-blue-700",
  Failed: "bg-red-100 text-red-600",
  Completed: "bg-green-100 text-green-700",
  Cancelled: "bg-gray-100 text-gray-500",
};

// ─── Component ────────────────────────────────────────────────────────────────

export const PayrollDashboard: React.FC<Props> = ({
  records,
  loading = false,

  onNewPayroll,
  onRunPayroll,

  onEditRecord,
  currentPage,
  totalPages,
  onDeleteRecord,
  onPageChange,
  canCreate = false,
  canWrite = false,
}) => {
  const [searchQuery] = useState("");
  const [selectedDept] = useState("All");
  const [filterStatus] = useState("All");

  // When set, renders the full-page detail view instead of the table
  const [detailEntryId, setDetailEntryId] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      records.filter((r) => {
        const deptOk = selectedDept === "All" || r.department === selectedDept;
        const statusOk = filterStatus === "All" || r.status === filterStatus;
        const q = searchQuery.toLowerCase();
        const searchOk =
          !q ||
          r.employeeName.toLowerCase().includes(q) ||
          r.employeeId.toLowerCase().includes(q);
        return deptOk && statusOk && searchOk;
      }),
    [records, selectedDept, filterStatus, searchQuery],
  );

  // ── Full-page detail view
  if (detailEntryId) {
    return (
      <div className="flex-1 min-h-0 flex flex-col h-full">
        <PayrollEntryDetail
          payrollEntryId={detailEntryId}
          onBack={() => setDetailEntryId(null)}
        />
      </div>
    );
  }

  // ── Columns — styled to match CustomerManagement
  const payrollColumns: Column<any>[] = [
    {
      key: "name",
      header: "Payroll Entry",
      sortable: true,
      render: (row) => (
        <span className="font-medium whitespace-nowrap">{row.name ?? "—"}</span>
      ),
    },
    {
      key: "currency",
      header: "Currency",
      sortable: true,
      align: "center",
      render: (row) => (
        <code className="text-xs px-2 py-0.5 rounded bg-row-hover text-main whitespace-nowrap">
          {row.currency ?? "—"}
        </code>
      ),
    },
    {
      key: "branch",
      header: "Branch",
      sortable: true,
      align: "left",
      render: (row) => (
        <span className="text-muted whitespace-nowrap">
          {row.branch || "—"}
        </span>
      ),
    },
    {
      key: "payroll_frequency",
      header: "Frequency",
      align: "left",
      render: (row) => (
        <span className="whitespace-nowrap">
          {row.payroll_frequency ?? "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      align: "center",
      render: (row) => (
        <span
          className={`inline-flex items-center justify-center text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${
            STATUS_COLORS[row.status] ?? "bg-gray-100 text-gray-600"
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "center",
      render: (row) => (
        <ActionGroup>
          {/* View — always visible */}
          <ActionButton
            type="view"
            iconOnly
            onClick={() => setDetailEntryId(row.name)}
            title="View details"
          />

          <ActionMenu
            // Edit: only when user has Payroll Entry write
            {...(canWrite && row.status !== "Submitted"
              ? { onEdit: () => onEditRecord(row), editLabel: "Edit Record" }
              : {})}
            onDelete={() => onDeleteRecord?.(row)}
            deleteLabel="Delete"
            // Run Payroll: only when user has Payroll Entry create
            customActions={
              canCreate
                ? [
                    {
                      label:
                        row.status === "Failed"
                          ? "Re-Run Payroll"
                          : "Run Payroll",
                      icon: <Play className="w-4 h-4" />,
                      onClick: () => onRunPayroll(row.name),
                      disabled: !["Draft", "Failed"].includes(row.status),
                    },
                  ]
                : []
            }
          />
        </ActionGroup>
      ),
    },
  ];

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <Table
      tableId="payroll-dashboard"
      showToolbar
    
      enableAdd={canCreate}
      addLabel="New Payroll"
      onAdd={onNewPayroll}
      columns={payrollColumns}
      enableColumnSelector
      data={filtered}
      loading={loading}
      totalItems={filtered.length}
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={onPageChange}
      pageSize={10}
    />
  );
};
