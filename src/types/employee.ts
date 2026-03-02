export interface EmployeeSummary {
  id: string;
  name: string;
  jobTitle: string;
  department: string;
  workLocation: string;
  status: string;
}
export interface Employee {
  id: string;
  status: string;
  identityInfo: IdentityInfo;
  personalInfo: PersonalInfo;
  contactInfo: ContactInfo;
  employmentInfo: EmploymentInfo;
  payrollInfo: PayrollInfo;
  documents: any[];
}

export interface ContactInfo {
  Email: string;
  workEmail: string;
  phoneNumber: string;
  alternatePhone: string;
  address: Address;
  emergencyContact: EmergencyContact;
}

export interface Address {
  street: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

export interface EmploymentInfo {
  employeeId: string;
  Department: string;
  JobTitle: string;
  reportingManager: string;
  EmployeeType: string;
  joiningDate: Date;
  probationPeriod: string;
  contractEndDate: Date;
  workLocation: string;
  workAddress: string;
  branchId: string;
  branchName: string;
  shift: string;
  weeklySchedule: WeeklySchedule;
}

export interface WeeklySchedule {
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
}

export interface IdentityInfo {
  NrcId: string;
  SocialSecurityNapsa: string;
  NhimaHealthInsurance: string;
  TpinId: string;
  verifiedFromSource: boolean;
}

export interface PayrollInfo {
  grossSalary: string;
  currency: string;
  paymentFrequency: string;
  paymentMethod: string;
  salaryBreakdown: SalaryBreakdown;
  statutoryDeductions: StatutoryDeductions;
  bankAccount: BankAccount;
}

export interface BankAccount {
  AccountNumber: string;
  AccountName: string;
  BankName: string;
  branchCode: string;
  AccountType: string;
}

export interface SalaryBreakdown {
  BasicSalary: string;
  HousingAllowance: string;
  TransportAllowance: string;
  MealAllowance: string;
  otherAllowances: string;
}

export interface StatutoryDeductions {
  napsaEmployeeRate: number;
  napsaEmployerRate: number;
  nhimaRate: number;
  payeAmount: number;
}

export interface PersonalInfo {
  FirstName: string;
  OtherNames: string;
  LastName: string;
  Dob: Date;
  Gender: string;
  Nationality: string;
  maritalStatus: string;
}

// ===============================
// UPDATE / WRITE MODEL
// ===============================

export interface UpdateEmployeePayload {
  id: string;

  // ===== Personal =====
  Email?: string;
  CompanyEmail?: string;
  MaritalStatus?: string;
  Nationality?: string;

  // ===== Contact =====
  PhoneNumber?: string;
  AlternatePhone?: string;

  // ===== Employment =====
  JobTitle?: string;
  EmployeeType?: string;
  Department?: string;
  reportingManager?: string;
  probationPeriod?: number;
  contractEndDate?: string;
  workLocation?: string;
  workAddress?: string;
  shift?: string;

  // ===== Bank =====
  AccountName?: string;
  AccountNumber?: string;
  BankName?: string;
  BranchCode?: string;
  AccountType?: string;

  // ===== Compliance =====
  NrcId?: string;
  TpinId?: string;
  SocialSecurityNapsa?: string;
  NhimaHealthInsurance?: string;
  verifiedFromSource?: number;

  // ===== Payroll =====
  currency?: string;
  PaymentFrequency?: string;
  GrossSalary?: number;
  BasicSalary?: number;
  HousingAllowance?: number;
  MealAllowance?: number;
  TransportAllowance?: number;
  otherAllowances?: number;

  // ===== Status =====
  status?: string;
}
