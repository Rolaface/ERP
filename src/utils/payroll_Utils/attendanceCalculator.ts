// attendanceCalculator.ts — attendance → paid days / overtime. No tax or
// payroll-record knowledge here; keeps this reusable wherever only
// attendance numbers are needed.

import type { AttendanceRecord, LeaveRecord } from "../../types/Payroll/payrolltypes";
import { OVERTIME_RATE_PER_HOUR } from "./constants";

const DEFAULT_PAID_DAYS_FALLBACK = { workingDays: 22, paidDays: 22, absentDays: 0, leaveDays: 0 };

export const calculatePaidDays = (
  employeeId: string,
  attendance: AttendanceRecord[],
  leaves: LeaveRecord[],
): { workingDays: number; paidDays: number; absentDays: number; leaveDays: number } => {
  const att = attendance.find((a) => a.employeeId === employeeId);
  if (!att) return DEFAULT_PAID_DAYS_FALLBACK;

  const approvedLeaves = leaves.filter((l) => l.employeeId === employeeId && l.status === "Approved");
  const paidLeaves = approvedLeaves.filter((l) => l.isPaid).reduce((s, l) => s + l.days, 0);
  const unpaidDays = approvedLeaves.filter((l) => !l.isPaid).reduce((s, l) => s + l.days, 0);

  const workingDays = att.totalDays - att.weeklyOffs - att.holidays;
  const paidDays = att.presentDays + paidLeaves - att.halfDays * 0.5;

  return {
    workingDays,
    paidDays: Math.round(paidDays),
    absentDays: att.absentDays,
    leaveDays: unpaidDays,
  };
};

export const calculateOvertimePay = (employeeId: string, attendance: AttendanceRecord[]): number => {
  const att = attendance.find((a) => a.employeeId === employeeId);
  return att ? att.overtimeHours * OVERTIME_RATE_PER_HOUR : 0;
};