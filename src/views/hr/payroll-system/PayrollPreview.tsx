import React, { useState, useMemo, useCallback, useEffect } from "react";
import * as XLSX from "xlsx";
import {
  X,
  FileSpreadsheet,
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
} from "lucide-react";

import type { PayrollVerificationData } from "../../../api/payroll/payrollEntryApi";
import type { MappedEmployee } from "../../../views/hr/payroll-system/mapPayrollVerificationData";
import { MinimizableModal } from "../../../components/common/MinimizableModal";
import { Button } from "../../../components/ui/modal/formComponent";
import ModalTable from "../../../components/ui/Table/ModalTableInside";
import type { Column } from "../../../components/ui/Table/type";

// ─── Props ────────────────────────────────────────────────────────────────────

interface PayrollPreviewModalProps {
  modalId: string;
  isOpen: boolean;
  onClose: () => void;
  rawData: PayrollVerificationData | null;
  loading?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Data builder ─────────────────────────────────────────────────────────────

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
      branch: slip.branch ?? null,
      salaryStructure: slip.salary_structure ?? "—",
      status: slip.status ?? "—",
      isError,
      errorMessage: isError ? (slip.error_message ?? null) : null,
      totalWorkingDays: slip.total_working_days ?? 0,
      paymentDays: slip.payment_days ?? 0,
      leaveWithoutPay: slip.leave_without_pay ?? 0,
      absentDays: slip.absent_days ?? 0,
      // base_ fields — direct from API, zero frontend calculation
      gross: slip.base_gross_pay ?? slip.gross_pay ?? 0,
      totalDeductions: slip.base_total_deduction ?? slip.total_deduction ?? 0,
      netPay: slip.base_rounded_total ?? slip.net_payable ?? 0,
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
      <p className="text-[9px] font-extrabold uppercase tracking-wider text-muted mb-0.5 leading-none">
        {label}
      </p>
      <p
        className={`text-sm font-extrabold tabular-nums leading-tight truncate ${valueClass}`}
      >
        {value}
      </p>
      {sub && <p className="text-[10px] text-muted mt-0.5 truncate">{sub}</p>}
    </div>
  </div>
);

// ─── Salary Slip Drawer ────────────────────────────────────────────────────────

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
        className={`fixed top-0 right-0 bottom-0 z-50 w-[440px] max-w-full bg-card border-l border-theme flex flex-col shadow-2xl transition-transform duration-200 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {!emp ? null : (
          <>
            {/* Header */}
            <div className="border-b border-theme px-5 py-4 flex-shrink-0">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-extrabold shrink-0 ${avatarBg(emp.id)}`}
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
                  className="shrink-0 w-8 h-8 rounded-lg border border-theme flex items-center justify-center text-muted hover:text-main hover:bg-app transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Meta pills */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {[
                  {
                    icon: <Calendar className="w-3 h-3" />,
                    label: `${emp.paymentDays} pay days`,
                  },
                  emp.leaveWithoutPay > 0 && {
                    icon: <AlertCircle className="w-3 h-3" />,
                    label: `LWP: ${emp.leaveWithoutPay}`,
                  },
                  emp.absentDays > 0 && {
                    icon: <AlertCircle className="w-3 h-3" />,
                    label: `Absent: ${emp.absentDays}`,
                  },
                  emp.salaryStructure !== "—" && {
                    icon: <ReceiptText className="w-3 h-3" />,
                    label: emp.salaryStructure,
                  },
                  emp.branch && {
                    icon: <Building2 className="w-3 h-3" />,
                    label: emp.branch,
                  },
                ]
                  .filter(Boolean)
                  .map((item: any, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 text-[10px] font-semibold text-muted bg-app border border-theme rounded-full px-2 py-0.5"
                    >
                      {item.icon} {item.label}
                    </span>
                  ))}
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-bold rounded-full px-2 py-0.5 ${
                    emp.isError
                      ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                      : "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                  }`}
                >
                  {emp.isError ? (
                    <AlertCircle className="w-3 h-3" />
                  ) : (
                    <CheckCircle2 className="w-3 h-3" />
                  )}
                  {emp.status}
                </span>
              </div>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto">
              {emp.isError && emp.errorMessage && (
                <div className="m-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex gap-2 items-start">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-red-700 dark:text-red-400 leading-snug">
                    {emp.errorMessage}
                  </p>
                </div>
              )}

              {(emp.ctc > 0 || emp.annualTaxable > 0) && (
                <div className="px-5 py-4 border-b border-theme">
                  <p className="text-[9px] font-extrabold uppercase tracking-wider text-muted mb-3">
                    Annual overview
                  </p>
                  <div className="space-y-2">
                    {emp.ctc > 0 && (
                      <div className="flex justify-between text-[12px]">
                        <span className="text-muted">CTC</span>
                        <span className="font-semibold text-main tabular-nums">
                          {fmtMoney(emp.ctc, currency)}
                        </span>
                      </div>
                    )}
                    {emp.annualTaxable > 0 && (
                      <div className="flex justify-between text-[12px]">
                        <span className="text-muted">
                          Annual taxable amount
                        </span>
                        <span className="font-semibold text-main tabular-nums">
                          {fmtMoney(emp.annualTaxable, currency)}
                        </span>
                      </div>
                    )}
                    {emp.currentMonthTax > 0 && (
                      <div className="flex justify-between text-[12px]">
                        <span className="text-muted">
                          Income tax this month
                        </span>
                        <span className="font-semibold text-danger tabular-nums">
                          {fmtMoney(emp.currentMonthTax, currency)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {emp.earnings.length > 0 && (
                <div className="px-5 py-4 border-b border-theme">
                  <div className="flex items-center gap-1.5 mb-3">
                    <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
                    <p className="text-[9px] font-extrabold uppercase tracking-wider text-muted">
                      Earnings
                    </p>
                  </div>
                  {emp.earnings.map((e, i) => (
                    <div
                      key={e.abbr || i}
                      className="flex justify-between items-center py-2 border-b border-theme last:border-0"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[9px] font-bold bg-app border border-theme rounded px-1.5 py-0.5 text-muted font-mono shrink-0">
                          {e.abbr}
                        </span>
                        <span className="text-[12px] text-muted truncate">
                          {e.salary_component}
                        </span>
                        {!!e.is_flexible_benefit && (
                          <span className="text-[9px] font-semibold text-blue-500 bg-blue-50 dark:bg-blue-900/20 rounded px-1">
                            Flex
                          </span>
                        )}
                        {!e.is_tax_applicable && (
                          <span className="text-[9px] font-semibold text-muted bg-app border border-theme rounded px-1">
                            Non-tax
                          </span>
                        )}
                      </div>
                      <span className="text-[12px] font-semibold text-main tabular-nums ml-4 shrink-0">
                        {fmtMoney(e.amount ?? 0, currency)}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center mt-2 pt-2 border-t-2 border-theme">
                    <span className="text-[11px] font-extrabold text-main">
                      Gross pay
                    </span>
                    <span className="text-[13px] font-extrabold text-main tabular-nums">
                      {fmtMoney(emp.gross, currency)}
                    </span>
                  </div>
                </div>
              )}

              {emp.deductions.length > 0 && (
                <div className="px-5 py-4 border-b border-theme">
                  <div className="flex items-center gap-1.5 mb-3">
                    <ArrowDownRight className="w-3.5 h-3.5 text-red-500" />
                    <p className="text-[9px] font-extrabold uppercase tracking-wider text-muted">
                      Deductions
                    </p>
                  </div>
                  {emp.deductions.map((d, i) => (
                    <div
                      key={d.abbr || i}
                      className="flex justify-between items-center py-2 border-b border-theme last:border-0"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[9px] font-bold bg-app border border-theme rounded px-1.5 py-0.5 text-muted font-mono shrink-0">
                          {d.abbr}
                        </span>
                        <span className="text-[12px] text-muted truncate">
                          {d.salary_component}
                        </span>
                        {!!d.variable_based_on_taxable_salary && (
                          <span className="text-[9px] font-semibold text-amber-600 bg-amber-50 dark:bg-amber-900/20 rounded px-1">
                            Variable
                          </span>
                        )}
                      </div>
                      <span className="text-[12px] font-semibold text-danger tabular-nums ml-4 shrink-0">
                        −{fmtMoney(d.amount ?? 0, currency)}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center mt-2 pt-2 border-t-2 border-theme">
                    <span className="text-[11px] font-extrabold text-danger">
                      Total deductions
                    </span>
                    <span className="text-[13px] font-extrabold text-danger tabular-nums">
                      −{fmtMoney(emp.totalDeductions, currency)}
                    </span>
                  </div>
                </div>
              )}

              <div className="px-5 py-4">
                <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-0.5">
                      Net payable
                    </p>
                    {emp.totalInWords && (
                      <p className="text-[10px] text-emerald-700/70 dark:text-emerald-400/70 leading-snug max-w-[220px]">
                        {emp.totalInWords}
                      </p>
                    )}
                  </div>
                  <p className="text-xl font-extrabold text-emerald-700 dark:text-emerald-400 tabular-nums">
                    {emp.isError ? "—" : fmtMoney(emp.netPay, currency)}
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
  const currency = rawData?.currency ?? "INR";

  const employees = useMemo(
    () => (rawData ? buildEmployees(rawData) : []),
    [rawData],
  );

  // Totals: directly from API financial_summary
  const totalGross = rawData?.financial_summary?.total_gross_payable ?? 0;
  const totalDeductions = rawData?.financial_summary?.total_deduction ?? 0;
  const totalNet = rawData?.financial_summary?.total_net_payable ?? 0;
  const employeeCount =
    rawData?.financial_summary?.employee_count ??
    rawData?.number_of_employees ??
    employees.length;

  // Drawer
  const [selectedEmp, setSelectedEmp] = useState<MappedEmployee | null>(null);

  // Sort state for ModalTable
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

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

  // Month label
  const monthLabel = useMemo(() => {
    if (!rawData?.start_date) return rawData?.name ?? "Payroll";
    return new Date(rawData.start_date + "T00:00:00").toLocaleString("en-IN", {
      month: "long",
      year: "numeric",
    });
  }, [rawData]);

  // ── ModalTable columns definition ────────────────────────────────────────
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

  // Sorted data for ModalTable (ModalTable doesn't sort internally without server-side)
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

  // Excel export
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

    const header = [
      "ID",
      "Name",
      "Department",
      "Designation",
      "Work Days",
      "Paid Days",
      "LWP",
      ...earningCols.map(([, label]) => label),
      "Gross Pay",
      ...deductionCols.map(([, label]) => label),
      "Total Deductions",
      "Net Pay",
      "Salary Structure",
    ];

    const rows = employees.map((e) => [
      e.id,
      e.name,
      e.department,
      e.designation,
      e.totalWorkingDays,
      e.paymentDays,
      e.leaveWithoutPay,
      ...earningCols.map(([abbr]) => e.components[abbr] ?? 0),
      e.gross,
      ...deductionCols.map(([abbr]) => e.components[abbr] ?? 0),
      e.totalDeductions,
      e.netPay,
      e.salaryStructure,
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
    ];

    const ws = XLSX.utils.aoa_to_sheet([header, ...rows, [], totalRow]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, monthLabel.slice(0, 31));
    XLSX.writeFile(wb, `payroll_${rawData.name ?? "export"}.xlsx`);
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
        <div className="flex flex-col gap-3 pb-2 relative">
          {/* ── Info bar ── */}
          <div className="bg-card border border-theme rounded-xl px-4 py-2.5 flex flex-wrap items-center gap-x-5 gap-y-1.5">
            {[
              // rawData.company                 && { label: "Company",     value: rawData.company },
              rawData.posting_date && {
                label: "Post date",
                value: rawData.posting_date,
              },
              rawData.currency && {
                label: "Currency",
                value: rawData.currency,
              },
              // rawData.cost_center             && { label: "Cost center", value: rawData.cost_center },
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
                <div key={item.label} className="flex items-center gap-1.5">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-muted">
                    {item.label}
                  </span>
                  <span className="text-[11px] font-semibold text-main">
                    {item.value}
                  </span>
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

          {/* ── Export button ── */}
          <div className="flex justify-end">
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

          {/* ── ModalTable ── */}
          <ModalTable<MappedEmployee>
            tableId="payroll-preview-table"
            columns={columns}
            data={sortedEmployees}
            rowKey={(emp) => emp.id}
            loading={loading}
            emptyMessage="No employees found"
            onRowClick={(emp) => setSelectedEmp(emp)}
            showToolbar
            toolbarPlaceholder="Search name, ID, dept…"
            defaultVisibleKeys={columns.map((c) => c.key)}
            enableExport={false}
            enableColumnSelector={true}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={handleSortChange}
            totalItems={employees.length}
            bodyMaxHeight={420}
          />
        </div>
      )}

      {/* Salary slip drawer */}
      <SlipDrawer
        emp={selectedEmp}
        currency={currency}
        onClose={() => setSelectedEmp(null)}
      />
    </MinimizableModal>
  );
};

export default PayrollPreviewModal;
