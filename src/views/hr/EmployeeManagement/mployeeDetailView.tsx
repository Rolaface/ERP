import React, { useState } from "react";
import {
  showApiError,
  showSuccess,
  showLoading,
  closeSwal,
} from "../../../utils/alert";
import {
  Eye,
  Download,
  Upload,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  DollarSign,
  FileText,
  X,
  User,
  Building2,
  CreditCard,
  Shield,
  ArrowLeft,
  Clock,
} from "lucide-react";
import { updateEmployeeDocuments } from "../../../api/employeeapi";
import { ERP_BASE } from "../../../config/api";

type Props = {
  employee: any; // flat API response from getEmployeeById
  onBack: () => void;
  onDocumentUploaded: () => Promise<void>;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const getFileUrl = (file?: string | null) =>
  file ? `${ERP_BASE}${file}` : null;

const fmt = (val: any) =>
  val !== null && val !== undefined && val !== "" ? String(val) : null;

const fmtDate = (val: any) => {
  if (!val) return null;
  try {
    return new Date(val).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return val;
  }
};

const fmtMoney = (val: any, currency = "ZMW") => {
  const n = Number(val);
  if (!n) return null;
  return `${currency} ${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
};

const initials = (emp: any) => {
  const f = (emp?.first_name?.[0] || "").toUpperCase();
  const l = (emp?.last_name?.[0] || "").toUpperCase();
  return f + l || "?";
};

// ── Sub-components ────────────────────────────────────────────────────────────

const Field = ({
  label,
  value,
  className = "",
  mono = false,
}: {
  label: string;
  value?: string | null;
  className?: string;
  mono?: boolean;
}) => (
  <div className={className}>
    <p className="text-[10px] uppercase tracking-wider text-muted font-semibold mb-0.5">
      {label}
    </p>
    <p
      className={`text-xs font-medium text-main ${mono ? "font-mono" : ""}`}
    >
      {value || <span className="text-muted italic font-normal">—</span>}
    </p>
  </div>
);

const Section = ({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div className="mb-5">
    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-theme">
      {icon && <span className="text-primary">{icon}</span>}
      <h3 className="text-[11px] font-bold text-main uppercase tracking-wider">
        {title}
      </h3>
    </div>
    {children}
  </div>
);

const QuickStat = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
}) => (
  <div className="flex items-start gap-2.5 py-2 border-b border-theme last:border-0">
    <div className="text-primary mt-0.5 flex-shrink-0 w-4">{icon}</div>
    <div className="flex-1 min-w-0">
      <p className="text-[9px] uppercase tracking-wider text-muted font-semibold">
        {label}
      </p>
      <p className="text-[11px] font-semibold text-main truncate">
        {value || "—"}
      </p>
    </div>
  </div>
);

// ── Document Upload Modal ─────────────────────────────────────────────────────

const DocumentUploadModal: React.FC<{
  onClose: () => void;
  onUpload: (payload: { description: string; file: File }) => Promise<void>;
}> = ({ onClose, onUpload }) => {
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!description || !file) return;
    try {
      setLoading(true);
      await onUpload({ description, file });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-card w-full max-w-md rounded-xl shadow-xl border border-theme">
        <div className="flex justify-between items-center px-5 py-3.5 border-b border-theme">
          <h3 className="text-sm font-semibold text-main">Upload Document</h3>
          <button
            onClick={onClose}
            className="text-muted hover:text-main transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="text-[10px] uppercase tracking-wider font-semibold text-muted">
              Document Name
            </label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full border border-theme rounded-lg px-3 py-2 text-xs bg-app text-main focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
              placeholder="e.g. NRC Copy, Offer Letter"
            />
          </div>

          <label className="block cursor-pointer">
            <div className="border-2 border-dashed border-theme rounded-lg p-5 text-center hover:border-primary/50 hover:bg-primary/5 transition">
              <Upload className="w-5 h-5 mx-auto text-primary mb-1.5" />
              <p className="text-xs text-muted">Click to select file</p>
              <p className="text-[10px] text-muted/60 mt-0.5">
                PDF, JPG, PNG — max 5MB
              </p>
            </div>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"
            />
          </label>

          {file && (
            <div className="flex items-center gap-2 text-xs bg-app border border-theme rounded-lg px-3 py-2">
              <FileText className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <span className="truncate flex-1 text-main font-medium">
                {file.name}
              </span>
              <span className="text-muted text-[10px]">
                {(file.size / 1024).toFixed(1)} KB
              </span>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 px-5 py-3.5 border-t border-theme bg-app rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs border border-theme rounded-lg hover:bg-app text-main transition"
          >
            Cancel
          </button>
          <button
            disabled={!description || !file || loading}
            onClick={handleSubmit}
            className="px-5 py-1.5 text-xs bg-primary text-white rounded-lg disabled:opacity-40 hover:opacity-90 transition font-semibold"
          >
            {loading ? "Uploading…" : "Upload"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Status helpers ────────────────────────────────────────────────────────────

const statusClasses: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
  inactive: "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700",
  suspended: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
  left: "bg-red-100 text-red-600 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
};

const getStatusClass = (status?: string) =>
  statusClasses[(status || "").toLowerCase()] ||
  "bg-gray-100 text-gray-600 border-gray-200";

// ── Main Component ────────────────────────────────────────────────────────────

type TabId = "personal" | "employment" | "compensation" | "documents";

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "personal", label: "Personal", icon: <User className="w-3.5 h-3.5" /> },
  { id: "employment", label: "Employment", icon: <Briefcase className="w-3.5 h-3.5" /> },
  { id: "compensation", label: "Compensation", icon: <DollarSign className="w-3.5 h-3.5" /> },
  { id: "documents", label: "Documents", icon: <FileText className="w-3.5 h-3.5" /> },
];

const EmployeeDetailView: React.FC<Props> = ({
  employee: emp,
  onBack,
  onDocumentUploaded,
}) => {
  const [activeTab, setActiveTab] = useState<TabId>("personal");
  const [showUploadModal, setShowUploadModal] = useState(false);

  // ── Derived display values from flat API ──────────────────────────────────

  const fullName = [emp.first_name, emp.middle_name, emp.last_name]
    .filter(Boolean)
    .join(" ");

  const currency = fmt(emp.salary_currency) || "ZMW";

  const handleUploadDocument = async ({
    description,
    file,
  }: {
    description: string;
    file: File;
  }) => {
    try {
      showLoading("Uploading Document…");
      const formData = new FormData();
      formData.append("employeeId", emp.employee);
      formData.append("name[0]", description);
      formData.append("description[0]", description);
      formData.append("file[0]", file);
      formData.append("isUpdate", "1");
      formData.append("isDelete", "0");
      await updateEmployeeDocuments(formData);
      await onDocumentUploaded();
      closeSwal();
      showSuccess("Document uploaded successfully");
    } catch (error) {
      closeSwal();
      showApiError(error);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-app">
      {/* ── Top bar ── */}
      <div className="bg-card border-b border-theme px-6 py-3 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:opacity-80 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Directory
        </button>

        <div className="flex items-center gap-3">
          <div>
            <p className="text-xs font-bold text-main text-right">{fullName}</p>
            <p className="text-[10px] text-muted text-right">
              {fmt(emp.designation)} · {fmt(emp.department)}
            </p>
          </div>
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusClass(emp.status)}`}
          >
            {emp.status || "—"}
          </span>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-[1400px] mx-auto px-6 py-5">
        <div className="grid grid-cols-12 gap-5">

          {/* ── LEFT SIDEBAR ── */}
          <div className="col-span-12 lg:col-span-3">
            <div className="bg-card rounded-xl border border-theme shadow-sm sticky top-4 overflow-hidden">

              {/* Avatar header */}
              <div className="bg-primary px-4 py-6 text-center relative">
                <div className="absolute inset-0 opacity-10"
                  style={{ backgroundImage: "radial-gradient(circle at 30% 20%, white 1px, transparent 1px), radial-gradient(circle at 70% 80%, white 1px, transparent 1px)", backgroundSize: "24px 24px" }}
                />
                {emp.image ? (
                  <img
                    src={getFileUrl(emp.image)!}
                    alt={fullName}
                    className="w-16 h-16 rounded-full object-cover mx-auto mb-2 ring-2 ring-white/40 shadow-lg"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-white text-xl font-bold mx-auto mb-2 ring-2 ring-white/30 shadow-lg">
                    {initials(emp)}
                  </div>
                )}
                <h3 className="text-white text-sm font-bold leading-snug">
                  {fullName}
                </h3>
                <p className="text-white/70 text-[11px] mt-0.5">
                  {fmt(emp.designation)}
                </p>
              </div>

              {/* Employee ID */}
              <div className="px-4 py-2.5 border-b border-theme bg-app text-center">
                <p className="text-[9px] uppercase tracking-widest text-muted font-bold mb-0.5">
                  Employee ID
                </p>
                <p className="text-sm font-mono font-bold text-primary">
                  {fmt(emp.employee) || "—"}
                </p>
              </div>

              {/* Quick stats */}
              <div className="px-4 py-2">
                <QuickStat
                  icon={<Mail className="w-3.5 h-3.5" />}
                  label="Work Email"
                  value={fmt(emp.company_email)}
                />
                <QuickStat
                  icon={<Phone className="w-3.5 h-3.5" />}
                  label="Phone"
                  value={fmt(emp.cell_number)}
                />
                <QuickStat
                  icon={<Building2 className="w-3.5 h-3.5" />}
                  label="Department"
                  value={fmt(emp.department)}
                />
                <QuickStat
                  icon={<Calendar className="w-3.5 h-3.5" />}
                  label="Joined"
                  value={fmtDate(emp.date_of_joining)}
                />
                <QuickStat
                  icon={<MapPin className="w-3.5 h-3.5" />}
                  label="Branch"
                  value={fmt(emp.branch)}
                />
              </div>

              {/* Salary pill */}
              <div className="px-4 pb-4">
                <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3">
                  <p className="text-[9px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold mb-1 flex items-center gap-1">
                    <DollarSign className="w-3 h-3" /> Gross / CTC
                  </p>
                  <p className="text-lg font-bold text-emerald-800 dark:text-emerald-200">
                    {fmtMoney(emp.ctc, currency) || "—"}
                  </p>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {fmt(emp.salary_mode)} · {fmt(emp.salary_structure)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT CONTENT ── */}
          <div className="col-span-12 lg:col-span-9 flex flex-col">

            {/* Tabs */}
            <div className="bg-card border border-theme border-b-0 rounded-t-xl px-4 pt-3 flex gap-0.5">
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

              {/* ── PERSONAL ── */}
              {activeTab === "personal" && (
                <div className="space-y-5">
                  <Section title="Personal Info" icon={<User className="w-3.5 h-3.5" />}>
                    <div className="grid grid-cols-3 gap-x-5 gap-y-4">
                      <Field label="Full Name" value={fullName} className="col-span-2" />
                      <Field label="Gender" value={fmt(emp.gender)} />
                      <Field label="Date of Birth" value={fmtDate(emp.date_of_birth)} />
                      <Field label="Marital Status" value={fmt(emp.marital_status)} />
                      <Field label="Blood Group" value={fmt(emp.blood_group)} />
                      <Field label="Salutation" value={fmt(emp.salutation)} />
                    </div>
                  </Section>

                  <Section title="Contact" icon={<Mail className="w-3.5 h-3.5" />}>
                    <div className="grid grid-cols-2 gap-x-5 gap-y-4">
                      <Field label="Personal Email" value={fmt(emp.personal_email)} />
                      <Field label="Company Email" value={fmt(emp.company_email)} />
                      <Field label="Cell Number" value={fmt(emp.cell_number)} />
                      <Field label="Preferred Email" value={fmt(emp.prefered_email) || fmt(emp.prefered_contact_email)} />
                      <Field label="Current Address" value={fmt(emp.current_address)} className="col-span-2" />
                      <Field label="Permanent Address" value={fmt(emp.permanent_address)} className="col-span-2" />
                    </div>
                  </Section>

                  <Section title="Emergency Contact" icon={<Shield className="w-3.5 h-3.5" />}>
                    <div className="grid grid-cols-3 gap-x-5 gap-y-4">
                      <Field label="Contact Name" value={fmt(emp.person_to_be_contacted)} />
                      <Field label="Relationship" value={fmt(emp.relation)} />
                      <Field label="Phone" value={fmt(emp.emergency_phone_number)} />
                    </div>
                  </Section>

                  <Section title="Identity & Compliance" icon={<CreditCard className="w-3.5 h-3.5" />}>
                    <div className="grid grid-cols-2 gap-x-5 gap-y-4">
                      <Field label="Passport Number" value={fmt(emp.passport_number)} mono />
                      <Field label="Place of Issue" value={fmt(emp.place_of_issue)} />
                      <Field label="Date of Issue" value={fmtDate(emp.date_of_issue)} />
                      <Field label="Valid Upto" value={fmtDate(emp.valid_upto)} />
                      <Field label="Health Insurance" value={fmt(emp.health_insurance_provider)} />
                      <Field label="Insurance No." value={fmt(emp.health_insurance_no)} mono />
                    </div>
                  </Section>
                </div>
              )}

              {/* ── EMPLOYMENT ── */}
              {activeTab === "employment" && (
                <div className="space-y-5">
                  <Section title="Role & Assignment" icon={<Briefcase className="w-3.5 h-3.5" />}>
                    <div className="grid grid-cols-2 gap-x-5 gap-y-4">
                      <Field label="Designation" value={fmt(emp.designation)} />
                      <Field label="Department" value={fmt(emp.department)} />
                      <Field label="Employment Type" value={fmt(emp.employment_type)} />
                      <Field label="Employee Type" value={fmt(emp.employee_type)} />
                      <Field label="Grade" value={fmt(emp.grade)} />
                      <Field label="Branch / Location" value={fmt(emp.branch)} />
                      <Field label="Reports To" value={fmt(emp.reports_to)} />
                      <Field label="Company" value={fmt(emp.company)} />
                    </div>
                  </Section>

                  <Section title="Dates & Contract" icon={<Calendar className="w-3.5 h-3.5" />}>
                    <div className="grid grid-cols-3 gap-x-5 gap-y-4">
                      <Field label="Date of Joining" value={fmtDate(emp.date_of_joining)} />
                      <Field label="Contract End" value={fmtDate(emp.contract_end_date)} />
                      <Field label="Notice Period" value={emp.notice_number_of_days ? `${emp.notice_number_of_days} days` : null} />
                      <Field label="Date of Retirement" value={fmtDate(emp.date_of_retirement)} />
                      <Field label="Relieving Date" value={fmtDate(emp.relieving_date)} />
                    </div>
                  </Section>

                  <Section title="Approvers" icon={<User className="w-3.5 h-3.5" />}>
                    <div className="grid grid-cols-3 gap-x-5 gap-y-4">
                      <Field label="Leave Approver" value={fmt(emp.leave_approver)} />
                      <Field label="Expense Approver" value={fmt(emp.expense_approver)} />
                      <Field label="Shift Approver" value={fmt(emp.shift_request_approver)} />
                    </div>
                  </Section>

                  <Section title="Leave" icon={<Clock className="w-3.5 h-3.5" />}>
                    <div className="grid grid-cols-2 gap-x-5 gap-y-4">
                      <Field label="Leave Policy" value={fmt(emp.leave_policy)} />
                      <Field label="Holiday List" value={fmt(emp.holiday_list)} />
                      <Field label="Default Shift" value={fmt(emp.default_shift)} />
                    </div>
                  </Section>
                </div>
              )}

              {/* ── COMPENSATION ── */}
              {activeTab === "compensation" && (
                <div className="space-y-5">
                  <Section title="Salary" icon={<DollarSign className="w-3.5 h-3.5" />}>
                    <div className="grid grid-cols-2 gap-x-5 gap-y-4">
                      <Field label="Salary Structure" value={fmt(emp.salary_structure)} />
                      <Field label="Currency" value={fmt(emp.salary_currency)} />
                      <Field label="Salary Mode" value={fmt(emp.salary_mode)} />
                      <Field
                        label="CTC / Gross"
                        value={fmtMoney(emp.ctc, currency)}
                      />
                    </div>

                    {/* CTC highlight bar */}
                    <div className="mt-4 flex items-center justify-between bg-primary/5 border border-primary/20 rounded-lg px-4 py-3">
                      <span className="text-xs font-semibold text-main">
                        Total CTC
                      </span>
                      <span className="text-base font-bold text-primary">
                        {fmtMoney(emp.ctc, currency) || "—"}
                      </span>
                    </div>
                  </Section>

                  <Section title="Bank Account" icon={<CreditCard className="w-3.5 h-3.5" />}>
                    <div className="grid grid-cols-2 gap-x-5 gap-y-4">
                      <Field label="Bank Name" value={fmt(emp.bank_name)} />
                      <Field label="Account Number" value={fmt(emp.bank_ac_no)} mono />
                      <Field label="Account Type" value={fmt(emp.account_type)} />
                      <Field label="Branch Code" value={fmt(emp.branch_code)} mono />
                    </div>
                  </Section>
                </div>
              )}

              {/* ── DOCUMENTS ── */}
              {activeTab === "documents" && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[11px] font-bold text-main uppercase tracking-wider">
                      Documents
                    </h3>
                    <button
                      onClick={() => setShowUploadModal(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg hover:opacity-90 transition"
                    >
                      <Upload className="w-3 h-3" />
                      Upload
                    </button>
                  </div>

                  {emp.documents && emp.documents.length > 0 ? (
                    <div className="space-y-2">
                      {emp.documents.map((doc: any) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-3 border border-theme rounded-lg hover:bg-app transition"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <FileText className="w-4 h-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-main truncate">
                                {doc.description || doc.file_name}
                              </p>
                              <p className="text-[10px] text-muted">
                                {doc.file_type || "Document"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 ml-3">
                            {doc.file ? (
                              <>
                                <button
                                  onClick={() =>
                                    window.open(getFileUrl(doc.file)!, "_blank")
                                  }
                                  className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition"
                                  title="View"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <a
                                  href={getFileUrl(doc.file)!}
                                  download
                                  className="p-1.5 text-muted hover:text-main hover:bg-app rounded-lg transition"
                                  title="Download"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </a>
                              </>
                            ) : (
                              <span className="text-[10px] text-muted italic">
                                No file
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-14">
                      <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-primary/5 flex items-center justify-center">
                        <FileText className="w-7 h-7 text-muted/30" />
                      </div>
                      <p className="text-xs font-semibold text-muted mb-1">
                        No documents yet
                      </p>
                      <p className="text-[10px] text-muted/60">
                        Click Upload to attach files
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
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