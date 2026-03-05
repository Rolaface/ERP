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
 
import { createEmployee, getEmployeeById, updateEmployeeById, updateEmployeeDocuments } from "../../../api/employeeapi";
import {
  createSalaryStructureAssignment,
  getSalaryStructureAssignments,
  replaceSalaryStructureAssignment,
} from "../../../api/salaryStructureAssignmentApi";
import { getSalaryStructureById } from "../../../api/salaryStructureApi";

import { useCompanySelection } from "../../../hooks/useCompanySelection";
import { getEmployeeFeatures } from "../../../config/employeeFeatures";

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
 
  editData,
}) => {
  //   - Conditional based on company
const { companyCode } = useCompanySelection();
const features = getEmployeeFeatures(companyCode);
const departments = features.departments;

const [step, setStep] = useState<"verification" | "form">(
  features.requireIdentityVerification ? "verification" : "form"
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
      if (profilePreviewUrl) URL.revokeObjectURL(profilePreviewUrl);
    };
  }, [profilePreviewUrl]);

  useEffect(() => {
    if (!editData) return;

    setStep("form");
    setIsPreFilled(true);

    setFormData((prev) => ({
      ...prev,

      // ===== PERSONAL INFO =====
      firstName: editData.personalInfo?.FirstName || "",
      OtherNames: editData.personalInfo?.OtherNames || "",
      lastName: editData.personalInfo?.LastName || "",
      dateOfBirth: editData.personalInfo?.Dob || "",
      gender: editData.personalInfo?.Gender || "",
      nationality: editData.personalInfo?.Nationality || "Zambian",
      maritalStatus: editData.personalInfo?.maritalStatus || "",

      // ===== CONTACT INFO =====
      email: editData.contactInfo?.Email || "",
      CompanyEmail: editData.contactInfo?.workEmail || "",
      phoneNumber: editData.contactInfo?.phoneNumber || "",
      alternatePhone: editData.contactInfo?.alternatePhone || "",

      // Address
      street: editData.contactInfo?.address?.street || "",
      city: editData.contactInfo?.address?.city || "",
      province: editData.contactInfo?.address?.province || "",
      postalCode: editData.contactInfo?.address?.postalCode || "",
      country: editData.contactInfo?.address?.country || "Zambia",

      // Emergency Contact
      emergencyContactName: editData.contactInfo?.emergencyContact?.name || "",
      emergencyContactPhone:
        editData.contactInfo?.emergencyContact?.phone || "",
      emergencyContactRelationship:
        editData.contactInfo?.emergencyContact?.relationship || "",

      // ===== EMPLOYMENT INFO =====
      employeeId: editData.employmentInfo?.employeeId || "",
      department: editData.employmentInfo?.Department || "",
      jobTitle: editData.employmentInfo?.JobTitle || "",
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

      // ===== IDs =====
      NrcId: editData.identityInfo?.nrc || "",
      SocialSecurityNapsa: editData.identityInfo?.napsa || "",
      nhimaHealthInsurance: editData.identityInfo?.nhima || "",
      TpinId: editData.identityInfo?.tpin || "",

      // ===== SALARY COMPONENTS =====
      basicSalary: editData.payrollInfo?.salaryBreakdown?.BasicSalary || "",
      housingAllowance:
        editData.payrollInfo?.salaryBreakdown?.HousingAllowance || "",
      mealAllowance: editData.payrollInfo?.salaryBreakdown?.MealAllowance || "",
      transportAllowance:
        editData.payrollInfo?.salaryBreakdown?.TransportAllowance || "",
      otherAllowances:
        editData.payrollInfo?.salaryBreakdown?.otherAllowances || "",
      grossSalary: editData.payrollInfo?.grossSalary || "",

      employeeNapsa:
        editData.payrollInfo?.statutoryDeductions?.EmployeeNapsa || "",
      employeerNapsa:
        editData.payrollInfo?.statutoryDeductions?.EmployeerNapsa || "",
      employeeNhima:
        editData.payrollInfo?.statutoryDeductions?.EmployeeNhima || "",
      employeerNhima:
        editData.payrollInfo?.statutoryDeductions?.EmployeerNhima || "",
      payAsYouEarn:
        editData.payrollInfo?.statutoryDeductions?.PayAsYouEarn || "",

      // ===== PAYROLL CONFIG =====
      currency: editData.payrollInfo?.currency || "ZMW",
      paymentFrequency: editData.payrollInfo?.paymentFrequency || "Monthly",
      paymentMethod: editData.payrollInfo?.paymentMethod || "Bank Transfer",

      // ===== BANK DETAILS =====
      accountNumber: editData.payrollInfo?.bankAccount?.AccountNumber || "",
      accountName: editData.payrollInfo?.bankAccount?.AccountName || "",
      bankName: editData.payrollInfo?.bankAccount?.BankName || "",
      branchCode: editData.payrollInfo?.bankAccount?.branchCode || "",
      accountType: editData.payrollInfo?.bankAccount?.AccountType || "Savings",

      // ===== LEAVE SETUP =====
      openingLeaveBalance:
        editData.leaveInfo?.openingLeaveBalance ||
        "Incremental two (2) days per month of service",
      initialLeaveRateMonthly:
        editData.leaveInfo?.initialLeaveRateMonthly?.toString() || "2",
      ceilingYear: editData.leaveInfo?.ceilingYear?.toString() || "2025",
      ceilingAmount: editData.leaveInfo?.ceilingAmount?.toString() || "",

      // ===== WORK SCHEDULE =====

      weeklyScheduleMonday:
        editData.employmentInfo?.weeklySchedule?.monday || "",
      weeklyScheduleTuesday:
        editData.employmentInfo?.weeklySchedule?.tuesday || "",
      weeklyScheduleWednesday:
        editData.employmentInfo?.weeklySchedule?.wednesday || "",
      weeklyScheduleThursday:
        editData.employmentInfo?.weeklySchedule?.thursday || "",
      weeklyScheduleFriday:
        editData.employmentInfo?.weeklySchedule?.friday || "",
      weeklyScheduleSaturday:
        editData.employmentInfo?.weeklySchedule?.saturday || "",
      weeklyScheduleSunday:
        editData.employmentInfo?.weeklySchedule?.sunday || "",

      // ===== NOTES =====
      notes: editData.notes || "",
    }));
  }, [editData]);

  useEffect(() => {
    if (!verifiedData) return;

    setFormData((prev) => ({
      ...prev,
      nrcId: verifiedData.identityInfo?.nrc || "",
      socialSecurityNapsa: verifiedData.identityInfo?.ssn || "",
      firstName: verifiedData.personalInfo?.firstName || "",
      lastName: verifiedData.personalInfo?.lastName || "",
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
          if (!formData.nhimaHealthInsurance)
            return "NHIMA number is required";
          if (!formData.tpinId)
            return "TPIN is required";
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

  const handleNext = () => {
    const error = validateCurrentTab();
  if (error) {
  showApiError(error);
  return;
}

    
    setCurrentTabIndex((prev) => prev + 1);
  };

  const handlePrevious = () => {
    
    setCurrentTabIndex((prev) => prev - 1);
  };

  const handleInputChange = (field: string, value: string | boolean | any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const buildPayload = () => {
    const basicSalaryNum = Number(formData.basicSalary) || 0;

    const housingAmount = Number(formData.housingAllowance) || 0;
    const mealAmount = Number(formData.mealAllowance) || 0;
    const transportAmount = Number(formData.transportAllowance) || 0;
    const otherAmount = Number(formData.otherAllowances) || 0;

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

      // Address
      addressStreet: formData.street,
      addressCity: formData.city,
      addressProvince: formData.province,
      addressPostalCode: formData.postalCode,
      addressCountry: formData.country,

      // Emergency Contact
      emergencyContactName: formData.emergencyContactName,
      emergencyContactPhone: formData.emergencyContactPhone,
      emergencyContactRelationship: formData.emergencyContactRelationship,

      // Employment
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

      // Salary Components - ALWAYS send final amounts
      BasicSalary: basicSalaryNum,
      HousingAllowance: housingAmount,
      MealAllowance: mealAmount,
      TransportAllowance: transportAmount,
      otherAllowances: otherAmount,
      GrossSalary: Number(formData.grossSalary) || 0,

      // Payroll
      currency: formData.currency,
      PaymentFrequency: formData.paymentFrequency,
      PaymentMethod: formData.paymentMethod,
      SalaryStructure: formData.salaryStructure,

      // Bank
      AccountType: formData.accountType,
      BankName: formData.bankName,
      AccountName: formData.accountName,
      AccountNumber: formData.accountNumber,
      BranchCode: formData.branchCode,

      // Work Schedule - Send as empty string instead of undefined/null
      weeklyScheduleMonday: formData.weeklyScheduleMonday || "",
      weeklyScheduleTuesday: formData.weeklyScheduleTuesday || "",
      weeklyScheduleWednesday: formData.weeklyScheduleWednesday || "",
      weeklyScheduleThursday: formData.weeklyScheduleThursday || "",
      weeklyScheduleFriday: formData.weeklyScheduleFriday || "",
      weeklyScheduleSaturday: formData.weeklyScheduleSaturday || "",
      weeklyScheduleSunday: formData.weeklyScheduleSunday || "",

      // Leave
      OpeningLeaveBalance: formData.openingLeaveBalance,
      InitialLeaveRateMonthly: Number(formData.initialLeaveRateMonthly) || 0,
      CeilingYear: Number(formData.ceilingYear) || 0,
      CeilingAmount: Number(formData.ceilingAmount) || 0,

      verifiedFromSource: !!verifiedData,
    };
    if (!editData) {
      payload.NrcId = formData.nrcId;
      payload.SocialSecurityNapsa = formData.socialSecurityNapsa;
      payload.TpinId = formData.tpinId;
      payload.NhimaHealthInsurance = formData.nhimaHealthInsurance;
    }

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

    const selectedSalaryStructure = String(formData.salaryStructure ?? "").trim();

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

      let company = "";
      try {
        const detail = await getSalaryStructureById(selectedSalaryStructure);
        company = String((detail as any)?.company ?? "").trim();
      } catch {
        company = "";
      }

      const from_date =
        String(formData.engagementDate ?? "").trim() || new Date().toISOString().slice(0, 10);

      try {
        const list = await getSalaryStructureAssignments({ employee: emp });
        const rows = Array.isArray(list) ? list : [];
        const best = rows
          .filter((r: any) => String(r?.name ?? "").trim())
          .sort((a: any, b: any) => String(b?.from_date ?? "").localeCompare(String(a?.from_date ?? "")))[0];

        const assignmentName = String(best?.name ?? "").trim();
        const resolvedCompany = company || String(companyCode ?? "").trim();

        if (assignmentName) {
          await replaceSalaryStructureAssignment({
            name: assignmentName,
            salary_structure: selectedSalaryStructure,
            company: resolvedCompany,
          });
        } else {
          await createSalaryStructureAssignment({
            employee: emp,
            salary_structure: selectedSalaryStructure,
            from_date,
            company: resolvedCompany,
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
        formData.employeeId ?? editData?.employeeId ?? editData?.employmentInfo?.employeeId ?? editData?.id,
      );
      await createOrUpdateAssignment(empCode);

      const internalId = await resolveEmployeeInternalId(editData?.id ?? empCode);
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

      const internalId = await resolveEmployeeInternalId(candidate || empCode);
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
                    <img src={profilePreviewUrl} alt="Profile" className="w-full h-full object-cover" />
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
                    if (profilePreviewUrl) URL.revokeObjectURL(profilePreviewUrl);
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
        ${index === currentTabIndex
          ? "text-primary border-b-2 border-primary"
          : "text-gray-500 hover:text-primary"
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
                className="px-6 py-2 text-sm bg-success text-white rounded-lg  disabled:opacity-50"
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
