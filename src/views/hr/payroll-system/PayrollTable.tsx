// PayrollTable.tsx
import React from "react";
import {
  ChevronDown,
  CheckCircle,
  Clock,
  Users,
  RefreshCw,
} from "lucide-react";
import ActionButton, {
  ActionGroup,
} from "../../../components/ui/Table/ActionButton";
import type { PayrollRecord } from "../../../types/payrolltypes";
import { ExpandedRowDetail } from "./ExpandedRowDetail";

const fmtZMW = (n: number) => Number(n || 0).toLocaleString("en-ZM");

const calculateDeductions = (record: PayrollRecord): number =>
  record.taxDeduction +
  record.pfDeduction +
  record.esiDeduction +
  record.professionalTax +
  record.loanDeduction +
  record.advanceDeduction +
  record.otherDeductions;

interface PayrollTableProps {
  records: PayrollRecord[];
  expandedRows: Set<string>;
  onToggleRow: (id: string) => void;
  onViewPayslip: (record: PayrollRecord) => void;
  onEditRecord: (record: PayrollRecord) => void;
  onViewDetails: (record: PayrollRecord) => void;
}

const StatusPill: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, string> = {
    Paid: "bg-success/10 text-success border-success/20",
    Pending: "bg-warning/10 text-warning border-warning/20",
    Processing: "bg-primary/10 text-primary border-[var(--primary)]/20",
    Approved: "bg-success/10 text-success border-success/20",
    Rejected: "bg-danger/10 text-danger border-danger/20",
    Draft: "bg-row-hover/40 text-main border-theme",
    Failed: "bg-danger/10 text-danger border-danger/20",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${map[status] ?? "bg-row-hover/40 text-main border-theme"}`}
    >
      {status === "Paid" && <CheckCircle className="w-3.5 h-3.5" />}
      {status === "Pending" && <Clock className="w-3.5 h-3.5" />}
      {status === "Processing" && (
        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
      )}
      {status}
    </span>
  );
};

const Th: React.FC<{
  children: React.ReactNode;
  align?: "left" | "right" | "center";
}> = ({ children, align = "left" }) => (
  <th
    className={`px-4 py-3 text-xs font-semibold text-muted text-${align} whitespace-nowrap`}
  >
    {children}
  </th>
);

export const PayrollTable: React.FC<PayrollTableProps> = ({
  records,
  expandedRows,
  onToggleRow,
  onViewPayslip,
  onEditRecord,
  onViewDetails,
}) => {
  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted">
        <Users className="w-10 h-10 opacity-20" />
        <p className="text-sm">No payroll records found</p>
      </div>
    );
  }

  return (
    <table className="w-full">
      <thead className="sticky top-0 z-10 bg-muted/5">
        <tr>
          <Th>Employee</Th>
          <Th>Department</Th>
          <Th align="center">Attendance</Th>
          <Th align="right">Gross</Th>
          <Th align="right">Deductions</Th>
          <Th align="right">Net Pay</Th>
          <Th align="center">Status</Th>
          <Th align="center">Actions</Th>
        </tr>
      </thead>
      <tbody>
        {records.map((record) => {
          const expanded = expandedRows.has(record.id);
          const totalDed = calculateDeductions(record);
          const initials = record.employeeName
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();
          const attendancePct =
            record.workingDays > 0
              ? (record.paidDays / record.workingDays) * 100
              : 0;

          return (
            <React.Fragment key={record.id}>
              {/* Main row */}
              <tr
                onClick={() => onToggleRow(record.id)}
                className={`cursor-pointer transition-colors ${
                  expanded ? "bg-muted/5" : "hover:bg-muted/5"
                }`}
              >
                {/* Employee */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={`transition-transform duration-150 shrink-0 ${expanded ? "rotate-180" : ""}`}
                    >
                      <ChevronDown className="w-4 h-4 text-muted" />
                    </span>
                    <div className="w-8 h-8 rounded shrink-0 bg-muted/10 text-primary font-bold flex items-center justify-center">
                      {initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-main leading-tight">
                        {record.employeeName}
                      </p>
                      <p className="text-xs text-muted mt-0.5">
                        {record.employeeId} • {record.grade}
                      </p>
                    </div>
                  </div>
                </td>

                {/* Department */}
                <td className="px-4 py-3">
                  <span className="text-xs font-medium text-main">
                    {record.department}
                  </span>
                </td>

                {/* Attendance with mini progress bar */}
                <td className="px-4 py-3 text-center">
                  <p className="text-sm font-semibold text-main">
                    {record.paidDays}
                    <span className="text-xs text-muted font-normal ml-0.5">
                      /{record.workingDays}
                    </span>
                  </p>
                  <div className="h-1.5 bg-muted/10 rounded-full mt-1.5 w-16 mx-auto overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${attendancePct}%` }}
                    />
                  </div>
                </td>

                {/* Gross */}
                <td className="px-4 py-3 text-right">
                  <span className="text-sm font-medium text-main tabular-nums">
                    ZMW {fmtZMW(record.grossPay)}
                  </span>
                </td>

                {/* Deductions */}
                <td className="px-4 py-3 text-right">
                  <span className="text-sm font-medium text-main tabular-nums ml-1">
                    ZMW {fmtZMW(totalDed)}
                  </span>
                </td>

                {/* Net Pay */}
                <td className="px-4 py-3 text-right">
                  <span className="text-sm font-bold text-main tabular-nums">
                    ZMW {fmtZMW(record.netPay)}
                  </span>
                </td>

                {/* Status */}
                <td className="px-4 py-3 text-center">
                  <StatusPill status={record.status} />
                </td>

                {/* Actions */}
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <ActionGroup>
                    <ActionButton
                      type="view"
                      label={null}
                      iconOnly
                      onClick={() => onViewPayslip(record)}
                    />
                    {record.status !== "Paid" ? (
                      <ActionButton
                        type="edit"
                        label={null}
                        iconOnly
                        onClick={() => onEditRecord(record)}
                        variant="secondary"
                      />
                    ) : null}
                  </ActionGroup>
                </td>
              </tr>

              {/* Expanded row */}
              {expanded && (
                <ExpandedRowDetail
                  record={record}
                  onCollapse={() => onToggleRow(record.id)}
                  onViewDetails={onViewDetails}
                />
              )}
            </React.Fragment>
          );
        })}
      </tbody>
    </table>
  );
};
