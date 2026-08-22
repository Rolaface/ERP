import React from "react";
import {
  Users,
  FileText,
  Building2,
  Calendar,
  CreditCard,
  Clock,
} from "lucide-react";
import type {
  PayrollEntryDetail,
  PayrollEmployeeDetail,
} from "../../../../api/payroll/payrollEntryApi";
import { InfoTile, DetailRow } from "../payrolldetail/Payrollsharedcomponents";
import { getGLNameWithoutAbbreviation } from "../../../../api/utils/glAccountUtils";

// ─── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  employee: PayrollEmployeeDetail;
  entry: PayrollEntryDetail;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export const EmployeeOverviewTab: React.FC<Props> = ({ employee, entry }) => (
  <div className="space-y-5">
    {/* Top info tiles */}
    <div className="grid grid-cols-3 gap-3">
      <InfoTile
        icon={<Users className="w-4 h-4" />}
        label="Employee ID"
        value={employee.employee}
      />
      <InfoTile
        icon={<Building2 className="w-4 h-4" />}
        label="Department"
        value={getGLNameWithoutAbbreviation(employee.department)}
      />
      <InfoTile
        icon={<FileText className="w-4 h-4" />}
        label="Designation"
        value={employee.designation}
      />
    </div>

    {/* Employee details section */}
    <div className="rounded-xl border border-theme overflow-hidden">
      <div className="px-4 py-3 bg-app border-b border-theme">
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted flex items-center gap-2">
          <Users className="w-3.5 h-3.5 text-primary/60" />
          Employee Details
        </p>
      </div>
      <div className="px-4">
        <DetailRow
          icon={<Users className="w-3 h-3" />}
          label="Full Name"
          value={employee.employee_name}
        />
        <DetailRow
          icon={<FileText className="w-3 h-3" />}
          label="Employee ID"
          value={employee.employee}
        />
        <DetailRow
          icon={<Building2 className="w-3 h-3" />}
          label="Department"
          value={getGLNameWithoutAbbreviation(employee.department)}
        />
        <DetailRow
          icon={<Building2 className="w-3 h-3" />}
          label="Designation"
          value={employee.designation}
        />
        <DetailRow
          icon={<Clock className="w-3 h-3" />}
          label="Salary Withheld"
          value={
            employee.is_salary_withheld ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-600 border border-red-200">
                Yes
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
                No
              </span>
            )
          }
        />
      </div>
    </div>

    {/* Payroll period section */}
    <div className="rounded-xl border border-theme overflow-hidden">
      <div className="px-4 py-3 bg-app border-b border-theme">
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-primary/60" />
          Payroll Period
        </p>
      </div>
      <div className="px-4">
        <DetailRow
          icon={<Calendar className="w-3 h-3" />}
          label="Start Date"
          value={entry.start_date}
        />
        <DetailRow
          icon={<Calendar className="w-3 h-3" />}
          label="End Date"
          value={entry.end_date}
        />
        <DetailRow
          icon={<CreditCard className="w-3 h-3" />}
          label="Frequency"
          value={entry.payroll_frequency}
        />
        <DetailRow
          icon={<CreditCard className="w-3 h-3" />}
          label="Currency"
          value={`${entry.currency} (${entry.exchange_rate})`}
        />
      </div>
    </div>
  </div>
);