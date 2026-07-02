// EmployeeSummaryPanel.tsx
import { FaCamera, FaBuilding, FaBriefcase, FaStar, FaCalendarAlt, FaMapMarkerAlt, FaMoneyBillWave, FaCalendarCheck , FaClock } from "react-icons/fa";
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

// derive initials from name parts
const getInitials = (first: string, middle: string, last: string): string => {
  const parts = [first, last].filter(Boolean);
  if (!parts.length) return "?";
  return parts.map((p) => p[0].toUpperCase()).join("").slice(0, 2);
};

// pick a stable hue from the name so initials bg is always the same color for a given employee
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

// local, dependency-free formatters — kept inline so this panel doesn't
// need to reach into the Compensation tab's folder for salaryHelpers.
const fmtNum = (n: number) => (n ?? 0).toLocaleString();

const SalarySummaryRow: React.FC<{
  label: string;
  value: string;
  variant?: "default" | "accent" | "negative" | "dimmed";
  topBorder?: boolean;
}> = ({ label, value, variant = "default", topBorder }) => (
  <div
    className={[
      "flex justify-between items-center gap-2 py-1 min-w-0",
      topBorder ? "border-t border-theme mt-1 pt-1.5" : "",
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
          ? "text-primary font-semibold"
          : variant === "negative"
            ? "text-red-500 dark:text-red-400"
            : variant === "dimmed"
              ? "text-muted"
              : "text-main"
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

  // clears the locally selected photo — no API call
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
      case "active":     return "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800";
      case "inactive":   return "text-gray-500 bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700";
      case "suspended":  return "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800";
      case "terminated": return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800";
      default:           return "text-muted bg-app border-theme";
    }
  };

  const grossMonthly = formData.grossSalary
    ? `${formData.currency || ""} ${(parseFloat(formData.grossSalary) || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo`.trim()
    : undefined;

  const canRemoveLocal = !!localPreview;

  // info rows config — icon + label + value
  const infoRows = [
    { icon: FaBuilding,      label: "Department", value: formData.departmentLabel || formData.department },
    { icon: FaBriefcase,     label: "Type",       value: formData.employeeType || formData.employment_type },
    { icon: FaStar,          label: "Grade",      value: formData.gradeLabel || formData.grade },
    { icon: FaCalendarAlt,   label: "Joined",     value: formData.dateOfJoining },
    { icon: FaMapMarkerAlt,  label: "Location",   value: formData.workLocation },
    {
      icon: FaMoneyBillWave,
      label: "Basic",
      value: formData.basicSalary
        ? `${formData.currency || ""} ${parseFloat(formData.basicSalary).toLocaleString()}`.trim()
        : undefined,
    },
    { icon: FaMoneyBillWave, label: "Gross/mo",   value: grossMonthly, accent: true },
    { icon: FaCalendarCheck ,      label: "Leave",      value: formData.leavePolicyLabel || formData.leavePolicy },
    { icon: FaClock,         label: "Shift",      value: formData.shiftLabel || formData.shift },
  ];

  // Salary calculation summary, written by the Compensation tab into
  // formData._salaryResult. Rendered here, below the existing info rows,
  // instead of as a separate floating card in the Compensation tab body.
  const salaryResult = formData._salaryResult;
  const currencyPrefix = formData.currency || "";
  const cur = (n: number) => `${currencyPrefix} ${fmtNum(n)}`.trim();

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

        {/* ── Header label ─────────────────────────────────────────────── */}
         <div className="px-2.5 pt-2 pb-1.5">
+          <p className="text-[9px] uppercase tracking-widest text-muted font-semibold">
            Preview
          </p>
        </div>

        {/* ── Avatar + Name ─────────────────────────────────────────────── */}
       <div className="flex flex-col items-center px-2.5 pt-0.5 pb-2 border-b border-theme">
          <div className="relative mb-2">
            {/* avatar box */}
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
                // initials fallback — no photo yet
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

            {/* remove badge */}
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

            {/* camera badge when photo exists */}
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

          {/* name */}
          <h3 className="text-xs font-semibold text-main text-center leading-snug mt-0.5">
            {fullName || "New Employee"}
          </h3>

          {/* designation */}
          {formData.designation && (
            <p className="text-[10px] text-muted mt-0.5 text-center truncate max-w-full px-2">
              {formData.designationLabel || formData.designation}
            </p>
          )}

          {/* status badge */}
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

        {/* ── Info rows + Salary summary ───────────────────────────────── */}
       <div className="flex-1 overflow-y-auto px-2.5 py-1.5">
          {infoRows.map(({ icon: Icon, label, value, accent }) => (
            <div
              key={label}
              className="flex items-center gap-1.5 py-1 border-b border-theme/60 last:border-0 min-w-0"
            >
              {/* icon */}
              <Icon className="w-2.5 h-2.5 text-muted flex-shrink-0" />
              {/* label */}
               <span className="text-[9px] uppercase tracking-wider text-muted font-medium flex-shrink-0 w-14">
                 
                {label}
              </span>
              {/* value */}
              <span
                className={`text-[10px] font-medium text-right truncate flex-1 min-w-0 ${
                  accent ? "text-primary font-semibold" : value ? "text-main" : "text-muted italic font-normal"
                }`}
              >
                {value || "—"}
              </span>
            </div>
          ))}

          {/* Salary calculation summary — appears once a base salary /
              structure has produced a result on the Compensation tab.
              Sits below the existing info rows in this same panel. */}
          {salaryResult && (
            <div className="mt-2 pt-1.5 border-t border-theme">

              <p className="text-[9px] uppercase tracking-widest text-muted font-semibold mb-1.5">
                Salary Summary
              </p>

              <div className="grid grid-cols-2 gap-1.5 mb-1.5">
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-md p-1.5 text-center min-w-0">
                  <p className="text-[8px] text-muted uppercase tracking-wide mb-0.5 truncate">
                    Gross/mo
                  </p>
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tabular-nums truncate">
                    {fmtNum(salaryResult.gross)}
                  </p>
                </div>
                <div className="bg-primary/5 rounded-md p-1.5 text-center min-w-0">
                  <p className="text-[8px] text-muted uppercase tracking-wide mb-0.5 truncate">
                    Net/mo
                  </p>
                  <p className="text-xs font-bold text-primary tabular-nums truncate">
                    {fmtNum(salaryResult.net)}
                  </p>
                </div>
              </div>

              <SalarySummaryRow label="Monthly base" value={cur(salaryResult.resolvedBase)} />
              <SalarySummaryRow label="Gross (annual)" value={cur(salaryResult.gross * 12)} variant="dimmed" />
              {salaryResult.monthlyTax > 0 && (
                <SalarySummaryRow label="Income tax (mo)" value={`− ${cur(salaryResult.monthlyTax)}`} variant="negative" />
              )}
              {salaryResult.deductionsTotal > 0 && (
                <SalarySummaryRow label="Deductions" value={`− ${cur(salaryResult.deductionsTotal)}`} variant="negative" />
              )}
              <SalarySummaryRow label="Net pay (mo)" value={cur(salaryResult.net)} variant="accent" topBorder />
              <SalarySummaryRow label="Net pay (annual)" value={cur(salaryResult.net * 12)} variant="dimmed" />
            </div>
          )}
        </div>

      </div>
    </>
  );
};

export default EmployeeSummaryPanel;