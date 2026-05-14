// ─── Tab Order ────────────────────────────────────────────────────────────────
export const TAB_ORDER = [
  "Personal",
  "Address & Contact",
  "Employment",
  "Leave Setup",
  "Compensation",
  "Bank",
  "Work Schedule",
] as const;

export type TabName = (typeof TAB_ORDER)[number];

// ─── SalaryResult type (mirror of salaryengine) ───────────────────────────────
export type SalaryResult = {
  gross: number;
  net: number;
  deductionsTotal: number;
  components: Array<{
    key: string;
    name: string;
    type: "Earning" | "Deduction";
    amount: number;
    isFormula: boolean;
    formula?: string;
  }>;
};

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
  blood_group: "",
  bio: "",
  salutation: "",
  nationalidentificationnumber: "",
  taxidentificationnumber: "",
  universalaccountnumber: "",
  reports_to: "",
  reportingToLabel: "",

  // IDs / Statutory
  nrcId: "",
  socialSecurityNapsa: "",
  nhimaHealthInsurance: "",
  tpinId: "",

  // Health / Passport
  healthInsuranceProvider: "",
  healthInsuranceNo: "",
  healthDetails: "",
  passportNumber: "",
  placeOfIssue: "",
  dateOfIssue: "",
  validUpto: "",

  // Contact
  email: "",
  CompanyEmail: "",
  preferredEmail: "",
  preferredContactEmail: "",
  phoneNumber: "",
  alternatePhone: "",

  // Address
  street: "",
  city: "",
  province: "",
  postalCode: "",
  country: "",
  accommodationType: "",

  // Emergency
  emergencyContactName: "",
  emergencyContactPhone: "",
  emergencyContactRelation: "",

  // Employment
  department: "",
  designation: "",
  grade: "",
  employment_type: "",
  employeeType: "",
  employmentStatus: "Active",
  reportingManager: "",
  hrManager: "",
  dateOfJoining: "",
  contractEndDate: "",
  workLocation: "",
  workAddress: "",
  probationPeriod: "",
  shift: "Day",

  // Approvers
  leaveApprover: "",
  leaveApproverLabel: "",
  expenseApprover: "",
  shiftRequestApprover: "",

  // Compensation
  salaryStructure: "",
  basicSalary: "",
  grossSalary: "",
  currency: "",
  paymentFrequency: "",
  paymentMethod: "Bank",

  // Bank
  accountName: "",
  accountNumber: "",
  bankName: "",
  branchCode: "",
  accountType: "Savings",

  // NAPSA Ceiling
  ceilingAmount: "",
  ceilingYear: String(new Date().getFullYear()),

  // Leave
  leavePolicy: "",
  leavePolicyLabel: "",

  // Work Schedule
  weeklyScheduleMonday: "",
  weeklyScheduleTuesday: "",
  weeklyScheduleWednesday: "",
  weeklyScheduleThursday: "",
  weeklyScheduleFriday: "",
  weeklyScheduleSaturday: "",
  weeklyScheduleSunday: "",

  notes: "",

  // Internal: computed salary result (not sent to server directly)
  _salaryResult: null,

  // Profile photo (existing, from edit — relative path from API)
  existingPhotoUrl: "",
};

// ─── Map API response → formData ─────────────────────────────────────────────
/**
 * Maps the flat API response (from getEmployeeById) into the formData shape.
 * This is the ONLY place where API field names are translated to form field names.
 */
export function mapEditDataToForm(data: any): Record<string, any> {
  // Parse the joined address back into parts if possible
  // The address is stored as a comma-separated string: "street, city, province, postal, country"
  const addressParts = (data.current_address || "")
    .split(", ")
    .map((s: string) => s.trim());

  return {
    // ── Personal ──────────────────────────────────────────────
    firstName: data.first_name || "",
    middleName: data.middle_name || "",
    lastName: data.last_name || "",
    dateOfBirth: data.date_of_birth || "",
    gender: data.gender || "",
    maritalStatus: data.marital_status || "",
    blood_group: data.blood_group || "",
    bio: data.bio || "",
    salutation: data.salutation || "",
    nationality: data.nationality || "",
    nationalidentificationnumber: data.national_identification_number || "",
    taxidentificationnumber: data.tax_identification_number || "",
    universalaccountnumber: data.universal_account_number || "",

    // ── Statutory IDs ─────────────────────────────────────────
    nrcId: data.nrc_id || "",
    socialSecurityNapsa: data.social_security_napsa || "",
    nhimaHealthInsurance: data.nhima_health_insurance || "",
    tpinId: data.tpin_id || "",

    // ── Health / Passport ─────────────────────────────────────
    healthInsuranceProvider: data.health_insurance_provider || "",
    healthInsuranceNo: data.health_insurance_no || "",
    healthDetails: data.health_details || "",
    passportNumber: data.passport_number || "",
    placeOfIssue: data.place_of_issue || "",
    dateOfIssue: data.date_of_issue || "",
    validUpto: data.valid_upto || "",

    // ── Contact ───────────────────────────────────────────────
    email: data.personal_email || "",
    CompanyEmail: data.company_email || "",
    preferredEmail: data.prefered_email || "",
    preferredContactMethod: data.prefered_contact_email || "",
    phoneNumber: data.cell_number || "",
    alternatePhone: data.alternate_phone || "",
    employee_number:data.employee_number||"",

    // ── Address (best-effort parse from joined string) ────────
    street: addressParts[0] || "",
    city: addressParts[1] || "",
    province: addressParts[2] || "",
    postalCode: addressParts[3] || "",
    country: addressParts[4] || "",
    accommodationType: data.permanent_accommodation_type || "",

    // ── Emergency Contact ─────────────────────────────────────
    emergencyContactName: data.person_to_be_contacted || "",
    emergencyContactPhone: data.emergency_phone_number || "",
    emergencyContactRelationship: data.relation || "",

    // ── Employment ────────────────────────────────────────────
    department: data.department || "",
    designation: data.designation || "",
    grade: data.grade || "",
    employment_type: data.employment_type || "",
    employeeType: data.employee_type || "",
    employmentStatus: data.status || "Active",
    reportingToLabel: data.reports_to || "",
    branch: data.branch || "",
    dateOfJoining: data.date_of_joining || "",
    contractEndDate: data.contract_end_date || "",
    probationPeriod:
      data.notice_number_of_days != null
        ? String(data.notice_number_of_days)
        : "",
    shift: data.default_shift || "Day",

    // ── Approvers ─────────────────────────────────────────────
    leaveApprover: data.leave_approver || "",
    leaveApproverLabel: data.leave_approver || "",
    expenseApprover: data.expense_approver || "",
    shiftRequestApprover: data.shift_request_approver || "",

    // ── Compensation ──────────────────────────────────────────
    salaryStructure: data.salary_structure || "",
    // Use base_salary if present, else fall back to ctc
    basicSalary:
      data.base_salary != null
        ? String(data.base_salary)
        : data.ctc != null
          ? String(data.ctc)
          : "",

    grossSalary: data.gross != null ? String(data.gross) : "",
    currency: data.salary_currency || "",
    paymentMethod: data.salary_mode || "",
    paymentFrequency: data.payment_frequency || "",
     Taxslab:data.income_tax_slab||"",
    // ── Bank ──────────────────────────────────────────────────
    accountNumber: data.bank_ac_no || "",
    bankName: data.bank_name || "",
    accountType: data.account_type || "Savings",
    branchCode: data.branch_code || "",
    accountName: data.account_name || "",

    // ── Leave ─────────────────────────────────────────────────
    leavePolicy: data.leave_policy || "",
    leavePolicyLabel: data.leave_policy || "",

    // ── Work Schedule ─────────────────────────────────────────
    weeklyScheduleMonday: data.weekly_schedule_monday || "",
    weeklyScheduleTuesday: data.weekly_schedule_tuesday || "",
    weeklyScheduleWednesday: data.weekly_schedule_wednesday || "",
    weeklyScheduleThursday: data.weekly_schedule_thursday || "",
    weeklyScheduleFriday: data.weekly_schedule_friday || "",
    weeklyScheduleSaturday: data.weekly_schedule_saturday || "",
    weeklyScheduleSunday: data.weekly_schedule_sunday || "",

    notes: data.notes || "",

    // Internal
    _salaryResult: null,

    // Profile photo — relative path from API e.g. "/files/photo.jpg"
    // EmployeeSummaryPanel will prepend the base URL to render it
    existingPhotoUrl: data.image || "",
  };
}

export function buildEmployeePayload(formData: Record<string, any>) {
  // Join address parts into the single stored string
  const fullAddress = [
    formData.street,
    formData.city,
    formData.province,
    formData.postalCode,
    formData.country,
  ]
    .filter(Boolean)
    .join(", ");

  // Normalise payment method
  const mapSalaryMode = (method: string): string | null => {
    const m = (method ?? "").toLowerCase().trim();
    if (m.includes("bank")) return "Bank";
    if (m.includes("mobile")) return "Mobile";
    if (m.includes("cash")) return "Cash";
    if (m.includes("check") || m.includes("cheque")) return "Cheque";
    return method || null;
  };

  // Computed salary result stashed by CompensationTab
  const salaryResult: SalaryResult | null = formData._salaryResult ?? null;

  return {
    // ── Personal ──────────────────────────────────────────────
    first_name: formData.firstName || "",
    middle_name: formData.middleName || "",
    last_name: formData.lastName || "",
    employee_name:
      `${formData.firstName || ""} ${formData.lastName || ""}`.trim(),
    salutation: formData.salutation || null,
    gender: formData.gender || "",
    date_of_birth: formData.dateOfBirth || null,
    marital_status: formData.maritalStatus || "",
    blood_group: formData.blood_group || null,
    bio: formData.bio || null,
    employee_type: formData.employeeType || formData.employment_type || "",
    national_identification_number: formData.nationalidentificationnumber,
    tax_identification_number: formData.taxidentificationnumber,
    universal_account_number: formData.universalaccountnumber,
    health_insurance_number: formData.healthInsuranceNo,

    // ── Contact ───────────────────────────────────────────────
    personal_email: formData.email || "",
    company_email: formData.CompanyEmail || "",
    prefered_email: formData.preferredEmail || null,
    prefered_contact_email: formData.preferredContactMethod || "",
    cell_number: formData.phoneNumber || "",
    emergency_phone_number: formData.emergencyContactPhone || "",
    person_to_be_contacted: formData.emergencyContactName || null,
    relation: formData.emergencyContactRelationship || null,
    current_address: fullAddress,
    permanent_address: fullAddress,
    permanent_accommodation_type: formData.accommodationType || "",

    // ── Employment ────────────────────────────────────────────
    designation: formData.designation || "",
    department: formData.department || "",
    reports_to: formData.reports_to || "",
    employment_type: formData.employment_type || null,
    employee_number:formData.employee_number,
    grade: formData.grade || "",
    branch: formData.branch || "",
    date_of_joining: formData.dateOfJoining || null,
    contract_end_date: formData.contractEndDate || null,
    notice_number_of_days: Number(formData.probationPeriod) || 0,
    status: formData.employmentStatus || "Active",

    // ── Approvers ─────────────────────────────────────────────
    leave_approver: formData.leaveApprover || null,
    expense_approver: formData.expenseApprover || null,
    shift_request_approver: formData.shiftRequestApprover || null,

    // ── Leave ─────────────────────────────────────────────────
    leave_policy: formData.leavePolicy || "",

    // ── Compensation ──────────────────────────────────────────
    salary_structure: formData.salaryStructure || null,
    income_tax_slab: formData.Taxslab,
    base_salary: Number(formData.basicSalary) || 0,
    gross: salaryResult?.gross ?? Number(formData.grossSalary) ?? 0,
    ctc: salaryResult?.gross ?? Number(formData.grossSalary) ?? 0,
    salary_mode: mapSalaryMode(formData.paymentMethod || ""),
    salary_currency: formData.currency || null,

    // ── Bank ──────────────────────────────────────────────────
    bank_name: formData.bankName || null,
    bank_ac_no: formData.accountNumber || null,
    account_type: formData.accountType || null,
    branch_code: formData.branchCode || null,

    // ── Health / Passport ─────────────────────────────────────
    health_insurance_provider: formData.healthInsuranceProvider || null,
    health_insurance_no: formData.healthInsuranceNo || null,
    health_details: formData.healthDetails || null,
    passport_number: formData.passportNumber || null,
    place_of_issue: formData.placeOfIssue || null,
    date_of_issue: formData.dateOfIssue || null,
    valid_upto: formData.validUpto || null,

    // ── System ────────────────────────────────────────────────
    create_user_permission: 1,
    create_user_automatically: 1,
  };
}

// ─── Per-tab validation ───────────────────────────────────────────────────────
export function validateTab(
  tab: TabName,
  formData: Record<string, any>,
): string | null {
  switch (tab) {
    case "Personal":
      if (!formData.firstName || !formData.lastName)
        return "First name and last name are required";
      if (!formData.dateOfBirth) return "Date of birth is required";
      if (!formData.gender) return "Gender is required";
      return null;

    case "Address & Contact":
      if (!formData.email || !formData.phoneNumber)
        return "Email and phone number are required";
      if (!formData.preferredContactMethod)
        return "Please select a preferred contact email";

      return null;

    case "Employment":
      if (
        !formData.department ||
        !formData.designation ||
        !formData.dateOfJoining
      )
        return "Department, designation, and date of joining are required";
      return null;

    case "Compensation":
      if (!formData.basicSalary) return "Basic salary is required";
      return null;

    default:
      return null;
  }
}
