
export const TAB_ORDER = [
  "Personal",
  "Address & Contact",
  "Employment",
  "Leave Setup",
  "Compensation",
  "Work Schedule",
  "Documents",
] as const;

export type TabName = (typeof TAB_ORDER)[number];

// ─── Default form state ───────────────────────────────────────────────────────
export const DEFAULT_FORM: Record<string, any> = {
  // Personal
  firstName: "",
  middleName: "",
  lastName: "",
  dateOfBirth: "",
  gender: "",
  nationality: "",
  maritalStatus: "",

  // IDs
  nrcId: "",
  socialSecurityNapsa: "",
  nhimaHealthInsurance: "",
  tpinId: "",

  // Contact
  email: "",
  companyEmail: "",
  phoneNumber: "",
  alternatePhone: "",
  street: "",
  city: "",
  province: "",
  postalCode: "",
  country: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  emergencyContactRelationship: "",

  // Employment
  department: "",
  jobTitle: "",
  level: "",
  employmentStatus: "Actve",
  hrManager: "",
  reportingManager: "",
  employeeType: "",
  engagementDate: "",
  contractEndDate: "",
  workLocation: "",
  workAddress: "",
  probationPeriod: "",
  shift: "Day",

   // Compensation
   basicSalary: "",
   housingAllowance: "",
   housingAllowanceType: "amount",
   mealAllowance: "",
   mealAllowanceType: "amount",
   transportAllowance: "",
   transportAllowanceType: "amount",
   otherAllowances: "",
   otherAllowancesType: "",
   grossSalary: "",
   currency: "",
   paymentFrequency: "",
   paymentMethod: " ",
   accountName: "",
   accountNumber: "",
   bankName: "",
   branchCode: "",
   accountType: "Savings",
   ceilingAmount: "",
   ceilingYear: String(new Date().getFullYear()),

  // Leave
  leavePolicy: "",

  // Work Schedule
  weeklyScheduleMonday: "",
  weeklyScheduleTuesday: "",
  weeklyScheduleWednesday: "",
  weeklyScheduleThursday: "",
  weeklyScheduleFriday: "",
  weeklyScheduleSaturday: "",
  weeklyScheduleSunday: "",

  notes: "",
};

// ─── Map editData → formData ──────────────────────────────────────────────────
export function mapEditDataToForm(editData: any): Record<string, any> {
  return {
    firstName: editData.personalInfo?.FirstName || "",
    middleName: editData.personalInfo?.MiddleName || "",
    lastName: editData.personalInfo?.LastName || "",
    dateOfBirth: editData.personalInfo?.Dob || "",
    gender: editData.personalInfo?.Gender || "",
    nationality: editData.personalInfo?.Nationality || "",
    maritalStatus: editData.personalInfo?.maritalStatus || "",

    nrcId: editData.identityInfo?.nrc || "",
    socialSecurityNapsa: editData.identityInfo?.napsa || "",
    nhimaHealthInsurance: editData.identityInfo?.nhima || "",
    tpinId: editData.identityInfo?.tpin || "",

    email: editData.contactInfo?.Email || "",
    companyEmail: editData.contactInfo?.workEmail || "",
    phoneNumber: editData.contactInfo?.phoneNumber || "",
    alternatePhone: editData.contactInfo?.alternatePhone || "",
    street: editData.contactInfo?.address?.street || "",
    city: editData.contactInfo?.address?.city || "",
    province: editData.contactInfo?.address?.province || "",
    postalCode: editData.contactInfo?.address?.postalCode || "",
    country: editData.contactInfo?.address?.country || "",
    emergencyContactName: editData.contactInfo?.emergencyContact?.name || "",
    emergencyContactPhone: editData.contactInfo?.emergencyContact?.phone || "",
    emergencyContactRelationship: editData.contactInfo?.emergencyContact?.relationship || "",

    department: editData.employmentInfo?.Department || "",
    jobTitle: editData.employmentInfo?.JobTitle || "",
    level: editData.employmentInfo?.level || "",
    employeeType: editData.employmentInfo?.EmployeeType || "Permanent",
    employmentStatus: editData.status || "Active",
    engagementDate: editData.employmentInfo?.joiningDate || "",
    probationPeriod: editData.employmentInfo?.probationPeriod || "",
    contractEndDate: editData.employmentInfo?.contractEndDate || "",
    workLocation: editData.employmentInfo?.workLocation || "",
    workAddress: editData.employmentInfo?.workAddress || "",
    shift: editData.employmentInfo?.shift || "Day",
    reportingManager: editData.employmentInfo?.reportingManager || "",
    hrManager: editData.employmentInfo?.hrManager || "",

    basicSalary: editData.payrollInfo?.salaryBreakdown?.BasicSalary || "",
    housingAllowance: editData.payrollInfo?.salaryBreakdown?.HousingAllowance || "",
    mealAllowance: editData.payrollInfo?.salaryBreakdown?.MealAllowance || "",
    transportAllowance: editData.payrollInfo?.salaryBreakdown?.TransportAllowance || "",
    otherAllowances: editData.payrollInfo?.salaryBreakdown?.otherAllowances || "",
    grossSalary: editData.payrollInfo?.grossSalary || "",
    currency: editData.payrollInfo?.currency || "ZMW",
    paymentFrequency: editData.payrollInfo?.paymentFrequency || "Monthly",
    paymentMethod: editData.payrollInfo?.paymentMethod || "Bank Transfer",
    accountNumber: editData.payrollInfo?.bankAccount?.AccountNumber || "",
    accountName: editData.payrollInfo?.bankAccount?.AccountName || "",
    bankName: editData.payrollInfo?.bankAccount?.BankName || "",
    branchCode: editData.payrollInfo?.bankAccount?.branchCode || "",
    accountType: editData.payrollInfo?.bankAccount?.AccountType || "Savings",
    ceilingAmount: editData.leaveInfo?.ceilingAmount?.toString() || "",
    ceilingYear: editData.leaveInfo?.ceilingYear?.toString() || String(new Date().getFullYear()),

    leavePolicy: editData.leaveInfo?.leavePolicy || "",

    weeklyScheduleMonday: editData.employmentInfo?.weeklySchedule?.monday || "",
    weeklyScheduleTuesday: editData.employmentInfo?.weeklySchedule?.tuesday || "",
    weeklyScheduleWednesday: editData.employmentInfo?.weeklySchedule?.wednesday || "",
    weeklyScheduleThursday: editData.employmentInfo?.weeklySchedule?.thursday || "",
    weeklyScheduleFriday: editData.employmentInfo?.weeklySchedule?.friday || "",
    weeklyScheduleSaturday: editData.employmentInfo?.weeklySchedule?.saturday || "",
    weeklyScheduleSunday: editData.employmentInfo?.weeklySchedule?.sunday || "",

    notes: editData.notes || "",
  };
}

// ─── Build API payload from form ─────────────────────────────────────────────
export function buildPayload(formData: Record<string, any>, isEdit: boolean) {
  const payload: Record<string, any> = {
    // Personal
    FirstName: formData.firstName,
    LastName: formData.lastName,
    OtherNames: formData.middleName,
    Dob: formData.dateOfBirth,
    Gender: formData.gender,
    MaritalStatus: formData.maritalStatus,
    Nationality: formData.nationality,

    // Contact
    Email: formData.email,
    CompanyEmail: formData.companyEmail,
    PhoneNumber: formData.phoneNumber,
    AlternatePhone: formData.alternatePhone,
    addressStreet: formData.street,
    addressCity: formData.city,
    addressProvince: formData.province,
    addressPostalCode: formData.postalCode,
    addressCountry: formData.country,
    emergencyContactName: formData.emergencyContactName,
    emergencyContactPhone: formData.emergencyContactPhone,
    emergencyContactRelationship: formData.emergencyContactRelationship,

    // Employment
    EngagementDate: formData.engagementDate,
    contractEndDate: formData.contractEndDate,
    Department: formData.department,
    JobTitle: formData.jobTitle,
    level: formData.level,
    EmployeeType: formData.employeeType,
    status: formData.employmentStatus,
    ReportingManager: formData.reportingManager,
    HrManager: formData.hrManager,
    probationPeriod: formData.probationPeriod,
    workLocation: formData.workLocation,
    workAddress: formData.workAddress,
    shift: formData.shift,

    // Salary
    BasicSalary: Number(formData.basicSalary) || 0,
    HousingAllowance: Number(formData.housingAllowance) || 0,
    MealAllowance: Number(formData.mealAllowance) || 0,
    TransportAllowance: Number(formData.transportAllowance) || 0,
    otherAllowances: Number(formData.otherAllowances) || 0,
    GrossSalary: Number(formData.grossSalary) || 0,

    // Payroll
    currency: formData.currency,
    PaymentFrequency: formData.paymentFrequency,
    PaymentMethod: formData.paymentMethod,
    AccountType: formData.accountType,
    BankName: formData.bankName,
    AccountName: formData.accountName,
    AccountNumber: formData.accountNumber,
    BranchCode: formData.branchCode,

    // Leave
    leavePolicy: formData.leavePolicy,
    CeilingAmount: Number(formData.ceilingAmount) || 0,
    CeilingYear: Number(formData.ceilingYear) || 0,

    // Work Schedule
    weeklyScheduleMonday: formData.weeklyScheduleMonday || "",
    weeklyScheduleTuesday: formData.weeklyScheduleTuesday || "",
    weeklyScheduleWednesday: formData.weeklyScheduleWednesday || "",
    weeklyScheduleThursday: formData.weeklyScheduleThursday || "",
    weeklyScheduleFriday: formData.weeklyScheduleFriday || "",
    weeklyScheduleSaturday: formData.weeklyScheduleSaturday || "",
    weeklyScheduleSunday: formData.weeklyScheduleSunday || "",

    notes: formData.notes,
  };

  // IDs — only on create
  if (!isEdit) {
    payload.NrcId = formData.nrcId;
    payload.SocialSecurityNapsa = formData.socialSecurityNapsa;
    payload.TpinId = formData.tpinId;
    payload.NhimaHealthInsurance = formData.nhimaHealthInsurance;
  }

  return payload;
}

// ─── Per-tab validation ───────────────────────────────────────────────────────
export function validateTab(tab: TabName, formData: Record<string, any>): string | null {
  switch (tab) {
    case "Personal":
      if (!formData.firstName || !formData.lastName) return "First name and last name are required";
      if (!formData.dateOfBirth) return "Date of birth is required";
      if (!formData.gender) return "Gender is required";
      return null;
    case "Address & Contact":
      if (!formData.email || !formData.phoneNumber) return "Email and phone number are required";
      return null;
    case "Employment":
      if (!formData.department || !formData.jobTitle || !formData.engagementDate)
        return "Department, job title and engagement date are required";
      return null;
    case "Compensation":
      if (!formData.basicSalary) return "Basic salary is required";
      return null;
    default:
      return null;
  }
}