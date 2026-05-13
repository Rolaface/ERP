import React, { useState, useEffect } from "react";
import {
  showApiError,
  showSuccess,
  showLoading,
  closeSwal,
} from "../../../utils/alert";
import { ShieldCheck } from "lucide-react";
import { User, Briefcase, Banknote, FileText } from "lucide-react";
import {
  uploadEmployeeDocument,
  getEmployeeDocuments,
} from "../../../api/employeedocument";
import { ERP_BASE } from "../../../config/api";
import { fmt } from "./detailtab/Employeehelpers";
import { EmployeeSidebar } from "./detailtab/Employeesidebar";
import { PersonalTab } from "./detailtab/Personaltab";
import { EmploymentTab } from "./detailtab/Employmenttab";
import { CompensationTab } from "./detailtab/Compensationtab";
import { DocumentsTab, DocumentUploadModal } from "./detailtab/documenttab";
import { SalarySlipTable } from "./detailtab/Salaryslip";
import { getSalarySlipsByEmployee } from "../../../api/payroll/payrollEntryApi";
import { StatutoryTab } from "./detailtab/StatutoryTab";

// ── Use your existing AppSubTabs primitive ────────────────────────────────────
// AppSubTabs gives the same underline-tab style used throughout your app.
// Adjust path to wherever AppLayoutPrimitives lives in your project.
import { AppSubTabs } from "../../../components/ui/app-shell";

// ─── Tabs config ──────────────────────────────────────────────────────────────

type TabId =
  | "personal"
  | "statutory"
  | "employment"
  | "compensation"
  | "salarySlip"
  | "documents";

const TABS = [
  { id: "personal", label: "Personal", icon: <User size={14} /> },
  {
    id: "statutory",
    label: "Statutory",
    icon: <ShieldCheck size={14} />,
  },
  { id: "employment", label: "Employment", icon: <Briefcase size={14} /> },
  { id: "compensation", label: "Compensation", icon: <Banknote size={14} /> },
  { id: "salarySlip", label: "Salary Slip", icon: <FileText size={14} /> },
  { id: "documents", label: "Documents", icon: <FileText size={14} /> },
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
  const [activeTab, setActiveTab] = useState<TabId>("personal");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const [salarySlips, setSalarySlips] = useState<any[]>([]);
  const [salarySlipsLoading, setSalarySlipsLoading] = useState(false);

  const fullName = [emp.first_name, emp.middle_name, emp.last_name]
    .filter(Boolean)
    .join(" ");
  const currency = fmt(emp.salary_currency) || "";

   const visibleTabs = hideFinancialTabs
    ? TABS.filter((t) => t.id !== "compensation" && t.id !== "salarySlip")
    : TABS;

  // ── Data fetching ──────────────────────────────────────────────────────────

  const fetchDocuments = async () => {
    if (!emp.employee) return;
    try {
      const res = await getEmployeeDocuments(emp.employee);
      setDocuments(res?.message?.data || []);
    } catch {
      setDocuments([]);
    }
  };

  const fetchSalarySlips = async () => {
    if (!emp.employee) return;
    setSalarySlipsLoading(true);
    try {
      const res = await getSalarySlipsByEmployee(emp.employee);
      setSalarySlips(res || []);
    } catch {
      setSalarySlips([]);
    } finally {
      setSalarySlipsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
    fetchSalarySlips();
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

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    /*
     * Outer wrapper: flex row, fills whatever height the parent gives.
     * Parent (Employee Directory page) should already be AppPage + AppPageBody
     * so this just sits inside the body's flex-col.
     */
    <div className="flex flex-1 min-h-0 gap-4">
      {/* ── Sidebar — fixed width, sticky ─────────────────────────────────── */}
      <div className="w-[256px] shrink-0 self-start sticky top-0">
        <EmployeeSidebar
          emp={emp}
          fullName={fullName}
          currency={currency}
          erpBase={ERP_BASE}
          onBack={onBack}
        />
      </div>

      {/* ── Detail panel — grows, clips, scrolls internally ───────────────── */}
      <div className="flex flex-1 flex-col min-w-0 min-h-0 bg-card rounded-xl border border-[var(--border)] overflow-hidden">
        {/*
         * AppSubTabs — same underline style used in Employment Directory,
         * Payroll, etc. Zero extra styling needed; it matches out of the box.
         */}
        <AppSubTabs
          tabs={visibleTabs}  
          activeTab={activeTab}
          onChange={(id) => setActiveTab(id as TabId)}
        />

        {/* Scrollable tab body */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === "personal" && (
            <PersonalTab emp={emp} fullName={fullName} />
          )}
          {activeTab === "statutory" && <StatutoryTab emp={emp} />}
          {activeTab === "employment" && <EmploymentTab emp={emp} />}
          {activeTab === "compensation" && (
            <CompensationTab emp={emp} currency={currency} />
          )}
          {activeTab === "salarySlip" && (
            <SalarySlipTable slips={salarySlips} loading={salarySlipsLoading} />
          )}
          {activeTab === "documents" && (
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
