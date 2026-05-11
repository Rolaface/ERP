import React, { useState, useMemo } from "react";
import type { PayrollRecord } from "../../../types/payrolltypes";

import Table from "../../../components/ui/Table/Table";
import type { Column } from "../../../components/ui/Table/type";
import StatusBadge from "../../../components/ui/Table/StatusBadge";
import { Play } from "lucide-react";
import {
  ActionButton,
  ActionGroup,
  ActionMenu,
} from "../../../components/ui/Table/ActionButton";
import PayrollEntryDetail from "./payrolldetail/paymententrydetail";

interface Props {
  records: PayrollRecord[];
  loading?: boolean;
  onQuickCreate: () => void;
  onNewPayroll: () => void;
  onRunPayroll: (id: string) => void;
  onViewPayslip: (r: PayrollRecord) => void;
  onEditRecord: (r: PayrollRecord) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const PayrollDashboard: React.FC<Props> = ({
  records,
  loading = false,
  onQuickCreate,
  onNewPayroll,
  onRunPayroll,
  onViewPayslip,
  onEditRecord,
  currentPage,
  totalPages,
  onPageChange,
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

  // ── Full-page detail view ──
  if (detailEntryId) {
    return (
      <div className="flex-1 min-h-0 flex flex-col h-full">
        <PayrollEntryDetail
          payrollEntryId={detailEntryId}
          onBack={() => setDetailEntryId(null)}
          // onViewSalarySlip={...} // wire when salary slip page/modal is ready
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
        <span className="font-semibold text-primary">{row.name}</span>
      ),
    },
    {
      key: "currency",
      header: "Currency",
      sortable: true,
      render: (row) => (
        <span className="text-xs font-semibold">{row.currency}</span>
      ),
    },
    {
      key: "branch",
      header: "Branch",
      sortable: true,
      render: (row) => (
        <span className="text-xs text-muted">{row.branch || "-"}</span>
      ),
    },
    {
      key: "payroll_frequency",
      header: "Frequency",
      render: (row) => (
        <span className="px-2 py-1 rounded-md bg-app text-xs">
          {row.payroll_frequency}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <ActionGroup>
          <ActionButton
            type="view"
            iconOnly
            variant="secondary"
            onClick={() => setDetailEntryId(row.name)}
            title="View details"
          />
          <ActionButton
            type="download"
            iconOnly
            variant="secondary"
            onClick={() => onViewPayslip(row)}
            title="View payslip"
          />
          <ActionMenu
            onEdit={() => onEditRecord(row)}
            editLabel="Edit Record"
            onDelete={() => {
              /* wire delete handler if needed */
            }}
            deleteLabel="Remove"
            customActions={[
            {
  label:
    row.status === "Failed"
      ? "Re-Run Payroll"
      : "Run Payroll",

  icon: <Play className="w-4 h-4" />,

  onClick: () => onRunPayroll(row.name),

  disabled: !["Draft", "Failed"].includes(row.status),
},
            ]}
          />
        </ActionGroup>
      ),
    },
  ];

  return (
    <div className="flex-1 min-h-0 px-5 pb-4 flex flex-col">
      <div className="flex-1 min-h-0 overflow-y-auto">
        <Table
          tableId="payroll-dashboard"
          showToolbar
          enableAdd
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
      </div>
    </div>
  );
};
