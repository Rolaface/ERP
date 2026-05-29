import React, { useState, useEffect } from "react";
import {
  showApiError,
  showSuccess,
  showLoading,
  closeSwal,
} from "../../../utils/alert";
import { ShieldCheck } from "lucide-react";
import { User, Briefcase, Banknote, FileText, Landmark } from "lucide-react";
import {
  uploadEmployeeDocument,
  getEmployeeDocuments,
} from "../../../api/employeedocument";
import { ERP_BASE } from "../../../config/api";
import { fmt } from "./detailtab/Employeehelpers";
import { EmployeeSidebar } from "./detailtab/Employeesidebar";
import { PersonalTab } from "./detailtab/Personaltab";
import { EmploymentTab } from "./detailtab/Employmenttab";
import { SalaryStructureAssignmentsSection } from "./detailtab/Compensationtab";
import EmployeeBankDetails from "./detailtab/EmployeeBank";
import { DocumentsTab, DocumentUploadModal } from "./detailtab/documenttab";
import { SalarySlipTable } from "./detailtab/Salaryslip";
import { StatutoryTab } from "./detailtab/StatutoryTab";
import { AppSubTabs } from "../../../components/ui/app-shell";

// ─── Tabs ─────────────────────────────────────────────────────────────────────

type TabId =
  | "personal"
  | "statutory"
  | "employment"
  | "compensation"
  | "BankAccount"
  | "salarySlip"
  | "documents";

const TABS = [
  { id: "personal",     label: "Personal",     icon: <User      size={14} /> },
  { id: "statutory",    label: "Statutory",    icon: <ShieldCheck size={14} /> },
  { id: "employment",   label: "Employment",   icon: <Briefcase size={14} /> },
  { id: "compensation", label: "Compensation", icon: <Banknote  size={14} /> },
  { id: "BankAccount",  label: "Bank Account", icon: <Landmark  size={14} /> },
  { id: "salarySlip",   label: "Salary Slip",  icon: <FileText  size={14} /> },
  { id: "documents",    label: "Documents",    icon: <FileText  size={14} /> },
];

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  employee: any;
  onBack?: () => void;
  onDocumentUploaded: () => Promise<void>;
  hideFinancialTabs?: boolean;
};

// ─── Component ────────────────────────────────────────────────────────────────

const EmployeeDetailView: React.FC<Props> = ({
  employee: emp,
  onBack,
  onDocumentUploaded,
  hideFinancialTabs = false,
}) => {
  const [activeTab,       setActiveTab]       = useState<TabId>("personal");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [documents,       setDocuments]       = useState<any[]>([]);

  const fullName = [emp.first_name, emp.middle_name, emp.last_name]
    .filter(Boolean).join(" ");
  const currency = fmt(emp.salary_currency) || "";

  const visibleTabs = hideFinancialTabs
    ? TABS.filter((t) => t.id !== "compensation" && t.id !== "salarySlip")
    : TABS;

  // ── Documents ─────────────────────────────────────────────────────────────

  const fetchDocuments = async () => {
    if (!emp.employee) return;
    try {
      const res = await getEmployeeDocuments(emp.employee);
      setDocuments(res?.message?.data || []);
    } catch {
      setDocuments([]);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [emp.employee]);

  // ── Document upload ────────────────────────────────────────────────────────

  const handleUploadDocument = async ({
    description,
    file,
  }: {
    description: string;
    file: File;
  }) => {
    try {
      showLoading("Uploading Document…");
      await uploadEmployeeDocument(emp.employee, description, file);
      await onDocumentUploaded();
      await fetchDocuments();
      closeSwal();
      showSuccess("Document uploaded successfully");
    } catch (error) {
      closeSwal();
      showApiError(error);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-1 min-h-0 gap-4">
      {/* Sidebar */}
      <div className="w-[256px] shrink-0 self-start sticky top-0">
        <EmployeeSidebar
          emp={emp}
          fullName={fullName}
          currency={currency}
          erpBase={ERP_BASE}
          onBack={onBack}
        />
      </div>

      {/* Detail panel */}
      <div className="flex flex-1 flex-col min-w-0 min-h-0 bg-card rounded-xl border border-[var(--border)] overflow-hidden">
        <AppSubTabs
          tabs={visibleTabs}
          activeTab={activeTab}
          onChange={(id) => setActiveTab(id as TabId)}
        />

        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === "personal"     && <PersonalTab emp={emp} fullName={fullName} />}
          {activeTab === "statutory"    && <StatutoryTab emp={emp} />}
          {activeTab === "employment"   && <EmploymentTab emp={emp} />}
          {activeTab === "compensation" && <SalaryStructureAssignmentsSection emp={emp} currency={currency} />}
          {activeTab === "BankAccount"  && <EmployeeBankDetails employeename={emp.employee} />}
          {activeTab === "salarySlip"   && (
            <SalarySlipTable employeeId={emp.employee} />  // ← self-fetching, no props needed
          )}
          {activeTab === "documents"    && (
            <DocumentsTab
              documents={documents}
              onOpenUploadModal={() => setShowUploadModal(true)}
              erpBase={ERP_BASE}
            />
          )}
        </div>
      </div>

      {showUploadModal && (
        <DocumentUploadModal
          onClose={() => setShowUploadModal(false)}
          onUpload={handleUploadDocument}
        />
      )}
    </div>
  );
};

export default EmployeeDetailView;