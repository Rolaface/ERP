// ─── AddEmployeeModal.tsx ────────────────────────────────────────────────────
// Orchestration only — form state, tab nav, save.
// All field logic lives in tab components.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect } from "react";
import { X, Upload, User, CheckCircle2, ChevronRight, ChevronLeft } from "lucide-react";

import IdentityVerificationModal from "./IdentityVerificationModal";
import PersonalInfoTab           from "./PersonalInfoTab";
import ContactInfoTab            from "./ContactInfoTabs";
import EmploymentTab             from "./EmploymentTab";
import CompensationTab           from "./CompensationTab";
import { LeaveSetupTab }         from "./LeaveSetupTab";
import { WorkScheduleTab }       from "./WorkScheduletab";
import DocumentsTab              from "./DocumentsTab";
import { MinimizableModal } from "../../common/MinimizableModal";

import { getLevelsFromHrSettings }    from "../../../views/hr/tabs/salarystructure";
import { EMPLOYEE_ROLE_CONFIG }       from "../../../api/config/employeeRoleConfig";
import { filterEmployeesByRole }      from "../../../api/config/employeeRoleFilter";
import { getAllEmployees, createEmployee, updateEmployeeById } from "../../../api/employeeapi";
import { useCompanySelection }        from "../../../hooks/useCompanySelection";
import { getEmployeeFeatures }        from "../../../config/employeeFeatures";
import { showApiError, showSuccess, showLoading, closeSwal } from "../../../utils/alert";

import {
  TAB_ORDER,
  type TabName,
  DEFAULT_FORM,
  mapEditDataToForm,
  buildPayload,
  validateTab,
} from "./Employeeformconfig";

// ─── Tab progress pill ────────────────────────────────────────────────────────
const TAB_ICONS: Record<TabName, string> = {
  "Personal":     "👤",
  "Contact":      "",
  "Employment":   "💼",
  "Leave Setup":  "🏖️",
  "Compensation": "💰",
  "Work Schedule":"🗓️",
  "Documents":    "📄",
};

// ─── Types ────────────────────────────────────────────────────────────────────
type DocumentUpload = { uploaded: boolean; fileName?: string; fileUrl?: string };

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  editData?: any;
  mode?: "add" | "edit";
};

// ─────────────────────────────────────────────────────────────────────────────
const AddEmployeeModal: React.FC<Props> = ({ isOpen, onClose, onSuccess, editData, mode = "add" }) => {
  const { companyCode }   = useCompanySelection();
  const features          = getEmployeeFeatures(companyCode);
  const departments       = features.departments;
  const levelsFromSettings = getLevelsFromHrSettings();

  // ── Step: verification vs form ──────────────────────────────────────────
  const [step, setStep] = useState<"verification" | "form">(
    features.requireIdentityVerification ? "verification" : "form"
  );

  // ── Form state ──────────────────────────────────────────────────────────
  const [formData, setFormData]       = useState<Record<string, any>>(DEFAULT_FORM);
  const [verifiedFields, setVerifiedFields] = useState<Record<string, boolean>>({});
  const [isPreFilled, setIsPreFilled] = useState(false);
  const [currentTabIndex, setCurrentTabIndex] = useState(0);
  const activeTab  = TAB_ORDER[currentTabIndex] as TabName;
  const isLastTab  = currentTabIndex === TAB_ORDER.length - 1;

  // ── People dropdowns ────────────────────────────────────────────────────
  const [reportingManagers, setReportingManagers] = useState<any[]>([]);
  const [hrManagers, setHrManagers]               = useState<any[]>([]);

  // ── Documents ───────────────────────────────────────────────────────────
  const [documents, setDocuments]       = useState<Record<string, DocumentUpload>>({
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
  }, [isOpen, editData]);

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
        setReportingManagers(filterEmployeesByRole(emps, EMPLOYEE_ROLE_CONFIG.reportingManager));
        setHrManagers(filterEmployeesByRole(emps, EMPLOYEE_ROLE_CONFIG.hrManager));
      } catch { /* silent — dropdowns just stay empty */ }
    })();
  }, [isOpen]);

  // ── Helpers ─────────────────────────────────────────────────────────────
  const handleInputChange = (field: string, value: any) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleNext = () => {
    const err = validateTab(activeTab, formData);
    if (err) { showApiError(err); return; }
    setCurrentTabIndex((p) => p + 1);
  };

  const handlePrevious = () => setCurrentTabIndex((p) => p - 1);

  const handleSave = async () => {
    const err = validateTab(activeTab, formData);
    if (err) { showApiError(err); return; }
    try {
      setSaving(true);
      showLoading(editData ? "Updating Employee…" : "Creating Employee…");
      const payload = buildPayload(formData, !!editData);
      if (editData?.id) {
        await updateEmployeeById({ id: String(editData.id), ...payload });
      } else {
        await createEmployee(payload);
      }
      closeSwal();
      showSuccess(editData ? "Employee updated successfully" : "Employee created successfully");
      onSuccess?.();
      onClose();
    } catch (err) {
      closeSwal();
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
    setVerifiedFields({ nrcId: true, firstName: true, lastName: true, gender: true, dateOfBirth: true });
    setIsPreFilled(true);
    setStep("form");
  };

  // ── Guard ───────────────────────────────────────────────────────────────
  if (!isOpen) return null;

  if (step === "verification" && features.requireIdentityVerification) {
    return (
      <IdentityVerificationModal
        onVerified={handleVerified}
        onManualEntry={() => { setIsPreFilled(false); setVerifiedFields({}); setStep("form"); }}
        onClose={onClose}
      />
    );
  }

  const fullName = [formData.firstName, formData.lastName].filter(Boolean).join(" ");


    return (
  <MinimizableModal
    modalId="add-employee"
    isOpen={isOpen}
    onClose={onClose}
    title={fullName || (editData ? "Edit Employee" : "New Employee")}
    subtitle={formData.department || ""}
    maxWidth="5xl"
    height="90vh"
    footer={
      <div className="flex justify-between w-full items-center">
        <button
          onClick={onClose}
          className="px-4 py-2 text-xs text-muted hover:text-main hover:bg-app rounded-lg"
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
              className="px-3 py-2 text-xs border border-theme rounded-lg"
            >
              Previous
            </button>
          )}

          {!isLastTab ? (
            <button
              onClick={handleNext}
              className="px-5 py-2 text-xs bg-primary text-white rounded-lg"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 text-xs bg-primary text-white rounded-lg"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          )}
        </div>
      </div>
    }
  >

      

        {/* ── Tab Bar ─────────────────────────────────────────────────────── */}
        <div className="flex border-b border-theme bg-card px-2 overflow-x-auto flex-shrink-0">
          {TAB_ORDER.map((tab, i) => {
            const done    = i < currentTabIndex;
            const active  = i === currentTabIndex;
            return (
              <button
                key={tab}
                onClick={() => setCurrentTabIndex(i)}
                className={`relative flex items-center gap-1.5 px-3 py-2.5 text-[11px] font-medium whitespace-nowrap transition flex-shrink-0 border-b-2 ${
                  active
                    ? "text-primary border-primary"
                    : done
                    ? "text-emerald-600 border-transparent"
                    : "text-muted border-transparent hover:text-main"
                }`}
              >
                <span>{TAB_ICONS[tab as TabName]}</span>
                {tab}
                {done && <span className="text-emerald-500 text-[9px]">✓</span>}
              </button>
            );
          })}
        </div>

        {/* ── Tab Content ─────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto bg-app p-5">
          {activeTab === "Personal" && (
            <PersonalInfoTab
              formData={formData}
              handleInputChange={handleInputChange}
              verifiedFields={verifiedFields}
            />
          )}
          {activeTab === "Contact" && (
            <ContactInfoTab formData={formData} handleInputChange={handleInputChange} />
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
            <LeaveSetupTab formData={formData} handleInputChange={handleInputChange} />
          )}
          {activeTab === "Compensation" && (
            <CompensationTab formData={formData} handleInputChange={handleInputChange} />
          )}
          {activeTab === "Work Schedule" && (
            <WorkScheduleTab formData={formData} handleInputChange={handleInputChange} />
          )}
          {activeTab === "Documents" && (
            <DocumentsTab
              documents={documents}
              setUploadingDoc={setUploadingDoc}
              removeDocument={removeDocument}
            />
          )}
        </div>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <div className="flex justify-between items-center px-5 py-3 border-t border-theme bg-card flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs text-muted hover:text-main hover:bg-app rounded-lg transition"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            {/* Step indicator */}
            <span className="text-[10px] text-muted mr-2">
              {currentTabIndex + 1} / {TAB_ORDER.length}
            </span>

            {currentTabIndex > 0 && (
              <button
                onClick={handlePrevious}
                className="flex items-center gap-1 px-3 py-2 text-xs border border-theme rounded-lg hover:bg-app transition text-main"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Previous
              </button>
            )}

            {!isLastTab ? (
              <button
                onClick={handleNext}
                className="flex items-center gap-1 px-5 py-2 text-xs bg-primary text-white rounded-lg hover:opacity-90 transition"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 text-xs bg-primary text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition font-semibold"
              >
                {saving ? "Saving…" : editData ? "Update Employee" : "Save Employee"}
              </button>
            )}
          </div>
        </div>
          </MinimizableModal>
      </div>
    
    </div>
  );
};

export default AddEmployeeModal;