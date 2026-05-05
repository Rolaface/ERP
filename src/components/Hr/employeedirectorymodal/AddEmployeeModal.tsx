import React, { useState, useEffect } from "react";
import {
  FaArrowLeft,
  FaArrowRight,
  FaCheck,
} from "react-icons/fa";
import { uploadEmployeePhoto } from "../../../api/employeeapi";

import IdentityVerificationModal from "./IdentityVerificationModal";
import PersonalInfoTab from "./PersonalInfoTab";
import ContactInfoTab from "./ContactInfoTabs";
import EmploymentTab from "./EmploymentTab";
import CompensationTab from "./CompensationTab";
import { LeaveSetupTab } from "./LeaveSetupTab";
import WorkScheduleTab from "./WorkScheduletab";
import { openBankAccountModal } from "../../../store/modalStore";
import { PaymentInfoTab } from "../../../components/procurement/supply/PaymentInfoTab"
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
import { showApiError, showSuccess, showStepLoader,closeSwal ,showEmployeeCreationResult} from "../../../utils/alert";

import {
  TAB_ORDER,
  type TabName,
  DEFAULT_FORM,
  mapEditDataToForm,
  buildEmployeePayload,   // ← single source of truth
} from "./Employeeformconfig";
import AddBankAccountModal from "../../CompanySetup/AddBankAccountModal";
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
  const features       = getEmployeeFeatures(companyCode);
  const departments    = features.departments;
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

  // ── Documents ───────────────────────────────────────────────────────────
  const [documents, setDocuments] = useState<Record<string, DocumentUpload>>({
    "NRC Copy":            { uploaded: false },
    "Offer Letter":        { uploaded: false },
    "Employment Contract": { uploaded: false },
    "NAPSA Certificate":   { uploaded: false },
  });
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "uploading">("idle");

  // ── Reset / seed on open ────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;

    if (editData) {
      // editData is the flat object from the API response
      // It may be nested as editData.data or flat – unwrap accordingly
      const flat =
        editData?.data ?? editData?.message?.data ?? editData;

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
  }, [isOpen, editData, features.requireIdentityVerification]);

  // ── Body scroll lock ────────────────────────────────────────────────────
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
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

  // ── Helpers ─────────────────────────────────────────────────────────────
  const handleInputChange = (field: string, value: any) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleNext     = () => setCurrentTabIndex((p) => p + 1);
  const handlePrevious = () => setCurrentTabIndex((p) => p - 1);



const handleSave = async () => {
  const payload = buildEmployeePayload(formData);
  const isEdit  = mode === "edit" || !!editData;

  // ── EDIT MODE: keep exact same simple flow as before ───────────────────────
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

      const res = await updateEmployeeById({ id: String(id), ...payload });
      const msg =
        res?.message?.message ||
        res?.data?.message    ||
        "Employee updated successfully.";

      if (employeeFile) {
        setSaveStatus("uploading");
        try { await uploadEmployeePhoto(String(id), employeeFile); } catch { /* silent */ }
      }

      showSuccess(msg);
      onSubmit(payload);
      onClose();
    } catch (err) {
      showApiError(err);
    } finally {
      setSaving(false);
      setSaveStatus("idle");
    }
    return;
  }


  // Step 1 — show loader while creating employee
  showStepLoader(
    "Creating Employee…",
    `<span style="font-size:13px;color:#64748b">
       Setting up the employee record, please wait.
     </span>`
  );

  let employeeId   = "";
  let backendMsg   = "";
  let welcomeMsg   = "";
  let serverWarns: string[] = [];

  try {
    const res = await createEmployee(payload);

    // ── Extract all fields from the response ──────────────────────────────
    const data = res?.message?.data ?? res?.data?.data ?? {};

    employeeId  = data?.employee || res?.data?.employee || "";
    backendMsg  = res?.message?.message || res?.data?.message || "Employee created successfully.";
    welcomeMsg  = typeof data?.messages === "string" ? data.messages.trim() : "";

    // Parse Frappe _server_messages (double-encoded JSON array)
    try {
      if (res?._server_messages) {
        const outer: string[] = JSON.parse(res._server_messages);
        serverWarns = outer.flatMap((raw: string) => {
          try { const p = JSON.parse(raw); return p?.message ? [String(p.message)] : []; }
          catch { return []; }
        });
      }
    } catch { /* ignore malformed _server_messages */ }

  } catch (err) {
  
    closeSwal();
    showApiError(err);
    return;
  }


  let photoUploaded = false;
  let photoError    = "";

  if (employeeFile && employeeId) {
    // Update the loader text to show photo upload is in progress
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
       </div>`
    );

    try {
      await uploadEmployeePhoto(employeeId, employeeFile);
      photoUploaded = true;
    } catch {
      photoError = "Upload failed";
    }
  }

  // Step 3 — all done, close loader and show the full result Swal
  closeSwal();

  await showEmployeeCreationResult({
    employeeId,
    successMessage: backendMsg,
    welcomeMessage: welcomeMsg || undefined,
    serverWarnings: serverWarns,
    photoUploaded,
    photoError: photoError || undefined,
  });

  // Only after user clicks "Done" on the result Swal do we close everything
  onSubmit(payload);
  onClose();
};

  const removeDocument = (key: string) =>
    setDocuments((prev) => ({ ...prev, [key]: { uploaded: false } }));

  // ── Verification callback ───────────────────────────────────────────────
  const handleVerified = (data: any) => {
    setFormData((prev) => ({
      ...prev,
      nrcId:       data.identityInfo?.nrc        || "",
      firstName:   data.personalInfo?.firstName  || "",
      lastName:    data.personalInfo?.lastName   || "",
      gender:      data.personalInfo?.gender     || "",
      dateOfBirth: data.personalInfo?.dateOfBirth || "",
    }));
    setVerifiedFields({
      nrcId: true, firstName: true, lastName: true,
      gender: true, dateOfBirth: true,
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
      modalId={modalId}
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
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs bg-primary text-white rounded-lg hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition font-semibold min-w-[90px] justify-center"
              >
                {saveStatus === "uploading" ? (
                  <>
                    <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin flex-shrink-0" />
                    Uploading photo…
                  </>
                ) : saveStatus === "saving" ? (
                  <>
                    <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin flex-shrink-0" />
                    Saving…
                  </>
                ) : (
                  <>
                    <FaCheck className="w-3 h-3" />
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
           {activeTab === "Bank" && (
  <EmployeeBankTab
    formData={formData}
    setFormData={setFormData}
    isEditMode={!!editData}
    employeeId={
      editData?.employee ||
      editData?.id ||
      editData?.name
    }
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