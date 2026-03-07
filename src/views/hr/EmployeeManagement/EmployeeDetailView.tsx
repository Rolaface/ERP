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
  Edit2,
} from "lucide-react";
import {
  updateEmployeeDocuments,
  updateEmployeeProfilePhoto,
} from "../../../api/employeeapi";
import { ERP_BASE } from "../../../config/api";
import { useAssignedSalaryStructure } from "../../../hooks/useAssignedSalaryStructure";
import {
  mapSalaryStructureComponentLabel,
  toSalaryStructureMoneyRows,
} from "../../../utils/salaryStructureDisplay";

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

const toAbsoluteFileUrl = (base: string, filePath: string) => {
  const b = String(base ?? "").trim();
  const p = String(filePath ?? "").trim();
  if (!b || !p) return "";
  if (p.startsWith("http")) return p;

  const cleanBase = b.endsWith("/") ? b.slice(0, -1) : b;
  const cleanPath = p.startsWith("/") ? p : `/${p}`;
  return `${cleanBase}${cleanPath}`;
};

const getFileUrl = (file?: string | null) => {
  if (!file) return null;
  const url = toAbsoluteFileUrl(ERP_BASE, String(file));
  return url || null;
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
      <div className="bg-card w-full max-w-md rounded-2xl shadow-xl border border-theme overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 border-b border-theme">
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
              className="w-full border border-theme rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[rgba(204,0,0,0.2)] focus:border-[var(--primary)] bg-card text-main"
              placeholder="e.g. NRC, Offer Letter, Resume"
            />
          </div>

          <label className="block group">
            <div className="border-2 border-dashed border-theme rounded-2xl p-6 text-center cursor-pointer hover:border-[var(--primary)] hover:bg-primary/5 transition-colors">
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
            <div className="flex items-center gap-3 bg-app border border-theme rounded-xl px-3 py-2">
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
                className="p-1 hover:bg-app rounded"
              >
                <X className="w-3.5 h-3.5 text-muted hover:text-red-500" />
              </button>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 bg-app border-t border-theme">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium border border-theme rounded-xl hover:bg-app transition-colors text-main"
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
      <div className="bg-card w-full max-w-md rounded-2xl shadow-xl border border-theme overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 border-b border-theme">
          <h3 className="text-sm font-bold text-main flex items-center gap-2">
            <Upload className="w-4 h-4 text-muted" />
            Update Profile Photo
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-muted/10 transition-colors"
          >
            <X className="w-4 h-4 text-muted hover:text-main" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {preview && (
            <div className="flex justify-center mb-4">
              <div className="w-24 h-24 bg-app border border-theme rounded-full flex items-center justify-center overflow-hidden">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}

          <label className="block group">
            <div className="border-2 border-dashed border-theme rounded-2xl p-6 text-center cursor-pointer hover:border-[var(--primary)] hover:bg-primary/5 transition-colors">
              <Upload className="w-5 h-5 text-muted mx-auto mb-2 group-hover:text-primary transition-colors" />
              <p className="text-sm font-medium text-main mb-1">
                Click to upload or drag & drop
              </p>
              <p className="text-xs text-muted">JPG, PNG (max 5MB)</p>
            </div>
            <input
              type="file"
              accept=".jpg,.jpeg,.png"
              onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
              className="hidden"
            />
          </label>

          {file && (
            <div className="flex items-center gap-3 bg-app border border-theme rounded-xl px-3 py-2">
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
                  handleFileChange(null);
                }}
                className="p-1 hover:bg-app rounded"
              >
                <X className="w-3.5 h-3.5 text-muted hover:text-red-500" />
              </button>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 bg-app border-t border-theme">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium border border-theme rounded-xl hover:bg-app transition-colors text-main"
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
    const direct = String(
      employee?.ProfilePicture ??
        employee?.profilePicture ??
        employee?.profile_picture ??
        employee?.profile_photo ??
        employee?.profilePhoto ??
        employee?.profilePhotoUrl ??
        employee?.profile_picture_url ??
        "",
    ).trim();

    if (direct) return getFileUrl(direct);

    const docs = Array.isArray(documents) ? documents : [];
    const profileDoc = docs.find((d: any) => {
      const desc = String(d?.description ?? d?.name ?? "")
        .trim()
        .toLowerCase();
      return desc === "profile photo";
    });

    const file = profileDoc?.file ? String(profileDoc.file) : "";
    return getFileUrl(file) || null;
  }, [documents, employee]);

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

  const toMoneyRowsFromMap = useMemo(() => {
    return (input: any): Array<{ label: string; amount: number }> => {
      if (!input || typeof input !== "object" || Array.isArray(input))
        return [];
      return Object.entries(input)
        .map(([key, value]) => ({
          label: String(key ?? "").trim(),
          amount: Number(value ?? 0),
        }))
        .filter((r) => Boolean(r.label));
    };
  }, []);

  const hasStructureEarnings = useMemo(() => {
    const payrollArr = Array.isArray(payrollInfo?.salaryBreakdown)
      ? payrollInfo.salaryBreakdown
      : [];
    if (payrollArr.length > 0) return true;

    const payrollMapRows = toMoneyRowsFromMap(payrollInfo?.salaryBreakdown);
    if (payrollMapRows.length > 0) return true;

    const earnings = Array.isArray(salaryStructureDetail?.earnings)
      ? salaryStructureDetail.earnings
      : [];
    return earnings.length > 0;
  }, [payrollInfo?.salaryBreakdown, salaryStructureDetail, toMoneyRowsFromMap]);

  const hasStructureDeductions = useMemo(() => {
    const payrollArr = Array.isArray(payrollInfo?.statutoryDeductions)
      ? payrollInfo.statutoryDeductions
      : [];
    if (payrollArr.length > 0) return true;

    const payrollMapRows = toMoneyRowsFromMap(payrollInfo?.statutoryDeductions);
    if (payrollMapRows.length > 0) return true;

    const deductions = Array.isArray(salaryStructureDetail?.deductions)
      ? salaryStructureDetail.deductions
      : [];
    return deductions.length > 0;
  }, [
    payrollInfo?.statutoryDeductions,
    salaryStructureDetail,
    toMoneyRowsFromMap,
  ]);

  const salaryBreakdownRows = useMemo(() => {
    const currency = String(payrollInfo?.currency ?? "ZMW").trim() || "ZMW";

    const payrollArr = Array.isArray(payrollInfo?.salaryBreakdown)
      ? payrollInfo.salaryBreakdown
      : [];
    if (payrollArr.length > 0) {
      return payrollArr
        .map((r: any) => ({
          label: mapSalaryStructureComponentLabel(r),
          amount: Number(r?.amount ?? 0),
          currency,
        }))
        .filter((r: any) => Boolean(r.label));
    }

    const payrollMapRows = toMoneyRowsFromMap(payrollInfo?.salaryBreakdown);
    if (payrollMapRows.length > 0) {
      return payrollMapRows.map((r: any) => ({
        ...r,
        currency,
      }));
    }

    const earnings = Array.isArray(salaryStructureDetail?.earnings)
      ? salaryStructureDetail.earnings
      : [];
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
  }, [
    payrollInfo?.currency,
    payrollInfo?.salaryBreakdown,
    salaryStructureDetail,
    toMoneyRowsFromMap,
  ]);

  const statutoryDeductionsRows = useMemo(() => {
    const currency = String(payrollInfo?.currency ?? "ZMW").trim() || "ZMW";

    const shouldKeepDeductionRow = (labelInput: any) => {
      const label = String(labelInput ?? "")
        .toLowerCase()
        .replace(/[^a-z]/g, "");
      if (!label) return false;
      if (label.includes("employernapsa")) return false;
      if (label.includes("employernhima")) return false;
      if (label.includes("employer") && label.includes("napsa")) return false;
      if (label.includes("employer") && label.includes("nhima")) return false;
      return true;
    };

    const payrollArr = Array.isArray(payrollInfo?.statutoryDeductions)
      ? payrollInfo.statutoryDeductions
      : [];
    if (payrollArr.length > 0) {
      return payrollArr
        .map((r: any) => ({
          label: mapSalaryStructureComponentLabel(r),
          amount: Math.abs(Number(r?.amount ?? 0)),
          currency,
        }))
        .filter((r: any) => shouldKeepDeductionRow(r.label));
    }

    const payrollMapRows = toMoneyRowsFromMap(payrollInfo?.statutoryDeductions);
    if (payrollMapRows.length > 0) {
      return payrollMapRows
        .map((r: any) => ({
          ...r,
          amount: Math.abs(Number(r?.amount ?? 0)),
          currency,
        }))
        .filter((r: any) => shouldKeepDeductionRow(r.label));
    }

    const fallback = Array.isArray(salaryStructureDetail?.deductions)
      ? salaryStructureDetail.deductions
      : [];
    return toSalaryStructureMoneyRows(fallback)
      .map((d: any) => ({
        ...d,
        amount: Math.abs(Number(d?.amount ?? 0)),
        currency,
      }))
      .filter((r: any) => shouldKeepDeductionRow(r.label));
  }, [
    payrollInfo?.currency,
    payrollInfo?.statutoryDeductions,
    salaryStructureDetail,
    toMoneyRowsFromMap,
  ]);

  const compensationHeader = useMemo(() => {
    const currency = String(payrollInfo?.currency ?? "ZMW").trim() || "ZMW";
    const structureName = String(assignedSalaryStructureName ?? "").trim();
    const fromDate = String(assignedSalaryStructureFromDate ?? "").trim();

    const earningsRows = salaryBreakdownRows;
    const deductionsRows = statutoryDeductionsRows;

    const totalEarnings = earningsRows.reduce((s: number, r: any) => {
      return s + Number(r?.amount ?? 0);
    }, 0);
    const totalDeductions = deductionsRows.reduce((s: number, r: any) => {
      return s + Math.abs(Number(r?.amount ?? 0));
    }, 0);
    const net = totalEarnings - totalDeductions;

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
    payrollInfo?.currency,
    salaryBreakdownRows,
    statutoryDeductionsRows,
  ]);

  const getStatusBadge = () => {
    const statusLower = status?.toLowerCase() || "";
    if (statusLower === "active")
      return "bg-success/10 text-success border-success/20";
    if (statusLower === "inactive" || statusLower === "terminated")
      return "bg-danger/10 text-danger border-danger/20";
    if (statusLower === "on leave")
      return "bg-primary/10 text-primary border-[var(--primary)]/20";
    return "bg-row-hover/40 text-main border-theme";
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
    <div className="min-h-screen bg-app">
      {/* Structural Header */}
      <div className="bg-card border-b border-theme px-4 sm:px-8 py-4 sticky top-0 z-20">
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
              <div className="w-14 h-14 bg-app border border-theme rounded-full flex items-center justify-center overflow-hidden">
                {profilePhotoUrl ? (
                  <img
                    src={profilePhotoUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
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
              <h1 className="text-xl sm:text-2xl font-extrabold text-main leading-tight">
                {personalInfo?.FirstName} {personalInfo?.LastName}
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-muted">
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
              className={`px-3 py-1 rounded-full text-[11px] font-bold border ${getStatusBadge()}`}
            >
              {status}
            </div>
            <div className="px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-app border border-theme text-main">
              ID: {employeeCode || "—"}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-card rounded-2xl border border-theme p-4 shadow-sm">
            <p className="text-[11px] font-black tracking-widest uppercase text-muted">
              Department
            </p>
            <p className="text-sm font-bold text-main mt-1 truncate">
              {employmentInfo?.Department || "—"}
            </p>
          </div>
          <div className="bg-card rounded-2xl border border-theme p-4 shadow-sm">
            <p className="text-[11px] font-black tracking-widest uppercase text-muted">
              Location
            </p>
            <p className="text-sm font-bold text-main mt-1 truncate">
              {employmentInfo?.workLocation || "—"}
            </p>
          </div>
          <div className="bg-card rounded-2xl border border-theme p-4 shadow-sm">
            <p className="text-[11px] font-black tracking-widest uppercase text-muted">
              Gross Salary
            </p>
            <p className="text-sm font-bold text-main mt-1 tabular-nums">
              {payrollInfo?.currency || "ZMW"}{" "}
              {Number(payrollInfo?.grossSalary || 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-card rounded-2xl border border-theme p-4 shadow-sm">
            <p className="text-[11px] font-black tracking-widest uppercase text-muted">
              Leave Balance
            </p>
            <p className="text-sm font-bold text-main mt-1">
              {leaveInfo?.openingLeaveBalance || "0"} Days
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Sidebar Info Cards */}
          <div className="lg:col-span-4 xl:col-span-3 space-y-6">
            {/* Quick Contact Card */}
            <div className="bg-card rounded-2xl border border-theme p-5 shadow-sm">
              <h3 className="text-sm font-black text-main mb-4 border-b border-theme pb-2 tracking-wide">
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
            <div className="bg-card rounded-2xl border border-theme p-5 shadow-sm">
              <h3 className="text-sm font-black text-main mb-4 border-b border-theme pb-2 tracking-wide">
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
                <div className="pt-4 border-t border-theme">
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
            <div className="flex overflow-x-auto border-b border-theme mb-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? "border-[var(--primary)] text-primary"
                      : "border-transparent text-muted hover:text-main hover:border-theme"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content Container */}
            <div className="bg-card rounded-2xl border border-theme p-6 md:p-8 min-h-[500px] shadow-sm">
              {/* PERSONAL TAB */}
              {activeTab === "personal" && (
                <div className="space-y-8 max-w-4xl">
                  <section>
                    <h2 className="text-sm font-black text-main uppercase tracking-wider mb-4 text-muted border-b border-theme pb-2">
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
                    <h2 className="text-sm font-black text-main uppercase tracking-wider mb-4 text-muted border-b border-theme pb-2">
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
                      <h2 className="text-sm font-black text-main uppercase tracking-wider mb-4 text-muted border-b border-theme pb-2">
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
                      <h2 className="text-sm font-black text-main uppercase tracking-wider mb-4 text-muted border-b border-theme pb-2">
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
                    <h2 className="text-sm font-black text-main uppercase tracking-wider mb-4 text-muted border-b border-theme pb-2">
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
                      <h2 className="text-sm font-black text-main uppercase tracking-wider mb-4 text-muted border-b border-theme pb-2">
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
                      <h2 className="text-sm font-black text-main uppercase tracking-wider mb-4 text-muted border-b border-theme pb-2">
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
                  <div className="bg-app border border-theme rounded-2xl p-6">
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

                  <section>
                    <h2 className="text-sm font-black text-main uppercase tracking-wider mb-4 text-muted border-b border-theme pb-2">
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

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Earnings */}
                    <section>
                      <h2 className="text-sm font-black text-main uppercase tracking-wider mb-4 text-muted border-b border-theme pb-2">
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
                      <h2 className="text-sm font-black text-main uppercase tracking-wider mb-4 text-muted border-b border-theme pb-2">
                        Statutory & Deductions
                      </h2>
                      <div className="space-y-0 text-sm">
                        {!hasStructureDeductions ? (
                          <div className="text-muted font-medium py-2">—</div>
                        ) : (
                          statutoryDeductionsRows.map((d: any) => (
                            <div
                              key={d.label}
                              className="flex justify-between py-2.5 border-b border-border/50"
                            >
                              <span className="text-main">{d.label}</span>
                              <span className="font-medium text-main">
                                {d.currency || payrollInfo?.currency || "ZMW"}{" "}
                                {Number(d.amount ?? 0).toLocaleString()}
                              </span>
                            </div>
                          ))
                        )}
                        <div className="flex justify-between py-3 font-bold mt-2">
                          <span className="text-main">Total Deductions</span>
                          <span className="text-main">
                            {compensationHeader.currency}{" "}
                            {Number(
                              compensationHeader.totalDeductions || 0,
                            ).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </section>
                  </div>
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
