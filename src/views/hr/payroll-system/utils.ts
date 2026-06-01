// utils.ts — Pure payroll calculation functions. No hardcoded/demo data.
// All inputs come from API responses via props or function arguments.

import type {
  Employee, PayrollRecord, AttendanceRecord, LeaveRecord,
  Arrear, Bonus, ValidationIssue, ValidationResult,
} from "../../../types/payrolltypes";
import {
  TAX_SLABS_OLD, TAX_SLABS_NEW,
  PF_RATE, ESI_RATE, ESI_EMPLOYER_RATE,
  PROFESSIONAL_TAX, STANDARD_DEDUCTION,
  OVERTIME_RATE_PER_HOUR, ESI_ELIGIBILITY_LIMIT,
} from "./constants";

// ─────────────────────────────────────────────────────────────────────────────
// FORMATTING
// ─────────────────────────────────────────────────────────────────────────────
export const fmtINR = (n: number) => n.toLocaleString("en-IN");

export const toWords = (n: number): string => {
  if (n === 0) return "Zero Rupees Only";
  const ones = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine",
    "Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
  const tens = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
  const conv = (num: number): string => {
    if (num < 20)       return ones[num];
    if (num < 100)      return tens[Math.floor(num/10)] + (num%10 ? " " + ones[num%10] : "");
    if (num < 1000)     return ones[Math.floor(num/100)] + " Hundred" + (num%100 ? " " + conv(num%100) : "");
    if (num < 100000)   return conv(Math.floor(num/1000)) + " Thousand" + (num%1000 ? " " + conv(num%1000) : "");
    if (num < 10000000) return conv(Math.floor(num/100000)) + " Lakh" + (num%100000 ? " " + conv(num%100000) : "");
    return conv(Math.floor(num/10000000)) + " Crore" + (num%10000000 ? " " + conv(num%10000000) : "");
  };
  return conv(n) + " Rupees Only";
};

// ─────────────────────────────────────────────────────────────────────────────
// TAX CALCULATION
// ─────────────────────────────────────────────────────────────────────────────
export const calculateTax = (
  annualIncome: number,
  regime: "Old" | "New",
  investments = 0,
): number => {
  const slabs = regime === "Old" ? TAX_SLABS_OLD : TAX_SLABS_NEW;
  let taxable = annualIncome - STANDARD_DEDUCTION;
  if (regime === "Old") taxable -= investments;
  taxable = Math.max(0, taxable);

  let tax = 0, rem = taxable;
  for (const slab of slabs) {
    const inc = Math.min(rem, slab.max - slab.min);
    if (inc > 0) { tax += (inc * slab.rate) / 100; rem -= inc; }
    if (rem <= 0) break;
  }
  return Math.round((tax * 1.04) / 12); // monthly TDS + 4% cess
};

// ─────────────────────────────────────────────────────────────────────────────
// ATTENDANCE CALCULATIONS (pure — pass data in, no imports from constants)
// ─────────────────────────────────────────────────────────────────────────────
export const calculatePaidDays = (
  employeeId: string,
  attendance: AttendanceRecord[],
  leaves: LeaveRecord[],
): { workingDays: number; paidDays: number; absentDays: number; leaveDays: number } => {
  const att = attendance.find(a => a.employeeId === employeeId);
  if (!att) return { workingDays: 22, paidDays: 22, absentDays: 0, leaveDays: 0 };

  const empLeaves   = leaves.filter(l => l.employeeId === employeeId && l.status === "Approved");
  const paidLeaves  = empLeaves.filter(l => l.isPaid).reduce((s, l) => s + l.days, 0);
  const unpaidDays  = empLeaves.filter(l => !l.isPaid).reduce((s, l) => s + l.days, 0);
  const workingDays = att.totalDays - att.weeklyOffs - att.holidays;
  const paidDays    = att.presentDays + paidLeaves - att.halfDays * 0.5;
  return {
    workingDays,
    paidDays:   Math.round(paidDays),
    absentDays: att.absentDays,
    leaveDays:  unpaidDays,
  };
};

export const calculateOvertimePay = (
  employeeId: string,
  attendance: AttendanceRecord[],
): number => {
  const att = attendance.find(a => a.employeeId === employeeId);
  return att ? att.overtimeHours * OVERTIME_RATE_PER_HOUR : 0;
};

export const calculateDeductions = (record: PayrollRecord): number =>
  record.taxDeduction + record.pfDeduction + record.esiDeduction +
  record.professionalTax + record.loanDeduction + record.advanceDeduction + record.otherDeductions;

// ─────────────────────────────────────────────────────────────────────────────
// PAYROLL RECORD GENERATION
// All data is passed in — no magic constants or demo arrays
// ─────────────────────────────────────────────────────────────────────────────
export const generatePayrollRecord = (
  emp: Employee,
  status: PayrollRecord["status"] = "Draft",
  attendance: AttendanceRecord[] = [],
  leaves: LeaveRecord[] = [],
  arrears: Arrear[] = [],
  bonuses: Bonus[] = [],
): PayrollRecord => {
  const { workingDays, paidDays, absentDays, leaveDays } = calculatePaidDays(emp.id, attendance, leaves);

  const safeDivisor        = workingDays > 0 ? workingDays : 1;
  const proratedBasic      = Math.round((emp.basicSalary / safeDivisor) * paidDays);
  const proratedHRA        = Math.round((emp.hra / safeDivisor) * paidDays);
  const proratedAllowances = Math.round((emp.allowances / safeDivisor) * paidDays);
  const overtimePay        = calculateOvertimePay(emp.id, attendance);

  const totalArrears = arrears.reduce((s, a) => s + a.amount, 0);
  const totalBonus   = bonuses.filter(b => b.approved).reduce((s, b) => s + b.amount, 0);

  const grossSalary = proratedBasic + proratedHRA + proratedAllowances;
  const grossPay    = grossSalary + totalArrears + totalBonus + overtimePay;

  const annualIncome = (emp.basicSalary + emp.hra + emp.allowances) * 12;
  const regime       = emp.taxStatus === "New Regime" ? "New" : "Old";
  const taxDeduction = calculateTax(annualIncome, regime);
  const pfDeduction  = Math.round(proratedBasic * PF_RATE);
  const esiDeduction = grossSalary <= ESI_ELIGIBILITY_LIMIT ? Math.round(grossSalary * ESI_RATE) : 0;
  const otherDeductions = emp.otherDeductions ?? 0;

  const totalDeductions = taxDeduction + pfDeduction + esiDeduction + PROFESSIONAL_TAX + otherDeductions;
  const netPay = grossPay - totalDeductions;

  return {
    id:           `PAY-${emp.id}-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    employeeId:   emp.id,
    employeeName: emp.name,
    email:        emp.email,
    department:   emp.department,
    designation:  emp.designation,
    grade:        emp.grade,
    joiningDate:  emp.joiningDate,
    pfNumber:     emp.pfNumber,
    panNumber:    emp.panNumber,
    bankAccount:  emp.bankAccount,
    ifscCode:     emp.ifscCode,
    taxRegime:    regime,
    workingDays,
    paidDays,
    absentDays,
    leaveDays,
    basicSalary:     proratedBasic,
    hra:             proratedHRA,
    allowances:      proratedAllowances,
    overtimePay,
    arrears:         totalArrears,
    totalBonus,
    grossPay,
    taxDeduction,
    pfDeduction,
    esiDeduction,
    professionalTax: PROFESSIONAL_TAX,
    loanDeduction:   emp.loanDeduction ?? 0,
    advanceDeduction: emp.advanceDeduction ?? 0,
    otherDeductions,
    netPay,
    status,
    paymentDate: "",
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// RECALCULATE (after manual edits in the Edit modal)
// ─────────────────────────────────────────────────────────────────────────────
export const recalculatePayroll = (record: PayrollRecord): PayrollRecord => {
  const grossPay = record.basicSalary + record.hra + record.allowances +
    record.overtimePay + record.totalBonus + record.arrears;

  const annualIncome = (record.basicSalary + record.hra + record.allowances) * 12;
  const taxDeduction = calculateTax(annualIncome, record.taxRegime);
  const pfDeduction  = Math.round(record.basicSalary * PF_RATE);
  const esiDeduction = grossPay <= ESI_ELIGIBILITY_LIMIT ? Math.round(grossPay * ESI_RATE) : 0;

  const totalDed = taxDeduction + pfDeduction + esiDeduction +
    record.professionalTax + record.loanDeduction + record.advanceDeduction + record.otherDeductions;

  return { ...record, grossPay, taxDeduction, pfDeduction, esiDeduction, netPay: grossPay - totalDed };
};

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION ENGINE
// ─────────────────────────────────────────────────────────────────────────────
export const runPayrollValidation = (
  records: PayrollRecord[],
  attendance: AttendanceRecord[] = [],
): ValidationResult => {
  const issues: ValidationIssue[] = [];

  const issue = (i: ValidationIssue) => issues.push(i);

  for (const r of records) {
    if (!r.bankAccount || r.bankAccount.trim() === "") {
      issue({ id: "BANK-001", employeeId: r.employeeId, employeeName: r.employeeName, department: r.department,
        category: "banking", severity: "error", code: "BANK-001",
        title: "Bank Account Missing",
        description: `No bank account on record for ${r.employeeName}. Payment cannot be processed.`,
        field: "bankAccount", suggestedAction: "Add bank account in Employee Master.",
        canProceed: false });
    } else if (!/^\d{9,18}$/.test(r.bankAccount.replace(/\s/g, ""))) {
      issue({ id: "BANK-002", employeeId: r.employeeId, employeeName: r.employeeName, department: r.department,
        category: "banking", severity: "warning", code: "BANK-002",
        title: "Invalid Bank Account Format",
        description: `Bank account "${r.bankAccount}" does not match required format (9–18 digits).`,
        field: "bankAccount", suggestedAction: "Verify and correct the bank account number.",
        canProceed: false });
    }

    if (!r.ifscCode || r.ifscCode.trim() === "") {
      issue({ id: "BANK-003", employeeId: r.employeeId, employeeName: r.employeeName, department: r.department,
        category: "banking", severity: "error", code: "BANK-003",
        title: "IFSC Code Missing",
        description: `IFSC code is missing for ${r.employeeName}. Required for NEFT transfer.`,
        field: "ifscCode", suggestedAction: "Add IFSC code in Employee Master.",
        canProceed: false });
    } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(r.ifscCode)) {
      issue({ id: "BANK-004", employeeId: r.employeeId, employeeName: r.employeeName, department: r.department,
        category: "banking", severity: "warning", code: "BANK-004",
        title: "IFSC Code Format Mismatch",
        description: `IFSC "${r.ifscCode}" may not be in the standard format (e.g. HDFC0001234).`,
        field: "ifscCode", suggestedAction: "Verify IFSC code with the bank.",
        canProceed: true });
    }

    if (!r.pfNumber || r.pfNumber.trim() === "") {
      issue({ id: "COMP-001", employeeId: r.employeeId, employeeName: r.employeeName, department: r.department,
        category: "compliance", severity: "error", code: "COMP-001",
        title: "PF Number Missing",
        description: `PF account number is not registered for ${r.employeeName}. Statutory compliance at risk.`,
        field: "pfNumber", suggestedAction: "Register employee with EPFO and update PF number.",
        canProceed: false });
    }

    if (!r.panNumber || r.panNumber.trim() === "") {
      issue({ id: "TAX-001", employeeId: r.employeeId, employeeName: r.employeeName, department: r.department,
        category: "tax", severity: "error", code: "TAX-001",
        title: "PAN Number Missing",
        description: `PAN card details missing. TDS at 20% (Sec 206AA) will apply.`,
        field: "panNumber", suggestedAction: "Collect PAN card copy and update in system.",
        canProceed: true });
    } else if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(r.panNumber)) {
      issue({ id: "TAX-002", employeeId: r.employeeId, employeeName: r.employeeName, department: r.department,
        category: "tax", severity: "warning", code: "TAX-002",
        title: "Invalid PAN Format",
        description: `PAN "${r.panNumber}" does not match the standard 10-character format.`,
        field: "panNumber", suggestedAction: "Re-verify PAN details with employee.",
        canProceed: true });
    }

    // Attendance check
    const att = attendance.find(a => a.employeeId === r.employeeId);
    if (!att) {
      issue({ id: "ATT-001", employeeId: r.employeeId, employeeName: r.employeeName, department: r.department,
        category: "attendance", severity: "warning", code: "ATT-001",
        title: "Attendance Not Finalized",
        description: `Attendance records for ${r.employeeName} not found. Payroll will use default 22 paid days.`,
        suggestedAction: "Lock and submit attendance before payroll run.",
        canProceed: true });
    } else {
      if (r.leaveDays > 5) {
        issue({ id: "ATT-002", employeeId: r.employeeId, employeeName: r.employeeName, department: r.department,
          category: "attendance", severity: "warning", code: "ATT-002",
          title: "High LWP Days",
          description: `${r.employeeName} has ${r.leaveDays} LWP days. Verify this is correct.`,
          suggestedAction: "Confirm with HR manager before processing.",
          canProceed: true });
      }
      if (r.paidDays > r.workingDays) {
        issue({ id: "ATT-004", employeeId: r.employeeId, employeeName: r.employeeName, department: r.department,
          category: "attendance", severity: "error", code: "ATT-004",
          title: "Paid Days Exceed Working Days",
          description: `Paid days (${r.paidDays}) cannot exceed working days (${r.workingDays}).`,
          suggestedAction: "Correct attendance records immediately.",
          canProceed: false });
      }
    }

    if (r.netPay <= 0) {
      issue({ id: "SAL-001", employeeId: r.employeeId, employeeName: r.employeeName, department: r.department,
        category: "salary", severity: "error", code: "SAL-001",
        title: "Negative / Zero Net Pay",
        description: `Net pay for ${r.employeeName} is ${r.netPay.toLocaleString()}. Deductions exceed gross.`,
        suggestedAction: "Review loan/advance deductions for this month.",
        canProceed: false });
    }

    if (r.basicSalary <= 0) {
      issue({ id: "SAL-002", employeeId: r.employeeId, employeeName: r.employeeName, department: r.department,
        category: "salary", severity: "error", code: "SAL-002",
        title: "Zero Basic Salary",
        description: `Basic salary is 0 for ${r.employeeName}. Salary structure may be missing.`,
        suggestedAction: "Assign a salary structure in the system.",
        canProceed: false });
    }

    if (!r.taxRegime) {
      issue({ id: "TAX-003", employeeId: r.employeeId, employeeName: r.employeeName, department: r.department,
        category: "tax", severity: "warning", code: "TAX-003",
        title: "Tax Regime Not Declared",
        description: `${r.employeeName} has not declared tax regime. Defaulting to New Regime.`,
        suggestedAction: "Request employee to submit IT declaration form.",
        canProceed: true });
    }
  }

  const errors   = issues.filter(i => i.severity === "error");
  const warnings = issues.filter(i => i.severity === "warning");
  const infos    = issues.filter(i => i.severity === "info");
  const blockers = errors.filter(i => !i.canProceed);

  return {
    isValid:    errors.length === 0,
    canProceed: blockers.length === 0,
    errors,
    warnings,
    infos,
    summary: {
      totalChecked: records.length,
      totalIssues:  issues.length,
      blockers:     blockers.length,
      warnings:     warnings.length,
      infos:        infos.length,
    },
  };
};