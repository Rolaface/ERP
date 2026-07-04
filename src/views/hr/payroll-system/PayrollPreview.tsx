import React, { useState, useMemo, useCallback, useEffect } from "react";
import * as XLSX from "xlsx";
import {
  X,
  Wallet,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  Building2,
  AlertCircle,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  ReceiptText,
  Search,
  Download,
} from "lucide-react";

import type { PayrollVerificationData } from "../../../api/payroll/payrollEntryApi";
import type { MappedEmployee } from "../../../views/hr/payroll-system/mapPayrollVerificationData";
import { MinimizableModal } from "../../../components/common/MinimizableModal";
import { Button } from "../../../components/ui/modal/formComponent";
import ModalTable from "../../../components/ui/Table/ModalTableInside";
import type { Column } from "../../../components/ui/Table/type";

interface PayrollPreviewModalProps {
  modalId: string;
  isOpen: boolean;
  onClose: () => void;
  rawData: PayrollVerificationData | null;
  loading?: boolean;
}

const fmtMoney = (value: number, currencyCode: string): string => {
  if (value === 0) return "—";
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currencyCode} ${value.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
};

const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const AVATAR_PALETTE = [
  "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
  "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
];
const avatarBg = (id: string) =>
  AVATAR_PALETTE[
    (id || "0").charCodeAt((id || "0").length - 1) % AVATAR_PALETTE.length
  ];

const tokenize = (raw: string): string[] =>
  raw
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean);

function employeeMatchesQuery(emp: MappedEmployee, tokens: string[]): boolean {
  if (tokens.length === 0) return true;

  const haystack = [
    emp.name,
    emp.id,
    emp.department,
    emp.designation,
    emp.branch ?? "",
    emp.salaryStructure,
  ]
    .join(" ")
    .toLowerCase();

  return tokens.every((token) => haystack.includes(token));
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
    for (const e of slip.earnings ?? []) {
      if (e?.abbr) components[e.abbr] = e.amount ?? 0;
    }
    for (const d of slip.deductions ?? []) {
      if (d?.abbr) components[d.abbr] = d.amount ?? 0;
    }

    return {
      id: entry.employee || "UNKNOWN",
      name: entry.employee_name || "Unknown",
      department: entry.department || slip.department || "—",
      designation: entry.designation || slip.designation || "—",
      gender: entry.gender || slip.gender || "—",
      branch: slip.branch ?? null,
      salaryStructure: slip.salary_structure ?? "—",
      status: slip.status ?? "—",
      isError,
      errorMessage: isError ? (slip.error_message ?? null) : null,
      totalWorkingDays: slip.total_working_days ?? 0,
      paymentDays: slip.payment_days ?? 0,
      leaveWithoutPay: slip.leave_without_pay ?? 0,
      absentDays: slip.absent_days ?? 0,
      leavesTakenThisMonth: slip.leaves_taken_in_payroll_period ?? 0,
      gross: slip.base_gross_pay ?? slip.gross_pay ?? 0,
      totalDeductions: slip.base_total_deduction ?? slip.total_deduction ?? 0,
      netPay: slip.net_pay ?? slip.net_payable ?? 0,
      ctc: slip.ctc ?? 0,
      annualTaxable: slip.annual_taxable_amount ?? 0,
      currentMonthTax: slip.current_month_income_tax ?? 0,
      yearToDate: slip.year_to_date ?? 0,
      incomeTaxDeductedTillDate: slip.income_tax_deducted_till_date ?? 0,
      totalInWords: slip.total_in_words ?? "",
      components,
      earnings: slip.earnings ?? [],
      deductions: slip.deductions ?? [],
    };
  });
}

const StatChip: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  valueClass?: string;
}> = ({ icon, label, value, sub, valueClass = "text-main" }) => (
  <div className="bg-card border border-theme rounded-lg px-3 py-1.5 flex items-center gap-2 min-w-0">
    <div className="shrink-0 w-6 h-6 rounded-md bg-app border border-theme flex items-center justify-center text-muted [&>svg]:w-3 [&>svg]:h-3">
      {icon}
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[9px] font-extrabold uppercase tracking-wider text-muted leading-none">
        {label}
      </p>
      <p
        className={`text-[12px] font-extrabold tabular-nums leading-tight truncate ${valueClass}`}
      >
        {value}
      </p>
      {sub && (
        <p className="text-[9px] text-muted truncate leading-none mt-0.5">
          {sub}
        </p>
      )}
    </div>
  </div>
);

const SearchBar: React.FC<{
  value: string;
  onChange: (v: string) => void;
  resultCount: number;
  totalCount: number;
}> = ({ value, onChange, resultCount, totalCount }) => {
  const isFiltered = value.trim().length > 0;

  return (
    <div className="flex items-center gap-2 w-full max-w-sm">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search name, ID, dept…"
          className="w-full pl-8 pr-3 py-1.5 text-[12px] bg-app border border-theme rounded-lg text-main placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60 transition"
        />
        {isFiltered && (
          <button
            onClick={() => onChange("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center rounded-full hover:bg-app text-muted hover:text-main transition"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
      {isFiltered && (
        <span className="text-[10px] font-semibold text-muted shrink-0">
          {resultCount} of {totalCount}
        </span>
      )}
    </div>
  );
};

const SlipDrawer: React.FC<{
  emp: MappedEmployee | null;
  currency: string;
  onClose: () => void;
}> = ({ emp, currency, onClose }) => {
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
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
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
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0 ${avatarBg(emp.id)}`}
                  >
                    {initials(emp.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-main leading-tight truncate">
                      {emp.name}
                    </p>
                    <p className="text-[11px] text-muted font-mono leading-tight">
                      {emp.id}
                    </p>
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
                  <p className="text-[11px] text-red-700 dark:text-red-400 leading-snug">
                    {emp.errorMessage}
                  </p>
                </div>
              )}

              {(emp.ctc > 0 ||
                emp.annualTaxable > 0 ||
                emp.yearToDate > 0 ||
                emp.incomeTaxDeductedTillDate > 0) && (
                <div className="px-4 py-2.5 border-b border-theme bg-app/30">
                  <p className="text-[9px] font-extrabold uppercase tracking-wider text-muted mb-1.5">
                    Annual overview
                  </p>

                  <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[11px]">
                    {emp.ctc > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted">CTC</span>
                        <span className="font-semibold">
                          {fmtMoney(emp.ctc, currency)}
                        </span>
                      </div>
                    )}

                    {emp.annualTaxable > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted">Annual taxable</span>
                        <span className="font-semibold">
                          {fmtMoney(emp.annualTaxable, currency)}
                        </span>
                      </div>
                    )}

                    {emp.yearToDate > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted">Earning till date</span>
                        <span className="font-semibold">
                          {fmtMoney(emp.yearToDate, currency)}
                        </span>
                      </div>
                    )}

                    {emp.incomeTaxDeductedTillDate > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted">Tax till date</span>
                        <span className="font-semibold text-danger">
                          {fmtMoney(emp.incomeTaxDeductedTillDate, currency)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {(emp.earnings.length > 0 || emp.deductions.length > 0) && (
                <div className="grid grid-cols-2 border-b border-theme divide-x border-theme">
                  
                  {/* Earnings Column (Right) */}
                  <div className="px-4 py-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <p className="text-[9px] font-extrabold uppercase tracking-wider text-muted">
                          Earnings
                        </p>
                      </div>
                      {emp.earnings.length > 0 ? (
                        emp.earnings.map((e, i) => (
                          <div
                            key={e.abbr || i}
                            className="flex justify-between items-center py-1.5 border-b border-theme/60 last:border-0"
                          >
                            <div className="flex items-center gap-1 min-w-0 pr-1.5">
                              <span
                                className="text-[11px] text-main truncate"
                                title={e.salary_component}
                              >
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
                        <p className="text-[11px] text-muted italic py-1.5">
                          No earnings
                        </p>
                      )}
                    </div>
                    <div className="flex justify-between items-center mt-3 pt-2 border-t-2 border-theme">
                      <span className="text-[11px] font-bold text-main">
                        Gross pay
                      </span>
                      <span className="text-[12px] font-extrabold text-main tabular-nums">
                        {fmtMoney(emp.gross, currency)}
                      </span>
                    </div>
                  </div>
                  <div className="px-4 py-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <ArrowDownRight className="w-3.5 h-3.5 text-red-500 shrink-0" />
                        <p className="text-[9px] font-extrabold uppercase tracking-wider text-muted">
                          Deductions
                        </p>
                      </div>
                      {emp.deductions.length > 0 ? (
                        emp.deductions.map((d, i) => (
                          <div
                            key={d.abbr || i}
                            className="flex justify-between items-center py-1.5 border-b border-theme/60 last:border-0"
                          >
                            <div className="flex items-center gap-1 min-w-0 pr-1.5">
                              <span
                                className="text-[11px] text-main truncate"
                                title={d.salary_component}
                              >
                                {d.salary_component}
                              </span>
                              {/* {!!d.variable_based_on_taxable_salary && (
                                <span className="text-[8px] font-semibold text-amber-600 bg-amber-50 dark:bg-amber-900/20 border border-amber-200/60 dark:border-amber-800/60 rounded px-1 py-0.5 shrink-0">
                                  Income Tax
                                </span>
                              )} */}
                            </div>
                            <span className="text-[11px] font-semibold text-danger tabular-nums shrink-0 ml-1">
                              {fmtMoney(d.amount ?? 0, currency)}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-[11px] text-muted italic py-1.5">
                          No deductions
                        </p>
                      )}
                    </div>
                    <div className="flex justify-between items-center mt-3 pt-2 border-t-2 border-theme">
                      <span className="text-[11px] font-bold text-danger">
                        Total deductions
                      </span>
                      <span className="text-[12px] font-extrabold text-danger tabular-nums">
                        −{fmtMoney(emp.totalDeductions, currency)}
                      </span>
                    </div>
                  </div>

                </div>
              )}
            </div>

            {/* Sticky Bottom Net Payable */}
            <div className="flex-shrink-0 border-t border-theme bg-app px-4 py-3">
              <div className="rounded-xl bg-card border border-theme px-4 py-3 flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted mb-0.5">
                    Net payable
                  </p>

                  {emp.totalInWords && (
                    <p className="text-[11px] text-muted font-medium leading-snug max-w-[260px]">
                      {emp.totalInWords}
                    </p>
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

export const PayrollPreviewModal: React.FC<PayrollPreviewModalProps> = ({
  modalId,
  isOpen,
  onClose,
  rawData,
  loading = false,
}) => {
  const currency = rawData?.currency ?? "INR";

  const employees = useMemo(
    () => (rawData ? buildEmployees(rawData) : []),
    [rawData],
  );

  const totalGross = rawData?.financial_summary?.total_gross_payable ?? 0;
  const totalDeductions = rawData?.financial_summary?.total_deduction ?? 0;
  const totalNet = rawData?.financial_summary?.total_net_payable ?? 0;
  const employeeCount =
    rawData?.financial_summary?.employee_count ??
    rawData?.number_of_employees ??
    employees.length;

  const [selectedEmp, setSelectedEmp] = useState<MappedEmployee | null>(null);
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    if (!isOpen) setSearchQuery("");
  }, [isOpen]);

  const handleSortChange = ({
    sortBy: key,
    sortOrder: order,
  }: {
    sortBy: string;
    sortOrder: "asc" | "desc";
  }) => {
    setSortBy(key);
    setSortOrder(order);
  };

  const monthLabel = useMemo(() => {
    if (!rawData?.start_date) return rawData?.name ?? "Payroll";
    return new Date(rawData.start_date + "T00:00:00").toLocaleString("en-IN", {
      month: "long",
      year: "numeric",
    });
  }, [rawData]);

  const sortedEmployees = useMemo(() => {
    const list = [...employees];
    list.sort((a, b) => {
      const av: any = (a as any)[sortBy] ?? "";
      const bv: any = (b as any)[sortBy] ?? "";
      const cmp =
        typeof av === "number" ? av - bv : String(av).localeCompare(String(bv));
      return sortOrder === "asc" ? cmp : -cmp;
    });
    return list;
  }, [employees, sortBy, sortOrder]);

  const searchTokens = useMemo(() => tokenize(searchQuery), [searchQuery]);

  const filteredEmployees = useMemo(() => {
    if (searchTokens.length === 0) return sortedEmployees;
    return sortedEmployees.filter((emp) =>
      employeeMatchesQuery(emp, searchTokens),
    );
  }, [sortedEmployees, searchTokens]);

  const columns = useMemo<Column<MappedEmployee>[]>(
    () => [
      {
        key: "name",
        header: "Employee",
        sortable: true,
        align: "left",
        minWidth: "200px",
        render: (emp) => (
          <div className="flex items-center gap-2">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-extrabold shrink-0 ${avatarBg(emp.id)}`}
            >
              {initials(emp.name)}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold truncate leading-tight text-main">
                {emp.name}
              </p>
              <p className="text-[9px] text-muted font-mono leading-tight">
                {emp.id}
              </p>
              {emp.isError && (
                <p
                  className="text-[9px] text-danger leading-tight truncate max-w-[150px]"
                  title={emp.errorMessage ?? ""}
                >
                  ⚠ {emp.errorMessage}
                </p>
              )}
            </div>
          </div>
        ),
      },
      {
        key: "department",
        header: "Dept",
        sortable: true,
        minWidth: "130px",
        align: "left",
        truncate: true,
      },
      {
        key: "totalWorkingDays",
        header: "Work Days",
        sortable: true,
        align: "left",
        minWidth: "90px",
        render: (emp) => (
          <span className="tabular-nums">{emp.totalWorkingDays || "—"}</span>
        ),
      },
      {
        key: "paymentDays",
        header: "Paid Days",
        sortable: true,
        align: "left",
        minWidth: "90px",
        render: (emp) => (
          <span className="tabular-nums">{emp.paymentDays || "—"}</span>
        ),
      },
      {
        key: "leaveWithoutPay",
        header: "LWP",
        sortable: true,
        align: "left",
        minWidth: "70px",
        render: (emp) => (
          <span className="tabular-nums text-muted">
            {emp.leaveWithoutPay > 0 ? emp.leaveWithoutPay : "—"}
          </span>
        ),
      },
      {
        key: "gross",
        header: "Gross",
        sortable: true,
        align: "left",
        minWidth: "140px",
        render: (emp) => (
          <span className="tabular-nums font-bold text-main">
            {emp.isError ? "—" : fmtMoney(emp.gross, currency)}
          </span>
        ),
      },
      {
        key: "totalDeductions",
        header: "Deductions",
        sortable: true,
        align: "left",
        minWidth: "140px",
        render: (emp) => (
          <span className="tabular-nums text-danger">
            {emp.isError ? "—" : fmtMoney(emp.totalDeductions, currency)}
          </span>
        ),
      },
      {
        key: "netPay",
        header: "Net Pay",
        sortable: true,
        align: "left",
        minWidth: "140px",
        render: (emp) => (
          <span className="tabular-nums font-extrabold text-success">
            {emp.isError ? "—" : fmtMoney(emp.netPay, currency)}
          </span>
        ),
      },
      {
        key: "actions",
        header: "",
        minWidth: "40px",
        align: "center",
        render: () => <span className="text-muted text-xs">›</span>,
      },
    ],
    [currency],
  );

  const exportExcel = useCallback(() => {
    if (!rawData) return;

    const earningAbbrSet = new Map<string, string>();
    const deductionAbbrSet = new Map<string, string>();
    for (const emp of employees) {
      for (const e of emp.earnings) {
        if (e.abbr) earningAbbrSet.set(e.abbr, e.salary_component || e.abbr);
      }
      for (const d of emp.deductions) {
        if (d.abbr) deductionAbbrSet.set(d.abbr, d.salary_component || d.abbr);
      }
    }
    const earningCols = [...earningAbbrSet.entries()];
    const deductionCols = [...deductionAbbrSet.entries()];

    const payrollMonth = new Date(rawData.start_date).toLocaleString(
      "default",
      {
        month: "long",
        year: "numeric",
      },
    );

    const baseHeadersLength = 7;
    const earningLength = earningCols.length;
    const deductionLength = deductionCols.length;

    const row1 = Array(baseHeadersLength).fill("");
    row1.push("Earning", ...Array(Math.max(0, earningLength - 1)).fill(""));
    row1.push("");
    row1.push(
      "Deductions",
      ...Array(Math.max(0, deductionLength - 1)).fill(""),
    );
    row1.push("Summary", "", "", "");

    const row2 = Array(row1.length).fill("");

    const row3 = [
      "Emp ID",
      "Name",
      "Department",
      "Work Days",
      "Paid Days",
      "Leave Without Pay",
      "Leave Days",
      ...earningCols.map(([, label]) => label),
      "Gross Pay",
      ...deductionCols.map(([, label]) => label),
      "Total Deductions",
      "Net Pay",
      "Total Earning Till Date",
      "Tax Till Date",
    ];

    const rows = employees.map((e) => [
      e.id,
      e.name,
      e.department,
      e.totalWorkingDays,
      e.paymentDays,
      e.leaveWithoutPay,
      e.leavesTakenThisMonth ?? 0,
      ...earningCols.map(([abbr]) => e.components[abbr] ?? 0),
      e.gross,
      ...deductionCols.map(([abbr]) => e.components[abbr] ?? 0),
      e.totalDeductions,
      e.netPay,
      e.yearToDate ?? 0,
      e.incomeTaxDeductedTillDate ?? 0,
    ]);

    const totalRow = [
      "",
      "TOTALS",
      "",
      "",
      "",
      "",
      "",
      ...earningCols.map(([abbr]) =>
        employees.reduce((s, e) => s + (e.components[abbr] ?? 0), 0),
      ),
      rawData.financial_summary?.total_gross_payable ?? 0,
      ...deductionCols.map(([abbr]) =>
        employees.reduce((s, e) => s + (e.components[abbr] ?? 0), 0),
      ),
      rawData.financial_summary?.total_deduction ?? 0,
      rawData.financial_summary?.total_net_payable ?? 0,
      "",
      "",
    ];

    const wsData = [row1, row2, row3, ...rows, [], totalRow];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    const merges = [];

    if (earningLength > 1) {
      merges.push({
        s: { r: 0, c: baseHeadersLength },
        e: { r: 0, c: baseHeadersLength + earningLength - 1 },
      });
    }

    const deductionStartCol = baseHeadersLength + earningLength + 1;
    if (deductionLength > 1) {
      merges.push({
        s: { r: 0, c: deductionStartCol },
        e: { r: 0, c: deductionStartCol + deductionLength - 1 },
      });
    }

    const summaryStartCol = deductionStartCol + deductionLength;
    merges.push({
      s: { r: 0, c: summaryStartCol },
      e: { r: 0, c: summaryStartCol + 3 },
    });

    ws["!merges"] = merges;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, monthLabel.slice(0, 31));
    XLSX.writeFile(wb, `payroll_${payrollMonth}.xlsx`);
  }, [rawData, employees, monthLabel]);

  if (!isOpen) return null;

  const footer = (
    <Button variant="secondary" onClick={onClose}>
      Close
    </Button>
  );

  return (
    <MinimizableModal
      modalId={modalId}
      isOpen={isOpen}
      onClose={onClose}
      title={loading ? "Loading…" : `Payroll Preview — ${monthLabel}`}
      subtitle={
        loading
          ? ""
          : `${rawData?.name ?? ""} · ${rawData?.start_date ?? ""} → ${rawData?.end_date ?? ""}`
      }
      maxWidth="full"
      height="90vh"
      footer={footer}
    >
      {loading ? (
        <div className="flex h-48 items-center justify-center text-muted text-sm">
          Loading payroll data…
        </div>
      ) : !rawData ? (
        <div className="flex h-48 flex-col items-center justify-center gap-2 text-center">
          <AlertCircle className="h-8 w-8 text-danger" />
          <p className="text-sm font-semibold text-main">
            No payroll data available.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2 pb-2 relative h-full min-h-0">
          <div className="bg-card border border-theme rounded-lg px-3 py-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 shrink-0">
            {[
              rawData.posting_date && {
                label: "Post date",
                value: rawData.posting_date,
              },
              rawData.currency && {
                label: "Currency",
                value: rawData.currency,
              },
              rawData.bank_account && {
                label: "Bank",
                value: rawData.bank_account,
              },
              rawData.payroll_payable_account && {
                label: "Payable A/C",
                value: rawData.payroll_payable_account,
              },
              rawData.payroll_frequency && {
                label: "Frequency",
                value: rawData.payroll_frequency,
              },
            ]
              .filter(Boolean)
              .map((item: any) => (
                <div key={item.label} className="flex items-center gap-1">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-muted">
                    {item.label}
                  </span>
                  <span className="text-[10px] font-semibold text-main">
                    {item.value}
                  </span>
                </div>
              ))}
            <span className="ml-auto text-[9px] font-bold px-2 py-0.5 rounded-full bg-app border border-theme text-muted">
              {rawData.status}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2 shrink-0">
            <StatChip
              icon={<Users className="w-4 h-4" />}
              label="Employees"
              value={`${employeeCount}`}
              sub={rawData?.financial_summary?.calculation_method ?? ""}
            />
            <StatChip
              icon={<TrendingUp className="w-4 h-4" />}
              label="Total gross"
              value={fmtMoney(totalGross, currency)}
              valueClass="text-main"
            />
            <StatChip
              icon={<TrendingDown className="w-4 h-4" />}
              label="Total deductions"
              value={fmtMoney(totalDeductions, currency)}
              valueClass="text-danger"
            />
            <StatChip
              icon={<Wallet className="w-4 h-4" />}
              label="Net payable"
              value={fmtMoney(totalNet, currency)}
              valueClass="text-success"
            />
          </div>

          <div className="shrink-0 flex items-center justify-between gap-4 mt-1">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              resultCount={filteredEmployees.length}
              totalCount={employees.length}
            />

            {employees.length > 0 && (
              <button
                type="button"
                onClick={exportExcel}
                className="h-9 px-3.5 rounded-xl border border-theme bg-card hover:bg-emerald-500/5 hover:border-emerald-500/40 text-xs font-bold text-main transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                title="Export list to Excel"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                Export Excel
              </button>
            )}
          </div>

          <div className="flex-1 min-h-0">
            <ModalTable<MappedEmployee>
              tableId="payroll-preview-table"
              columns={columns}
              data={filteredEmployees}
              rowKey={(emp) => emp.id}
              loading={loading}
              emptyMessage={
                searchTokens.length > 0
                  ? `No employees match "${searchQuery}"`
                  : "No employees found"
              }
              onRowClick={(emp) => setSelectedEmp(emp)}
              showToolbar={false}
              enableExport={employees.length > 0}
              exportLabel="Export Excel"
              onExport={exportExcel}
              enableColumnSelector={true}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortChange={handleSortChange}
              totalItems={filteredEmployees.length}
            />
          </div>
        </div>
      )}

      <SlipDrawer
        emp={selectedEmp}
        currency={currency}
        onClose={() => setSelectedEmp(null)}
      />
    </MinimizableModal>
  );
};

export default PayrollPreviewModal;
