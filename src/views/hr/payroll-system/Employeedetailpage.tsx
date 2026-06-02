
import React, { useState } from "react";
import {
  ChevronLeft, Search, User, Mail, Briefcase, Calendar,
  Shield, Banknote, FileText, Download, CheckCircle, ArrowUpRight,
} from "lucide-react";
import type { PayrollRecord } from "../../../types/payrolltypes";
import { fmtINR, calculateDeductions } from "./utils";

interface EmployeeDetailPageProps {
  records: PayrollRecord[];
  initialRecord?: PayrollRecord;
  onBack: () => void;
  onViewPayslip: (record: PayrollRecord) => void;
}

const StatusPill: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, string> = {
    Paid:       "bg-success/10 text-success",
    Pending:    "bg-warning/10 text-warning",
    Processing: "bg-primary/10 text-primary",
    Approved:   "bg-success/10 text-success",
    Rejected:   "bg-danger/10 text-danger",
    Draft:      "bg-app text-muted",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${map[status] ?? "bg-app text-muted"}`}>
      {status === "Paid" && <CheckCircle className="w-3 h-3" />}
      {status}
    </span>
  );
};

const InfoRow: React.FC<{ label: string; value: React.ReactNode; icon?: React.ReactNode }> = ({
  label, value, icon,
}) => (
  <div className="flex items-center justify-between py-2.5 border-b border-theme last:border-0">
    <div className="flex items-center gap-2 text-muted">
      {icon && <span className="opacity-60">{icon}</span>}
      <span className="text-xs">{label}</span>
    </div>
    <span className="text-xs font-semibold text-main text-right max-w-[200px] truncate">{value}</span>
  </div>
);

export const EmployeeDetailPage: React.FC<EmployeeDetailPageProps> = ({
  records, initialRecord, onBack, onViewPayslip,
}) => {
  const [search, setSearch]   = useState("");
  const [selected, setSelected] = useState<PayrollRecord>(initialRecord ?? records[0]);
  const [section, setSection]  = useState<"overview" | "payroll" | "documents">("overview");

  const filtered = records.filter(r =>
    r.employeeName.toLowerCase().includes(search.toLowerCase()) ||
    r.employeeId.toLowerCase().includes(search.toLowerCase()) ||
    r.department.toLowerCase().includes(search.toLowerCase()),
  );

  const initials  = selected.employeeName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  const totalDed  = calculateDeductions(selected);
  const netPct    = selected.grossPay > 0 ? Math.round((selected.netPay / selected.grossPay) * 100) : 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-app overflow-hidden">

      {/* Top bar */}
      <header className="h-12 shrink-0 bg-card border-b border-theme px-5 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-app text-muted hover:text-main transition">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="h-4 w-px bg-theme opacity-40" />
          <span className="text-sm font-extrabold text-main">Employee Payroll Detail</span>
          <span className="text-xs text-muted opacity-60">· {records.length} records</span>
        </div>
        <span className="text-xs text-muted bg-app border border-theme px-3 py-1 rounded-full">
          {new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
        </span>
      </header>

      <div className="flex-1 min-h-0 flex overflow-hidden">

        {/* ── Left sidebar ── */}
        <aside className="w-64 shrink-0 border-r border-theme flex flex-col bg-card">
          <div className="p-3 border-b border-theme">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search employee…"
                className="w-full pl-8 pr-3 py-2 border border-theme rounded-lg text-xs text-main bg-app placeholder:text-muted focus:outline-none focus:border-primary transition"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filtered.map(r => {
              const ini = r.employeeName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
              const isSel = r.id === selected.id;
              return (
                <button
                  key={r.id}
                  onClick={() => setSelected(r)}
                  className={`w-full flex items-center gap-2.5 px-4 py-3 border-b border-theme text-left transition-all border-l-2 ${
                    isSel ? "bg-primary/5 border-l-primary" : "border-l-transparent hover:bg-app"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full text-xs font-extrabold flex items-center justify-center shrink-0 ${
                    isSel ? "bg-primary text-white" : "bg-app text-muted"
                  }`}>
                    {ini}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-main truncate">{r.employeeName}</p>
                    <p className="text-[10px] text-muted">{r.department}</p>
                  </div>
                  <StatusPill status={r.status} />
                </button>
              );
            })}
          </div>
        </aside>

        {/* ── Main content ── */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">

          {/* Hero band */}
          <div className="shrink-0 bg-primary to-violet-600 px-7 py-5 text-white">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/20 text-lg font-extrabold flex items-center justify-center shrink-0">
                  {initials}
                </div>
                <div>
                  <h2 className="text-lg font-extrabold leading-tight">{selected.employeeName}</h2>
                  <p className="text-xs text-white/75 mt-0.5">{selected.designation} · {selected.department} · Grade {selected.grade}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] bg-white/15 px-2 py-0.5 rounded-full">{selected.employeeId}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${selected.taxRegime === "New" ? "bg-white/15" : "bg-white/15"}`}>
                      {selected.taxRegime} Regime
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <p className="text-[10px] text-white/60 uppercase tracking-wider">Net Pay</p>
                <p className="text-3xl font-extrabold tabular-nums">{fmtINR(selected.netPay)}</p>
                <button
                  onClick={() => onViewPayslip(selected)}
                  className="mt-2 flex items-center gap-1.5 px-3 py-1.5 bg-white/15 border border-white/25 text-white text-[11px] font-bold rounded-lg hover:bg-white/25 transition ml-auto"
                >
                  <FileText className="w-3.5 h-3.5" /> View Payslip
                </button>
              </div>
            </div>

            {/* Quick stats */}
            <div className="flex gap-6 mt-4 pt-4 border-t border-white/15">
              {[
                { label: "Gross Pay",       val: `${fmtINR(selected.grossPay)}` },
                { label: "Deductions",      val: `${fmtINR(totalDed)}`          },
                { label: "Paid Days",       val: `${selected.paidDays}/${selected.workingDays}` },
                { label: "Net Retention",   val: `${netPct}%`                     },
              ].map(({ label, val }) => (
                <div key={label}>
                  <p className="text-[9px] text-white/55 uppercase tracking-wider">{label}</p>
                  <p className="text-sm font-extrabold mt-0.5">{val}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Section tabs */}
          <div className="shrink-0 bg-card border-b border-theme px-6 flex gap-1">
            {(["overview", "payroll", "documents"] as const).map(s => (
              <button
                key={s}
                onClick={() => setSection(s)}
                className={`px-4 py-3 text-xs font-bold capitalize border-b-2 -mb-px transition-all ${
                  section === s ? "text-primary border-primary" : "text-muted border-transparent hover:text-main"
                }`}
              >
                {s === "payroll" ? "Payroll Breakdown" : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          {/* Section content */}
          <div className="flex-1 overflow-y-auto p-6">

            {/* OVERVIEW */}
            {section === "overview" && (
              <div className="grid grid-cols-2 gap-5 animate-[fadeIn_0.2s_ease]">
                <div className="bg-card border border-theme rounded-2xl p-5">
                  <p className="text-[10px] font-extrabold text-muted uppercase tracking-wider mb-4">Personal Information</p>
                  <InfoRow icon={<User className="w-3.5 h-3.5" />}     label="Full Name"      value={selected.employeeName} />
                  <InfoRow icon={<Mail className="w-3.5 h-3.5" />}     label="Email"          value={selected.email} />
                  <InfoRow icon={<Briefcase className="w-3.5 h-3.5" />}label="Designation"    value={selected.designation} />
                  <InfoRow icon={<Calendar className="w-3.5 h-3.5" />} label="Joining Date"   value={selected.joiningDate} />
                  <InfoRow icon={<Shield className="w-3.5 h-3.5" />}   label="PAN Number"     value={selected.panNumber || "—"} />
                  <InfoRow icon={<Shield className="w-3.5 h-3.5" />}   label="PF Number"      value={selected.pfNumber || "—"} />
                </div>

                <div className="flex flex-col gap-4">
                  <div className="bg-card border border-theme rounded-2xl p-5">
                    <p className="text-[10px] font-extrabold text-muted uppercase tracking-wider mb-4">Bank Details</p>
                    <InfoRow icon={<Banknote className="w-3.5 h-3.5" />} label="Account No." value={selected.bankAccount || "Not configured"} />
                    <InfoRow icon={<Banknote className="w-3.5 h-3.5" />} label="IFSC Code"   value={selected.ifscCode || "Not configured"} />
                  </div>

                  <div className={`rounded-2xl p-5 border ${selected.status === "Paid" ? "bg-success/5 border-success/25" : "bg-warning/5 border-warning/25"}`}>
                    <p className="text-[10px] font-extrabold text-muted uppercase tracking-wider mb-3">Payroll Status</p>
                    <div className="flex items-center justify-between">
                      <StatusPill status={selected.status} />
                      {selected.paymentDate && (
                        <span className="text-xs text-success font-semibold">Paid on {selected.paymentDate}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PAYROLL BREAKDOWN */}
            {section === "payroll" && (
              <div className="space-y-4 animate-[fadeIn_0.2s_ease]">
                <div className="grid grid-cols-2 gap-4">
                  {/* Earnings */}
                  <div className="bg-card border border-theme rounded-2xl p-5">
                    <p className="text-[10px] font-extrabold text-muted uppercase tracking-wider mb-4">Earnings</p>
                    {[
                      { label: "Basic Salary",   val: selected.basicSalary   },
                      { label: "HRA",            val: selected.hra           },
                      { label: "Allowances",     val: selected.allowances    },
                      { label: "Overtime Pay",   val: selected.overtimePay   },
                      { label: "Total Bonus",    val: selected.totalBonus    },
                      { label: "Arrears",        val: selected.arrears       },
                    ].map(({ label, val }) => (
                      <div key={label} className="flex justify-between items-center py-2 border-b border-theme last:border-0">
                        <span className="text-xs text-muted">{label}</span>
                        <span className="text-xs font-bold text-main tabular-nums">{fmtINR(val)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center pt-3 mt-1">
                      <span className="text-sm font-extrabold text-main">Gross Total</span>
                      <span className="text-base font-extrabold text-success tabular-nums">{fmtINR(selected.grossPay)}</span>
                    </div>
                  </div>

                  {/* Deductions */}
                  <div className="bg-card border border-theme rounded-2xl p-5">
                    <p className="text-[10px] font-extrabold text-muted uppercase tracking-wider mb-4">Deductions</p>
                    {[
                      { label: `Income Tax (${selected.taxRegime})`, val: selected.taxDeduction    },
                      { label: "Provident Fund",                      val: selected.pfDeduction     },
                      { label: "ESI",                                 val: selected.esiDeduction    },
                      { label: "Professional Tax",                    val: selected.professionalTax },
                      { label: "Other Deductions",                    val: selected.otherDeductions },
                    ].map(({ label, val }) => (
                      <div key={label} className="flex justify-between items-center py-2 border-b border-theme last:border-0">
                        <span className="text-xs text-muted">{label}</span>
                        <span className="text-xs font-bold text-danger tabular-nums">{fmtINR(val)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center pt-3 mt-1">
                      <span className="text-sm font-extrabold text-main">Total Deductions</span>
                      <span className="text-base font-extrabold text-danger tabular-nums">{fmtINR(totalDed)}</span>
                    </div>
                  </div>
                </div>

                {/* Net pay highlight */}
                <div className="rounded-2xl bg-primary to-violet-600 p-5 flex items-center justify-between text-white">
                  <div>
                    <p className="text-xs font-extrabold text-white/65 uppercase tracking-wider">Final Net Pay</p>
                    <p className="text-xs text-white/50 mt-0.5">Gross Earnings − Total Deductions</p>
                  </div>
                  <p className="text-3xl font-extrabold tabular-nums">{fmtINR(selected.netPay)}</p>
                </div>
              </div>
            )}

            {/* DOCUMENTS */}
            {section === "documents" && (
              <div className="animate-[fadeIn_0.2s_ease]">
                <div className="bg-card border border-theme rounded-2xl overflow-hidden">
                  {[
                    { name: "Salary Slip — Jan 2026",       type: "PDF", date: "31 Jan 2026" },
                    { name: "Form 16 — FY 2025-26",         type: "PDF", date: "15 Jun 2025" },
                    { name: "PF Statement 2025",            type: "PDF", date: "31 Mar 2025" },
                    { name: "ESI Certificate 2025",         type: "PDF", date: "31 Mar 2025" },
                    { name: "Appointment Letter",           type: "PDF", date: "Joining date" },
                  ].map((doc, i) => (
                    <div key={doc.name} className={`flex items-center justify-between px-5 py-4 ${i > 0 ? "border-t border-theme" : ""}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                          <FileText className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-main">{doc.name}</p>
                          <p className="text-[10px] text-muted">{doc.type} · Generated {doc.date}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => alert(`Downloading ${doc.name}…`)}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-theme text-muted hover:text-primary hover:border-primary rounded-lg text-[11px] font-semibold transition"
                      >
                        <Download className="w-3 h-3" /> Download
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
