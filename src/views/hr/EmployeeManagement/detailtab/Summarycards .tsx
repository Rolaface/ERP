import React from "react";
import { Banknote, TrendingUp, Wallet, Clock } from "lucide-react";
import type { SummaryStats } from "./salarytypes";
import { formatCurrency } from "../detailtab/salarysliphelper";

interface SummaryCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  colorClass: string;
  iconBg: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  iconBg,
}) => (
  <div className="rounded-xl border border-theme bg-card p-4 hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between">
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted truncate">
          {title}
        </p>
        <p className="text-xl font-bold text-main mt-1 truncate">{value}</p>
        <p className="text-[10px] text-muted mt-1 truncate">{subtitle}</p>
      </div>
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ml-3 ${iconBg}`}
      >
        {icon}
      </div>
    </div>
  </div>
);

interface Props {
  stats: SummaryStats;
  currentYear: number;
}

export const SummaryCards: React.FC<Props> = ({ stats, currentYear }) => {
  const { totalPaidThisYear, averageMonthlySalary, latestSalaryCredited, pendingCount, currency } = stats;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <SummaryCard
        title="Total Paid This Year"
        value={formatCurrency(totalPaidThisYear, currency)}
        subtitle={`Jan – Dec ${currentYear}`}
        icon={<Banknote className="w-5 h-5 text-success" />}
        colorClass="text-success"
        iconBg="bg-success/10"
      />
      <SummaryCard
        title="Avg Monthly Salary"
        value={formatCurrency(averageMonthlySalary, currency)}
        subtitle="Based on all paid slips"
        icon={<TrendingUp className="w-5 h-5 text-info" />}
        colorClass="text-info"
        iconBg="bg-info/10"
      />
      <SummaryCard
        title="Latest Salary Credited"
        value={formatCurrency(latestSalaryCredited, currency)}
        subtitle="Most recent payment"
        icon={<Wallet className="w-5 h-5 text-primary" />}
        colorClass="text-primary"
        iconBg="bg-primary/10"
      />
      <SummaryCard
        title="Pending Payments"
        value={pendingCount.toString()}
        subtitle="Draft or Submitted"
        icon={<Clock className="w-5 h-5 text-warning" />}
        colorClass="text-warning"
        iconBg="bg-warning/10"
      />
    </div>
  );
};