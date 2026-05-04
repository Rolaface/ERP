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
import { getAllEmployees } from "../../../api/employeeapi";
import { useCompanySelection } from "../../../hooks/useCompanySelection";
import { getEmployeeFeatures } from "../../../config/employeeFeatures";

import {
  TAB_ORDER,
  type TabName,
  DEFAULT_FORM,
  mapEditDataToForm,
} from "./Employeeformconfig";

const TAB_ICONS: Record<TabName, React.ElementType> = {
  "Personal":      FaUser,
  "Contact":       FaAddressBook,
  "Employment":    FaBriefcase,
  "Leave Setup":   FaCalendarCheck,
  "Compensation":  FaMoneyBillWave,
  "Work Schedule": FaCalendarAlt,
  "Documents":     FaFolder,
};

type DocumentUpload = { uploaded: boolean; fileName?: string; fileUrl?: string };

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (formData: any) => void;
  onSuccess?: () => void;
  editData?: any;
  mode?: "add" | "edit";
};

const AddEmployeeModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSubmit,
  onSuccess,
  editData,
  mode = "add",
}) => {
  const { companyCode } = useCompanySelection();
  const features = getEmployeeFeatures(companyCode);
  const departments = features.departments;
  const levelsFromSettings = getLevelsFromHrSettings();

  const [step, setStep] = useState<"verification" | "form">(
    features.requireIdentityVerification ? "verification" : "form"
  );

  const [formData, setFormData] = useState<Record<string, any>>(DEFAULT_FORM);
  const [verifiedFields, setVerifiedFields] = useState<Record<string, boolean>>({});
  const [isPreFilled, setIsPreFilled] = useState(false);
  const [currentTabIndex, setCurrentTabIndex] = useState(0);
  const activeTab = TAB_ORDER[currentTabIndex] as TabName;
  const isLastTab = currentTabIndex === TAB_ORDER.length - 1;

  const [reportingManagers, setReportingManagers] = useState<any[]>([]);
  const [hrManagers, setHrManagers] = useState<any[]>([]);

  const [documents, setDocuments] = useState<Record<string, DocumentUpload>>({
    "NRC Copy":            { uploaded: false },
    "Offer Letter":        { uploaded: false },
    "Employment Contract": { uploaded: false },
    "NAPSA Certificate":   { uploaded: false },
  });
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

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

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      try {
        const res = await getAllEmployees(1, 200, "Active");
        const emps = res?.data?.employees ?? [];
        setReportingManagers(filterEmployeesByRole(emps, EMPLOYEE_ROLE_CONFIG.reportingManager));
        setHrManagers(filterEmployeesByRole(emps, EMPLOYEE_ROLE_CONFIG.hrManager));
      } catch { /* silent */ }
    })();
  }, [isOpen]);

  const handleInputChange = (field: string, value: any) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleNext = () => setCurrentTabIndex((p) => p + 1);
  const handlePrevious = () => setCurrentTabIndex((p) => p - 1);

  const handleSave = () => {
    onSubmit?.(formData);
    onSuccess?.();
    onClose();
  };

  const removeDocument = (key: string) =>
    setDocuments((prev) => ({ ...prev, [key]: { uploaded: false } }));

  const handleVerified = (data: any) => {
    setFormData((prev) => ({
      ...prev,
      nrcId:       data.identityInfo?.nrc || "",
      firstName:   data.personalInfo?.firstName || "",
      lastName:    data.personalInfo?.lastName || "",
      gender:      data.personalInfo?.gender || "",
      dateOfBirth: data.personalInfo?.dateOfBirth || "",
    }));
    setVerifiedFields({ nrcId: true, firstName: true, lastName: true, gender: true, dateOfBirth: true });
    setIsPreFilled(true);
    setStep("form");
  };

  if (!isOpen) return null;

  if (step === "verification" && features.requireIdentityVerification) {
    return (
      <IdentityVerificationModal
        isOpen={isOpen}
        onVerified={handleVerified}
        onManualEntry={() => { setIsPreFilled(false); setVerifiedFields({}); setStep("form"); }}
        onClose={onClose}
      />
    );
  }

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
                className="flex items-center gap-1 px-4 py-1.5 text-xs bg-primary text-white rounded-lg hover:opacity-90 transition font-semibold"
              >
                <FaCheck className="w-3 h-3" /> {editData ? "Update" : "Save"}
              </button>
            )}
          </div>
        </div>
      }
    >
      {/* Main split layout */}
      <div className="flex h-full overflow-hidden">

        {/* LEFT: Tabs + Form (flexible) */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">

          {/* Tab Bar */}
          <div className="flex border-b border-theme bg-card px-1 overflow-x-auto flex-shrink-0">
            {TAB_ORDER.map((tab, i) => {
              const done   = i < currentTabIndex;
              const active = i === currentTabIndex;
              const Icon   = TAB_ICONS[tab];
              return (
                <button
                  key={tab}
                  onClick={() => setCurrentTabIndex(i)}
                  className={`relative flex items-center gap-1 px-2.5 py-2 text-[10px] font-medium whitespace-nowrap transition flex-shrink-0 border-b-2 ${
                    active
                      ? "text-primary border-primary bg-primary/5"
                      : done
                      ? "text-emerald-600 border-transparent"
                      : "text-muted border-transparent hover:text-main hover:bg-app"
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{tab}</span>
                  {done && (
                    <span className="ml-0.5 w-3.5 h-3.5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-[7px]">
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto bg-app p-3">
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
        </div>

        {/* RIGHT: Summary Panel (fixed 260px) */}
        <div className="w-[260px] flex-shrink-0 border-l border-theme bg-card overflow-hidden">
          <EmployeeSummaryPanel formData={formData} />
        </div>

      </div>
    </MinimizableModal>
  );
};

export default AddEmployeeModal;