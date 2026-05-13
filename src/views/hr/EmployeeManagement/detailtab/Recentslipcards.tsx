import React from "react";
import { Download, Eye } from "lucide-react";
import type { SalarySlip } from "./salarytypes";
import { formatCurrency, getSlipPeriodLabel } from "../detailtab/salarysliphelper";
import { StatusBadge } from "./shareslip";

interface RecentSlipCardProps {
  slip: SalarySlip;
  isSelected: boolean;
  isDownloading: boolean;
  onSelect: () => void;
  onDownload: () => void;
}

const RecentSlipCard: React.FC<RecentSlipCardProps> = ({
  slip,
  isSelected,
  isDownloading,
  onSelect,
  onDownload,
}) => (
  <div
    role="button"
    tabIndex={0}
    onClick={onSelect}
    onKeyDown={(e) => e.key === "Enter" && onSelect()}
    className={`rounded-xl border p-3 cursor-pointer transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/40 ${
      isSelected
        ? "border-primary bg-primary/5 shadow-sm"
        : "border-theme bg-card"
    }`}
  >
    <div className="flex items-start justify-between mb-2">
      <div className="min-w-0">
        <p className="text-xs font-semibold text-main truncate">
          {getSlipPeriodLabel(slip)}
        </p>
        <p className="text-[10px] text-muted font-mono mt-0.5 truncate">{slip.name}</p>
      </div>
      <StatusBadge status={slip.status} />
    </div>

    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-[9px] text-muted">Gross Pay</span>
        <span className="text-xs font-semibold text-main">
          {formatCurrency(slip.gross_pay, slip.currency)}
        </span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-[9px] text-muted">Net Pay</span>
        <span className="text-xs font-semibold text-success">
          {formatCurrency(slip.net_pay, slip.currency)}
        </span>
      </div>
    </div>

    <div className="mt-3">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDownload();
        }}
        disabled={isDownloading}
        className="w-full flex items-center justify-center gap-1 px-2 py-1 text-[9px] font-medium rounded-md bg-app border border-theme hover:bg-card transition-colors disabled:opacity-50"
      >
        <Download className="w-3 h-3" />
        {isDownloading ? "Downloading…" : "PDF"}
      </button>
    </div>
  </div>
);

interface RecentSlipsProps {
  slips: SalarySlip[];
  selectedSlipName: string | null;
  downloadingSlipName: string | null;
  onSelect: (slip: SalarySlip) => void;
  onDownload: (slipName: string) => void;
}

export const RecentSlipCards: React.FC<RecentSlipsProps> = ({
  slips,
  selectedSlipName,
  downloadingSlipName,
  onSelect,
  onDownload,
}) => {
  if (slips.length === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-main">Recent Payslips</h3>
        <span className="text-[10px] text-muted">Quick access</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {slips.map((slip) => (
          <RecentSlipCard
            key={slip.name}
            slip={slip}
            isSelected={selectedSlipName === slip.name}
            isDownloading={downloadingSlipName === slip.name}
            onSelect={() => onSelect(slip)}
            onDownload={() => onDownload(slip.name)}
          />
        ))}
      </div>
    </div>
  );
};