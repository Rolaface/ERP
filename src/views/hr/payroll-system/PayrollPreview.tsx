import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import {
  X,
  Search,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  FileSpreadsheet,
  Wallet,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  Building2,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Banknote,
  ReceiptText,
} from "lucide-react";

import type { PayrollVerificationData, VerificationSalaryComponent } from "../../../api/payroll/payrollEntryApi";
import type { MappedEmployee, MappedPayrollHeader } from "../../../views/hr/payroll-system/mapPayrollVerificationData";
import { MinimizableModal } from "../../../components/common/MinimizableModal";
import { Button } from "../../../components/ui/modal/formComponent";

// ─── Types ────────────────────────────────────────────────────────────────────

type SortDir = "asc" | "desc";

interface SalaryColumn {
  abbr: string;
  label: string;
  kind: "earning" | "deduction";
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface PayrollPreviewModalProps {
  modalId:   string;
  isOpen:    boolean;
  onClose:   () => void;
  rawData:   PayrollVerificationData | null;
  loading?:  boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CURRENCY_SYMBOLS: Record<string, string> = { INR: "₹", USD: "$", EUR: "€", GBP: "£" };
const sym = (code?: string) => CURRENCY_SYMBOLS[code ?? "INR"] ?? `${code ?? ""} `;

const fmtNum = (v: number, cur = "₹") =>
  v === 0
    ? "—"
    : `${cur}${v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtShort = (v: number, cur = "₹") => {
  if (v === 0) return "—";
  if (v >= 10_000_000) return `${cur}${(v / 10_000_000).toFixed(2)}Cr`;
  if (v >= 100_000) return `${cur}${(v / 100_000).toFixed(2)}L`;
  if (v >= 1_000) return `${cur}${(v / 1_000).toFixed(1)}K`;
  return `${cur}${Math.round(v).toLocaleString("en-IN")}`;
};

const initials = (name: string) =>
  name.split(" ").filter(Boolean).map((n) => n[0]).join("").slice(0, 2).toUpperCase();

const AVATAR_PALETTE = [
  { bg: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  { bg: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
  { bg: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300" },
  { bg: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
  { bg: "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300" },
  { bg: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300" },
];
const avatarBg = (id: string) =>
  AVATAR_PALETTE[(id || "0").charCodeAt((id || "0").length - 1) % AVATAR_PALETTE.length].bg;

// ─── Data builders ─────────────────────────────────────────────────────────────

function buildColumns(raw: PayrollVerificationData): SalaryColumn[] {
  const earningMap = new Map<string, string>();
  const deductionMap = new Map<string, string>();

  for (const emp of raw.employees ?? []) {
    const slip = emp.salary_slip_details;
    for (const e of slip?.earnings ?? []) {
      if (e?.abbr) earningMap.set(e.abbr, e.salary_component || e.abbr);
    }
    for (const d of slip?.deductions ?? []) {
      if (d?.abbr) deductionMap.set(d.abbr, d.salary_component || d.abbr);
    }
  }

  return [
    ...[...earningMap.entries()].map(([abbr, label]) => ({ abbr, label, kind: "earning" as const })),
    ...[...deductionMap.entries()].map(([abbr, label]) => ({ abbr, label, kind: "deduction" as const })),
  ];
}

function buildEmployees(raw: PayrollVerificationData): MappedEmployee[] {
  return (raw.employees ?? []).map((entry) => {
    const slip = entry.salary_slip_details ?? {
      employee: entry.employee,
      employee_name: entry.employee_name,
      status: "Error",
      error_message: "Salary slip details missing.",
      earnings: [],
      deductions: [],
    };

    const isError = slip.status === "Error";

    const components: Record<string, number> = {};
    for (const e of slip.earnings ?? []) { if (e?.abbr) components[e.abbr] = e.amount ?? 0; }
    for (const d of slip.deductions ?? []) { if (d?.abbr) components[d.abbr] = d.amount ?? 0; }

    return {
      id: entry.employee || "UNKNOWN",
      name: entry.employee_name || "Unknown",
      department: entry.department || slip.department || "—",
      designation: entry.designation || slip.designation || "—",
      branch: slip.branch ?? null,
      salaryStructure: slip.salary_structure ?? "—",
      status: slip.status ?? "—",
      isError,
      errorMessage: isError ? (slip.error_message ?? null) : null,
      totalWorkingDays: slip.total_working_days ?? 0,
      paymentDays: slip.payment_days ?? 0,
      leaveWithoutPay: slip.leave_without_pay ?? 0,
      absentDays: slip.absent_days ?? 0,
      gross: slip.gross_pay ?? 0,
      totalDeductions: slip.total_deduction ?? 0,
      netPay: slip.net_payable ?? slip.rounded_total ?? 0,
      ctc: slip.ctc ?? 0,
      annualTaxable: slip.annual_taxable_amount ?? 0,
      currentMonthTax: slip.current_month_income_tax ?? 0,
      totalInWords: slip.total_in_words ?? "",
      components,
      earnings: slip.earnings ?? [],
      deductions: slip.deductions ?? [],
    };
  });
}

// ─── Stat chip ─────────────────────────────────────────────────────────────────

const StatChip: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  valueClass?: string;
}> = ({ icon, label, value, sub, valueClass = "text-main" }) => (
  <div className="bg-card border border-theme rounded-xl p-3 flex items-center gap-3 min-w-0">
    <div className="shrink-0 w-9 h-9 rounded-lg bg-app border border-theme flex items-center justify-center text-muted">
      {icon}
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[9px] font-extrabold uppercase tracking-wider text-muted mb-0.5 leading-none">{label}</p>
      <p className={`text-sm font-extrabold tabular-nums leading-tight ${valueClass}`}>{value}</p>
      {sub && <p className="text-[10px] text-muted mt-0.5 truncate">{sub}</p>}
    </div>
  </div>
);

// ─── Sort header ───────────────────────────────────────────────────────────────

const SortTh: React.FC<{
  label: string;
  sortKey?: string;
  current: string | null;
  dir: SortDir;
  onSort: (k: string) => void;
  right?: boolean;
  className?: string;
  title?: string;
}> = ({ label, sortKey, current, dir, onSort, right, className = "", title }) => {
  const active = sortKey && current === sortKey;
  return (
    <th
      title={title}
      onClick={() => sortKey && onSort(sortKey)}
      className={`px-2 py-2.5 text-[9px] font-extrabold uppercase tracking-wider text-muted whitespace-nowrap select-none
        ${right ? "text-right" : "text-left"}
        ${sortKey ? "cursor-pointer hover:text-main transition-colors" : ""}
        ${className}`}
    >
      <span className={`inline-flex items-center gap-1 ${right ? "justify-end w-full" : ""}`}>
        {label}
        {sortKey && (
          <span className={active ? "opacity-100" : "opacity-20"}>
            {active && dir === "desc"
              ? <ChevronDown className="w-3 h-3" />
              : <ChevronUp className="w-3 h-3" />}
          </span>
        )}
      </span>
    </th>
  );
};

// ─── Salary Slip Drawer ────────────────────────────────────────────────────────

const SlipDrawer: React.FC<{
  emp: MappedEmployee | null;
  cur: string;
  onClose: () => void;
}> = ({ emp, cur, onClose }) => {
  const open = !!emp;

  // trap focus / close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity duration-200 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      />

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 bottom-0 z-50 w-[420px] max-w-full bg-card border-l border-theme flex flex-col shadow-2xl transition-transform duration-200 ease-out ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        {!emp ? null : (
          <>
            {/* Header */}
            <div className="border-b border-theme px-5 py-4 flex-shrink-0">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-extrabold shrink-0 ${avatarBg(emp.id)}`}>
                    {initials(emp.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-main leading-tight truncate">{emp.name}</p>
                    <p className="text-[11px] text-muted font-mono leading-tight">{emp.id}</p>
                    <p className="text-[11px] text-muted leading-tight truncate">{emp.designation} · {emp.department}</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="shrink-0 w-8 h-8 rounded-lg border border-theme flex items-center justify-center text-muted hover:text-main hover:bg-app transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Meta pills */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {[
                  { icon: <Calendar className="w-3 h-3" />, label: `${emp.paymentDays} pay days` },
                  emp.leaveWithoutPay > 0 && { icon: <AlertCircle className="w-3 h-3" />, label: `LWP: ${emp.leaveWithoutPay}` },
                  emp.absentDays > 0 && { icon: <AlertCircle className="w-3 h-3" />, label: `Absent: ${emp.absentDays}` },
                  emp.salaryStructure !== "—" && { icon: <ReceiptText className="w-3 h-3" />, label: emp.salaryStructure },
                  emp.branch && { icon: <Building2 className="w-3 h-3" />, label: emp.branch },
                ].filter(Boolean).map((item: any, i) => (
                  <span key={i} className="inline-flex items-center gap-1 text-[10px] font-semibold text-muted bg-app border border-theme rounded-full px-2 py-0.5">
                    {item.icon} {item.label}
                  </span>
                ))}

                {/* Status */}
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold rounded-full px-2 py-0.5 ${emp.isError
                  ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                  : "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"}`}>
                  {emp.isError ? <AlertCircle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                  {emp.status}
                </span>
              </div>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto">

              {/* Error block */}
              {emp.isError && emp.errorMessage && (
                <div className="m-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex gap-2 items-start">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-red-700 dark:text-red-400 leading-snug">{emp.errorMessage}</p>
                </div>
              )}

              {/* Annual overview */}
              {(emp.ctc > 0 || emp.annualTaxable > 0) && (
                <div className="px-5 py-4 border-b border-theme">
                  <p className="text-[9px] font-extrabold uppercase tracking-wider text-muted mb-3">Annual overview</p>
                  <div className="space-y-2">
                    {emp.ctc > 0 && (
                      <div className="flex justify-between text-[12px]">
                        <span className="text-muted">CTC</span>
                        <span className="font-semibold text-main tabular-nums">{fmtNum(emp.ctc, cur)}</span>
                      </div>
                    )}
                    {emp.annualTaxable > 0 && (
                      <div className="flex justify-between text-[12px]">
                        <span className="text-muted">Annual taxable amount</span>
                        <span className="font-semibold text-main tabular-nums">{fmtNum(emp.annualTaxable, cur)}</span>
                      </div>
                    )}
                    {emp.currentMonthTax > 0 && (
                      <div className="flex justify-between text-[12px]">
                        <span className="text-muted">Income tax this month</span>
                        <span className="font-semibold text-danger tabular-nums">{fmtNum(emp.currentMonthTax, cur)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Earnings */}
              {emp.earnings.length > 0 && (
                <div className="px-5 py-4 border-b border-theme">
                  <div className="flex items-center gap-1.5 mb-3">
                    <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
                    <p className="text-[9px] font-extrabold uppercase tracking-wider text-muted">Earnings</p>
                  </div>
                  <div className="space-y-0">
                    {emp.earnings.map((e, i) => (
                      <div
                        key={e.abbr || i}
                        className="flex justify-between items-center py-2 border-b border-theme last:border-0"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[9px] font-bold bg-app border border-theme rounded px-1.5 py-0.5 text-muted font-mono shrink-0">{e.abbr}</span>
                          <span className="text-[12px] text-muted truncate">{e.salary_component}</span>
                          {!!e.is_flexible_benefit && (
                            <span className="text-[9px] font-semibold text-blue-500 bg-blue-50 dark:bg-blue-900/20 rounded px-1">Flex</span>
                          )}
                          {!e.is_tax_applicable && (
                            <span className="text-[9px] font-semibold text-muted bg-app border border-theme rounded px-1">Non-tax</span>
                          )}
                        </div>
                        <span className="text-[12px] font-semibold text-main tabular-nums ml-4 shrink-0">{fmtNum(e.amount, cur)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center mt-2 pt-2 border-t-2 border-theme">
                    <span className="text-[11px] font-extrabold text-main">Gross pay</span>
                    <span className="text-[13px] font-extrabold text-main tabular-nums">{fmtNum(emp.gross, cur)}</span>
                  </div>
                </div>
              )}

              {/* Deductions */}
              {emp.deductions.length > 0 && (
                <div className="px-5 py-4 border-b border-theme">
                  <div className="flex items-center gap-1.5 mb-3">
                    <ArrowDownRight className="w-3.5 h-3.5 text-red-500" />
                    <p className="text-[9px] font-extrabold uppercase tracking-wider text-muted">Deductions</p>
                  </div>
                  <div className="space-y-0">
                    {emp.deductions.map((d, i) => (
                      <div
                        key={d.abbr || i}
                        className="flex justify-between items-center py-2 border-b border-theme last:border-0"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[9px] font-bold bg-app border border-theme rounded px-1.5 py-0.5 text-muted font-mono shrink-0">{d.abbr}</span>
                          <span className="text-[12px] text-muted truncate">{d.salary_component}</span>
                          {!!d.variable_based_on_taxable_salary && (
                            <span className="text-[9px] font-semibold text-amber-600 bg-amber-50 dark:bg-amber-900/20 rounded px-1">Variable</span>
                          )}
                        </div>
                        <span className="text-[12px] font-semibold text-danger tabular-nums ml-4 shrink-0">−{fmtNum(d.amount, cur)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center mt-2 pt-2 border-t-2 border-theme">
                    <span className="text-[11px] font-extrabold text-danger">Total deductions</span>
                    <span className="text-[13px] font-extrabold text-danger tabular-nums">−{fmtNum(emp.totalDeductions, cur)}</span>
                  </div>
                </div>
              )}

              {/* Net payable banner */}
              <div className="px-5 py-4">
                <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-0.5">Net payable</p>
                    {emp.totalInWords && (
                      <p className="text-[10px] text-emerald-700/70 dark:text-emerald-400/70 leading-snug max-w-[200px]">{emp.totalInWords}</p>
                    )}
                  </div>
                  <p className="text-xl font-extrabold text-emerald-700 dark:text-emerald-400 tabular-nums">
                    {emp.isError ? "—" : fmtNum(emp.netPay, cur)}
                  </p>
                </div>
              </div>

            </div>
          </>
        )}
      </div>
    </>
  );
};

// ─── Main component ────────────────────────────────────────────────────────────

export const PayrollPreviewModal: React.FC<PayrollPreviewModalProps> = ({
  modalId,
  isOpen,
  onClose,
  rawData,
  loading = false,
}) => {
  const currency = useMemo(() => sym(rawData?.currency), [rawData?.currency]);

  const columns = useMemo(() => rawData ? buildColumns(rawData) : [], [rawData]);
  const employees = useMemo(() => rawData ? buildEmployees(rawData) : [], [rawData]);

  const earningCols = useMemo(() => columns.filter((c) => c.kind === "earning"), [columns]);
  const deductionCols = useMemo(() => columns.filter((c) => c.kind === "deduction"), [columns]);

  // Totals from financial_summary if present (already computed server-side), fallback to summing
  const totalGross = useMemo(
    () => rawData?.financial_summary?.total_gross_payable ?? employees.reduce((s, e) => s + e.gross, 0),
    [rawData, employees],
  );
  const totalDeductions = useMemo(
    () => rawData?.financial_summary?.total_deduction ?? employees.reduce((s, e) => s + e.totalDeductions, 0),
    [rawData, employees],
  );
  const totalNet = useMemo(
    () => rawData?.financial_summary?.total_net_payable ?? employees.reduce((s, e) => s + e.netPay, 0),
    [rawData, employees],
  );
  const employeeCount = useMemo(
    () => rawData?.financial_summary?.employee_count ?? rawData?.number_of_employees ?? employees.length,
    [rawData, employees],
  );

  const colTotals = useMemo<Record<string, number>>(() => {
    const t: Record<string, number> = {};
    for (const col of columns) {
      t[col.abbr] = employees.reduce((s, e) => s + (e.components[col.abbr] ?? 0), 0);
    }
    return t;
  }, [columns, employees]);

  // Search + sort
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const displayed = useMemo(() => {
    let list = [...employees];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) => e.name.toLowerCase().includes(q) || e.id.toLowerCase().includes(q) || e.department.toLowerCase().includes(q),
      );
    }
    if (sortKey) {
      list.sort((a, b) => {
        const av: any = sortKey.startsWith("comp:") ? (a.components[sortKey.slice(5)] ?? 0) : (a as any)[sortKey] ?? "";
        const bv: any = sortKey.startsWith("comp:") ? (b.components[sortKey.slice(5)] ?? 0) : (b as any)[sortKey] ?? "";
        const cmp = typeof av === "number" ? av - bv : String(av).localeCompare(String(bv));
        return sortDir === "asc" ? cmp : -cmp;
      });
    }
    return list;
  }, [employees, search, sortKey, sortDir]);

  // Drawer
  const [selectedEmp, setSelectedEmp] = useState<MappedEmployee | null>(null);

  // Month label
  const monthLabel = useMemo(() => {
    if (!rawData?.start_date) return rawData?.name ?? "Payroll";
    return new Date(rawData.start_date + "T00:00:00").toLocaleString("en-IN", { month: "long", year: "numeric" });
  }, [rawData]);

  // Excel export — fully dynamic, no hardcoded columns
  const exportExcel = useCallback(() => {
    if (!rawData) return;

    const header = [
      "ID", "Name", "Department", "Designation",
      ...earningCols.map((c) => c.label),
      "Gross Pay",
      ...deductionCols.map((c) => c.label),
      "Total Deductions", "Net Pay", "Salary Structure",
    ];

    const rows = employees.map((e) => [
      e.id, e.name, e.department, e.designation,
      ...earningCols.map((c) => e.components[c.abbr] ?? 0),
      e.gross,
      ...deductionCols.map((c) => e.components[c.abbr] ?? 0),
      e.totalDeductions, e.netPay, e.salaryStructure,
    ]);

    const totalRow = [
      "", "TOTALS", "", "",
      ...earningCols.map((c) => colTotals[c.abbr] ?? 0),
      totalGross,
      ...deductionCols.map((c) => colTotals[c.abbr] ?? 0),
      totalDeductions, totalNet, "",
    ];

    const ws = XLSX.utils.aoa_to_sheet([header, ...rows, [], totalRow]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, monthLabel.slice(0, 31));
    XLSX.writeFile(wb, `payroll_${rawData.name ?? "export"}.xlsx`);
  }, [rawData, employees, earningCols, deductionCols, colTotals, totalGross, totalDeductions, totalNet, monthLabel]);

  if (!isOpen) return null;

  const footer = <Button variant="secondary" onClick={onClose}>Close</Button>;

  return (
    <MinimizableModal
      modalId={modalId}
      isOpen={isOpen}
      onClose={onClose}
      title={loading ? "Loading…" : `Payroll Preview — ${monthLabel}`}
      subtitle={loading ? "" : `${rawData?.name ?? ""} · ${rawData?.start_date ?? ""} → ${rawData?.end_date ?? ""}`}
      maxWidth="full"
      height="90vh"
      footer={footer}
    >
      {loading ? (
        <div className="flex h-48 items-center justify-center text-muted text-sm">Loading payroll data…</div>
      ) : !rawData ? (
        <div className="flex h-48 flex-col items-center justify-center gap-2 text-center">
          <AlertCircle className="h-8 w-8 text-danger" />
          <p className="text-sm font-semibold text-main">No payroll data available.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 pb-2 relative">

          {/* ── Info bar ── */}
          <div className="bg-card border border-theme rounded-xl px-4 py-2.5 flex flex-wrap items-center gap-x-5 gap-y-1.5">
            {[
              rawData.company        && { label: "Company",      value: rawData.company },
              rawData.posting_date   && { label: "Post date",    value: rawData.posting_date },
              rawData.currency       && { label: "Currency",     value: rawData.currency },
              rawData.cost_center    && { label: "Cost center",  value: rawData.cost_center },
              rawData.bank_account   && { label: "Bank",         value: rawData.bank_account },
              rawData.payroll_payable_account && { label: "Payable A/C", value: rawData.payroll_payable_account },
              rawData.payroll_frequency && { label: "Frequency",  value: rawData.payroll_frequency },
            ].filter(Boolean).map((item: any) => (
              <div key={item.label} className="flex items-center gap-1.5">
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-muted">{item.label}</span>
                <span className="text-[11px] font-semibold text-main">{item.value}</span>
              </div>
            ))}
            <span className="ml-auto text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-app border border-theme text-muted">
              {rawData.status}
            </span>
          </div>

          {/* ── KPI chips ── */}
          <div className="grid grid-cols-4 gap-2.5">
            <StatChip
              icon={<Users className="w-4 h-4" />}
              label="Employees"
              value={`${employeeCount}`}
              sub={`${rawData?.financial_summary?.calculation_method ?? ""}`}
            />
            <StatChip
              icon={<TrendingUp className="w-4 h-4" />}
              label="Total gross"
              value={fmtShort(totalGross, currency)}
              valueClass="text-main"
            />
            <StatChip
              icon={<TrendingDown className="w-4 h-4" />}
              label="Total deductions"
              value={fmtShort(totalDeductions, currency)}
              valueClass="text-danger"
            />
            <StatChip
              icon={<Wallet className="w-4 h-4" />}
              label="Net payable"
              value={fmtShort(totalNet, currency)}
              valueClass="text-success"
            />
          </div>

          {/* ── Table toolbar ── */}
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted">Employee breakdown</p>
            <div className="relative ml-2">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, ID, dept…"
                className="h-7 pl-7 pr-6 bg-card border border-theme rounded-lg text-xs text-main placeholder:text-muted focus:outline-none w-48"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-main">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <span className="text-[10px] font-bold text-muted bg-app border border-theme px-2.5 py-0.5 rounded-full">
              {displayed.length} / {employees.length}
            </span>
            <div className="ml-auto">
              <button
                type="button"
                onClick={exportExcel}
                disabled={employees.length === 0}
                className="h-7 px-3 flex items-center gap-1.5 rounded-lg border border-theme bg-card hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-300 text-[11px] font-bold text-muted hover:text-emerald-700 transition disabled:opacity-40"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                Export Excel
              </button>
            </div>
          </div>

          {/* ── Table ── */}
          <div className="border border-theme rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse" style={{ minWidth: 800 }}>
                <thead className="bg-app border-b border-theme">
                  <tr>
                    {/* Sticky employee col */}
                    <SortTh label="Employee"   sortKey="name"        current={sortKey} dir={sortDir} onSort={handleSort} className="sticky left-0 bg-app z-10 min-w-[180px]" />
                    <SortTh label="Dept"       sortKey="department"  current={sortKey} dir={sortDir} onSort={handleSort} />
                    <SortTh label="Days"       sortKey="paymentDays" current={sortKey} dir={sortDir} onSort={handleSort} right />

                    {/* Dynamic earning cols */}
                    {earningCols.map((col) => (
                      <SortTh
                        key={col.abbr}
                        label={col.abbr}
                        title={col.label}
                        sortKey={`comp:${col.abbr}`}
                        current={sortKey}
                        dir={sortDir}
                        onSort={handleSort}
                        right
                      />
                    ))}

                    <SortTh label="Gross"   sortKey="gross"          current={sortKey} dir={sortDir} onSort={handleSort} right />

                    {/* Dynamic deduction cols */}
                    {deductionCols.map((col) => (
                      <SortTh
                        key={col.abbr}
                        label={col.abbr}
                        title={col.label}
                        sortKey={`comp:${col.abbr}`}
                        current={sortKey}
                        dir={sortDir}
                        onSort={handleSort}
                        right
                      />
                    ))}

                    <SortTh label="Net pay" sortKey="netPay" current={sortKey} dir={sortDir} onSort={handleSort} right />
                    {/* Chevron col — no header */}
                    <th className="w-8" />
                  </tr>
                </thead>

                <tbody>
                  {displayed.length === 0 ? (
                    <tr>
                      <td colSpan={5 + earningCols.length + deductionCols.length} className="py-12 text-center text-xs text-muted">
                        {search ? `No results for "${search}"` : "No employees"}
                      </td>
                    </tr>
                  ) : (
                    displayed.map((emp, i) => (
                      <tr
                        key={emp.id}
                        onClick={() => setSelectedEmp(emp)}
                        className={`border-b border-theme last:border-0 cursor-pointer transition-colors group
                          ${i % 2 === 1 ? "bg-app" : "bg-card"} hover:bg-primary/5`}
                      >
                        {/* Sticky employee cell */}
                        <td className="px-2 py-2 sticky left-0 bg-inherit z-[1]">
                          <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-extrabold shrink-0 ${avatarBg(emp.id)}`}>
                              {initials(emp.name)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[11px] font-bold truncate leading-tight text-main">{emp.name}</p>
                              <p className="text-[9px] text-muted font-mono leading-tight">{emp.id}</p>
                              {emp.isError && (
                                <p className="text-[9px] text-danger leading-tight truncate max-w-[150px]" title={emp.errorMessage ?? ""}>
                                  ⚠ {emp.errorMessage}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-2 py-2 text-[11px] text-muted truncate max-w-[100px]">{emp.department}</td>

                        <td className="px-2 py-2 text-[11px] text-right tabular-nums text-main">
                          {emp.paymentDays || "—"}
                        </td>

                        {earningCols.map((col) => (
                          <td key={col.abbr} className="px-2 py-2 text-[11px] text-right tabular-nums text-main" title={col.label}>
                            {fmtNum(emp.components[col.abbr] ?? 0, currency)}
                          </td>
                        ))}

                        <td className="px-2 py-2 text-[11px] text-right tabular-nums font-bold text-main">
                          {fmtNum(emp.gross, currency)}
                        </td>

                        {deductionCols.map((col) => (
                          <td key={col.abbr} className="px-2 py-2 text-[11px] text-right tabular-nums text-danger" title={col.label}>
                            {fmtNum(emp.components[col.abbr] ?? 0, currency)}
                          </td>
                        ))}

                        <td className="px-2 py-2 text-[11px] text-right tabular-nums font-extrabold text-success">
                          {fmtNum(emp.netPay, currency)}
                        </td>

                        <td className="px-2 py-2 text-center">
                          <ChevronRight className="w-3.5 h-3.5 text-muted group-hover:text-main transition" />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>

                {/* Totals footer */}
                {displayed.length > 0 && (
                  <tfoot className="border-t-2 border-theme bg-app">
                    <tr>
                      <td colSpan={3} className="px-2 py-2 text-[9px] font-extrabold uppercase tracking-wider text-muted">
                        Totals — {employees.length} employees
                      </td>

                      {earningCols.map((col) => (
                        <td key={col.abbr} className="px-2 py-2 text-[11px] text-right tabular-nums font-extrabold text-main">
                          {fmtNum(colTotals[col.abbr] ?? 0, currency)}
                        </td>
                      ))}

                      <td className="px-2 py-2 text-[11px] text-right tabular-nums font-extrabold text-main">
                        {fmtNum(totalGross, currency)}
                      </td>

                      {deductionCols.map((col) => (
                        <td key={col.abbr} className="px-2 py-2 text-[11px] text-right tabular-nums font-extrabold text-danger">
                          {fmtNum(colTotals[col.abbr] ?? 0, currency)}
                        </td>
                      ))}

                      <td className="px-2 py-2 text-[11px] text-right tabular-nums font-extrabold text-success">
                        {fmtNum(totalNet, currency)}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

        </div>
      )}

      {/* Salary slip drawer — rendered inside modal context */}
      <SlipDrawer
        emp={selectedEmp}
        cur={currency}
        onClose={() => setSelectedEmp(null)}
      />
    </MinimizableModal>
  );
};

export default PayrollPreviewModal;