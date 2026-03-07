// ExpandedRowDetail.tsx
import React from "react";
import { ChevronUp } from "lucide-react";
import ActionButton, {
  ActionGroup,
} from "../../../components/ui/Table/ActionButton";
import type { PayrollRecord } from "../../../types/payrolltypes";

const fmtZMW = (n: number) => Number(n || 0).toLocaleString("en-ZM");

interface ExpandedRowDetailProps {
  record: PayrollRecord;
  onCollapse: () => void;
  onViewDetails: (record: PayrollRecord) => void;
}

const SummaryItem: React.FC<{
  label: string;
  value: number;
  danger?: boolean;
  success?: boolean;
  large?: boolean;
}> = ({ label, value, danger, success, large }) => (
  <div>
    <p className="text-[10px] uppercase tracking-widest text-muted mb-1">
      {label}
    </p>
    <p
      className={`tabular-nums font-mono ${large ? "text-xl font-extrabold" : "text-base font-bold"} ${
        danger ? "text-danger" : success ? "text-success" : "text-main"
      }`}
    >
      ZMW {fmtZMW(value)}
    </p>
  </div>
);

const Block: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <div>
    <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted mb-3">
      {title}
    </p>
    <div className="space-y-2.5">{children}</div>
  </div>
);

const MoneyRow: React.FC<{
  label: string;
  value: number;
  danger?: boolean;
  highlight?: boolean;
}> = ({ label, value, danger, highlight }) => (
  <div
    className={`flex items-center justify-between ${highlight ? "bg-warning/10 px-2 py-1 rounded-lg" : ""}`}
  >
    <span className="text-xs text-muted">{label}</span>
    <span
      className={`text-xs font-bold tabular-nums font-mono ${danger ? "text-danger" : "text-main"}`}
    >
      ZMW {fmtZMW(value)}
    </span>
  </div>
);

const MetaRow: React.FC<{ label: string; value: React.ReactNode }> = ({
  label,
  value,
}) => (
  <div className="flex items-center justify-between">
    <span className="text-xs text-muted">{label}</span>
    <span className="text-xs font-semibold text-main">{value}</span>
  </div>
);

export const ExpandedRowDetail: React.FC<ExpandedRowDetailProps> = ({
  record,
  onCollapse,
  onViewDetails,
}) => {
  const totalDed =
    record.taxDeduction +
    record.pfDeduction +
    record.esiDeduction +
    record.professionalTax +
    record.loanDeduction +
    record.advanceDeduction +
    record.otherDeductions;

  return (
    <tr>
      <td colSpan={8} className="border-b border-theme bg-app">
        <div className="px-8 py-5 animate-[fadeIn_0.2s_ease]">
          {/* Top summary strip */}
          <div className="flex items-end justify-between border-b border-theme pb-4 mb-5">
            <div className="flex gap-10">
              <SummaryItem label="Gross Pay" value={record.grossPay} />
              <SummaryItem label="Total Deductions" value={totalDed} danger />
              <SummaryItem
                label="Net Pay"
                value={record.netPay}
                success
                large
              />
            </div>
            <div className="flex gap-2">
              <ActionGroup>
                <ActionButton
                  type="view"
                  label={null}
                  iconOnly
                  onClick={() => onViewDetails(record)}
                />
              </ActionGroup>
              <button
                onClick={onCollapse}
                className="flex items-center gap-1 px-3 py-2 text-xs border border-theme rounded-lg text-muted hover:text-main hover:bg-card transition"
              >
                <ChevronUp className="w-3.5 h-3.5" /> Collapse
              </button>
            </div>
          </div>

          {/* Three-column breakdown */}
          <div className="grid grid-cols-3 gap-10 text-sm">
            <Block title="Earnings">
              <MoneyRow label="Basic Salary" value={record.basicSalary} />
              <MoneyRow label="HRA" value={record.hra} />
              <MoneyRow label="Allowances" value={record.allowances} />
              {record.overtimePay > 0 && (
                <MoneyRow label="Overtime" value={record.overtimePay} />
              )}
              {record.totalBonus > 0 && (
                <MoneyRow label="Bonus" value={record.totalBonus} highlight />
              )}
              {record.arrears > 0 && (
                <MoneyRow label="Arrears" value={record.arrears} highlight />
              )}
            </Block>

            <Block title="Deductions">
              <MoneyRow label="PAYE" value={record.taxDeduction} danger />
              <MoneyRow
                label="Provident Fund"
                value={record.pfDeduction}
                danger
              />
              <MoneyRow label="ESI" value={record.esiDeduction} danger />
              <MoneyRow
                label="Professional Tax"
                value={record.professionalTax}
                danger
              />
              <MoneyRow label="Other" value={record.otherDeductions} danger />
            </Block>

            <Block title="Attendance & Tax">
              <MetaRow
                label="Working Days"
                value={`${record.workingDays} days`}
              />
              <MetaRow label="Paid Days" value={`${record.paidDays} days`} />
              <MetaRow label="Absent Days" value={record.absentDays} />
              <MetaRow label="LWP Days" value={record.leaveDays} />
              <MetaRow
                label="Tax Regime"
                value={
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${record.taxRegime === "New" ? "bg-primary/10 text-primary" : "bg-warning/10 text-warning"}`}
                  >
                    {record.taxRegime} Regime
                  </span>
                }
              />
            </Block>
          </div>
        </div>
      </td>
    </tr>
  );
};
