import React, { useEffect } from "react";
import { X, Calendar, AlertCircle, Building2, ArrowUpRight, ArrowDownRight } from "lucide-react";

import type { MappedEmployee } from "../../../utils/payroll_Utils/mapPayrollVerificationData";
import { avatarBg, fmtMoney, initials } from "../../../utils/payroll_Utils/payrollPreview.utils";

interface SlipDrawerProps {
  emp: MappedEmployee | null;
  currency: string;
  onClose: () => void;
}

export const SlipDrawer: React.FC<SlipDrawerProps> = ({ emp, currency, onClose }) => {
  const open = !!emp;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity duration-200 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />
      <div
        className={`fixed top-0 right-0 bottom-0 z-50 w-[640px] max-w-full bg-card border-l border-theme flex flex-col shadow-2xl transition-transform duration-200 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {!emp ? null : (
          <>
            {/* Compact Header */}
            <div className="border-b border-theme px-4 py-3 flex-shrink-0">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0 ${avatarBg(emp.id)}`}>
                    {initials(emp.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-main leading-tight truncate">{emp.name}</p>
                    <p className="text-[11px] text-muted font-mono leading-tight">{emp.id}</p>
                    <p className="text-[11px] text-muted leading-tight truncate">
                      {emp.designation} · {emp.department}
                    </p>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="shrink-0 w-7 h-7 rounded-lg border border-theme flex items-center justify-center text-muted hover:text-main hover:bg-app transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-main bg-app border border-theme rounded px-2 py-0.5">
                  <Calendar className="w-3 h-3 text-muted shrink-0" />
                  {emp.totalWorkingDays} work days
                </span>

                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-main bg-app border border-theme rounded px-2 py-0.5">
                  <Calendar className="w-3 h-3 text-muted shrink-0" />
                  {emp.paymentDays} paid days
                </span>

                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-main bg-app border border-theme rounded px-2 py-0.5">
                  <Calendar className="w-3 h-3 text-muted shrink-0" />
                  {emp.leavesTakenThisMonth} leave days
                </span>

                {emp.leaveWithoutPay > 0 && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded px-2 py-0.5">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    LWP: {emp.leaveWithoutPay}
                  </span>
                )}

                {emp.absentDays > 0 && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded px-2 py-0.5">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    Absent: {emp.absentDays}
                  </span>
                )}

                {emp.branch && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted bg-app border border-theme rounded px-2 py-0.5">
                    <Building2 className="w-3 h-3 shrink-0" />
                    {emp.branch}
                  </span>
                )}
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto">
              {emp.isError && emp.errorMessage && (
                <div className="m-3 p-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex gap-2 items-start">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-red-700 dark:text-red-400 leading-snug">{emp.errorMessage}</p>
                </div>
              )}

              {(emp.ctc > 0 || emp.annualTaxable > 0 || emp.yearToDate > 0 || emp.incomeTaxDeductedTillDate > 0) && (
                <div className="px-4 py-2.5 border-b border-theme bg-app/30">
                  <p className="text-[9px] font-extrabold uppercase tracking-wider text-muted mb-1.5">Annual overview</p>

                  <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[11px]">
                    {emp.ctc > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted">CTC</span>
                        <span className="font-semibold">{fmtMoney(emp.ctc, currency)}</span>
                      </div>
                    )}

                    {emp.annualTaxable > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted">Annual taxable</span>
                        <span className="font-semibold">{fmtMoney(emp.annualTaxable, currency)}</span>
                      </div>
                    )}

                    {emp.yearToDate > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted">Earning till date</span>
                        <span className="font-semibold">{fmtMoney(emp.yearToDate, currency)}</span>
                      </div>
                    )}

                    {emp.incomeTaxDeductedTillDate > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted">Tax till date</span>
                        <span className="font-semibold text-danger">{fmtMoney(emp.incomeTaxDeductedTillDate, currency)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {(emp.earnings.length > 0 || emp.deductions.length > 0) && (
                <div className="grid grid-cols-2 border-b border-theme divide-x border-theme">
                  {/* Earnings Column */}
                  <div className="px-4 py-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <p className="text-[9px] font-extrabold uppercase tracking-wider text-muted">Earnings</p>
                      </div>
                      {emp.earnings.length > 0 ? (
                        emp.earnings.map((e, i) => (
                          <div key={e.abbr || i} className="flex justify-between items-center py-1.5 border-b border-theme/60 last:border-0">
                            <div className="flex items-center gap-1 min-w-0 pr-1.5">
                              <span className="text-[11px] text-main truncate" title={e.salary_component}>
                                {e.salary_component}
                              </span>
                              {!!e.is_flexible_benefit && (
                                <span className="text-[8px] font-semibold text-blue-500 bg-blue-50 dark:bg-blue-900/20 border border-blue-200/60 dark:border-blue-800/60 rounded px-1 py-0.5 shrink-0">
                                  Flex
                                </span>
                              )}
                              {!e.is_tax_applicable && (
                                <span className="text-[8px] font-semibold text-muted bg-app border border-theme rounded px-1 py-0.5 shrink-0">
                                  Non-tax
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] font-semibold text-success tabular-nums shrink-0 ml-1">
                              {fmtMoney(e.amount ?? 0, currency)}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-[11px] text-muted italic py-1.5">No earnings</p>
                      )}
                    </div>
                    <div className="flex justify-between items-center mt-3 pt-2 border-t-2 border-theme">
                      <span className="text-[11px] font-bold text-main">Gross pay</span>
                      <span className="text-[12px] font-extrabold text-main tabular-nums">{fmtMoney(emp.gross, currency)}</span>
                    </div>
                  </div>

                  {/* Deductions Column */}
                  <div className="px-4 py-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <ArrowDownRight className="w-3.5 h-3.5 text-red-500 shrink-0" />
                        <p className="text-[9px] font-extrabold uppercase tracking-wider text-muted">Deductions</p>
                      </div>
                      {emp.deductions.length > 0 ? (
                        emp.deductions.map((d, i) => (
                          <div key={d.abbr || i} className="flex justify-between items-center py-1.5 border-b border-theme/60 last:border-0">
                            <div className="flex items-center gap-1 min-w-0 pr-1.5">
                              <span className="text-[11px] text-main truncate" title={d.salary_component}>
                                {d.salary_component}
                              </span>
                            </div>
                            <span className="text-[11px] font-semibold text-danger tabular-nums shrink-0 ml-1">
                              {fmtMoney(d.amount ?? 0, currency)}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-[11px] text-muted italic py-1.5">No deductions</p>
                      )}
                    </div>
                    <div className="flex justify-between items-center mt-3 pt-2 border-t-2 border-theme">
                      <span className="text-[11px] font-bold text-danger">Total deductions</span>
                      <span className="text-[12px] font-extrabold text-danger tabular-nums">−{fmtMoney(emp.totalDeductions, currency)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sticky Bottom Net Payable */}
            <div className="flex-shrink-0 border-t border-theme bg-app px-4 py-3">
              <div className="rounded-xl bg-card border border-theme px-4 py-3 flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted mb-0.5">Net payable</p>
                  {emp.totalInWords && (
                    <p className="text-[11px] text-muted font-medium leading-snug max-w-[260px]">{emp.totalInWords}</p>
                  )}
                </div>
                <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {emp.isError ? "—" : fmtMoney(emp.netPay, currency)}
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};