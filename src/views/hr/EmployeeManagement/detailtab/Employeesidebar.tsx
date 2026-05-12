import React from "react";
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building2,
  Coins,
  ArrowLeft,
} from "lucide-react";
import {
  fmt,
  fmtDate,
  fmtMoney,
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
  currency,
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
      <div className="px-4 py-2">
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
        <QuickStat
          icon={<Building2 className="w-3.5 h-3.5" />}
          label="Department"
          value={fmt(emp.department)}
        />
        <QuickStat
          icon={<Calendar className="w-3.5 h-3.5" />}
          label="Joined"
          value={fmtDate(emp.date_of_joining)}
        />
        <QuickStat
          icon={<MapPin className="w-3.5 h-3.5" />}
          label="Branch"
          value={fmt(emp.branch)}
        />
      </div>

      {/* ── Salary pill ── */}
      <div className="px-4 pb-4">
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3">
          <p className="text-[9px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold mb-1 flex items-center gap-1">
            <Coins className="w-3 h-3" /> Gross / CTC
          </p>
          <p className="text-lg font-bold text-emerald-800 dark:text-emerald-200">
            {fmtMoney(emp.ctc, currency) || "—"}
          </p>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">
            {fmt(emp.salary_mode)} · {fmt(emp.salary_structure)}
          </p>
        </div>
      </div>
    </div>
  );
};
