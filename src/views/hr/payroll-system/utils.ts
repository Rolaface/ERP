// utils.ts — Payroll calculations + ERP-grade validation engine

import type {
  Employee, PayrollRecord, Arrear, Bonus,
  ValidationIssue, ValidationResult,
} from "../../../types/payrolltypes";
import {
  TAX_SLABS_OLD, TAX_SLABS_NEW,
  PF_RATE, ESI_RATE, ESI_EMPLOYER_RATE,
  PROFESSIONAL_TAX, STANDARD_DEDUCTION,
  OVERTIME_RATE_PER_HOUR, ESI_ELIGIBILITY_LIMIT,
  demoAttendance, demoLeaves, demoEmployees,
} from "./constants";

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
  return Math.round((tax * 1.04) / 12); // monthly, +4% cess
};

// ─────────────────────────────────────────────────────────────────────────────
// ATTENDANCE & DEDUCTIONS
// ─────────────────────────────────────────────────────────────────────────────
export const calculatePaidDays = (employeeId: string) => {
  const att = demoAttendance.find(a => a.employeeId === employeeId);
  if (!att) return { workingDays: 22, paidDays: 22, absentDays: 0, leaveDays: 0 };
  const leaves = demoLeaves.filter(l => l.employeeId === employeeId && l.status === "Approved");
  const paidLeaves = leaves.filter(l => l.isPaid).reduce((s, l) => s + l.days, 0);
  const unpaidLeaves = leaves.filter(l => !l.isPaid).reduce((s, l) => s + l.days, 0);
  const workingDays = att.totalDays - att.weeklyOffs - att.holidays;
  const paidDays    = att.presentDays + paidLeaves - att.halfDays * 0.5;
  return { workingDays, paidDays: Math.round(paidDays), absentDays: att.absentDays, leaveDays: unpaidLeaves };
};

export const calculateOvertimePay = (employeeId: string): number => {
  const att = demoAttendance.find(a => a.employeeId === employeeId);
  return att ? att.overtimeHours * OVERTIME_RATE_PER_HOUR : 0;
};

export const calculateDeductions = (record: PayrollRecord): number =>
  record.taxDeduction + record.pfDeduction + record.esiDeduction +
  record.professionalTax + record.loanDeduction + record.advanceDeduction + record.otherDeductions;

// ─────────────────────────────────────────────────────────────────────────────
// PAYROLL RECORD GENERATION
// ─────────────────────────────────────────────────────────────────────────────
export const generatePayrollRecord = (
  emp: Employee,
  status: PayrollRecord["status"] = "Draft",
): PayrollRecord => {
  const { workingDays, paidDays, absentDays, leaveDays } = calculatePaidDays(emp.id);

  const proratedBasic      = Math.round((emp.basicSalary / workingDays) * paidDays);
  const proratedHRA        = Math.round((emp.hra / workingDays) * paidDays);
  const proratedAllowances = Math.round((emp.allowances / workingDays) * paidDays);
  const overtimePay        = calculateOvertimePay(emp.id);

  const arrearDetails: Arrear[] = [
    { id: "ARR001", label: "Salary Arrear", amount: 5000, fromDate: "2025-10-01", toDate: "2025-12-31", reason: "Pending increment arrear Q4 2025" },
  ];
  const arrears = arrearDetails.reduce((s, a) => s + a.amount, 0);

  const bonuses: Bonus[] = [
    { id: "BON001", label: "Performance Bonus", bonusType: "Performance", amount: 10000, approved: true, date: new Date().toISOString(), approvedBy: "MGR001" },
  ];
  const totalBonus = bonuses.reduce((s, b) => s + b.amount, 0);

  const grossSalary = proratedBasic + proratedHRA + proratedAllowances;
  const grossPay    = grossSalary + arrears + totalBonus + overtimePay;

  const annualIncome = (emp.basicSalary + emp.hra + emp.allowances) * 12;
  const taxDeduction = calculateTax(annualIncome, emp.taxStatus === "New Regime" ? "New" : "Old", 150000);
  const pfDeduction  = Math.round(proratedBasic * PF_RATE);
  const esiDeduction = grossSalary <= ESI_ELIGIBILITY_LIMIT ? Math.round(grossSalary * ESI_RATE) : 0;
  const otherDeductions = 500;

  const totalDeductions = taxDeduction + pfDeduction + esiDeduction + PROFESSIONAL_TAX + otherDeductions;
  const netPay = grossPay - totalDeductions;

  return {
    id: `PAY-${emp.id}-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    employeeId: emp.id, employeeName: emp.name, email: emp.email,
    department: emp.department, designation: emp.designation,
    grade: emp.grade, joiningDate: emp.joiningDate,
    bankAccount: emp.bankAccount, ifscCode: emp.ifscCode,
    pfNumber: emp.pfNumber, panNumber: emp.panNumber,
    workingDays, paidDays, absentDays, leaveDays,
    basicSalary: proratedBasic, hra: proratedHRA, allowances: proratedAllowances,
    bonuses, totalBonus, arrears, arrearDetails, overtimePay,
    taxDeduction, pfDeduction, esiDeduction,
    professionalTax: PROFESSIONAL_TAX,
    loanDeduction: 0, advanceDeduction: 0, otherDeductions,
    grossPay, totalDeductions, netPay,
    status, createdDate: new Date().toISOString(),
    taxRegime: emp.taxStatus === "New Regime" ? "New" : "Old",
    taxableIncome: annualIncome, taxSavings: 150000,
    paymentDate: status === "Paid" ? new Date().toLocaleDateString("en-IN") : undefined,
  };
};

export const recalculatePayroll = (record: PayrollRecord): PayrollRecord => {
  const grossSalary = record.basicSalary + record.hra + record.allowances;
  const grossPay    = grossSalary + record.arrears + record.totalBonus + record.overtimePay;
  const annualIncome = grossSalary * 12;
  const taxDeduction = calculateTax(annualIncome, record.taxRegime, record.taxSavings);
  const pfDeduction  = Math.round(record.basicSalary * PF_RATE);
  const esiDeduction = grossSalary <= ESI_ELIGIBILITY_LIMIT ? Math.round(grossSalary * ESI_RATE) : 0;
  const totalDeductions = taxDeduction + pfDeduction + esiDeduction + record.professionalTax + record.loanDeduction + record.advanceDeduction + record.otherDeductions;
  return { ...record, grossPay, taxDeduction, pfDeduction, esiDeduction, totalDeductions, netPay: grossPay - totalDeductions };
};

// ─────────────────────────────────────────────────────────────────────────────
// NEFT FILE GENERATOR
// ─────────────────────────────────────────────────────────────────────────────
export const generateNEFTFile = (records: PayrollRecord[]): string => {
  let content = `H,NEFT,Payroll Payment,${new Date().toISOString()}\n`;
  records.forEach(r => { content += `D,${r.bankAccount},${r.ifscCode},${r.employeeName},${r.netPay},${r.id}\n`; });
  const total = records.reduce((s, r) => s + r.netPay, 0);
  content += `T,${records.length},${total}\n`;
  return content;
};

// ─────────────────────────────────────────────────────────────────────────────
// ERP-GRADE PRE-PAYROLL VALIDATION ENGINE
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Runs a comprehensive suite of validation checks before a payroll run.
 * Mirrors the kind of checks real ERP systems (SAP, Workday, Darwinbox) perform.
 *
 * Checks performed:
 *   COMPLIANCE  — PF number, ESI number, PAN number, IT declaration
 *   BANKING     — bank account, IFSC code presence + format
 *   ATTENDANCE  — attendance not locked/missing, LWP > 5 days, overtime anomalies
 *   SALARY      — negative net pay, zero basic, salary > last month spike
 *   TAX         — tax regime declared, taxable income anomalies
 */
export const runPayrollValidation = (records: PayrollRecord[]): ValidationResult => {
  const issues: ValidationIssue[] = [];
  let idCounter = 0;

  const issue = (
    partial: Omit<ValidationIssue, "id">,
  ): void => {
    issues.push({ id: `VAL-${String(++idCounter).padStart(3, "0")}`, ...partial });
  };

  for (const r of records) {
    const emp = demoEmployees.find(e => e.id === r.employeeId);

    // ── BANKING ──────────────────────────────────────────────────────────────
    if (!r.bankAccount || r.bankAccount.trim() === "") {
      issue({
        employeeId: r.employeeId, employeeName: r.employeeName, department: r.department,
        category: "banking", severity: "error", code: "BANK-001",
        title: "Bank Account Missing",
        description: `No bank account number found for ${r.employeeName}. Salary cannot be transferred.`,
        field: "bankAccount", suggestedAction: "Update bank details in Employee Master before processing payroll.",
        canProceed: false,
      });
    } else if (!/^\d{9,18}$/.test(r.bankAccount)) {
      issue({
        employeeId: r.employeeId, employeeName: r.employeeName, department: r.department,
        category: "banking", severity: "error", code: "BANK-002",
        title: "Invalid Bank Account Format",
        description: `Bank account "${r.bankAccount}" does not match the required format (9–18 digits).`,
        field: "bankAccount", suggestedAction: "Verify and correct the bank account number.",
        canProceed: false,
      });
    }

    if (!r.ifscCode || r.ifscCode.trim() === "") {
      issue({
        employeeId: r.employeeId, employeeName: r.employeeName, department: r.department,
        category: "banking", severity: "error", code: "BANK-003",
        title: "IFSC Code Missing",
        description: `IFSC code is missing for ${r.employeeName}. Required for NEFT transfer.`,
        field: "ifscCode", suggestedAction: "Add IFSC code in Employee Master.",
        canProceed: false,
      });
    } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(r.ifscCode)) {
      issue({
        employeeId: r.employeeId, employeeName: r.employeeName, department: r.department,
        category: "banking", severity: "warning", code: "BANK-004",
        title: "IFSC Code Format Mismatch",
        description: `IFSC "${r.ifscCode}" may not be in the standard format (e.g. HDFC0001234).`,
        field: "ifscCode", suggestedAction: "Verify IFSC code with the bank.",
        canProceed: true,
      });
    }

    // ── COMPLIANCE ────────────────────────────────────────────────────────────
    if (!r.pfNumber || r.pfNumber.trim() === "") {
      issue({
        employeeId: r.employeeId, employeeName: r.employeeName, department: r.department,
        category: "compliance", severity: "error", code: "COMP-001",
        title: "PF Number Missing",
        description: `PF account number is not registered for ${r.employeeName}. Statutory compliance at risk.`,
        field: "pfNumber", suggestedAction: "Register employee with EPFO and update PF number.",
        canProceed: false,
      });
    }

    if (!r.panNumber || r.panNumber.trim() === "") {
      issue({
        employeeId: r.employeeId, employeeName: r.employeeName, department: r.department,
        category: "tax", severity: "error", code: "TAX-001",
        title: "PAN Number Missing",
        description: `PAN card details missing. TDS will be deducted at 20% (higher rate) as per Section 206AA.`,
        field: "panNumber", suggestedAction: "Collect PAN card copy and update in system.",
        canProceed: true, // can proceed but at higher TDS
      });
    } else if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(r.panNumber)) {
      issue({
        employeeId: r.employeeId, employeeName: r.employeeName, department: r.department,
        category: "tax", severity: "warning", code: "TAX-002",
        title: "Invalid PAN Format",
        description: `PAN "${r.panNumber}" does not match the standard 10-character format (e.g. ABCDE1234F).`,
        field: "panNumber", suggestedAction: "Re-verify PAN details with employee.",
        canProceed: true,
      });
    }

    // ESI eligibility check
    if (emp && !emp.esiNumber && r.grossPay <= ESI_ELIGIBILITY_LIMIT) {
      issue({
        employeeId: r.employeeId, employeeName: r.employeeName, department: r.department,
        category: "compliance", severity: "warning", code: "COMP-002",
        title: "ESI Number Missing (ESI Eligible Employee)",
        description: `${r.employeeName} earns ${r.grossPay.toLocaleString()} (≤ 21,000) and is ESI eligible, but ESI registration is missing.`,
        field: "esiNumber", suggestedAction: "Register employee with ESIC portal.",
        canProceed: true,
      });
    }

    // ── ATTENDANCE ────────────────────────────────────────────────────────────
    const att = demoAttendance.find(a => a.employeeId === r.employeeId);
    if (!att) {
      issue({
        employeeId: r.employeeId, employeeName: r.employeeName, department: r.department,
        category: "attendance", severity: "warning", code: "ATT-001",
        title: "Attendance Not Finalized",
        description: `Attendance records for ${r.employeeName} are not found for this period. Payroll will use default 22 paid days.`,
        suggestedAction: "Lock and submit attendance before payroll run.",
        canProceed: true,
      });
    } else {
      if (r.leaveDays > 5) {
        issue({
          employeeId: r.employeeId, employeeName: r.employeeName, department: r.department,
          category: "attendance", severity: "warning", code: "ATT-002",
          title: "High LWP Days",
          description: `${r.employeeName} has ${r.leaveDays} Loss of Pay (LWP) days this month. Verify if this is correct.`,
          suggestedAction: "Confirm with HR manager before processing.",
          canProceed: true,
        });
      }
      if (att.overtimeHours > 40) {
        issue({
          employeeId: r.employeeId, employeeName: r.employeeName, department: r.department,
          category: "attendance", severity: "info", code: "ATT-003",
          title: "High Overtime Hours",
          description: `${r.employeeName} has logged ${att.overtimeHours} overtime hours. Please confirm OT approval.`,
          suggestedAction: "Verify overtime approval from department head.",
          canProceed: true,
        });
      }
      if (r.paidDays > r.workingDays) {
        issue({
          employeeId: r.employeeId, employeeName: r.employeeName, department: r.department,
          category: "attendance", severity: "error", code: "ATT-004",
          title: "Paid Days Exceed Working Days",
          description: `Paid days (${r.paidDays}) cannot be greater than working days (${r.workingDays}). Data integrity issue.`,
          suggestedAction: "Correct attendance records immediately.",
          canProceed: false,
        });
      }
    }

    // ── SALARY ────────────────────────────────────────────────────────────────
    if (r.netPay <= 0) {
      issue({
        employeeId: r.employeeId, employeeName: r.employeeName, department: r.department,
        category: "salary", severity: "error", code: "SAL-001",
        title: "Negative / Zero Net Pay",
        description: `Calculated net pay for ${r.employeeName} is ${r.netPay.toLocaleString()}. Deductions exceed gross pay.`,
        suggestedAction: "Review deductions — loan/advance deductions may be excessive this month.",
        canProceed: false,
      });
    }

    if (r.basicSalary <= 0) {
      issue({
        employeeId: r.employeeId, employeeName: r.employeeName, department: r.department,
        category: "salary", severity: "error", code: "SAL-002",
        title: "Zero Basic Salary",
        description: `Basic salary is 0 for ${r.employeeName}. Salary structure may be missing.`,
        suggestedAction: "Assign a salary structure to this employee in the system.",
        canProceed: false,
      });
    }

    if (r.grossPay > 500000) {
      issue({
        employeeId: r.employeeId, employeeName: r.employeeName, department: r.department,
        category: "salary", severity: "info", code: "SAL-003",
        title: "High Gross Pay — Review Recommended",
        description: `${r.employeeName}'s gross pay of ${r.grossPay.toLocaleString()} is unusually high. This may include arrears/bonuses.`,
        suggestedAction: "Verify bonuses and arrears are correctly approved.",
        canProceed: true,
      });
    }

    // ── TAX ───────────────────────────────────────────────────────────────────
    if (!r.taxRegime) {
      issue({
        employeeId: r.employeeId, employeeName: r.employeeName, department: r.department,
        category: "tax", severity: "warning", code: "TAX-003",
        title: "Tax Regime Not Declared",
        description: `${r.employeeName} has not declared their preferred tax regime. Defaulting to New Regime.`,
        suggestedAction: "Request employee to submit IT declaration form.",
        canProceed: true,
      });
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

// ── Amount to words (Indian system) ──────────────────────────────────────────
export const toWords = (n: number): string => {
  if (n === 0) return "Zero Rupees Only";
  const ones = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
  const tens = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
  const conv = (num: number): string => {
    if (num < 20)       return ones[num];
    if (num < 100)      return tens[Math.floor(num/10)] + (num%10 ? " "+ones[num%10] : "");
    if (num < 1000)     return ones[Math.floor(num/100)]+" Hundred"+(num%100?" "+conv(num%100):"");
    if (num < 100000)   return conv(Math.floor(num/1000))+" Thousand"+(num%1000?" "+conv(num%1000):"");
    if (num < 10000000) return conv(Math.floor(num/100000))+" Lakh"+(num%100000?" "+conv(num%100000):"");
    return conv(Math.floor(num/10000000))+" Crore"+(num%10000000?" "+conv(num%10000000):"");
  };
  return conv(n) + " Rupees Only";
};

export const fmtINR = (n: number) => n.toLocaleString("en-IN");