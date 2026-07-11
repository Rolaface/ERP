// payrollGenerator.ts — builds and recalculates PayrollRecord objects.
// All source data (employee, attendance, leaves, arrears, bonuses) is passed
// in — no demo/hardcoded data here.

import type { Employee, PayrollRecord, AttendanceRecord, LeaveRecord, Arrear, Bonus } from "../../types/Payroll/payrolltypes";
import { PF_RATE, ESI_RATE, PROFESSIONAL_TAX, ESI_ELIGIBILITY_LIMIT } from "./constants";
import { calculatePaidDays, calculateOvertimePay } from "./attendanceCalculator";
import { calculateTax } from "./taxCalculator";

const prorate = (amount: number, workingDays: number, paidDays: number): number => {
  const safeDivisor = workingDays > 0 ? workingDays : 1;
  return Math.round((amount / safeDivisor) * paidDays);
};

export const calculateDeductions = (record: PayrollRecord): number =>
  record.taxDeduction +
  record.pfDeduction +
  record.esiDeduction +
  record.professionalTax +
  record.loanDeduction +
  record.advanceDeduction +
  record.otherDeductions;

export const generatePayrollRecord = (
  emp: Employee,
  status: PayrollRecord["status"] = "Draft",
  attendance: AttendanceRecord[] = [],
  leaves: LeaveRecord[] = [],
  arrears: Arrear[] = [],
  bonuses: Bonus[] = [],
): PayrollRecord => {
  const { workingDays, paidDays, absentDays, leaveDays } = calculatePaidDays(emp.id, attendance, leaves);

  const proratedBasic = prorate(emp.basicSalary, workingDays, paidDays);
  const proratedHRA = prorate(emp.hra, workingDays, paidDays);
  const proratedAllowances = prorate(emp.allowances, workingDays, paidDays);
  const overtimePay = calculateOvertimePay(emp.id, attendance);

  const totalArrears = arrears.reduce((s, a) => s + a.amount, 0);
  const totalBonus = bonuses.filter((b) => b.approved).reduce((s, b) => s + b.amount, 0);

  const grossSalary = proratedBasic + proratedHRA + proratedAllowances;
  const grossPay = grossSalary + totalArrears + totalBonus + overtimePay;

  const annualIncome = (emp.basicSalary + emp.hra + emp.allowances) * 12;
  const regime = emp.taxStatus === "New Regime" ? "New" : "Old";
  const taxDeduction = calculateTax(annualIncome, regime);
  const pfDeduction = Math.round(proratedBasic * PF_RATE);
  const esiDeduction = grossSalary <= ESI_ELIGIBILITY_LIMIT ? Math.round(grossSalary * ESI_RATE) : 0;
  const otherDeductions = emp.otherDeductions ?? 0;

  const totalDeductions = taxDeduction + pfDeduction + esiDeduction + PROFESSIONAL_TAX + otherDeductions;

  return {
    id: `PAY-${emp.id}-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    employeeId: emp.id,
    employeeName: emp.name,
    email: emp.email,
    department: emp.department,
    designation: emp.designation,
    grade: emp.grade,
    joiningDate: emp.joiningDate,
    pfNumber: emp.pfNumber,
    panNumber: emp.panNumber,
    bankAccount: emp.bankAccount,
    ifscCode: emp.ifscCode,
    taxRegime: regime,
    workingDays,
    paidDays,
    absentDays,
    leaveDays,
    basicSalary: proratedBasic,
    hra: proratedHRA,
    allowances: proratedAllowances,
    overtimePay,
    arrears: totalArrears,
    totalBonus,
    grossPay,
    taxDeduction,
    pfDeduction,
    esiDeduction,
    professionalTax: PROFESSIONAL_TAX,
    loanDeduction: emp.loanDeduction ?? 0,
    advanceDeduction: emp.advanceDeduction ?? 0,
    otherDeductions,
    netPay: grossPay - totalDeductions,
    status,
    paymentDate: "",
  };
};

// Recalculate after manual edits in the Edit modal.
export const recalculatePayroll = (record: PayrollRecord): PayrollRecord => {
  const grossPay =
    record.basicSalary + record.hra + record.allowances + record.overtimePay + record.totalBonus + record.arrears;

  const annualIncome = (record.basicSalary + record.hra + record.allowances) * 12;
  const taxDeduction = calculateTax(annualIncome, record.taxRegime);
  const pfDeduction = Math.round(record.basicSalary * PF_RATE);
  const esiDeduction = grossPay <= ESI_ELIGIBILITY_LIMIT ? Math.round(grossPay * ESI_RATE) : 0;

  const totalDeductions =
    taxDeduction + pfDeduction + esiDeduction + record.professionalTax + record.loanDeduction +
    record.advanceDeduction + record.otherDeductions;

  return { ...record, grossPay, taxDeduction, pfDeduction, esiDeduction, netPay: grossPay - totalDeductions };
};