import React, { useRef, useState, useEffect } from "react";
import { X, Upload, User, CheckCircle2 } from "lucide-react";
import IdentityVerificationModal from "./IdentityVerificationModal";
import PersonalInfoTab from "./PersonalInfoTab";
import ContactInfoTab from "./ContactInfoTabs";
import EmploymentTab from "./EmploymentTab";
import CompensationTab from "./CompensationTab";
import { LeaveSetupTab } from "./LeaveSetupTab";
import { WorkScheduleTab } from "./WorkScheduletab";
import { getLevelsFromHrSettings } from "../../../views/hr/tabs/salarystructure";

import { EMPLOYEE_ROLE_CONFIG } from "../../../api/config/employeeRoleConfig";
import { filterEmployeesByRole } from "../../../api/config/employeeRoleFilter";
import { getAllEmployees } from "../../../api/employeeapi";

import {
  createEmployee,
  getEmployeeById,
  updateEmployeeById,
  updateEmployeeDocuments,
} from "../../../api/employeeapi";
import {
  createSalaryStructureAssignment,
  getSalaryStructureAssignments,
  replaceSalaryStructureAssignment,
} from "../../../api/salaryStructureAssignmentApi";

import { useCompanySelection } from "../../../hooks/useCompanySelection";
import { getEmployeeFeatures } from "../../../config/employeeFeatures";
import { ERP_BASE } from "../../../config/api";

const DEFAULT_FORM_DATA = {
  // Personal
  firstName: "",
  otherNames: "",
  lastName: "",
  dateOfBirth: "",
  gender: "",
  nationality: "Zambian",
  maritalStatus: "",

  // Contact
  email: "",
  CompanyEmail: "",
  phoneNumber: "",
  alternatePhone: "",
  street: "",
  city: "",
  province: "",
  postalCode: "",
  country: "Zambia",
  emergencyContactName: "",
  emergencyContactPhone: "",
  emergencyContactRelationship: "",

  // Employment
  employeeId: "",
  department: "",
  jobTitle: "",
  employmentStatus: "Active",
  hrManager: "",
  reportingManager: "",
  employeeType: "Permanent",
  engagementDate: "",
  contractEndDate: "",
  workLocation: "",
  workAddress: "",
  probationPeriod: "",
  shift: "Day",

  // IDs
  nrcId: "",
  socialSecurityNapsa: "",
  nhimaHealthInsurance: "",
  tpinId: "",

  basicSalary: "",
  housingAllowance: "",
  mealAllowance: "",
  transportAllowance: "",
  otherAllowances: "",
  grossSalary: "",

  employeeNapsa: "",
  employeerNapsa: "",
  employeeNhima: "",
  employeerNhima: "",
  payAsYouEarn: "",

  // Payroll
  currency: "ZMW",
  paymentFrequency: "Monthly",
  paymentMethod: "Bank Transfer",
  salaryStructure: "",

  // Bank
  accountName: "",
  accountNumber: "",
  bankName: "",
  branchCode: "",
  accountType: "Savings",

  // Leave
  openingLeaveBalance: "Incremental two (2) days per month of service",
  initialLeaveRateMonthly: "2",
  ceilingYear: "2025",
  ceilingAmount: "",

  // Work Schedule
  weeklyScheduleMonday: "",
  weeklyScheduleTuesday: "",
  weeklyScheduleWednesday: "",
  weeklyScheduleThursday: "",
  weeklyScheduleFriday: "",
  weeklyScheduleSaturday: "",
  weeklyScheduleSunday: "",

  notes: "",

  // level: "",
  // salaryStructure: "",
  // salaryStructureSource: "",
  // grossSalaryStarting: "",
  // customSalaryComponents: [],
};

const TAB_ORDER = [
  "Personal",
  "Contact",
  "Employment",
  "Leave-Setup",
  "Compensation & Payroll",
  "Work Schedule",
] as const;

type AddEmployeeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  departments?: string[];
  prefilledData?: any;
  level?: string[];
  verifiedData?: any;
  editData?: any;
  mode?: "add" | "edit";
};

import {
  showApiError,
  showSuccess,
  showLoading,
  closeSwal,
} from "../../../utils/alert";

const AddEmployeeModal: React.FC<AddEmployeeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  departments = [],
  prefilledData,
  editData,
}) => {
  //   - Conditional based on company
  const { companyCode } = useCompanySelection();
  const features = getEmployeeFeatures(companyCode);
  const departmentsFromFeatures = features.departments;

  const [step, setStep] = useState<"verification" | "form">(
    features.requireIdentityVerification ? "verification" : "form",
  );
  const [verifiedData, setVerifiedData] = useState<any>(null);
  const [currentTabIndex, setCurrentTabIndex] = useState(0);
  const activeTab = TAB_ORDER[currentTabIndex];
  const isLastTab = currentTabIndex === TAB_ORDER.length - 1;
  const [isPreFilled, setIsPreFilled] = useState(false);
  type EmployeeLite = {
    employeeId: string;
    name: string;
    jobTitle: string;
  };

  const [reportingManagers, setReportingManagers] = useState<EmployeeLite[]>(
    [],
  );
  const [hrManagers, setHrManagers] = useState<EmployeeLite[]>([]);

  const [verifiedFields, setVerifiedFields] = useState<Record<string, boolean>>(
    {},
  );

  const levelsFromHrSettings = getLevelsFromHrSettings();

  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);

  const handleInputChange = (field: string, value: string | boolean | any) => {
    const noUppercaseFields = new Set([
      "email",
      "CompanyEmail",
      "province",
      "country",
      "gender",
      "maritalStatus",
      "emergencyContactRelationship",
      "department",
      "level",
      "reportingManager",
      "hrManager",
      "employeeType",
      "employmentStatus",
      "shift",
      "currency",
      "paymentFrequency",
      "paymentMethod",
      "salaryStructure",
      "accountType",
      "openingLeaveBalance",
      "leavePolicy",
      "leavePolicyDetails",
      "dateOfBirth",
      "engagementDate",
      "contractEndDate",
      "weeklySchedulePreset",
      "weeklyScheduleMonday",
      "weeklyScheduleTuesday",
      "weeklyScheduleWednesday",
      "weeklyScheduleThursday",
      "weeklyScheduleFriday",
      "weeklyScheduleSaturday",
      "weeklyScheduleSunday",
    ]);

    const normalized =
      typeof value === "string" && !noUppercaseFields.has(field)
        ? String(value ?? "").toUpperCase()
        : value;

    setFormData((prev) => ({ ...prev, [field]: normalized }));
  };

  const profileInputRef = useRef<HTMLInputElement | null>(null);
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [profilePreviewUrl, setProfilePreviewUrl] = useState<string>("");

  const [loading] = useState(false);

  const resolveEmployeeInternalId = async (candidate: any): Promise<string> => {
    const raw = String(candidate ?? "").trim();
    if (!raw) return "";
    try {
      const emp = await getEmployeeById(raw);
      const id = String(emp?.id ?? emp?.name ?? "").trim();
      return id;
    } catch {
      return "";
    }
  };

  const uploadProfilePhoto = async (employeeInternalId: string) => {
    if (!profileFile) return;
    const empId = String(employeeInternalId ?? "").trim();
    if (!empId) return;

    const formData = new FormData();
    formData.append("employeeId", empId);
    formData.append("name[0]", "Profile Photo");
    formData.append("description[0]", "Profile Photo");
    formData.append("file[0]", profileFile);
    formData.append("isUpdate", "1");
    formData.append("isDelete", "0");

    await updateEmployeeDocuments(formData);
  };

  // Auto-set salary structure when job title changes

  useEffect(() => {
    if (!editData) return;
    setStep("form");
    setIsPreFilled(true);
  }, [editData]);

  useEffect(() => {
    if (isOpen && !editData) {
      setFormData(DEFAULT_FORM_DATA);
      setStep("verification");
      setIsPreFilled(false);
      setCurrentTabIndex(0);
      setProfileFile(null);
      setProfilePreviewUrl("");
    }
  }, [isOpen, editData]);

  useEffect(() => {
    return () => {
      if (profilePreviewUrl && profilePreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(profilePreviewUrl);
      }
    };
  }, [profilePreviewUrl]);

  useEffect(() => {
    if (!editData) return;

    const pick = (obj: any, keys: string[]) => {
      for (const k of keys) {
        const v = obj?.[k];
        if (v !== undefined && v !== null && String(v).trim() !== "") return v;
      }
      return "";
    };

    const personal =
      editData.personalInfo ??
      editData.personal_info ??
      editData.personal ??
      editData;
    const contact =
      editData.contactInfo ??
      editData.contact_info ??
      editData.contact ??
      editData;
    const address =
      contact?.address ?? contact?.Address ?? contact?.address_info;
    const emergency =
      contact?.emergencyContact ??
      contact?.EmergencyContact ??
      contact?.emergency_contact;

    const employment =
      editData.employmentInfo ??
      editData.employment_info ??
      editData.employment ??
      editData;
    const weeklySchedule =
      employment?.weeklySchedule ??
      employment?.weekly_schedule ??
      employment?.WeeklySchedule;

    const identity =
      editData.identityInfo ??
      editData.identity_info ??
      editData.identity ??
      editData;

    const payroll =
      editData.payrollInfo ??
      editData.payroll_info ??
      editData.payroll ??
      editData;
    const salaryBreakdown =
      payroll?.salaryBreakdown ??
      payroll?.salary_breakdown ??
      payroll?.SalaryBreakdown ??
      payroll;
    const deductions =
      payroll?.statutoryDeductions ??
      payroll?.statutory_deductions ??
      payroll?.StatutoryDeductions ??
      payroll;
    const bank =
      payroll?.bankAccount ??
      payroll?.bank_account ??
      payroll?.BankAccount ??
      payroll;

    const leave =
      editData.leaveInfo ?? editData.leave_info ?? editData.leave ?? editData;

    const getFileUrl = (file?: string | null) => {
      if (!file) return "";
      const f = String(file).trim();
      if (!f) return "";
      if (/^https?:\/\//i.test(f)) return f;
      return `${ERP_BASE}${f}`;
    };

    const docs = Array.isArray(editData.documents) ? editData.documents : [];
    const profileDoc = docs.find((d: any) => {
      const desc = String(d?.description ?? d?.name ?? "")
        .trim()
        .toLowerCase();
      return desc === "profile photo";
    });
    const existingPhotoUrl = getFileUrl(profileDoc?.file) || "";
    if (!profileFile && existingPhotoUrl) {
      setProfilePreviewUrl(existingPhotoUrl);
    }

    setStep("form");
    setIsPreFilled(true);

    setFormData((prev) => ({
      ...prev,

      // ===== PERSONAL INFO =====
      firstName: String(
        pick(personal, [
          "FirstName",
          "firstName",
          "first_name",
          "first_name_en",
        ]) || "",
      ).toUpperCase(),
      otherNames: String(
        pick(personal, [
          "OtherNames",
          "otherNames",
          "other_names",
          "middleName",
        ]) || "",
      ).toUpperCase(),
      lastName: String(
        pick(personal, ["LastName", "lastName", "last_name", "surname"]) || "",
      ).toUpperCase(),
      dateOfBirth: String(
        pick(personal, ["Dob", "dateOfBirth", "date_of_birth"]) || "",
      ),
      gender: String(pick(personal, ["Gender", "gender"]) || ""),
      nationality: String(
        pick(personal, ["Nationality", "nationality"]) || "Zambian",
      ),
      maritalStatus: String(
        pick(personal, ["maritalStatus", "MaritalStatus", "marital_status"]) ||
          "",
      ),

      // ===== CONTACT INFO =====
      email: String(pick(contact, ["Email", "email"]) || ""),
      CompanyEmail: String(
        pick(contact, [
          "workEmail",
          "CompanyEmail",
          "companyEmail",
          "work_email",
        ]) || "",
      ),
      phoneNumber: String(
        pick(contact, ["phoneNumber", "PhoneNumber", "phone_number"]) || "",
      ),
      alternatePhone: String(
        pick(contact, [
          "alternatePhone",
          "AlternatePhone",
          "alternate_phone",
        ]) || "",
      ),

      // Address
      street: String(
        pick(address, ["street", "Street", "addressStreet"]) || "",
      ).toUpperCase(),
      city: String(
        pick(address, ["city", "City", "addressCity"]) || "",
      ).toUpperCase(),
      province: String(
        pick(address, ["province", "Province", "addressProvince"]) || "",
      ),
      postalCode: String(
        pick(address, ["postalCode", "PostalCode", "addressPostalCode"]) || "",
      ).toUpperCase(),
      country: String(
        pick(address, ["country", "Country", "addressCountry"]) || "Zambia",
      ),

      // Emergency Contact
      emergencyContactName: String(
        pick(emergency, ["name", "Name"]) || "",
      ).toUpperCase(),
      emergencyContactPhone: String(pick(emergency, ["phone", "Phone"]) || ""),
      emergencyContactRelationship: String(
        pick(emergency, ["relationship", "Relationship"]) || "",
      ),

      // ===== EMPLOYMENT INFO =====
      employeeId: String(
        pick(employment, ["employeeId", "employee_id", "EmployeeId"]) || "",
      ),
      department: String(pick(employment, ["Department", "department"]) || ""),
      jobTitle: String(
        pick(employment, ["JobTitle", "jobTitle", "job_title"]) || "",
      ).toUpperCase(),
      employeeType: String(
        pick(employment, ["EmployeeType", "employeeType", "employee_type"]) ||
          "Permanent",
      ),
      employmentStatus: String(
        pick(editData, ["status", "Status"]) || "Active",
      ),
      engagementDate: String(
        pick(employment, [
          "joiningDate",
          "EngagementDate",
          "engagementDate",
          "joining_date",
        ]) || "",
      ),
      probationPeriod: String(
        pick(employment, ["probationPeriod", "probation_period"]) || "",
      ),
      contractEndDate: String(
        pick(employment, ["contractEndDate", "contract_end_date"]) || "",
      ),
      workLocation: String(
        pick(employment, ["workLocation", "work_location"]) || "",
      ).toUpperCase(),
      workAddress: String(
        pick(employment, ["workAddress", "work_address"]) || "",
      ).toUpperCase(),
      shift: String(pick(employment, ["shift", "Shift"]) || "Day"),
      reportingManager: String(
        pick(employment, [
          "reportingManager",
          "ReportingManager",
          "reporting_manager",
        ]) || "",
      ),
      hrManager: String(
        pick(employment, ["hrManager", "HrManager", "hr_manager"]) || "",
      ),

      // ===== IDs =====
      nrcId: String(pick(identity, ["nrc", "NrcId", "nrcId", "nrc_id"]) || ""),
      socialSecurityNapsa: String(
        pick(identity, [
          "napsa",
          "SocialSecurityNapsa",
          "socialSecurityNapsa",
          "ssn",
          "social_security_napsa",
        ]) || "",
      ),
      nhimaHealthInsurance: String(
        pick(identity, [
          "nhima",
          "NhimaHealthInsurance",
          "nhimaHealthInsurance",
          "nhima_health_insurance",
        ]) || "",
      ),
      tpinId: String(
        pick(identity, ["tpin", "TpinId", "tpinId", "tpin_id"]) || "",
      ),

      // ===== SALARY COMPONENTS =====
      basicSalary:
        pick(salaryBreakdown, [
          "BasicSalary",
          "basic",
          "basicSalary",
          "BasicAmount",
          "BasicAmount" as any,
        ]) ||
        pick(payroll, ["basic", "BasicAmount", "BasicSalary", "basicSalary"]) ||
        pick(editData, ["basic", "BasicAmount", "basicSalary"]) ||
        "",
      housingAllowance: String(
        pick(salaryBreakdown, [
          "HousingAllowance",
          "housingAllowance",
          "housing_allowance",
        ]) || "",
      ),
      mealAllowance: String(
        pick(salaryBreakdown, [
          "MealAllowance",
          "mealAllowance",
          "meal_allowance",
        ]) || "",
      ),
      transportAllowance: String(
        pick(salaryBreakdown, [
          "TransportAllowance",
          "transportAllowance",
          "transport_allowance",
        ]) || "",
      ),
      otherAllowances: String(
        pick(salaryBreakdown, [
          "otherAllowances",
          "OtherAllowances",
          "other_allowances",
        ]) || "",
      ),
      grossSalary: String(
        pick(payroll, ["grossSalary", "GrossSalary", "gross_salary"]) || "",
      ),

      employeeNapsa: String(
        pick(deductions, [
          "Employeenapsa",
          "EmployeeNapsa",
          "employeeNapsa",
          "employee_napsa",
        ]) || "",
      ),
      employeerNapsa: String(
        pick(deductions, [
          "Employeernapsa",
          "EmployeerNapsa",
          "employeerNapsa",
          "employer_napsa",
        ]) || "",
      ),
      employeeNhima: String(
        pick(deductions, [
          "Employeenhima",
          "EmployeeNhima",
          "employeeNhima",
          "employee_nhima",
        ]) || "",
      ),
      employeerNhima: String(
        pick(deductions, [
          "Employeernhima",
          "EmployeerNhima",
          "employeerNhima",
          "employer_nhima",
        ]) || "",
      ),
      payAsYouEarn: String(
        pick(deductions, [
          "Payasyouearn",
          "PayAsYouEarn",
          "paye",
          "payAsYouEarn",
        ]) || "",
      ),

      // ===== PAYROLL CONFIG =====
      currency: String(pick(payroll, ["currency", "Currency"]) || "ZMW"),
      paymentFrequency: String(
        pick(payroll, [
          "paymentFrequency",
          "PaymentFrequency",
          "payment_frequency",
        ]) || "Monthly",
      ),
      paymentMethod: String(
        pick(payroll, ["paymentMethod", "PaymentMethod", "payment_method"]) ||
          "Bank Transfer",
      ),

      // ===== BANK DETAILS =====
      accountNumber: String(
        pick(bank, ["AccountNumber", "accountNumber", "account_number"]) || "",
      ),
      accountName: String(
        pick(bank, ["AccountName", "accountName", "account_name"]) || "",
      ).toUpperCase(),
      bankName: String(
        pick(bank, ["BankName", "bankName", "bank_name"]) || "",
      ).toUpperCase(),
      branchCode: String(
        pick(bank, ["branchCode", "BranchCode", "branch_code"]) || "",
      ).toUpperCase(),
      accountType: String(
        pick(bank, ["AccountType", "accountType", "account_type"]) || "Savings",
      ),

      // ===== LEAVE SETUP =====
      openingLeaveBalance:
        pick(leave, [
          "openingLeaveBalance",
          "OpeningLeaveBalance",
          "opening_leave_balance",
        ]) || "Incremental two (2) days per month of service",
      initialLeaveRateMonthly: String(
        pick(leave, [
          "initialLeaveRateMonthly",
          "InitialLeaveRateMonthly",
          "initial_leave_rate_monthly",
        ]) || "2",
      ),
      ceilingYear: String(
        pick(leave, ["ceilingYear", "CeilingYear", "ceiling_year"]) || "2025",
      ),
      ceilingAmount: String(
        pick(leave, ["ceilingAmount", "CeilingAmount", "ceiling_amount"]) || "",
      ),

      // ===== WORK SCHEDULE =====

      weeklyScheduleMonday: String(
        pick(weeklySchedule, ["monday", "Monday"]) || "",
      ),
      weeklyScheduleTuesday: String(
        pick(weeklySchedule, ["tuesday", "Tuesday"]) || "",
      ),
      weeklyScheduleWednesday: String(
        pick(weeklySchedule, ["wednesday", "Wednesday"]) || "",
      ),
      weeklyScheduleThursday: String(
        pick(weeklySchedule, ["thursday", "Thursday"]) || "",
      ),
      weeklyScheduleFriday: String(
        pick(weeklySchedule, ["friday", "Friday"]) || "",
      ),
      weeklyScheduleSaturday: String(
        pick(weeklySchedule, ["saturday", "Saturday"]) || "",
      ),
      weeklyScheduleSunday: String(
        pick(weeklySchedule, ["sunday", "Sunday"]) || "",
      ),

      // ===== NOTES =====
      notes: String(editData.notes || "").toUpperCase(),
    }));
  }, [editData]);

  useEffect(() => {
    if (!verifiedData) return;

    setFormData((prev) => ({
      ...prev,
      nrcId: verifiedData.identityInfo?.nrc || "",
      socialSecurityNapsa: verifiedData.identityInfo?.ssn || "",
      firstName: String(
        verifiedData.personalInfo?.firstName || "",
      ).toUpperCase(),
      lastName: String(verifiedData.personalInfo?.lastName || "").toUpperCase(),
      gender: verifiedData.personalInfo?.gender || "",
    }));

    setVerifiedFields({
      nrcId: !!verifiedData.identityInfo?.nrc,
      socialSecurityNapsa: !!verifiedData.identityInfo?.ssn,
      firstName: true,
      lastName: true,
      gender: true,
    });

    setIsPreFilled(true);
  }, [verifiedData]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const isValidNrc = (value: string): boolean => {
    const v = String(value ?? "").trim();
    if (!v) return false;
    return /^\d{6}\/\d{2}\/\d$/.test(v);
  };

  const isValidDigitsLength = (value: string, length: number): boolean => {
    const digits = String(value ?? "").replace(/\D/g, "");
    return digits.length === length;
  };

  const isValidPhone = (value: string): boolean => {
    const v = String(value ?? "").trim();
    if (!v) return false;
    if (!/^\+?\d{9,15}$/.test(v)) return false;
    if (v.startsWith("+260")) return v.length === 13;
    return true;
  };

  const validateCurrentTab = (): string | null => {
    switch (activeTab) {
      case "Personal":
        if (!formData.firstName || !formData.lastName)
          return "First name and last name are required";
        if (!formData.dateOfBirth || !formData.gender)
          return "Date of birth and gender are required";

        if (features.showStatutoryFields && features.statutoryFieldsRequired) {
          if (!formData.nrcId) return "NRC number is required";
          if (!isValidNrc(formData.nrcId))
            return "NRC number must be in the format 123456/78/9";

          if (!formData.socialSecurityNapsa) return "SSN is required";
          if (!isValidDigitsLength(formData.socialSecurityNapsa, 9))
            return "SSN must be exactly 9 digits";

          if (!formData.nhimaHealthInsurance) return "NHIMA number is required";
          if (!formData.tpinId) return "TPIN is required";
          if (!isValidDigitsLength(formData.tpinId, 10))
            return "TPIN must be exactly 10 digits";
        }
        return null;

      case "Contact":
        if (!formData.email || !formData.phoneNumber)
          return "Email and phone number are required";

        if (formData.phoneNumber && !isValidPhone(formData.phoneNumber)) {
          return "Phone number must contain only digits and may start with + (e.g., +260971234567)";
        }

        if (formData.alternatePhone && !isValidPhone(formData.alternatePhone)) {
          return "Alternate phone number must contain only digits and may start with +";
        }

        if (
          formData.emergencyContactPhone &&
          !isValidPhone(formData.emergencyContactPhone)
        ) {
          return "Emergency contact phone must contain only digits and may start with +";
        }
        return null;

      case "Employment":
        if (
          !formData.department ||
          !formData.jobTitle ||
          !formData.engagementDate
        )
          return "Department, job title and engagement date are required";

        if (!String(formData.reportingManager ?? "").trim()) {
          return "Reporting manager is required";
        }

        if (!String(formData.hrManager ?? "").trim()) {
          return "HR manager is required";
        }
        return null;

      case "Compensation & Payroll":
        if (!formData.basicSalary) return "Basic salary is required";
        return null;

      default:
        return null;
    }
  };
  const handleNext = () => {
    const validationError = validateCurrentTab();
    if (validationError) {
      showApiError(validationError);
      return;
    }
    setCurrentTabIndex((prev) => Math.min(prev + 1, TAB_ORDER.length - 1));
  };

  const handlePrevious = () => {
    setCurrentTabIndex((prev) => Math.max(prev - 1, 0));
  };

  useEffect(() => {
    if (!isOpen) return;

    const fetchEmployees = async () => {
      try {
        const res = await getAllEmployees(1, 200, "Active");
        const employees = res?.employees ?? [];

        setReportingManagers(
          filterEmployeesByRole(
            employees,
            EMPLOYEE_ROLE_CONFIG.reportingManager,
          ),
        );

        setHrManagers(
          filterEmployeesByRole(employees, EMPLOYEE_ROLE_CONFIG.hrManager),
        );
      } catch (err) {
        console.error("Failed to fetch employees", err);
      }
    };

    fetchEmployees();
  }, [isOpen]);

  const buildPayload = () => {
    const basicSalaryNum = Number(formData.basicSalary) || 0;

    const payload: any = {
      FirstName: formData.firstName,
      LastName: formData.lastName,
      OtherNames: formData.otherNames,
      EngagementDate: formData.engagementDate,
      contractEndDate: formData.contractEndDate,
      Dob: formData.dateOfBirth,
      Gender: formData.gender,
      Email: formData.email,
      CompanyEmail: formData.CompanyEmail,
      MaritalStatus: formData.maritalStatus,
      Nationality: formData.nationality,
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

      Department: formData.department,
      JobTitle: formData.jobTitle,
      EmployeeType: formData.employeeType,
      status: formData.employmentStatus,
      ...(String(formData.reportingManager ?? "").trim()
        ? { ReportingManager: String(formData.reportingManager).trim() }
        : {}),
      ...(String(formData.hrManager ?? "").trim()
        ? { HrManager: String(formData.hrManager).trim() }
        : {}),
      probationPeriod: formData.probationPeriod,
      workLocation: formData.workLocation,
      workAddress: formData.workAddress,
      shift: formData.shift,

      // Salary Structure + Basic Amount
      BasicAmount: basicSalaryNum,

      currency: formData.currency,
      PaymentFrequency: formData.paymentFrequency,
      PaymentMethod: formData.paymentMethod,
      SalaryStructure: formData.salaryStructure,

      AccountType: formData.accountType,
      BankName: formData.bankName,
      AccountName: formData.accountName,
      AccountNumber: formData.accountNumber,
      BranchCode: formData.branchCode,

      weeklyScheduleMonday: formData.weeklyScheduleMonday || "",
      weeklyScheduleTuesday: formData.weeklyScheduleTuesday || "",
      weeklyScheduleWednesday: formData.weeklyScheduleWednesday || "",
      weeklyScheduleThursday: formData.weeklyScheduleThursday || "",
      weeklyScheduleFriday: formData.weeklyScheduleFriday || "",
      weeklyScheduleSaturday: formData.weeklyScheduleSaturday || "",
      weeklyScheduleSunday: formData.weeklyScheduleSunday || "",

      OpeningLeaveBalance: formData.openingLeaveBalance,
      InitialLeaveRateMonthly: Number(formData.initialLeaveRateMonthly) || 0,
      CeilingYear: Number(formData.ceilingYear) || 0,
      CeilingAmount: Number(formData.ceilingAmount) || 0,

      verifiedFromSource: !!verifiedData,
    };

    if (String(formData.nrcId ?? "").trim()) payload.NrcId = formData.nrcId;
    if (String(formData.socialSecurityNapsa ?? "").trim())
      payload.SocialSecurityNapsa = formData.socialSecurityNapsa;
    if (String(formData.tpinId ?? "").trim()) payload.TpinId = formData.tpinId;
    if (String(formData.nhimaHealthInsurance ?? "").trim())
      payload.NhimaHealthInsurance = formData.nhimaHealthInsurance;

    return payload;
  };
  const handleSave = async () => {
    const validationError = validateCurrentTab();
    if (validationError) {
      showApiError(validationError);
      return;
    }

    try {
      showLoading(editData ? "Updating Employee..." : "Creating Employee...");

      const selectedSalaryStructure = String(
        formData.salaryStructure ?? "",
      ).trim();

      const resolveEmployeeCode = async (input: any): Promise<string> => {
        const raw = String(input ?? "").trim();
        if (!raw) return "";
        if (/^HR-EMP-/i.test(raw)) return raw;

        try {
          const emp = await getEmployeeById(raw);
          const code = String(emp?.employeeId ?? emp?.employee_id ?? "").trim();
          return code;
        } catch {
          return "";
        }
      };

      const createOrUpdateAssignment = async (employeeCode: string) => {
        const emp = String(employeeCode ?? "").trim();
        if (!emp || !selectedSalaryStructure) return;

        // Ensure we have a valid basic salary number
        const basicNum = Number(formData.basicSalary) || 0;
        if (!Number.isFinite(basicNum) || basicNum <= 0) return;

        try {
          const list = await getSalaryStructureAssignments({ employee: emp });
          const rows = Array.isArray(list) ? list : [];
          const best = rows
            .filter((r: any) => String(r?.name ?? "").trim())
            .sort((a: any, b: any) =>
              String(b?.from_date ?? "").localeCompare(
                String(a?.from_date ?? ""),
              ),
            )[0];

          const assignmentName = String(best?.name ?? "").trim();
          if (assignmentName) {
            await replaceSalaryStructureAssignment({
              name: assignmentName,
              salary_structure: selectedSalaryStructure,
              basic: basicNum,
            });
          } else {
            await createSalaryStructureAssignment({
              employee: emp,
              salary_structure: selectedSalaryStructure,
              basic: basicNum,
            });
          }
        } catch {
          // Do not block employee create/update if assignment fails
        }
      };

      if (editData?.id) {
        const payload = {
          id: String(editData.id),
          ...buildPayload(),
        };

        await updateEmployeeById(payload);

        const empCode = await resolveEmployeeCode(
          formData.employeeId ??
            editData?.employeeId ??
            editData?.employmentInfo?.employeeId ??
            editData?.id,
        );
        await createOrUpdateAssignment(empCode);

        const internalId = await resolveEmployeeInternalId(
          editData?.id ?? empCode,
        );
        await uploadProfilePhoto(internalId);
        closeSwal();
        showSuccess("Employee updated successfully");
      } else {
        const resp: any = await createEmployee(buildPayload());

        const data = resp?.data ?? resp;
        const candidate = String(
          data?.employeeId ??
            data?.employee_id ??
            data?.name ??
            data?.id ??
            formData.employeeId ??
            "",
        ).trim();
        const empCode = await resolveEmployeeCode(candidate);
        await createOrUpdateAssignment(empCode);

        const internalId = await resolveEmployeeInternalId(
          candidate || empCode,
        );
        await uploadProfilePhoto(internalId);
        closeSwal();
        showSuccess("Employee created successfully");
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      closeSwal();
      showApiError(error);
    }
  };

  if (!isOpen) return null;

  // Add this condition check
  if (step === "verification" && features.requireIdentityVerification) {
    return (
      <IdentityVerificationModal
        onVerified={(data) => {
          setVerifiedData(data);
          setIsPreFilled(true);
          setStep("form");
        }}
        onManualEntry={() => {
          setVerifiedData(null);
          setIsPreFilled(false);
          setVerifiedFields({});
          setStep("form");
        }}
        onClose={onClose}
      />
    );
  }
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-start justify-center z-50 overflow-y-auto pt-4 pb-4">
      <div
        className="bg-card rounded-lg shadow-xl w-full max-w-6xl mx-4 flex flex-col border border-theme"
        style={{ maxHeight: "95vh" }}
      >
        {/* Top Bar */}
        <div className="flex justify-between items-center px-6 py-3 border-b border-theme bg-card flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🇿🇲</span>
            <div>
              <div className="font-semibold text-main">
                {editData ? "Edit Employee" : "Employee Onboarding"}
              </div>
              <div className="text-xs text-muted">
                {isPreFilled
                  ? "✓ Verified from NAPSA"
                  : "Complete employee information"}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-main transition p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Employee Header */}
        <div className="px-6 py-4 border-b border-theme flex-shrink-0">
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="relative">
                <div className="w-16 h-16 rounded-lg overflow-hidden flex items-center justify-center border-2 border-theme bg-app">
                  {profilePreviewUrl ? (
                    <img
                      src={profilePreviewUrl}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-8 h-8 text-muted" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => profileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-5 h-5 bg-card rounded-full border-2 border-theme flex items-center justify-center hover:bg-app transition shadow-sm"
                  title="Upload profile photo"
                >
                  <Upload className="w-2.5 h-2.5 text-main" />
                </button>
                <input
                  ref={profileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    if (profilePreviewUrl)
                      URL.revokeObjectURL(profilePreviewUrl);
                    setProfileFile(f);
                    setProfilePreviewUrl(f ? URL.createObjectURL(f) : "");
                    e.target.value = "";
                  }}
                />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-base font-semibold text-main truncate">
                  {formData.firstName || formData.lastName
                    ? `${formData.firstName} ${formData.lastName}`.trim()
                    : "New Employee"}
                </h3>
                {isPreFilled && (
                  <span className="flex items-center gap-1 text-xs text-success bg-success/10 px-2 py-0.5 rounded flex-shrink-0">
                    <CheckCircle2 className="w-3 h-3" />
                    Verified
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-main">
                {formData.nrcId && (
                  <div>
                    <span className="font-medium">NRC:</span> {formData.nrcId}
                  </div>
                )}
                {formData.employeeId && (
                  <div>
                    <span className="font-medium">ID:</span>{" "}
                    {formData.employeeId}
                  </div>
                )}
                {formData.department && (
                  <div>
                    <span className="font-medium">Dept:</span>{" "}
                    {formData.department}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        {/* Tabs - sticky & scroll-proof */}
        <div className="flex border-b border-theme bg-card px-2 overflow-x-auto flex-shrink-0 sticky top-0 z-10">
          {TAB_ORDER.map((tab, index) => (
            <button
              key={tab}
              onClick={() => setCurrentTabIndex(index)}
              className={`px-3 py-2.5 text-[11px] font-medium whitespace-nowrap transition flex-shrink-0
        ${
          index === currentTabIndex
            ? "text-primary border-b-2 border-[var(--primary)]"
            : "text-muted hover:text-[var(--primary)]"
        }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Form Content - Scrollable */}
        <div className="flex-1 overflow-y-auto bg-app p-6">
          {activeTab === "Personal" && (
            <PersonalInfoTab
              formData={formData}
              handleInputChange={handleInputChange}
              verifiedFields={verifiedFields}
            />
          )}

          {activeTab === "Contact" && (
            <ContactInfoTab
              formData={formData}
              handleInputChange={handleInputChange}
            />
          )}

          {activeTab === "Employment" && (
            <EmploymentTab
              formData={formData}
              handleInputChange={handleInputChange}
              departments={departments}
              Level={levelsFromHrSettings}
              managers={reportingManagers}
              hrManagers={hrManagers}
            />
          )}

          {activeTab === "Leave-Setup" && (
            <LeaveSetupTab
              formData={formData}
              handleInputChange={handleInputChange}
            />
          )}

          {activeTab === "Compensation & Payroll" && (
            <CompensationTab
              formData={formData}
              handleInputChange={handleInputChange}
            />
          )}

          {activeTab === "Work Schedule" && (
            <WorkScheduleTab
              formData={formData}
              handleInputChange={handleInputChange}
            />
          )}

          <div className="mt-6 bg-card p-5 rounded-lg border border-theme space-y-2">
            <label className="block text-xs text-main mb-1 font-medium">
              Notes
            </label>
            <textarea
              value={formData.notes || ""}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="Enter notes"
              rows={3}
              className="w-full px-3 py-2 text-sm border border-theme bg-card text-main rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgba(204,0,0,0.2)] focus:border-[var(--primary)]"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center px-6 py-4 border-t border-theme bg-card flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-main hover:bg-app rounded-lg"
          >
            Cancel
          </button>

          <div className="flex gap-2">
            {currentTabIndex > 0 && (
              <button
                onClick={handlePrevious}
                className="px-5 py-2 text-sm border rounded-lg hover:bg-gray-100"
              >
                Previous
              </button>
            )}

            {!isLastTab ? (
              <button
                onClick={handleNext}
                className="px-6 py-2 text-sm bg-primary text-white rounded-lg"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-6 py-2 text-sm bg-primary text-white rounded-lg disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save Employee"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddEmployeeModal;
