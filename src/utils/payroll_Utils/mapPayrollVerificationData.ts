// utils/payroll/mapPayrollVerificationData.ts
// ─────────────────────────────────────────────────────────────────────────────
// Pure mapping layer: PayrollVerificationData (API) → shapes the modal consumes.
// Self-contained — does NOT import from the modal component.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  PayrollVerificationData,
  VerificationEmployeeEntry,
} from "../../api/payroll/payrollEntryApi";

// ─── Output types (consumed by PayrollPreviewModal) ───────────────────────────

export interface MappedEmployee {
  leavesTakenThisMonth: number;
  yearToDate: number;
  incomeTaxDeductedTillDate: number;
  id:               string;
  name:             string;
  designation:      string;
  department:       string;
  gender:           string;
  branch:           string | null;
  salaryStructure:  string;
  status:           string;
  isError:          boolean;
  errorMessage:     string | null;
  // attendance
  totalWorkingDays: number;
  paymentDays:      number;
  leaveWithoutPay:  number;
  absentDays:       number;
  // financials
  gross:            number;
  totalDeductions:  number;
  netPay:           number;
  ctc:              number;
  annualTaxable:    number;
  currentMonthTax:  number;
  totalInWords:     string;
  // keyed by salary component abbr — includes both earnings and deductions
  components:       Record<string, number>;
  // raw arrays preserved for drill-down drawer
  earnings:         import("../../api/payroll/payrollEntryApi").VerificationSalaryComponent[];
  deductions:       import("../../api/payroll/payrollEntryApi").VerificationSalaryComponent[];
}

export interface MappedPayrollHeader {
  payrollId:             string;
  month:                 string;
  period:                string;
  postingDate:           string;
  currency:              string;
  company:               string;
  payrollPayableAccount: string;
  paymentAccount:        string;
  bankAccount:           string;
  costCenter?:           string;
  status:                string;
  payrollFrequency:      string;
}

export interface MappedPayrollVerification {
  header:    MappedPayrollHeader;
  employees: MappedEmployee[];
}

// ─── Employee mapper ──────────────────────────────────────────────────────────

function mapEmployee(entry: VerificationEmployeeEntry): MappedEmployee {
  const slip = entry.salary_slip_details ?? {
    employee:      entry.employee,
    employee_name: entry.employee_name,
    status:        "Error",
    error_message: "Salary slip details missing from payroll preview.",
    earnings:      [],
    deductions:    [],
  };

  const isError = slip.status === "Error";

  // Build flat components map from both earnings and deductions — keyed by abbr
  const components: Record<string, number> = {};
  for (const item of slip.earnings ?? []) {
    if (item?.abbr) components[item.abbr] = item.amount ?? 0;
  }
  for (const item of slip.deductions ?? []) {
    if (item?.abbr) components[item.abbr] = item.amount ?? 0;
  }

  return {
    id:               entry.employee        || "UNKNOWN",
    name:             entry.employee_name   || "Unknown",
    designation:      entry.designation     || slip.designation  || "—",
    department:       entry.department      || slip.department   || "—",
    branch:           slip.branch           ?? null,
    salaryStructure:  slip.salary_structure ?? "—",
    status:           slip.status           ?? "—",
    isError,
    errorMessage:     isError ? (slip.error_message ?? null) : null,
    totalWorkingDays: slip.total_working_days ?? 0,
    paymentDays:      slip.payment_days       ?? 0,
    leaveWithoutPay:  slip.leave_without_pay  ?? 0,
    absentDays:       slip.absent_days        ?? 0,
    gross:            slip.gross_pay          ?? 0,
    totalDeductions:  slip.total_deduction    ?? 0,
    netPay:           slip.net_payable ?? slip.rounded_total ?? 0,
    ctc:              slip.ctc                        ?? 0,
    annualTaxable:    slip.annual_taxable_amount      ?? 0,
    currentMonthTax:  slip.current_month_income_tax   ?? 0,
    totalInWords:     slip.total_in_words             ?? "",
    components,
    earnings:         slip.earnings   ?? [],
    deductions:       slip.deductions ?? [],
  };
}

// ─── Header mapper ────────────────────────────────────────────────────────────

function mapHeader(raw: PayrollVerificationData): MappedPayrollHeader {
  const month = raw.start_date
    ? new Date(raw.start_date + "T00:00:00").toLocaleString("en-IN", {
        month: "long",
        year:  "numeric",
      })
    : raw.name ?? "Payroll";

  return {
    payrollId:             raw.name                    ?? "—",
    month,
    period:                `${raw.start_date} → ${raw.end_date}`,
    postingDate:           raw.posting_date            ?? "—",
    currency:              raw.currency                ?? "INR",
    company:               raw.company                 ?? "—",
    payrollPayableAccount: raw.payroll_payable_account ?? "—",
    paymentAccount:        raw.payment_account         ?? "—",
    bankAccount:           raw.bank_account            ?? "—",
    costCenter:            raw.cost_center             ?? undefined,
    status:                raw.status                  ?? "—",
    payrollFrequency:      raw.payroll_frequency       ?? "—",
  };
}

// ─── Public export ────────────────────────────────────────────────────────────

export function mapPayrollVerificationData(
  raw: PayrollVerificationData,
): MappedPayrollVerification {
  return {
    header:    mapHeader(raw),
    employees: (raw.employees ?? []).map(mapEmployee),
  };
}