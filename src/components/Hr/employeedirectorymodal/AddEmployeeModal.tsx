import React, { useState, useEffect, useRef } from "react";
import { uploadEmployeePhoto } from "../../../api/employeeapi";
import ModalFooter from "../../common/ModalFooter";
import IdentityVerificationModal from "./IdentityVerificationModal";
import PersonalInfoTab from "./PersonalInfoTab";
import ContactInfoTab from "./ContactInfoTabs";
import EmploymentTab from "./EmploymentTab";
import CompensationTab from "./CompensationTab";
import { LeaveSetupTab } from "./LeaveSetupTab";
import WorkScheduleTab from "./WorkScheduletab";
import { EmployeeSummaryPanel } from "./EmployeeSummaryPanel";
import { MinimizableModal } from "../../common/MinimizableModal";
import { useUnsavedChangesGuard } from "../../../hooks/useUnsavedChangesGuard";

import {
  getAllDesignations,
  getEmployees,
} from "../../../api/utils/frappeUtilsApi";
import { getLevelsFromHrSettings } from "../../../views/hr/tabs/salarystructure";
import { EMPLOYEE_ROLE_CONFIG } from "../../../api/config/employeeRoleConfig";
import { filterEmployeesByRole } from "../../../api/config/employeeRoleFilter";
import { resolveLabel } from "../../../api/utils/labelResolver";
import { getAllDepartments } from "../../../api/utils/frappeUtilsApi";
import { getAllLeavePolicies } from "../../../api/utils/frappeUtilsApi";
import { getAllGrades } from "../../../api/utils/frappeUtilsApi";
import { getAllShiftTypes } from "../../../api/employeeapi";

import {
  getAllEmployees,
  createEmployee,
  updateEmployeeById,
} from "../../../api/employeeapi";
import { useCompanySelection } from "../../../hooks/useCompanySelection";
import { getEmployeeFeatures } from "../../../config/employeeFeatures";
import {
  showApiError,
  showSuccess,
  showStepLoader,
  closeSwal,
  showEmployeeCreationResult,
  showValidationError,
} from "../../../utils/alert";

import {
  TAB_ORDER,
  type TabName,
  DEFAULT_FORM,
  mapEditDataToForm,
  buildEmployeePayload,
} from "./Employeeformconfig";
import EmployeeBankTab from "./EmployeeBankTab";

// ─── Types ────────────────────────────────────────────────────────────────────

type DocumentUpload = {
  uploaded: boolean;
  fileName?: string;
  fileUrl?: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  editData?: any;
  mode?: "add" | "edit";
  modalId: string;
};

const extractCleanMessage = (err: any): string | null => {
  try {
    const serverMsgs = err?.response?.data?._server_messages;
    if (!serverMsgs) return null;
    const outer = JSON.parse(serverMsgs);
    const parsed = JSON.parse(outer[0]);
    if (parsed?.message) return String(parsed.message).replace(/<[^>]+>/g, "");
  } catch {
    return null;
  }
  return null;
};

// ─── Component ────────────────────────────────────────────────────────────────

const AddEmployeeModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSubmit,
  editData,
  modalId,
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
  const [verifiedFields, setVerifiedFields] = useState<Record<string, boolean>>({});
  const [isPreFilled, setIsPreFilled] = useState(false);
  const [currentTabIndex, setCurrentTabIndex] = useState(0);

  const activeTab = TAB_ORDER[currentTabIndex] as TabName;
  const isLastTab = currentTabIndex === TAB_ORDER.length - 1;

  // ── People dropdowns ────────────────────────────────────────────────────
  const [reportingManagers, setReportingManagers] = useState<any[]>([]);
  const [hrManagers, setHrManagers] = useState<any[]>([]);

  const { markDirty, resetDirty, handleCloseWithConfirm, containerRef } =
    useUnsavedChangesGuard();

  // ── Documents ───────────────────────────────────────────────────────────
  const [, setDocuments] = useState<Record<string, DocumentUpload>>({
    "NRC Copy": { uploaded: false },
    "Offer Letter": { uploaded: false },
    "Employment Contract": { uploaded: false },
    "NAPSA Certificate": { uploaded: false },
  });

  const [saving, setSaving] = useState(false);
  const [, setSaveStatus] = useState<"idle" | "saving" | "uploading">("idle");

  // ── Reset / seed on open ────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;

    if (editData) {
      const flat = editData?.data ?? editData?.message?.data ?? editData;
      setStep("form");
      setFormData(mapEditDataToForm(flat));
      setIsPreFilled(true);
    } else {
      setStep(features.requireIdentityVerification ? "verification" : "form");
      setFormData({ ...DEFAULT_FORM });
      setVerifiedFields({});
      setIsPreFilled(false);
    }

    setCurrentTabIndex(0);
    setEmployeeFile(null);
    // reset dirty state whenever modal opens fresh
    resetDirty();
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
        // swallow – dropdowns will just be empty
      }
    })();
  }, [isOpen]);

  useEffect(() => {
    const loadReportingToLabel = async () => {
      if (!formData.reports_to) return;
      try {
        const res = await getEmployees(formData.reports_to);
        const matchedEmployee = (res || []).find(
          (emp: any) => emp.value === formData.reports_to,
        );
        if (matchedEmployee && matchedEmployee.label !== formData.reportingToLabel) {
          setFormData((prev: any) => ({
            ...prev,
            reportingToLabel: matchedEmployee.label,
          }));
        }
      } catch {
        // silent
      }
    };
    loadReportingToLabel();
  }, [formData.reports_to]);

  useEffect(() => {
    const loadLabel = async () => {
      const label = await resolveLabel({ value: formData.department, fetcher: getAllDepartments });
      setFormData((prev: any) => ({ ...prev, departmentLabel: label }));
    };
    loadLabel();
  }, [formData.department]);

  useEffect(() => {
    const loadLabel = async () => {
      const label = await resolveLabel({ value: formData.leavePolicy, fetcher: getAllLeavePolicies });
      setFormData((prev: any) => ({ ...prev, leavePolicyLabel: label }));
    };
    loadLabel();
  }, [formData.leavePolicy]);

  useEffect(() => {
    const loadLabel = async () => {
      const label = await resolveLabel({ value: formData.grade, fetcher: getAllGrades });
      setFormData((prev: any) => ({ ...prev, gradeLabel: label }));
    };
    loadLabel();
  }, [formData.grade]);

  useEffect(() => {
    const loadLabel = async () => {
      const label = await resolveLabel({ value: formData.designation, fetcher: getAllDesignations });
      setFormData((prev: any) => ({ ...prev, designationLabel: label }));
    };
    loadLabel();
  }, [formData.designation]);

  useEffect(() => {
    const loadLabel = async () => {
      const label = await resolveLabel({ value: formData.shift, fetcher: getAllShiftTypes });
      setFormData((prev: any) => ({ ...prev, shiftLabel: label }));
    };
    loadLabel();
  }, [formData.shift]);

  // ── Helpers ─────────────────────────────────────────────────────────────

  // central handler — marks dirty so unsaved-changes guard fires on close
  const handleInputChange = (field: string, value: any) => {
    markDirty();
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const TAB_REQUIRED_FIELDS: Partial<Record<TabName, () => string | null>> = {
    Personal: () => {
      if (!formData.firstName?.trim()) return "First Name is required.";
      if (!formData.dateOfBirth?.trim()) return "Date of Birth is required.";
      if (!formData.gender?.trim()) return "Gender is required.";
      return null;
    },
    "Address & Contact": () => {
      if (!formData.email?.trim()) return "Personal Email is required.";
      if (!formData.CompanyEmail?.trim()) return "Company Email is required.";
      if (!formData.preferredContactMethod?.trim())
        return "Please select a preferred contact email.";
      return null;
    },
  };

  // validate current tab before advancing
  const handleNext = () => {
    const validator = TAB_REQUIRED_FIELDS[activeTab];
    if (validator) {
      const error = validator();
      if (error) {
        showValidationError(error);
        return;
      }
    }
    setCurrentTabIndex((p) => p + 1);
  };

  const handlePrevious = () => setCurrentTabIndex((p) => p - 1);

  // route close through the unsaved-changes guard
  const handleCloseRequest = () => {
    if (saving) return;
    handleCloseWithConfirm(onClose, modalId);
  };

  const handleResetTab = () => {
    if (saving) return;
    if (editData) {
      const flat = editData?.data ?? editData?.message?.data ?? editData;
      setFormData(mapEditDataToForm(flat));
    } else {
      setFormData({ ...DEFAULT_FORM });
      setVerifiedFields({});
      setEmployeeFile(null);
    }
    setCurrentTabIndex(0);
    resetDirty();
  };

  const handleSave = async () => {
    const payload = buildEmployeePayload(formData, mode === "edit" || !!editData);
    const isEdit = mode === "edit" || !!editData;

    // ── EDIT MODE ────────────────────────────────────────────────────────────
    if (isEdit) {
      try {
        setSaving(true);
        setSaveStatus("saving");

        const id =
          editData?.employee ||
          editData?.data?.employee ||
          editData?.message?.data?.employee ||
          editData?.id ||
          editData?.name;

        if (!id) throw new Error("Cannot determine employee ID for update");
        if (formData._salaryChanged && !formData.effectiveFrom) {
          showValidationError("Effective date is required when salary details are changed.");
          return;
        }

        const res = await updateEmployeeById({ id: String(id), ...payload });
        const msg =
          res?.message?.message ||
          res?.data?.message ||
          "Employee updated successfully.";

        if (employeeFile) {
          setSaveStatus("uploading");
          try {
            await uploadEmployeePhoto(String(id), employeeFile);
          } catch {
            /* silent */
          }
        }

        showSuccess(msg);
        resetDirty();
        onSubmit(payload);
        onClose();
      } catch (err) {
        const clean = extractCleanMessage(err);
        clean ? showValidationError(clean) : showApiError(err);
      } finally {
        setSaving(false);
        setSaveStatus("idle");
      }
      return;
    }

    // ── ADD MODE ─────────────────────────────────────────────────────────────
    showStepLoader(
      "Creating Employee…",
      `<span style="font-size:13px;color:#64748b">Setting up the employee record, please wait.</span>`,
    );

    let employeeId = "";
    let backendMsg = "";
    let welcomeMsg = "";
    let serverWarns: string[] = [];

    try {
      const res = await createEmployee(payload);
      const data = res?.message?.data ?? res?.data?.data ?? {};

      employeeId = data?.employee || res?.data?.employee || "";
      backendMsg =
        res?.message?.message || res?.data?.message || "Employee created successfully.";
      welcomeMsg = typeof data?.messages === "string" ? data.messages.trim() : "";

      try {
        if (res?._server_messages) {
          const outer: string[] = JSON.parse(res._server_messages);
          serverWarns = outer.flatMap((raw: string) => {
            try {
              const p = JSON.parse(raw);
              return p?.message ? [String(p.message)] : [];
            } catch {
              return [];
            }
          });
        }
      } catch {
        /* ignore malformed _server_messages */
      }
    } catch (err) {
      closeSwal();
      const clean = extractCleanMessage(err);
      clean ? showValidationError(clean) : showApiError(err);
      return;
    }

    let photoUploaded = false;
    let photoError = "";

    if (employeeFile && employeeId) {
      showStepLoader(
        "Uploading Profile Photo…",
        `<div style="text-align:left;padding:2px 0">
           <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
             <span style="color:#16a34a;font-size:15px">✓</span>
             <span style="font-size:12.5px;color:#15803d;font-weight:600">${backendMsg}</span>
           </div>
           <div style="display:flex;align-items:center;gap:8px">
             <span style="font-size:12px;color:#6366f1">↑</span>
             <span style="font-size:12px;color:#6366f1;font-weight:500">Uploading photo to <code style="font-size:11px">${employeeId}</code>…</span>
           </div>
         </div>`,
      );

      try {
        await uploadEmployeePhoto(employeeId, employeeFile);
        photoUploaded = true;
      } catch {
        photoError = "Upload failed";
      }
    }

    closeSwal();

    await showEmployeeCreationResult({
      employeeId,
      successMessage: backendMsg,
      welcomeMessage: welcomeMsg || undefined,
      serverWarnings: serverWarns,
      photoUploaded,
      photoError: photoError || undefined,
    });

    onSubmit(payload);
    resetDirty();
    onClose();
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

  const footer = (
    <ModalFooter
      onCancel={handleCloseRequest}
      onReset={handleResetTab}
      onSubmit={handleSave}
      onNext={!isLastTab ? handleNext : undefined}
      onPrevious={currentTabIndex > 0 ? handlePrevious : undefined}
      currentTab={currentTabIndex}
      totalTabs={TAB_ORDER.length}
      isSubmitting={saving}
      submitLabel={editData ? "Update" : "Submit"}
    />
  );

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <MinimizableModal
      modalId={modalId}
      isOpen={isOpen}
      onClose={() => handleCloseWithConfirm(onClose, modalId)}
      formContainerRef={containerRef}
      title={editData ? "Edit Employee" : "Add Employee"}
      subtitle="Employee Management"
      customWidth="90vw"
      height="95vh"
      footer={footer}
    >
      {/* Split layout */}
      <div className="flex h-full overflow-hidden">
        {/* LEFT: Tab bar + content */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          {/* Tab bar — clicking any tab jumps directly to it */}
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
            {activeTab === "Attendance & Leaves" && (
              <LeaveSetupTab
                formData={formData}
                handleInputChange={handleInputChange}
              />
            )}
            {activeTab === "Compensation" && (
              <CompensationTab
                formData={formData}
                handleInputChange={handleInputChange}
                isEditMode={!!editData}
              />
            )}
            {/* {activeTab === "Work Schedule" && (
              <WorkScheduleTab
                formData={formData}
                handleInputChange={handleInputChange}
              />
            )} */}
            {activeTab === "Bank" && (
              <EmployeeBankTab
                formData={formData}
                setFormData={setFormData}
                isEditMode={!!editData}
                employeeId={editData?.employee || editData?.id || editData?.name}
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