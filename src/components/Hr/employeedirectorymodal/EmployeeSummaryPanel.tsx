// EmployeeSummaryPanel.tsx
import { 
  FaCamera, 
  FaBuilding, 
  FaBriefcase 
} from "react-icons/fa";
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

const getInitials = (first: string, middle: string, last: string): string => {
  const parts = [first, last].filter(Boolean);
  if (!parts.length) return "?";
  return parts.map((p) => p[0].toUpperCase()).join("").slice(0, 2);
};

const getInitialsBg = (name: string): string => {
  const colors = [
    "bg-blue-500", "bg-violet-500", "bg-rose-500",
    "bg-amber-500", "bg-emerald-500", "bg-cyan-500",
    "bg-pink-500", "bg-indigo-500",
  ];
  if (!name) return colors[0];
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx];
};

const fmtNum = (n: number) => (n ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 });

// Helper component for clean line-item rows in the salary breakdown
const SalarySummaryRow: React.FC<{
  label: string;
  value: string;
  variant?: "default" | "accent" | "negative" | "dimmed";
  topBorder?: boolean;
}> = ({ label, value, variant = "default", topBorder }) => (
  <div
    className={[
      "flex justify-between items-center gap-2 py-0.5 min-w-0",
      topBorder ? "border-t border-theme/80 mt-1 pt-1.5" : "",
    ].join(" ")}
  >
    <span
      className={`text-[10px] leading-tight shrink-0 ${
        variant === "dimmed" ? "text-muted" : "text-main"
      }`}
    >
      {label}
    </span>
    <span
      className={`text-[10px] font-medium tabular-nums text-right min-w-0 truncate ${
        variant === "accent"
          ? "text-primary font-bold text-[11px]"
          : variant === "negative"
            ? "text-red-500 dark:text-red-400"
            : variant === "dimmed"
              ? "text-muted"
              : "text-main font-semibold"
      }`}
    >
      {value}
    </span>
  </div>
);

export const EmployeeSummaryPanel: React.FC<EmployeeSummaryPanelProps> = ({
  formData,
  onFileSelect,
}) => {
  const fullName = [formData.firstName, formData.middleName, formData.lastName]
    .filter(Boolean)
    .join(" ");

  const initials = getInitials(
    formData.firstName || "",
    formData.middleName || "",
    formData.lastName || "",
  );
  const initialsBg = getInitialsBg(formData.firstName || "");

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
      case "active":     return "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-200/20 border-emerald-200 dark:border-emerald-800";
      case "inactive":   return "text-gray-500 bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700";
      case "suspended":  return "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-200/20 border-amber-200 dark:border-amber-800";
      case "terminated": return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-200/20 border-red-200 dark:border-red-800";
      default:           return "text-muted bg-app border-theme";
    }
  };

  const canRemoveLocal = !!localPreview;

  const infoRows = [
    { icon: FaBuilding,  label: "Department", value: formData.departmentLabel || formData.department },
    { icon: FaBriefcase, label: "Type",       value: formData.employeeType || formData.employment_type },
  ];

  const salaryResult = formData._salaryResult;
  const currencyPrefix = formData.currency || "";
  const cur = (n: number) => `${currencyPrefix} ${fmtNum(n)}`.trim();

  const hasCustomizations =
    Object.keys(formData._componentOverrides || {}).length > 0 ||
    Object.keys(formData._componentFormulaOverrides || {}).length > 0 ||
    (formData._customComponents && formData._customComponents.length > 0);

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
        {/* Avatar + Name */}
        <div className="flex flex-col items-center px-2.5 pt-0.5 pb-2 border-b border-theme shrink-0">
          <div className="relative mb-2">
            <div
              className="relative group w-14 h-14 rounded-xl overflow-hidden cursor-pointer transition-all duration-200"
              onClick={() => fileInputRef.current?.click()}
            >
              {displayUrl ? (
                <>
                  <img
                    src={displayUrl}
                    alt="Employee"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                    <FaCamera className="w-3.5 h-3.5 text-white" />
                    <span className="text-[9px] text-white font-medium">Change</span>
                  </div>
                </>
              ) : (
                <div
                  className={`w-full h-full flex flex-col items-center justify-center ${initialsBg} group-hover:brightness-90 transition-all`}
                >
                  <span className="text-lg font-bold text-white leading-none">
                    {initials === "?" ? (
                      <FaCamera className="w-5 h-5 text-white/80" />
                    ) : (
                      initials
                    )}
                  </span>
                  {initials === "?" && (
                    <span className="text-[9px] text-white/70 mt-1">Photo</span>
                  )}
                </div>
              )}
            </div>

            {canRemoveLocal && (
              <button
                type="button"
                onClick={handleRemoveLocal}
                title="Remove selected photo"
                className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-md transition-colors z-10"
              >
                <span className="text-white text-[9px] font-bold leading-none">×</span>
              </button>
            )}

            {displayUrl && (
              <div
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow cursor-pointer z-10"
                onClick={() => fileInputRef.current?.click()}
              >
                <FaCamera className="w-2.5 h-2.5 text-white" />
              </div>
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

          <h3 className="text-xs font-semibold text-main text-center leading-snug mt-0.5">
            {fullName || "New Employee"}
          </h3>

          {formData.designation && (
            <p className="text-[10px] text-muted mt-0.5 text-center truncate max-w-full px-2">
              {formData.designationLabel || formData.designation}
            </p>
          )}

          {formData.employmentStatus ? (
            <div
              className={`flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full border text-[9px] font-semibold ${getStatusColor(formData.employmentStatus)}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${getStatusDot(formData.employmentStatus)}`} />
              {formData.employmentStatus}
            </div>
          ) : (
            <div className="flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full border border-dashed border-theme text-[9px] text-muted">
              No status set
            </div>
          )}
        </div>

        {/* Info rows + Detailed Read-Only Salary Preview */}
        <div className="flex-1 overflow-y-auto px-2.5 py-1.5">
          {infoRows.map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="flex items-center gap-1.5 py-1 border-b border-theme/60 last:border-0 min-w-0"
            >
              <Icon className="w-2.5 h-2.5 text-muted flex-shrink-0" />
              <span className="text-[9px] uppercase tracking-wider text-muted font-medium flex-shrink-0 w-14">
                {label}
              </span>
              <span
                className={`text-[10px] font-medium text-right truncate flex-1 min-w-0 ${
                  value ? "text-main" : "text-muted italic font-normal"
                }`}
              >
                {value || "—"}
              </span>
            </div>
          ))}

          {/* Comprehensive Salary Breakdown Panel */}
          {salaryResult && (
            <div className="mt-2 pt-2 border-t border-theme">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[9px] uppercase tracking-widest text-muted font-bold">
                  Salary Summary
                </p>
                {hasCustomizations && (
                  <span className="text-[8px] bg-primary/10 text-primary font-semibold px-1.5 py-0.5 rounded border border-primary/20">
                    Customized
                  </span>
                )}
              </div>

              {/* 2-Column Hero Highlight Box for Gross & Net */}
              <div className="grid grid-cols-1 gap-1.5 mb-2">
                <div className="bg-emerald-200/10 dark:bg-emerald-200/20 border border-emerald-500/20 rounded-md p-1.5 min-w-0">
                  <p className="text-[8px] text-emerald-700 dark:text-emerald-400 uppercase font-semibold tracking-wide mb-0.5 truncate">
                    Gross / Month
                  </p>
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tabular-nums truncate">
                    {fmtNum(salaryResult.gross)}
                  </p>
                </div>
                <div className="bg-primary/10 border border-primary/20 rounded-md p-1.5 min-w-0">
                  <p className="text-[8px] text-primary uppercase font-semibold tracking-wide mb-0.5 truncate">
                    Net / Month
                  </p>
                  <p className="text-xs font-bold text-primary tabular-nums truncate">
                    {fmtNum(salaryResult.net)}
                  </p>
                </div>
              </div>

              <div className="bg-app/50 border border-theme/80 rounded-lg p-2 space-y-0.5">
                <SalarySummaryRow label="Monthly base" value={cur(salaryResult.resolvedBase)} />
                <SalarySummaryRow label="Gross (annual)" value={cur(salaryResult.gross * 12)} variant="dimmed" />
                
                {salaryResult.monthlyTax > 0 && (
                  <SalarySummaryRow label="Income tax (mo)" value={`− ${cur(salaryResult.monthlyTax)}`} variant="negative" />
                )}
                
                {salaryResult.deductionsTotal > 0 && (
                  <SalarySummaryRow label="Deductions (mo)" value={`− ${cur(salaryResult.deductionsTotal)}`} variant="negative" />
                )}
                
                <SalarySummaryRow label="Net pay (mo)" value={cur(salaryResult.net)} variant="accent" topBorder />
                <SalarySummaryRow label="Net pay (annual)" value={cur(salaryResult.net * 12)} variant="dimmed" />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default EmployeeSummaryPanel;