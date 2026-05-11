import React, { useState, useEffect } from "react";
import {
  showApiError,
  showSuccess,
  showLoading,
  closeSwal,
} from "../../../utils/alert";
import { User, Briefcase, DollarSign, FileText } from "lucide-react";
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
import { SalarySlipTab } from "./detailtab/Salaryslip";

// ─── Types ────────────────────────────────────────────────────────────────────

type TabId = "personal" | "employment" | "compensation" | "salarySlip" | "documents";

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "personal", label: "Personal", icon: <User className="w-3.5 h-3.5" /> },
  {
    id: "employment",
    label: "Employment",
    icon: <Briefcase className="w-3.5 h-3.5" />,
  },
  {
    id: "compensation",
    label: "Compensation",
    icon: <DollarSign className="w-3.5 h-3.5" />,
  },
  {
    id: "salarySlip",
    label: "Salary Slip",
    icon: <FileText className="w-3.5 h-3.5" />,
  },
  {
    id: "documents",
    label: "Documents",
    icon: <FileText className="w-3.5 h-3.5" />,
  },
];

type Props = {
  employee: any;
  onBack?: () => void;  // Made optional since it's not used
  onDocumentUploaded: () => Promise<void>;
};

// ─── Component ────────────────────────────────────────────────────────────────

const EmployeeDetailView: React.FC<Props> = ({
  employee: emp,
  onDocumentUploaded,
}) => {
  const [activeTab, setActiveTab] = useState<TabId>("personal");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  
  // State for payroll entry (you need to fetch this or get from props)
  const [payrollEntryId, setPayrollEntryId] = useState<string>("");
  
  // Transform employee data to match what SalarySlipTab expects
  const selectedEmployee = {
    employee: emp.employee,
    employee_name: [emp.first_name, emp.middle_name, emp.last_name].filter(Boolean).join(" "),
    designation: emp.designation || "N/A",
    department: emp.department || "N/A",
    salary_structure: emp.salary_structure || "Standard",
    // Add other fields as needed by SalarySlipTab
  };

  const fullName = [emp.first_name, emp.middle_name, emp.last_name]
    .filter(Boolean)
    .join(" ");

  const currency = fmt(emp.salary_currency) || "ZMW";

  // ── Document logic ─────────────────────────────────────────────────────────

  const fetchDocuments = async () => {
    if (!emp.employee) return;
    try {
      const res = await getEmployeeDocuments(emp.employee);
      setDocuments(res?.message?.data || []);
    } catch (error) {
      console.error(error);
      setDocuments([]);
    }
  };

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

  // Fetch payroll entry ID - you need to implement this based on your API
  useEffect(() => {
    const fetchPayrollEntry = async () => {
      try {
        // Option 1: If your employee object already has payroll entry info
        if (emp.current_payroll_entry) {
          setPayrollEntryId(emp.current_payroll_entry);
        }
        // Option 2: Fetch from API based on employee ID
        // const entry = await getCurrentPayrollEntry(emp.employee);
        // setPayrollEntryId(entry.name);
        
        // Option 3: If no payroll entry exists, you might want to show a message
        // or let the SalarySlipTab handle it internally
      } catch (error) {
        console.error("Error fetching payroll entry:", error);
      }
    };
    
    fetchPayrollEntry();
    fetchDocuments();
  }, [emp.employee, emp.current_payroll_entry]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-app">
      <div className="max-w-[1400px] mx-auto px-4 pt-[-2px] pb-4">
        <div className="grid grid-cols-12 gap-4 items-start">
          {/* ── LEFT SIDEBAR ── */}
          <div className="col-span-12 lg:col-span-3">
            <EmployeeSidebar
              emp={emp}
              fullName={fullName}
              currency={currency}
              erpBase={ERP_BASE}
            />
          </div>

          {/* ── RIGHT CONTENT ── */}
          <div className="col-span-12 lg:col-span-9 flex flex-col">
            {/* Tab strip */}
            <div className="bg-card border border-theme border-b-0 rounded-t-xl px-4 pt-3 flex gap-0.5 overflow-x-auto">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 text-[11px] font-semibold rounded-t-lg transition-all whitespace-nowrap border-b-2 ${
                    activeTab === tab.id
                      ? "text-primary border-primary bg-app"
                      : "text-muted border-transparent hover:text-main"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab body */}
            <div
              className="bg-card border border-theme rounded-b-xl rounded-tr-xl shadow-sm flex-1 overflow-y-auto p-5"
              style={{ maxHeight: "calc(100vh - 210px)" }}
            >
              {activeTab === "personal" && (
                <PersonalTab emp={emp} fullName={fullName} />
              )}
              {activeTab === "employment" && <EmploymentTab emp={emp} />}
              {activeTab === "compensation" && (
                <CompensationTab emp={emp} currency={currency} />
              )}
             {activeTab === "salarySlip" && (
  <SalarySlipTab employee={{
    employee: emp.employee,
    employee_name: fullName,
    designation: emp.designation,
    department: emp.department
  }} />
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
        </div>
      </div>

      {/* ── Upload Modal ── */}
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