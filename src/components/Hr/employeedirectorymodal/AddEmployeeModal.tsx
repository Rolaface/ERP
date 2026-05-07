import React, { useState, useEffect } from "react";
import {
  FaUser,
  FaAddressBook,
  FaBriefcase,
  FaCalendarCheck,
  FaMoneyBillWave,
  FaCalendarAlt,
  FaFolder,
  FaArrowLeft,
  FaArrowRight,
  FaCheck,
} from "react-icons/fa";
import type { SalaryResult } from "./salaryengine";
import { uploadEmployeePhoto } from "../../../api/employeeapi";

import IdentityVerificationModal from "./IdentityVerificationModal";
import PersonalInfoTab from "./PersonalInfoTab";
import ContactInfoTab from "./ContactInfoTabs";
import EmploymentTab from "./EmploymentTab";
import CompensationTab from "./CompensationTab";
import { LeaveSetupTab } from "./LeaveSetupTab";
import WorkScheduleTab from "./WorkScheduletab";
import DocumentsTab from "./DocumentsTab";
import { EmployeeSummaryPanel } from "./EmployeeSummaryPanel";
import { MinimizableModal } from "../../common/MinimizableModal";

import { getLevelsFromHrSettings } from "../../../views/hr/tabs/salarystructure";
import { EMPLOYEE_ROLE_CONFIG } from "../../../api/config/employeeRoleConfig";
import { filterEmployeesByRole } from "../../../api/config/employeeRoleFilter";
import {
  getAllEmployees,
  createEmployee,
  updateEmployeeById,
} from "../../../api/employeeapi";
import { useCompanySelection } from "../../../hooks/useCompanySelection";
import { getEmployeeFeatures } from "../../../config/employeeFeatures";
import { showApiError, showSuccess } from "../../../utils/alert";

import {
  TAB_ORDER,
  type TabName,
  DEFAULT_FORM,
  mapEditDataToForm,
} from "./Employeeformconfig";


export function buildEmployeePayload(formData: any) {
  // Address
  const fullAddress = [
    formData.street,
    formData.city,
    formData.province,
    formData.postalCode,
    formData.country,
  ]
    .filter(Boolean)
    .join(", ");
 
  // Salary mode normalisation
  const mapSalaryMode = (method: string) => {
    const m = (method ?? "").toLowerCase();
    if (m.includes("bank"))   return "Bank";
    if (m.includes("mobile")) return "Mobile";
    if (m.includes("cash"))   return "Cash";
    return method || null;
  };
 
  // Pull the pre-computed salary result that CompensationTab wrote to formData
  const salaryResult: SalaryResult | undefined = formData._salaryResult;
 
  return {
    // ── Personal ────────────────────────────────────────────
    first_name:     formData.firstName  || "",
    middle_name:    formData.middleName || "",
    last_name:      formData.lastName   || "",
    employee_name:  `${formData.firstName || ""} ${formData.lastName || ""}`.trim(),
    employee_type:  formData.employeeType || "",
    salutation:     formData.salutation  || null,
    gender:         formData.gender      || "",
    date_of_birth:  formData.dateOfBirth || null,
    marital_status: formData.maritalStatus || "",
    blood_group:    formData.bloodGroup  || null,
    bio:            formData.bio         || null,
 
    // ── Contact ─────────────────────────────────────────────
    personal_email:              formData.email                   || "",
    company_email:               formData.CompanyEmail            || "",
    prefered_email:              formData.preferredEmail          || null,
    prefered_contact_email:      formData.preferredContactEmail   || "",
    cell_number:                 formData.phoneNumber             || "",
    emergency_phone_number:      formData.emergencyContactPhone   || "",
    person_to_be_contacted:      formData.emergencyContactName    || null,
    relation:                    formData.emergencyContactRelation || null,
    current_address:             fullAddress,
    permanent_address:           fullAddress,
    permanent_accommodation_type: formData.accommodationType      || "",
 
    // ── Employment ──────────────────────────────────────────
    designation:          formData.designation      || "",
    department:           formData.department       || "",
    reports_to:           formData.reportingManager || "",
    employment_type:      formData.employment_type   || null,
    grade:                formData.grade            || "",
    branch:               formData.workLocation     || "",
    date_of_joining:      formData.dateOfJoining    || null,
    contract_end_date:    formData.contractEndDate  || null,
    notice_number_of_days: Number(formData.probationPeriod) || 0,
    leave_approver:        formData.leaveApprover        || null,
    expense_approver:      formData.expenseApprover      || null,
    shift_request_approver: formData.shiftRequestApprover || null,
 
    // ── Leave ───────────────────────────────────────────────
    leave_policy: formData.leavePolicy || "",
 
    // ── Compensation (base-driven) ───────────────────────────
    salary_structure: formData.salaryStructure || null,
    base_salary:      Number(formData.basicSalary) || 0,   
    gross:            salaryResult?.gross            ?? 0,
    ctc: salaryResult?.gross ?? 0, 
   
    
 
  
    salary_mode:     mapSalaryMode(formData.paymentMethod || ""),
    salary_currency: formData.currency || null,
 
    // ── Bank ────────────────────────────────────────────────
    bank_name:    formData.bankName      || null,
    bank_ac_no:   formData.accountNumber || null,
    account_type: formData.accountType   || null,
    branch_code:  formData.branchCode    || null,
 
    // ── Health / Passport ────────────────────────────────────
    health_insurance_provider: formData.healthInsuranceProvider || null,
    health_insurance_no:       formData.healthInsuranceNo       || null,
    health_details:            formData.healthDetails           || null,
    passport_number:           formData.passportNumber          || null,
    place_of_issue:            formData.placeOfIssue            || null,
    date_of_issue:             formData.dateOfIssue             || null,
    valid_upto:                formData.validUpto               || null,
 
    // ── System ──────────────────────────────────────────────
    create_user_permission:    1,
    create_user_automatically: 1,
  };
}


// ── Tab icons ────────────────────────────────────────────────────────────────



type DocumentUpload = {
  uploaded: boolean;
  fileName?: string;
  fileUrl?: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  editData?: any;
  mode?: "add" | "edit";
};

// ── Component ────────────────────────────────────────────────────────────────

const AddEmployeeModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSuccess,
  editData,
  mode = "add",
}) => {
  const { companyCode } = useCompanySelection();
  const features = getEmployeeFeatures(companyCode);
  const departments = features.departments;
  const levelsFromSettings = getLevelsFromHrSettings();
  const [employeeFile, setEmployeeFile] = useState<File | null>(null);

  // ── Step ────────────────────────────────────────────────────────────────
  const [step, setStep] = useState<"verification" | "form">(
    features.requireIdentityVerification ? "verification" : "form",
  );

  // ── Form state ──────────────────────────────────────────────────────────
  const [formData, setFormData] = useState<Record<string, any>>(DEFAULT_FORM);
  const [verifiedFields, setVerifiedFields] = useState<Record<string, boolean>>(
    {},
  );
  const [isPreFilled, setIsPreFilled] = useState(false);
  const [currentTabIndex, setCurrentTabIndex] = useState(0);

  const activeTab = TAB_ORDER[currentTabIndex] as TabName;
  const isLastTab = currentTabIndex === TAB_ORDER.length - 1;

  // ── People dropdowns ────────────────────────────────────────────────────
  const [reportingManagers, setReportingManagers] = useState<any[]>([]);
  const [hrManagers, setHrManagers] = useState<any[]>([]);

  // ── Documents ───────────────────────────────────────────────────────────
  const [documents, setDocuments] = useState<Record<string, DocumentUpload>>({
    "NRC Copy": { uploaded: false },
    "Offer Letter": { uploaded: false },
    "Employment Contract": { uploaded: false },
    "NAPSA Certificate": { uploaded: false },
  });
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // ── Reset on open ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    if (editData) {
      setStep("form");
      setFormData(mapEditDataToForm(editData));
      setIsPreFilled(true);
    } else {
      setStep(features.requireIdentityVerification ? "verification" : "form");
      setFormData({ ...DEFAULT_FORM });
      setVerifiedFields({});
      setIsPreFilled(false);
    }
    setCurrentTabIndex(0);
  }, [isOpen, editData, features.requireIdentityVerification]);

  // ── Body scroll lock ────────────────────────────────────────────────────
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // ── Load managers ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      try {
        const res = await getAllEmployees(1, 200, "Active");
        const emps = res?.data?.employees ?? [];
        setReportingManagers(
          filterEmployeesByRole(emps, EMPLOYEE_ROLE_CONFIG.reportingManager),
        );
        setHrManagers(
          filterEmployeesByRole(emps, EMPLOYEE_ROLE_CONFIG.hrManager),
        );
      } catch {
        
      }
    })();
  }, [isOpen]);

  // ── Helpers ─────────────────────────────────────────────────────────────
  const handleInputChange = (field: string, value: any) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleNext = () => setCurrentTabIndex((p) => p + 1);
  const handlePrevious = () => setCurrentTabIndex((p) => p - 1);

const handleSave = async () => {
  try {
    setSaving(true);

    const payload = buildEmployeePayload(formData);

    let employeeId: string | null = null;

    if (editData?.id) {
      await updateEmployeeById({ id: String(editData.id), ...payload });
      employeeId = String(editData.id);
    } else {
     
     const res = await createEmployee(payload);

employeeId = res?.message?.data?.employee || null;
    }
   


   
    if (employeeFile && employeeId) {
      await uploadEmployeePhoto(employeeId, employeeFile);
    }

    showSuccess(
      editData
        ? "Employee updated successfully"
        : "Employee created successfully",
    );

    onSuccess?.();
    onClose();

  } catch (err) {
    showApiError(err);
  } finally {
    setSaving(false);
  }
};
  const removeDocument = (key: string) =>
    setDocuments((prev) => ({ ...prev, [key]: { uploaded: false } }));

  // ── Verification callback ───────────────────────────────────────────────
  const handleVerified = (data: any) => {
    setFormData((prev) => ({
      ...prev,
      nrcId: data.identityInfo?.nrc || "",
      firstName: data.personalInfo?.firstName || "",
      lastName: data.personalInfo?.lastName || "",
      gender: data.personalInfo?.gender || "",
      dateOfBirth: data.personalInfo?.dateOfBirth || "",
    }));
    setVerifiedFields({
      nrcId: true,
      firstName: true,
      lastName: true,
      gender: true,
      dateOfBirth: true,
    });
    setIsPreFilled(true);
    setStep("form");
  };

  // ── Guards ──────────────────────────────────────────────────────────────
  if (!isOpen) return null;

  if (step === "verification" && features.requireIdentityVerification) {
    return (
      <IdentityVerificationModal
        isOpen={isOpen}
        onVerified={handleVerified}
        onManualEntry={() => {
          setIsPreFilled(false);
          setVerifiedFields({});
          setStep("form");
        }}
        onClose={onClose}
      />
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <MinimizableModal
      modalId="add-employee"
      isOpen={isOpen}
      onClose={onClose}
      title={editData ? "Edit Employee" : "New Employee"}
      subtitle="Employee Management"
      customWidth="77vw"
      height="90vh"
      footer={
        <div className="flex justify-between w-full items-center px-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-muted hover:text-main hover:bg-app rounded-lg transition"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted">
              {currentTabIndex + 1} / {TAB_ORDER.length}
            </span>

            {currentTabIndex > 0 && (
              <button
                onClick={handlePrevious}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs border border-theme rounded-lg hover:bg-app transition text-main"
              >
                <FaArrowLeft className="w-3 h-3" /> Previous
              </button>
            )}

            {!isLastTab ? (
              <button
                onClick={handleNext}
                className="flex items-center gap-1 px-4 py-1.5 text-xs bg-primary text-white rounded-lg hover:opacity-90 transition"
              >
                Next <FaArrowRight className="w-3 h-3" />
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1 px-4 py-1.5 text-xs bg-primary text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition font-semibold"
              >
                {saving ? (
                  "Saving…"
                ) : (
                  <>
                    <FaCheck className="w-3 h-3" />{" "}
                    {editData ? "Update" : "Save"}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      }
    >
      {/* Split layout */}
      <div className="flex h-full overflow-hidden">
        {/* LEFT: Tab bar + content */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          {/* Tab bar */}
          <div className="flex border-b border-theme bg-card px-1.5 overflow-x-auto flex-shrink-0">
            {TAB_ORDER.map((tab, i) => {
              const active = i === currentTabIndex;
              return (
                <button
                  key={tab}
                  onClick={() => setCurrentTabIndex(i)}
                  className={`relative flex items-center gap-1 px-2.5 py-2 text-[10px] font-medium whitespace-nowrap transition flex-shrink-0 border-b-2 ${
                    active
                      ? "text-primary border-primary"
                      : "text-muted border-transparent hover:text-main"
                  }`}
                >
                  <span>{tab}</span>
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto bg-app p-3">
            {activeTab === "Personal" && (
              <PersonalInfoTab
                formData={formData}
                handleInputChange={handleInputChange}
                verifiedFields={verifiedFields}
              />
            )}
            {activeTab === "Address & Contact" && (
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
                Level={levelsFromSettings}
                managers={reportingManagers}
                hrManagers={hrManagers}
              />
            )}
            {activeTab === "Leave Setup" && (
              <LeaveSetupTab
                formData={formData}
                handleInputChange={handleInputChange}
              />
            )}
            {activeTab === "Compensation" && (
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
            {activeTab === "Documents" && (
              <DocumentsTab
                documents={documents}
                setUploadingDoc={setUploadingDoc}
                removeDocument={removeDocument}
              />
            )}
          </div>
        </div>

        {/* RIGHT: Summary panel */}
        <div className="w-[260px] flex-shrink-0 border-l border-theme bg-app">
          <div className="h-full">
           <EmployeeSummaryPanel
  formData={formData}
  onFileSelect={setEmployeeFile}
/>
          </div>
        </div>
      </div>
    </MinimizableModal>
  );
};

export default AddEmployeeModal;
