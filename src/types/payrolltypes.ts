export interface Employee {
  id: string;
  employeeId?: string;
  name: string;
  email?: string;
  status?: string;
  department: string;
  jobTitle?: string;
  workLocation?: string;
  grossSalary?: number;

  designation?: string;
  grade?: string;
  joiningDate?: string;
  bankAccount?: string;
  ifscCode?: string;
  pfNumber?: string;
  esiNumber?: string;
  panNumber?: string;
  taxStatus?: string;
  isActive: boolean;
  basicSalary?: number;
  hra?: number;
  allowances?: number;
  managerId?: string;
  branch?: string;
}

export interface AttendanceRecord {
  employeeId: string;
  month: string;
  year: number;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  weeklyOffs: number;
  holidays: number;
  paidLeaves: number;
  unpaidLeaves: number;
  halfDays: number;
  overtimeHours: number;
}

export interface LeaveRecord {
  id: string;
  employeeId: string;
  leaveType: "Casual" | "Sick" | "Earned" | "LWP" | "Maternity" | "Paternity";
  fromDate: string;
  toDate: string;
  days: number;
  status: "Pending" | "Approved" | "Rejected";
  reason: string;
  isPaid: boolean;
}

export interface Bonus {
  id: string;
  label: string;
  bonusType: "Performance" | "Festival" | "Retention" | "Referral" | "Project";
  amount: number;
  approved: boolean;
  date: string;
  approvedBy?: string;
}

export interface Arrear {
  id: string;
  label: string;
  amount: number;
  fromDate: string;
  toDate: string;
  reason: string;
}

export interface PayrollRecord {
  id: string;
  payrollName?: string;
  employeeId: string;
  employeeName: string;
  email: string;
  department: string;
  designation: string;
  grade: string;
  joiningDate: string;
  bankAccount: string;
  ifscCode: string;
  pfNumber: string;
  panNumber: string;

  // Attendance
  workingDays: number;
  paidDays: number;
  absentDays: number;
  leaveDays: number;

  // Earnings
  basicSalary: number;
  hra: number;
  allowances: number;
  bonuses?: Bonus[];
  totalBonus: number;
  arrears: number;
  arrearDetails?: Arrear[];
  overtimePay: number;

  // Deductions
  taxDeduction: number;
  pfDeduction: number;
  esiDeduction: number;
  professionalTax: number;
  loanDeduction: number;
  advanceDeduction: number;
  otherDeductions: number;

  // Calculations
  grossPay: number;
  totalDeductions: number;
  netPay: number;

  // Status
  status:
    | "Draft"
    | "Pending"
    | "Approved"
    | "Rejected"
    | "Processing"
    | "Paid"
    | "Failed";
  paymentDate?: string;
  createdDate: string;
  approvedBy?: string;
  approvedDate?: string;
  rejectionReason?: string;

  // Tax
  taxRegime: "Old" | "New";
  taxableIncome: number;
  taxSavings: number;
}

export interface PayrollEntry {
  postingDate: string;
  payrollName: string;
  currency: string;
  company: string;
  payrollPayableAccount: string;
  status: string;
  salarySlipTimesheet: boolean;
  deductTaxForProof: boolean;
  payrollFrequency: string;
  startDate: string;
  endDate: string;
  paymentAccount: string;
  costCenter: string;
  project: string;
  letterHead: string;
  selectedEmployees: string[];
  employeeSelectionMode?: "single" | "multiple";
  branch?: string;
  department?: string;
  designation?: string;
  grade?: string;
}

export type ValidationSeverity = "error" | "warning" | "info";

export interface ValidationIssue {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  category: "attendance" | "salary" | "compliance" | "banking" | "tax";
  severity: ValidationSeverity;
  code: string;
  title: string;
  description: string;
  field?: string;
  suggestedAction?: string;
  canProceed: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  canProceed: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  infos: ValidationIssue[];
  summary: {
    totalChecked: number;
    totalIssues: number;
    blockers: number;
    warnings: number;
    infos: number;
  };
}
