import type { PayrollVerificationData } from "../../api/payroll/payrollEntryApi";
import type { MappedEmployee } from "./mapPayrollVerificationData";

export const fmtMoney = (value: number, currencyCode: string): string => {
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

export const initials = (name: string) =>
  name.split(" ").filter(Boolean).map((n) => n[0]).join("").slice(0, 2).toUpperCase();

const AVATAR_PALETTE = [
  "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
  "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
];

export const avatarBg = (id: string) =>
  AVATAR_PALETTE[(id || "0").charCodeAt((id || "0").length - 1) % AVATAR_PALETTE.length];

export const tokenize = (raw: string): string[] =>
  raw.toLowerCase().split(/\s+/).map((t) => t.trim()).filter(Boolean);

export function employeeMatchesQuery(emp: MappedEmployee, tokens: string[]): boolean {
  if (tokens.length === 0) return true;
  const haystack = [emp.name, emp.id, emp.department, emp.designation, emp.branch ?? "", emp.salaryStructure]
    .join(" ")
    .toLowerCase();
  return tokens.every((token) => haystack.includes(token));
}

export function buildEmployees(raw: PayrollVerificationData): MappedEmployee[] {
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
    for (const e of slip.earnings ?? []) if (e?.abbr) components[e.abbr] = e.amount ?? 0;
    for (const d of slip.deductions ?? []) if (d?.abbr) components[d.abbr] = d.amount ?? 0;

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