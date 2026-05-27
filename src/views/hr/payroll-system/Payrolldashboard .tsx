import React, { useState, useMemo } from "react";
import { ShieldCheck } from "lucide-react";
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
  onVerify: (r: PayrollRecord) => void;         // ← NEW
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  canCreate?: boolean;
  canWrite?: boolean;
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
}

// ── Status color map
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
  onVerify,                                      // ← NEW
  currentPage,
  totalPages,
  onDeleteRecord,
  onPageChange,
  canCreate = false,
  canWrite = false,
  searchTerm,
  setSearchTerm,
}) => {
  const [detailEntryId, setDetailEntryId] = useState<string | null>(null);

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
      key: "employee_count",
      header: "Total Employees",
      sortable: true,
      align: "center",
      render: (row) => (
        <code className="text-xs px-2 py-0.5 rounded bg-row-hover text-main whitespace-nowrap">
          {row.employee_count ?? "—"}
        </code>
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
      key: "total_net_payable",
      header: "Total Payable",
      align: "left",
      render: (row) => (
        <span className="whitespace-nowrap">{row.total_net_payable ?? "—"}</span>
      ),
    },

    // ── Status ──────────────────────────────────────────────────────────────
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

    // ── Actions ──────────────────────────────────────────────────────────────
    {
      key: "actions",
      header: "Actions",
      align: "center",
      render: (row) => (
        <ActionGroup>
          <ActionButton
            type="view"
            iconOnly
            onClick={() => setDetailEntryId(row.name)}
            title="View details"
          />
          <ActionMenu
            {...(canWrite && row.status !== "Submitted"
              ? { onEdit: () => onEditRecord(row), editLabel: "Edit Record" }
              : {})}
            onDelete={() => onDeleteRecord?.(row)}
            deleteLabel="Delete"
            customActions={[
              ...(row.status === "Draft"
                ? [
                    {
                      label: "Verify Payroll",
                      icon: <ShieldCheck className="w-4 h-4" />,
                      onClick: () => onVerify(row),
                    },
                    { divider: true, label: "", onClick: () => {} },
                  ]
                : []),
              ...(canCreate
                ? [
                    {
                      label:
                        row.status === "Failed" ? "Re-Run Payroll" : "Run Payroll",
                      icon: <Play className="w-4 h-4" />,
                      onClick: () => onRunPayroll(row.name),
                      disabled: !["Draft", "Failed"].includes(row.status),
                    },
                  ]
                : []),
            ]}
          />
        </ActionGroup>
      ),
    },
  ];

  return (
    <Table
      tableId="payroll-dashboard"
      showToolbar
      enableAdd={canCreate}
      addLabel="New Payroll"
      onAdd={onNewPayroll}
      columns={payrollColumns}
      enableColumnSelector
      data={records}
      loading={loading}
      totalItems={records.length}
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={onPageChange}
      pageSize={10}
      searchValue={searchTerm}
      onSearch={(q) => {
        setSearchTerm(q);
        onPageChange(1);
      }}
    />
  );
};