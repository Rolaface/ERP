import React from "react";
import {
  Mail,
  Phone,

  Calendar,
  Building2,
  Briefcase,
  ArrowLeft,
} from "lucide-react";
import {
  fmt,
  fmtDate,
  
  initials,
  getFileUrl,
} from "../detailtab/Employeehelpers";
import { QuickStat } from "../detailtab/Employeeuiprimitives";

interface Props {
  emp: any;
  fullName: string;
  currency: string;
  erpBase?: string;
  onBack?: () => void;
}

export const EmployeeSidebar: React.FC<Props> = ({
  emp,
  fullName,
  
  erpBase = "",
  onBack,
}) => {
  const avatarUrl = emp.image ? getFileUrl(emp.image, erpBase) : null;

  return (
    <div className="bg-card rounded-xl border border-theme shadow-sm sticky top-2 overflow-hidden">
      <div className="bg-primary px-4 py-6 text-center relative">
        <button
          type="button"
          onClick={() => onBack?.()}
          className="absolute top-3 left-3 z-20 w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white transition-all duration-200"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 30% 20%, white 1px, transparent 1px), radial-gradient(circle at 70% 80%, white 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={fullName}
            className="w-16 h-16 rounded-full object-cover mx-auto mb-2 ring-2 ring-white/40 shadow-lg"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-white text-xl font-bold mx-auto mb-2 ring-2 ring-white/30 shadow-lg">
            {initials(emp)}
          </div>
        )}

        <h3 className="text-white text-sm font-bold leading-snug">
          {fullName}
        </h3>

        <p className="text-white/70 text-[11px] mt-0.5">
          {fmt(emp.designation)}
        </p>
        <div className="flex items-center justify-center gap-1.5 mt-3 flex-wrap">
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/20 text-[10px] font-medium text-emerald-100">
            {fmt(emp.status)}
          </span>

          <span className="px-2 py-0.5 rounded-full bg-white/10 border border-white/10 text-[10px] font-medium text-white/90">
            {fmt(emp.employment_type)}
          </span>
        </div>
      </div>
      {/* ── Employee ID ── */}
      <div className="px-4 py-2.5 border-b border-theme bg-app text-center">
        <p className="text-[9px] uppercase tracking-widest text-muted font-bold mb-0.5">
          Employee ID
        </p>
        <p className="text-sm font-mono font-bold text-primary">
          {fmt(emp.employee) || "—"}
        </p>
      </div>

      {/* ── Quick stats ── */}
      <div className="px-4 py-3 space-y-4">
        {/* Contact */}
        <div className="space-y-1">
          <QuickStat
            icon={<Mail className="w-3.5 h-3.5" />}
            label="Work Email"
            value={fmt(emp.company_email)}
          />

          <QuickStat
            icon={<Phone className="w-3.5 h-3.5" />}
            label="Phone"
            value={fmt(emp.cell_number)}
          />
        </div>

        {/* Organization */}
        <div className="border-t border-theme pt-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[9px] uppercase tracking-wider text-muted font-bold mb-1">
                Gender
              </p>

              <p className="text-sm font-semibold text-main">
                {fmt(emp.gender)}
              </p>
            </div>

            <div>
              <p className="text-[9px] uppercase tracking-wider text-muted font-bold mb-1">
                Blood Group
              </p>

              <p className="text-sm font-semibold text-main">
                {fmt(emp.blood_group)}
              </p>
            </div>

            <div>
              <p className="text-[9px] uppercase tracking-wider text-muted font-bold mb-1">
                Grade
              </p>

              <p className="text-sm font-semibold text-main">
                {fmt(emp.grade)}
              </p>
            </div>

            <div>
              <p className="text-[9px] uppercase tracking-wider text-muted font-bold mb-1">
                Salary Mode
              </p>

              <p className="text-sm font-semibold text-main">
                {fmt(emp.salary_mode)}
              </p>
            </div>
          </div>
        </div>

        {/* Organization Info */}
        <div className="border-t border-theme pt-3 space-y-1">
          <QuickStat
            icon={<Building2 className="w-3.5 h-3.5" />}
            label="Department"
            value={fmt(emp.department)}
          />

          <QuickStat
            icon={<Briefcase className="w-3.5 h-3.5" />}
            label="Company"
            value={fmt(emp.company)}
          />

          <QuickStat
            icon={<Calendar className="w-3.5 h-3.5" />}
            label="Joined"
            value={fmtDate(emp.date_of_joining)}
          />
        </div>
      </div>
    </div>
  );
};
