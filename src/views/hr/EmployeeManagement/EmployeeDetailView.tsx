import React, { useMemo, useState } from "react";
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
  Briefcase,
  DollarSign,
  FileText,
  X,
  User,
  Building2,
  ChevronLeft,
  Clock,
  TrendingUp,
  CreditCard as BankIcon,
  Edit2,
} from "lucide-react";
import { updateEmployeeDocuments, updateEmployeeProfilePhoto } from "../../../api/employeeapi";
import { ERP_BASE } from "../../../config/api";
import { useAssignedSalaryStructure } from "../../../hooks/useAssignedSalaryStructure";
import { toSalaryStructureMoneyRows } from "../../../utils/salaryStructureDisplay";

type Props = {
  employee: any;
  onBack: () => void;
  onDocumentUploaded: () => Promise<void>;
};

const toTitle = (key: string) =>
  String(key ?? "")
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (c) => c.toUpperCase());

const getFileUrl = (file?: string | null) => {
  if (!file) return null;
  return `${ERP_BASE}${file}`;
};

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
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card w-full max-w-md rounded-lg shadow-xl border border-border overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 border-b border-border">
          <h3 className="text-sm font-bold text-main flex items-center gap-2">
            <Upload className="w-4 h-4 text-muted" />
            Upload Document
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-muted/10 transition-colors"
          >
            <X className="w-4 h-4 text-muted hover:text-main" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="text-xs font-semibold text-main mb-1.5 block">
              Document Description
            </label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-background text-main"
              placeholder="e.g. NRC, Offer Letter, Resume"
            />
          </div>

          <label className="block group">
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
              <Upload className="w-5 h-5 text-muted mx-auto mb-2 group-hover:text-primary transition-colors" />
              <p className="text-sm font-medium text-main mb-1">
                Click to upload or drag & drop
              </p>
              <p className="text-xs text-muted">PDF, JPG, PNG (max 5MB)</p>
            </div>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"
            />
          </label>

          {file && (
            <div className="flex items-center gap-3 bg-muted/5 border border-border rounded-md px-3 py-2">
              <FileText className="w-4 h-4 text-muted" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-main truncate">
                  {file.name}
                </p>
                <p className="text-xs text-muted">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setFile(null);
                }}
                className="p-1 hover:bg-background rounded"
              >
                <X className="w-3.5 h-3.5 text-muted hover:text-red-500" />
              </button>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 bg-muted/5 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium border border-border rounded-md hover:bg-background transition-colors"
          >
            Cancel
          </button>
          <button
            disabled={!description || !file || loading}
            onClick={handleSubmit}
            className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-md disabled:opacity-50 hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            {loading ? "Uploading..." : "Upload Document"}
          </button>
        </div>
      </div>
    </div>
  );
};

const ProfilePhotoUploadModal: React.FC<{
  onClose: () => void;
  onUpload: (file: File) => Promise<void>;
}> = ({ onClose, onUpload }) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (selectedFile: File | null) => {
    setFile(selectedFile);
    if (selectedFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }
  };

  const handleSubmit = async () => {
    if (!file) return;

    try {
      setLoading(true);
      await onUpload(file);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card w-full max-w-md rounded-lg shadow-xl border border-border overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 border-b border-border">
          <h3 className="text-sm font-bold text-main flex items-center gap-2">
            <Upload className="w-4 h-4 text-muted" />
            Update Profile Photo
          </h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted/10 transition-colors">
            <X className="w-4 h-4 text-muted hover:text-main" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {preview && (
            <div className="flex justify-center mb-4">
              <div className="w-24 h-24 bg-muted/10 border border-border rounded-full flex items-center justify-center overflow-hidden">
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              </div>
            </div>
          )}

          <label className="block group">
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
              <Upload className="w-5 h-5 text-muted mx-auto mb-2 group-hover:text-primary transition-colors" />
              <p className="text-sm font-medium text-main mb-1">
                Click to upload or drag & drop
              </p>
              <p className="text-xs text-muted">
                JPG, PNG (max 5MB)
              </p>
            </div>
            <input
              type="file"
              accept=".jpg,.jpeg,.png"
              onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
              className="hidden"
            />
          </label>

          {file && (
            <div className="flex items-center gap-3 bg-muted/5 border border-border rounded-md px-3 py-2">
              <FileText className="w-4 h-4 text-muted" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-main truncate">{file.name}</p>
                <p className="text-xs text-muted">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <button onClick={(e) => { e.preventDefault(); handleFileChange(null); }} className="p-1 hover:bg-background rounded">
                <X className="w-3.5 h-3.5 text-muted hover:text-red-500" />
              </button>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 bg-muted/5 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium border border-border rounded-md hover:bg-background transition-colors"
          >
            Cancel
          </button>
          <button
            disabled={!file || loading}
            onClick={handleSubmit}
            className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-md disabled:opacity-50 hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            {loading ? "Uploading..." : "Update Photo"}
          </button>
        </div>
      </div>
    </div>
  );
};

const EmployeeDetailView: React.FC<Props> = ({
  employee,
  onBack,
  onDocumentUploaded,
}) => {
  const [activeTab, setActiveTab] = useState<
    "personal" | "employment" | "compensation" | "documents"
  >("personal");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showProfilePhotoModal, setShowProfilePhotoModal] = useState(false);

  const {
    status,
    identityInfo,
    personalInfo,
    contactInfo,
    employmentInfo,
    payrollInfo,
    documents,
    leaveInfo,
  } = employee;

  const profilePhotoUrl = useMemo(() => {
    const docs = Array.isArray(documents) ? documents : [];
    const profileDoc = docs.find((d: any) => {
      const desc = String(d?.description ?? d?.name ?? "")
        .trim()
        .toLowerCase();
      return desc === "profile photo";
    });

    const file = profileDoc?.file ? String(profileDoc.file) : "";
    return getFileUrl(file) || null;
  }, [documents]);

  const employeeCode = String(
    employee?.employeeId ??
      employmentInfo?.employeeId ??
      identityInfo?.EmployeeId ??
      employee?.id ??
      "",
  ).trim();

  const {
    assignedSalaryStructureName,
    assignedSalaryStructureFromDate,
    salaryStructureDetail,
  } = useAssignedSalaryStructure(employeeCode);

  const hasStructureEarnings = useMemo(() => {
    const earnings = Array.isArray(salaryStructureDetail?.earnings)
      ? salaryStructureDetail.earnings
      : [];
    return earnings.length > 0;
  }, [salaryStructureDetail]);

  const hasStructureDeductions = useMemo(() => {
    const deductions = Array.isArray(salaryStructureDetail?.deductions)
      ? salaryStructureDetail.deductions
      : [];
    return deductions.length > 0;
  }, [salaryStructureDetail]);

  const salaryBreakdownRows = useMemo(() => {
    const currency = String(payrollInfo?.currency ?? "ZMW").trim() || "ZMW";

    const breakdown = payrollInfo?.salaryBreakdown ?? payrollInfo?.SalaryBreakdown ?? null;
    if (Array.isArray(breakdown)) {
      const rows = breakdown
        .map((x: any) => ({
          label: String(x?.label ?? x?.name ?? "").trim(),
          amount: x?.amount,
          currency,
        }))
        .filter((x: any) => x.label && x.amount !== undefined && x.amount !== null);
      if (rows.length > 0) return rows;
    }

    if (breakdown && typeof breakdown === "object") {
      const rows = Object.entries(breakdown)
        .map(([k, v]) => ({
          label: toTitle(k),
          amount: v,
          currency,
        }))
        .filter((x: any) => x.label && x.amount !== undefined && x.amount !== null);
      if (rows.length > 0) return rows;
    }

    const earnings = Array.isArray(salaryStructureDetail?.earnings) ? salaryStructureDetail.earnings : [];
    if (earnings.length > 0) {
      return earnings
        .map((e: any) => ({
          label: String(e?.component ?? "").trim(),
          amount: e?.amount,
          currency,
        }))
        .filter(
          (r: any) => r.label && r.amount !== undefined && r.amount !== null,
        );
    }
    return [];
  }, [payrollInfo?.currency, payrollInfo?.salaryBreakdown, salaryStructureDetail]);

  const statutoryDeductionRows = useMemo(() => {
    const currency = String(payrollInfo?.currency ?? "ZMW").trim() || "ZMW";
    const raw = payrollInfo?.statutoryDeductions ?? payrollInfo?.StatutoryDeductions ?? null;
    const obj = raw && typeof raw === "object" ? raw : {};

    const keyMap: Record<string, string> = {
      employeenapsa: "NAPSA Employee",
      employeernapsa: "NAPSA Employer",
      employeenhima: "NHIMA Employee",
      employeernhima: "NHIMA Employer",
      payasyouearn: "PAYE",
      paye: "PAYE",
    };

    return Object.entries(obj as any)
      .map(([k, v]) => {
        const lk = String(k ?? "").replace(/\s+/g, "").toLowerCase();
        const label = keyMap[lk] ?? toTitle(k);
        return {
          label,
          amount: Number(v ?? 0),
          currency,
          rawKey: lk,
        };
      })
      .filter((r) => r.label && Number.isFinite(r.amount));
  }, [payrollInfo?.currency, payrollInfo?.statutoryDeductions]);

  const employeeDeductionRows = useMemo(() => {
    const keep = new Set(["employeenapsa", "employeenhima", "payasyouearn", "paye"]);
    return statutoryDeductionRows.filter((r: any) => keep.has(String(r.rawKey ?? "")));
  }, [statutoryDeductionRows]);

  const hasPayrollEmployeeDeductions = useMemo(() => {
    return employeeDeductionRows.some((r: any) => Number(r?.amount ?? 0) !== 0);
  }, [employeeDeductionRows]);

  const compensationHeader = useMemo(() => {
    const currency = String(payrollInfo?.currency ?? "ZMW").trim() || "ZMW";
    const structureName = String(assignedSalaryStructureName ?? "").trim();
    const fromDate = String(assignedSalaryStructureFromDate ?? "").trim();

    const payrollGross = Number(payrollInfo?.grossSalary ?? 0);
    const payrollRowsSum = salaryBreakdownRows.reduce(
      (s: number, r: any) => s + Number(r?.amount ?? 0),
      0,
    );
    const payrollEarnings = payrollGross > 0 ? payrollGross : payrollRowsSum;
    const payrollDeductions = employeeDeductionRows.reduce(
      (s: number, r: any) => s + Number(r?.amount ?? 0),
      0,
    );
    const hasPayroll = payrollEarnings > 0 || payrollDeductions > 0;

    const earnings = Array.isArray((salaryStructureDetail as any)?.earnings)
      ? (salaryStructureDetail as any).earnings
      : [];
    const deductions = Array.isArray(salaryStructureDetail?.deductions)
      ? salaryStructureDetail.deductions
      : [];
    const totalEarnings = hasPayroll
      ? payrollEarnings
      : earnings.length > 0
        ? earnings.reduce((s: number, r: any) => s + Number(r?.amount ?? 0), 0)
        : payrollRowsSum;
    const totalDeductions = hasPayroll
      ? payrollDeductions
      : deductions.length > 0
        ? deductions.reduce((s: number, r: any) => s + Number(r?.amount ?? 0), 0)
        : payrollDeductions;
    const net = (Number(totalEarnings ?? 0) || 0) - (Number(totalDeductions ?? 0) || 0);

    return {
      currency,
      structureName,
      fromDate,
      totalEarnings,
      totalDeductions,
      net,
    };
  }, [
    assignedSalaryStructureFromDate,
    assignedSalaryStructureName,
    employeeDeductionRows,
    payrollInfo?.grossSalary,
    payrollInfo?.currency,
    salaryBreakdownRows,
    salaryStructureDetail,
  ]);

  const getStatusBadge = () => {
    const statusLower = status?.toLowerCase() || "";
    if (statusLower === "active")
      return "bg-green-50 text-green-700 border-green-200";
    if (statusLower === "inactive" || statusLower === "terminated")
      return "bg-red-50 text-red-700 border-red-200";
    if (statusLower === "on leave")
      return "bg-yellow-50 text-yellow-700 border-yellow-200";
    return "bg-gray-50 text-gray-700 border-gray-200";
  };

  const handleUploadDocument = async ({
    description,
    file,
  }: {
    description: string;
    file: File;
  }) => {
    try {
      showLoading("Uploading Document...");

      const formData = new FormData();
      formData.append("employeeId", employee.id);
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

  const handleUploadProfilePhoto = async (file: File) => {
    try {
      showLoading("Uploading Profile Photo...");

      await updateEmployeeProfilePhoto(employee.id, file);

      await onDocumentUploaded();

      closeSwal();
      showSuccess("Profile photo updated successfully");
    } catch (error) {
      closeSwal();
      showApiError(error);
    }
  };

  const tabs = [
    {
      id: "personal",
      label: "Personal Info",
      icon: <User className="w-4 h-4" />,
    },
    {
      id: "employment",
      label: "Employment",
      icon: <Briefcase className="w-4 h-4" />,
    },
    {
      id: "compensation",
      label: "Compensation",
      icon: <DollarSign className="w-4 h-4" />,
    },
    {
      id: "documents",
      label: "Documents",
      icon: <FileText className="w-4 h-4" />,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Structural Header */}
      <div className="bg-card border-b border-border px-8 py-4 sticky top-0 z-10">
        <button
          onClick={onBack}
          className="group flex items-center gap-1.5 text-muted hover:text-main text-sm font-medium transition-colors mb-4"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Directory
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative group w-14 h-14">
              <div className="w-14 h-14 bg-muted/10 border border-border rounded-full flex items-center justify-center overflow-hidden">
                {profilePhotoUrl ? (
                  <img src={profilePhotoUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-primary text-xl font-bold">
                    {personalInfo?.FirstName?.[0]}
                    {personalInfo?.LastName?.[0]}
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowProfilePhotoModal(true)}
                className="absolute -bottom-1 -right-1 p-1.5 bg-primary text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-primary/90"
                title="Edit profile photo"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <div>
              <h1 className="text-xl font-bold text-main">
                {personalInfo?.FirstName} {personalInfo?.LastName}
              </h1>
              <div className="flex items-center gap-3 mt-1 text-sm text-muted">
                <span className="flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5" />
                  {employmentInfo?.JobTitle || "—"}
                </span>
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" />
                  {employmentInfo?.Department || "—"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`px-2.5 py-1 rounded text-xs font-medium border ${getStatusBadge()}`}
            >
              {status}
            </div>
            <div className="px-2.5 py-1 rounded text-xs font-mono font-medium bg-muted/10 border border-border text-main">
              ID: {employeeCode || "—"}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Sidebar Info Cards */}
          <div className="lg:col-span-4 xl:col-span-3 space-y-6">
            {/* Quick Contact Card */}
            <div className="bg-card rounded-lg border border-border p-5">
              <h3 className="text-sm font-bold text-main mb-4 border-b border-border pb-2">
                Contact Info
              </h3>
              <div className="space-y-4">
                <QuickDetail
                  icon={<Mail className="w-3.5 h-3.5" />}
                  label="Email"
                  value={contactInfo?.workEmail}
                />
                <QuickDetail
                  icon={<Phone className="w-3.5 h-3.5" />}
                  label="Phone"
                  value={contactInfo?.phoneNumber}
                />
                <QuickDetail
                  icon={<MapPin className="w-3.5 h-3.5" />}
                  label="Location"
                  value={employmentInfo?.workLocation}
                />
              </div>
            </div>

            {/* KPI Cards Striped Back */}
            <div className="bg-card rounded-lg border border-border p-5">
              <h3 className="text-sm font-bold text-main mb-4 border-b border-border pb-2">
                Compensation Summary
              </h3>
              <div className="mb-4">
                <p className="text-xs text-muted mb-1">Gross Salary</p>
                <p className="text-xl font-bold text-main">
                  {payrollInfo?.currency}{" "}
                  {Number(payrollInfo?.grossSalary || 0).toLocaleString()}
                </p>
                <p className="text-xs text-muted mt-0.5">
                  {payrollInfo?.paymentFrequency || "Monthly"}
                </p>
              </div>

              {leaveInfo && (
                <div className="pt-4 border-t border-border">
                  <p className="text-xs text-muted mb-1">Leave Balance</p>
                  <p className="text-xl font-bold text-main">
                    {leaveInfo?.openingLeaveBalance || "0"}{" "}
                    <span className="text-sm font-normal text-muted">Days</span>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Content Area */}
          <div className="lg:col-span-8 xl:col-span-9">
            {/* Clean Tabs */}
            <div className="flex overflow-x-auto border-b border-border mb-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? "border-primary text-primary"
                      : "border-transparent text-muted hover:text-main hover:border-border"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content Container */}
            <div className="bg-card rounded-lg border border-border p-6 md:p-8 min-h-[500px]">
              {/* PERSONAL TAB */}
              {activeTab === "personal" && (
                <div className="space-y-8 max-w-4xl">
                  <section>
                    <h2 className="text-sm font-bold text-main uppercase tracking-wider mb-4 text-muted border-b border-border pb-2">
                      Personal Information
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-8">
                      <CleanField
                        label="Full Name"
                        value={`${personalInfo?.FirstName} ${personalInfo?.OtherNames || ""} ${personalInfo?.LastName}`}
                      />
                      <CleanField label="Gender" value={personalInfo?.Gender} />
                      <CleanField
                        label="Date of Birth"
                        value={personalInfo?.Dob}
                      />
                      <CleanField
                        label="Marital Status"
                        value={personalInfo?.maritalStatus}
                      />
                      <CleanField
                        label="Nationality"
                        value={personalInfo?.Nationality}
                      />
                    </div>
                  </section>

                  <section>
                    <h2 className="text-sm font-bold text-main uppercase tracking-wider mb-4 text-muted border-b border-border pb-2">
                      Contact Details
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                      <CleanField
                        label="Work Email"
                        value={contactInfo?.workEmail}
                      />
                      <CleanField
                        label="Personal Email"
                        value={contactInfo?.Email}
                      />
                      <CleanField
                        label="Phone"
                        value={contactInfo?.phoneNumber}
                      />
                      <CleanField
                        label="Alt. Phone"
                        value={contactInfo?.alternatePhone}
                      />
                      <CleanField
                        className="md:col-span-2"
                        label="Current Address"
                        value={`${contactInfo?.address?.street || ""}, ${contactInfo?.address?.city || ""}`}
                      />
                    </div>
                  </section>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <section>
                      <h2 className="text-sm font-bold text-main uppercase tracking-wider mb-4 text-muted border-b border-border pb-2">
                        Emergency Contact
                      </h2>
                      <div className="space-y-4">
                        <CleanField
                          label="Name"
                          value={contactInfo?.emergencyContact?.name}
                        />
                        <CleanField
                          label="Relationship"
                          value={contactInfo?.emergencyContact?.relationship}
                        />
                        <CleanField
                          label="Phone"
                          value={contactInfo?.emergencyContact?.phone}
                        />
                      </div>
                    </section>

                    <section>
                      <h2 className="text-sm font-bold text-main uppercase tracking-wider mb-4 text-muted border-b border-border pb-2">
                        Compliance IDs
                      </h2>
                      <div className="grid grid-cols-2 gap-y-4 gap-x-4">
                        <CleanField
                          label="NRC ID"
                          value={identityInfo?.NrcId}
                        />
                        <CleanField label="TPIN" value={identityInfo?.TpinId} />
                        <CleanField
                          label="NAPSA"
                          value={identityInfo?.SocialSecurityNapsa}
                        />
                        <CleanField
                          label="NHIMA"
                          value={identityInfo?.NhimaHealthInsurance}
                        />
                      </div>
                    </section>
                  </div>
                </div>
              )}

              {/* EMPLOYMENT TAB */}
              {activeTab === "employment" && (
                <div className="space-y-8 max-w-4xl">
                  <section>
                    <h2 className="text-sm font-bold text-main uppercase tracking-wider mb-4 text-muted border-b border-border pb-2">
                      Employment Details
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-8">
                      <CleanField
                        label="Employee Type"
                        value={employmentInfo?.EmployeeType}
                      />
                      <CleanField
                        label="Reporting Manager"
                        value={employmentInfo?.reportingManager}
                      />
                      <CleanField
                        label="Joining Date"
                        value={employmentInfo?.joiningDate}
                      />
                      <CleanField
                        label="Probation Length"
                        value={employmentInfo?.probationPeriod}
                      />
                      <CleanField
                        label="Contract End"
                        value={employmentInfo?.contractEndDate}
                      />
                      <CleanField
                        label="Work Shift"
                        value={employmentInfo?.shift}
                      />
                      <CleanField
                        className="md:col-span-2 lg:col-span-3"
                        label="Work Address"
                        value={employmentInfo?.workAddress}
                      />
                    </div>
                  </section>

                  {employmentInfo?.weeklySchedule && (
                    <section>
                      <h2 className="text-sm font-bold text-main uppercase tracking-wider mb-4 text-muted border-b border-border pb-2">
                        Weekly Schedule
                      </h2>
                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-4">
                        {[
                          "monday",
                          "tuesday",
                          "wednesday",
                          "thursday",
                          "friday",
                          "saturday",
                          "sunday",
                        ].map((day) => (
                          <div key={day}>
                            <span className="text-xs text-muted capitalize block mb-1">
                              {day}
                            </span>
                            <span className="text-sm font-medium text-main">
                              {employmentInfo.weeklySchedule[day] || "Off"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {leaveInfo && (
                    <section>
                      <h2 className="text-sm font-bold text-main uppercase tracking-wider mb-4 text-muted border-b border-border pb-2">
                        Leave Policy Setup
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-y-6 gap-x-8">
                        <CleanField
                          label="Opening Balance"
                          value={`${leaveInfo?.openingLeaveBalance} Days`}
                        />
                        <CleanField
                          label="Monthly Accrual Rate"
                          value={`${leaveInfo?.initialLeaveRateMonthly} days/month`}
                        />
                        <CleanField
                          label="Ceiling Amount"
                          value={`${leaveInfo?.ceilingAmount} days (${leaveInfo?.ceilingYear})`}
                        />
                      </div>
                    </section>
                  )}
                </div>
              )}

              {/* COMPENSATION TAB */}
              {activeTab === "compensation" && (
                <div className="space-y-8 max-w-4xl">
                  {/* Clean Salary Header */}
                  <div className="bg-muted/5 border border-border rounded-lg p-6">
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                      <div>
                        <p className="text-xs text-muted uppercase tracking-wider font-semibold mb-1">
                          Assigned Salary Structure
                        </p>
                        <h2 className="text-xl font-bold text-main">
                          {compensationHeader.structureName ||
                            "No Structure Assigned"}
                        </h2>
                        {compensationHeader.fromDate && (
                          <p className="text-sm text-muted mt-1">
                            Effective from: {compensationHeader.fromDate}
                          </p>
                        )}
                      </div>

                      <div className="md:text-right">
                        <p className="text-xs text-muted uppercase tracking-wider font-semibold mb-1">
                          Net Monthly
                        </p>
                        <h3 className="text-2xl font-bold text-main tabular-nums">
                          {compensationHeader.currency}{" "}
                          {Number(compensationHeader.net || 0).toLocaleString()}
                        </h3>
                        <div className="flex md:justify-end gap-6 mt-2 text-sm">
                          <div>
                            <span className="text-muted mr-1">Gross:</span>
                            <span className="font-medium">
                              {Number(
                                compensationHeader.totalEarnings || 0,
                              ).toLocaleString()}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted mr-1">Deductions:</span>
                            <span className="font-medium text-red-600 border-red-200">
                              {Number(
                                compensationHeader.totalDeductions || 0,
                              ).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Earnings */}
                    <section>
                      <h2 className="text-sm font-bold text-main uppercase tracking-wider mb-4 text-muted border-b border-border pb-2">
                        Earnings & Allowances
                      </h2>
                      <div className="space-y-0 text-sm">
                        {salaryBreakdownRows.length === 0 ? (
                          <div className="text-muted font-medium py-2">—</div>
                        ) : (
                          salaryBreakdownRows.map((row: any) => (
                            <div
                              key={row.label}
                              className="flex justify-between py-2.5 border-b border-border/50"
                            >
                              <span className="text-main">{row.label}</span>
                              <span className="font-medium text-main">
                                {row.currency}{" "}
                                {Number(row.amount ?? 0).toLocaleString()}
                              </span>
                            </div>
                          ))
                        )}
                        <div className="flex justify-between py-3 font-bold mt-2">
                          <span className="text-main">Total Gross</span>
                          <span className="text-main">
                            {compensationHeader.currency}{" "}
                            {Number(
                              compensationHeader.totalEarnings || 0,
                            ).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </section>

                    {/* Deductions */}
                    <section>
                      <h2 className="text-sm font-bold text-main uppercase tracking-wider mb-4 text-muted border-b border-border pb-2">
                        Statutory & Deductions
                      </h2>
                      <div className="space-y-0 text-sm">
                        {hasPayrollEmployeeDeductions ? (
                          employeeDeductionRows.map((d: any) => (
                            <div key={d.label} className="flex justify-between py-2.5 border-b border-border/50">
                              <span className="text-main">{d.label}</span>
                              <span className="font-medium text-main">
                                - {d.currency} {Number(d.amount ?? 0).toLocaleString()}
                              </span>
                            </div>
                          ))
                        ) : hasStructureDeductions ? (
                          toSalaryStructureMoneyRows((salaryStructureDetail as any).deductions).map((d: any) => (
                            <div key={d.label} className="flex justify-between py-2.5 border-b border-border/50">
                              <span className="text-main">{d.label}</span>
                              <span className="font-medium text-main">
                                - {payrollInfo?.currency || "ZMW"} {Number(d.amount ?? 0).toLocaleString()}
                              </span>
                            </div>
                          ))
                        ) : employeeDeductionRows.length === 0 ? (
                          <div className="text-muted font-medium py-2">—</div>
                        ) : (
                          employeeDeductionRows.map((d: any) => (
                            <div key={d.label} className="flex justify-between py-2.5 border-b border-border/50">
                              <span className="text-main">{d.label}</span>
                              <span className="font-medium text-main">
                                - {d.currency} {Number(d.amount ?? 0).toLocaleString()}
                              </span>
                            </div>
                          ))
                        )}
                        <div className="flex justify-between py-3 font-bold mt-2">
                          <span className="text-main">Total Deductions</span>
                          <span className="text-main">
                            - {compensationHeader.currency}{" "}
                            {Number(
                              compensationHeader.totalDeductions || 0,
                            ).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </section>
                  </div>

                  <section>
                    <h2 className="text-sm font-bold text-main uppercase tracking-wider mb-4 text-muted border-b border-border pb-2">
                      Bank Details
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-8">
                      <CleanField
                        label="Account Name"
                        value={payrollInfo?.bankAccount?.AccountName}
                      />
                      <CleanField
                        label="Account Number"
                        value={payrollInfo?.bankAccount?.AccountNumber}
                      />
                      <CleanField
                        label="Bank Name"
                        value={payrollInfo?.bankAccount?.BankName}
                      />
                      <CleanField
                        label="Branch Code"
                        value={payrollInfo?.bankAccount?.branchCode}
                      />
                      <CleanField
                        label="Account Type"
                        value={payrollInfo?.bankAccount?.AccountType}
                      />
                    </div>
                  </section>
                </div>
              )}

              {/* DOCUMENTS TAB */}
              {activeTab === "documents" && (
                <div className="space-y-6 max-w-4xl">
                  <div className="flex justify-between items-center border-b border-border pb-4">
                    <div>
                      <h2 className="text-lg font-bold text-main">
                        Employee Documents
                      </h2>
                      <p className="text-sm text-muted mt-1">
                        Manage files and identification documents
                      </p>
                    </div>
                    <button
                      onClick={() => setShowUploadModal(true)}
                      className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary/90 transition-colors flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      Upload Document
                    </button>
                  </div>

                  {documents && documents.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {documents.map((doc: any) => (
                        <div
                          key={doc.id}
                          className="group border border-border rounded-lg p-4 flex items-center justify-between hover:bg-muted/5 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="p-2 bg-muted/10 rounded text-muted">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-sm font-medium text-main truncate pr-4">
                                {doc.description}
                              </h3>
                              <p className="text-xs text-muted mt-0.5">
                                PDF Document
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 flex-shrink-0">
                            {doc.file ? (
                              <>
                                <button
                                  onClick={() => {
                                    const url =
                                      getFileUrl(doc.file) || undefined;
                                    if (!url) return;
                                    window.open(url, "_blank");
                                  }}
                                  className="p-1.5 text-muted hover:text-main hover:bg-background rounded transition-colors"
                                  title="View"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <a
                                  href={getFileUrl(doc.file) || undefined}
                                  download
                                  className="p-1.5 text-muted hover:text-main hover:bg-background rounded transition-colors"
                                  title="Download"
                                >
                                  <Download className="w-4 h-4" />
                                </a>
                              </>
                            ) : (
                              <span className="text-xs text-red-500 font-medium">
                                Missing File
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16 border border-dashed border-border rounded-lg bg-muted/5">
                      <FileText className="w-8 h-8 text-muted mx-auto mb-3" />
                      <h3 className="text-sm font-medium text-main mb-1">
                        No Documents Found
                      </h3>
                      <p className="text-sm text-muted mb-4">
                        Upload an identification document, contract, or resume.
                      </p>
                      <button
                        onClick={() => setShowUploadModal(true)}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        Upload a file
                      </button>
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

      {showProfilePhotoModal && (
        <ProfilePhotoUploadModal
          onClose={() => setShowProfilePhotoModal(false)}
          onUpload={handleUploadProfilePhoto}
        />
      )}
    </div>
  );
};

// --- Cleaned Helper Components ---

const QuickDetail = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) => (
  <div className="flex items-center gap-3">
    <div className="text-muted flex-shrink-0">{icon}</div>
    <div className="flex-1 min-w-0">
      <p className="text-sm text-main truncate">{value || "—"}</p>
      <p className="text-xs text-muted mt-0.5">{label}</p>
    </div>
  </div>
);

const CleanField = ({
  label,
  value,
  className = "",
}: {
  label: string;
  value: any;
  className?: string;
}) => (
  <div className={className}>
    <p className="text-xs text-muted font-medium mb-1 capitalize border-none">
      {label}
    </p>
    <p className="text-sm font-medium text-main break-words">{value || "—"}</p>
  </div>
);

export default EmployeeDetailView;
