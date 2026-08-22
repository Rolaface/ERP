import React from "react";
import { FileText, AlertCircle } from "lucide-react";
import type { PayrollEntryDetail } from "../../../../api/payroll/payrollEntryApi";
import { InfoTile, DetailRow } from "../payrolldetail/Payrollsharedcomponents";
import { getGLNameWithoutAbbreviation } from "../../../../api/utils/glAccountUtils";

// ─── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  entry: PayrollEntryDetail;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export const PayrollDetailsTab: React.FC<Props> = ({ entry }) => (
  <div className="space-y-4">
    <div className="rounded-xl border border-theme overflow-hidden">
      <div className="px-4 py-3 bg-app border-b border-theme">
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-primary/60" />
          Payroll Entry
        </p>
      </div>
      <div className="px-4">
        {[
          { label: "Entry ID", value: entry.name },
          { label: "Company", value: entry.company },
          { label: "Posting Date", value: entry.posting_date },
          { label: "Cost Center", value: getGLNameWithoutAbbreviation(entry.cost_center) },
          { label: "Payable Account", value: getGLNameWithoutAbbreviation(entry.payroll_payable_account) },
          { label: "Slips Created", value: String(entry.salary_slips_created) },
          { label: "Slips Submitted", value: String(entry.salary_slips_submitted) },
          {
            label: "Deduct Tax (Unsubmitted)",
            value: entry.deduct_tax_for_unsubmitted_tax_exemption_proof ? "Yes" : "No",
          },
          {
            label: "Based on Timesheet",
            value: entry.salary_slip_based_on_timesheet ? "Yes" : "No",
          },
        ].map(({ label, value }) => (
          <DetailRow
            key={label}
            icon={<FileText className="w-3 h-3" />}
            label={label}
            value={value}
          />
        ))}
      </div>
    </div>

    {entry.error_message && (
      <div className="p-4 rounded-xl border border-red-200 bg-red-50">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-red-700 mb-1">Error Details</p>
            <p
              className="text-[11px] text-red-600 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: entry.error_message }}
            />
          </div>
        </div>
      </div>
    )}
  </div>
);