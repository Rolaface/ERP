import { FaCamera } from "react-icons/fa";
import React, { useRef, useState, useEffect } from "react";

import { ERP_BASE } from "../../../config/api";
import { PhotoUploadModal } from "../../../views/hr/EmployeeManagement/Photouploadmodal";

const getFullImageUrl = (path: string): string => {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${ERP_BASE}${path}`;
};

type EmployeeSummaryPanelProps = {
  formData: any;
  onFileSelect?: React.Dispatch<React.SetStateAction<File | null>>;
};

export const EmployeeSummaryPanel: React.FC<EmployeeSummaryPanelProps> = ({
  formData,
  onFileSelect,
}) => {
  const fullName = [formData.firstName, formData.middleName, formData.lastName]
    .filter(Boolean)
    .join(" ");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [pendingImageSrc, setPendingImageSrc] = useState<string | null>(null);
  const [pendingFileName, setPendingFileName] = useState<string>("");

  useEffect(() => {
    setLocalPreview(null);
  }, [formData.existingPhotoUrl]);

  useEffect(() => {
    return () => {
      if (pendingImageSrc) URL.revokeObjectURL(pendingImageSrc);
    };
  }, [pendingImageSrc]);

  const existingUrl = getFullImageUrl(formData.existingPhotoUrl || "");
  const displayUrl = localPreview || existingUrl || null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setPendingImageSrc(objectUrl);
    setPendingFileName(file.name);
  };

  const handleCropConfirm = (croppedFile: File) => {
    if (pendingImageSrc) URL.revokeObjectURL(pendingImageSrc);
    setPendingImageSrc(null);
    if (localPreview) URL.revokeObjectURL(localPreview);
    const preview = URL.createObjectURL(croppedFile);
    setLocalPreview(preview);
    onFileSelect?.(croppedFile);
  };

  const handleCropCancel = () => {
    if (pendingImageSrc) URL.revokeObjectURL(pendingImageSrc);
    setPendingImageSrc(null);
  };

  // just clears the locally selected photo — no API call
  const handleRemoveLocal = () => {
    if (localPreview) URL.revokeObjectURL(localPreview);
    setLocalPreview(null);
    onFileSelect?.(null);
  };

  const getStatusDot = (status: string) => {
    switch ((status || "").toLowerCase()) {
      case "active":     return "bg-emerald-500";
      case "inactive":   return "bg-gray-400";
      case "suspended":  return "bg-amber-500";
      case "terminated": return "bg-red-500";
      default:           return "bg-gray-300";
    }
  };

  const getStatusColor = (status: string) => {
    switch ((status || "").toLowerCase()) {
      case "active":     return "text-emerald-500";
      case "inactive":   return "text-gray-400";
      case "suspended":  return "text-amber-500";
      case "terminated": return "text-red-500";
      default:           return "text-muted";
    }
  };

  const Row = ({
    label,
    value,
    valueClass = "",
  }: {
    label: string;
    value?: string;
    valueClass?: string;
  }) => (
    <div className="flex items-start justify-between gap-2 py-1.5 border-b border-theme last:border-0">
      <span className="text-[9px] uppercase tracking-wider text-muted font-medium flex-shrink-0 pt-px">
        {label}
      </span>
      <span className={`text-[10px] font-medium text-right truncate max-w-[130px] ${valueClass || "text-main"}`}>
        {value || <span className="text-muted italic font-normal">—</span>}
      </span>
    </div>
  );

  const grossMonthly = formData.grossSalary
    ? `${formData.currency || ""} ${(parseFloat(formData.grossSalary) || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}/month`.trim()
    : undefined;

  // show × only when user has picked a local file (not from existing API photo)
  const canRemoveLocal = !!localPreview;

  return (
    <>
      {pendingImageSrc && (
        <PhotoUploadModal
          imageSrc={pendingImageSrc}
          fileName={pendingFileName}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      )}

      <div className="h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-3 pt-3 pb-1">
          <p className="text-[9px] uppercase tracking-widest text-muted font-semibold">
            Preview
          </p>
        </div>

        {/* Avatar + Name */}
        <div className="flex flex-col items-center px-3 pt-2 pb-3 border-b border-theme">
          <div className="relative mb-2">
            <div
              className="relative group w-20 h-20 rounded-2xl overflow-hidden border border-dashed border-primary/30 bg-primary/5 flex items-center justify-center transition-all duration-200 cursor-pointer group-hover:border-primary group-hover:bg-primary/10"
              onClick={() => fileInputRef.current?.click()}
            >
              {displayUrl ? (
                <>
                  <img
                    src={displayUrl}
                    alt="Employee"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center">
                    <FaCamera className="w-4 h-4 text-white mb-1" />
                    <span className="text-[10px] text-white font-medium">Change Photo</span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-1.5">
                    <FaCamera className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-[10px] font-medium text-primary">Upload Photo</span>
                </div>
              )}
            </div>

            {/* × badge — only when a local file has been selected, no API involved */}
            {canRemoveLocal && (
              <button
                type="button"
                onClick={handleRemoveLocal}
                title="Remove selected photo"
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-md transition-colors z-10"
              >
                <span className="text-white text-[10px] font-bold leading-none">×</span>
              </button>
            )}
          </div>

          <input
            id="employee-photo-input"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            ref={fileInputRef}
            hidden
            onChange={handleFileChange}
          />

          <h3 className="text-xs font-semibold text-main text-center leading-snug">
            {fullName || "New Employee"}
          </h3>

          {formData.designation && (
            <p className="text-[10px] text-muted mt-0.5 text-center truncate max-w-full px-2">
              {formData.designationLabel || formData.designation}
            </p>
          )}

          {formData.employmentStatus && (
            <div className="flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full bg-app border border-theme">
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${getStatusDot(formData.employmentStatus)}`} />
              <span className={`text-[9px] font-semibold ${getStatusColor(formData.employmentStatus)}`}>
                {formData.employmentStatus}
              </span>
            </div>
          )}
        </div>

        {/* Info rows */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-0">
          <Row label="Department" value={formData.departmentLabel || formData.department} />
          <Row label="Type"       value={formData.employeeType || formData.employment_type} />
          <Row label="Grade"      value={formData.gradeLabel || formData.grade} />
          <Row label="Joined"     value={formData.dateOfJoining} />
          <Row label="Location"   value={formData.workLocation} />
          <Row
            label="Basic"
            value={
              formData.basicSalary
                ? `${formData.currency || ""} ${parseFloat(formData.basicSalary).toLocaleString()}`.trim()
                : undefined
            }
          />
          <Row label="Gross/month" value={grossMonthly} valueClass="text-primary font-semibold" />
          <Row label="Leave"  value={formData.leavePolicyLabel || formData.leavePolicy} />
          <Row label="Shift"  value={formData.shiftLabel || formData.shift} />
        </div>
      </div>
    </>
  );
};

export default EmployeeSummaryPanel;