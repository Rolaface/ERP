

import type { PayrollRecord, AttendanceRecord, ValidationIssue, ValidationResult } from "../../types/Payroll/payrolltypes";

type IssueInput = Omit<ValidationIssue, "employeeId" | "employeeName" | "department">;

function withRecord(record: PayrollRecord, issues: ValidationIssue[]) {
  return (input: IssueInput) => {
    issues.push({
      employeeId: record.employeeId,
      employeeName: record.employeeName,
      department: record.department,
      ...input,
    });
  };
}

function validateBanking(r: PayrollRecord, addIssue: (i: IssueInput) => void) {
  if (!r.bankAccount?.trim()) {
    addIssue({
      id: "BANK-001", category: "banking", severity: "error", code: "BANK-001",
      title: "Bank Account Missing",
      description: `No bank account on record for ${r.employeeName}. Payment cannot be processed.`,
      field: "bankAccount", suggestedAction: "Add bank account in Employee Master.",
      canProceed: false,
    });
  } else if (!/^\d{9,18}$/.test(r.bankAccount.replace(/\s/g, ""))) {
    addIssue({
      id: "BANK-002", category: "banking", severity: "warning", code: "BANK-002",
      title: "Invalid Bank Account Format",
      description: `Bank account "${r.bankAccount}" does not match required format (9–18 digits).`,
      field: "bankAccount", suggestedAction: "Verify and correct the bank account number.",
      canProceed: false,
    });
  }

  if (!r.ifscCode?.trim()) {
    addIssue({
      id: "BANK-003", category: "banking", severity: "error", code: "BANK-003",
      title: "IFSC Code Missing",
      description: `IFSC code is missing for ${r.employeeName}. Required for NEFT transfer.`,
      field: "ifscCode", suggestedAction: "Add IFSC code in Employee Master.",
      canProceed: false,
    });
  } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(r.ifscCode)) {
    addIssue({
      id: "BANK-004", category: "banking", severity: "warning", code: "BANK-004",
      title: "IFSC Code Format Mismatch",
      description: `IFSC "${r.ifscCode}" may not be in the standard format (e.g. HDFC0001234).`,
      field: "ifscCode", suggestedAction: "Verify IFSC code with the bank.",
      canProceed: true,
    });
  }
}

function validateCompliance(r: PayrollRecord, addIssue: (i: IssueInput) => void) {
  if (!r.pfNumber?.trim()) {
    addIssue({
      id: "COMP-001", category: "compliance", severity: "error", code: "COMP-001",
      title: "PF Number Missing",
      description: `PF account number is not registered for ${r.employeeName}. Statutory compliance at risk.`,
      field: "pfNumber", suggestedAction: "Register employee with EPFO and update PF number.",
      canProceed: false,
    });
  }
}

function validateTax(r: PayrollRecord, addIssue: (i: IssueInput) => void) {
  if (!r.panNumber?.trim()) {
    addIssue({
      id: "TAX-001", category: "tax", severity: "error", code: "TAX-001",
      title: "PAN Number Missing",
      description: "PAN card details missing. TDS at 20% (Sec 206AA) will apply.",
      field: "panNumber", suggestedAction: "Collect PAN card copy and update in system.",
      canProceed: true,
    });
  } else if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(r.panNumber)) {
    addIssue({
      id: "TAX-002", category: "tax", severity: "warning", code: "TAX-002",
      title: "Invalid PAN Format",
      description: `PAN "${r.panNumber}" does not match the standard 10-character format.`,
      field: "panNumber", suggestedAction: "Re-verify PAN details with employee.",
      canProceed: true,
    });
  }

  if (!r.taxRegime) {
    addIssue({
      id: "TAX-003", category: "tax", severity: "warning", code: "TAX-003",
      title: "Tax Regime Not Declared",
      description: `${r.employeeName} has not declared tax regime. Defaulting to New Regime.`,
      suggestedAction: "Request employee to submit IT declaration form.",
      canProceed: true,
    });
  }
}

function validateAttendance(r: PayrollRecord, attendance: AttendanceRecord[], addIssue: (i: IssueInput) => void) {
  const att = attendance.find((a) => a.employeeId === r.employeeId);

  if (!att) {
    addIssue({
      id: "ATT-001", category: "attendance", severity: "warning", code: "ATT-001",
      title: "Attendance Not Finalized",
      description: `Attendance records for ${r.employeeName} not found. Payroll will use default 22 paid days.`,
      suggestedAction: "Lock and submit attendance before payroll run.",
      canProceed: true,
    });
    return;
  }

  if (r.leaveDays > 5) {
    addIssue({
      id: "ATT-002", category: "attendance", severity: "warning", code: "ATT-002",
      title: "High LWP Days",
      description: `${r.employeeName} has ${r.leaveDays} LWP days. Verify this is correct.`,
      suggestedAction: "Confirm with HR manager before processing.",
      canProceed: true,
    });
  }

  if (r.paidDays > r.workingDays) {
    addIssue({
      id: "ATT-004", category: "attendance", severity: "error", code: "ATT-004",
      title: "Paid Days Exceed Working Days",
      description: `Paid days (${r.paidDays}) cannot exceed working days (${r.workingDays}).`,
      suggestedAction: "Correct attendance records immediately.",
      canProceed: false,
    });
  }
}

function validateSalary(r: PayrollRecord, addIssue: (i: IssueInput) => void) {
  if (r.netPay <= 0) {
    addIssue({
      id: "SAL-001", category: "salary", severity: "error", code: "SAL-001",
      title: "Negative / Zero Net Pay",
      description: `Net pay for ${r.employeeName} is ${r.netPay.toLocaleString()}. Deductions exceed gross.`,
      suggestedAction: "Review loan/advance deductions for this month.",
      canProceed: false,
    });
  }

  if (r.basicSalary <= 0) {
    addIssue({
      id: "SAL-002", category: "salary", severity: "error", code: "SAL-002",
      title: "Zero Basic Salary",
      description: `Basic salary is 0 for ${r.employeeName}. Salary structure may be missing.`,
      suggestedAction: "Assign a salary structure in the system.",
      canProceed: false,
    });
  }
}

export const runPayrollValidation = (
  records: PayrollRecord[],
  attendance: AttendanceRecord[] = [],
): ValidationResult => {
  const issues: ValidationIssue[] = [];

  for (const record of records) {
    const addIssue = withRecord(record, issues);
    validateBanking(record, addIssue);
    validateCompliance(record, addIssue);
    validateTax(record, addIssue);
    validateAttendance(record, attendance, addIssue);
    validateSalary(record, addIssue);
  }

  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");
  const infos = issues.filter((i) => i.severity === "info");
  const blockers = errors.filter((i) => !i.canProceed);

  return {
    isValid: errors.length === 0,
    canProceed: blockers.length === 0,
    errors,
    warnings,
    infos,
    summary: {
      totalChecked: records.length,
      totalIssues: issues.length,
      blockers: blockers.length,
      warnings: warnings.length,
      infos: infos.length,
    },
  };
};