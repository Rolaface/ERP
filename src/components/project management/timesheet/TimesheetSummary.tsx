import React from "react";
import { Coins } from "lucide-react";

import type { TimesheetFormTotals } from "../../../types/Project_Management/Timesheet/form/timesheetForm.types";
import { useCurrencySymbols } from "../../../hooks/Usecurrencysymbols";

interface TimesheetSummaryProps {
  totals: TimesheetFormTotals;
  currency?: string;
  className?: string;
}

const TimesheetSummary: React.FC<TimesheetSummaryProps> = ({
  totals,
  currency = "",
  className = "",
}) => {
  const { formatAmount } = useCurrencySymbols(currency ? [currency] : []);

  return (
    <div
      className={`bg-app/60 border border-theme rounded-xl p-3.5 grid grid-cols-2 sm:grid-cols-3 gap-2.5 lg:flex lg:flex-col lg:h-full ${className}`}
    >
      <div className="col-span-full flex items-center gap-1.5 pb-2 border-b border-theme/70">
        <Coins size={13} className="text-purple-600" />

        <span className="text-[11px] font-bold text-main uppercase tracking-wider">
          Inline Billing Summary
        </span>
      </div>

      <SummaryCell
        label="Total Working Hours"
        value={`${totals.totalHours.toFixed(1)} hrs`}
      />

      <SummaryCell
        label="Billable Hours"
        value={`${totals.billableHours.toFixed(1)} hrs`}
        accent="text-primary"
      />

      <SummaryCell
        label="Billable Amount"
        value={formatAmount(currency, totals.billableAmount, {
          withSymbol: true,
        })}
        accent="text-primary"
      />

      <SummaryCell
        label="Costing Amount"
        value={formatAmount(currency, totals.costingAmount, {
          withSymbol: true,
        })}
      />

      <SummaryCell
        label="Billed Amount"
        value={formatAmount(currency, totals.billedAmount, {
          withSymbol: true,
        })}
        accent="text-emerald-700"
      />

      <SummaryCell label="% Billed" value={`${totals.percentBilled}%`} />
    </div>
  );
};

const SummaryCell: React.FC<{
  label: string;
  value: string;
  accent?: string;
}> = ({ label, value, accent = "text-main" }) => (
  <div className="bg-card p-2.5 rounded-lg border border-theme min-w-0">
    <span className="text-[9px] text-muted block uppercase font-medium truncate">
      {label}
    </span>

    <span className={`font-mono font-bold text-sm truncate block ${accent}`}>
      {value}
    </span>
  </div>
);

export default TimesheetSummary;