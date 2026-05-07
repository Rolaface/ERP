import {
  FaUser,
  FaCamera,
  FaBuilding,
  FaBriefcase,
  FaCircle,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaEnvelope,
  FaPhone,
} from "react-icons/fa";
import React, { useRef, useState } from "react";

type EmployeeSummaryPanelProps = {
  formData: any;
  onFileSelect?: React.Dispatch<React.SetStateAction<File | null>>;
};
export const EmployeeSummaryPanel: React.FC<EmployeeSummaryPanelProps> = ({
  formData,
  onFileSelect,
}) => {
  const fullName = [formData.firstName, formData.otherNames, formData.lastName]
    .filter(Boolean)
    .join(" ");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const preview = URL.createObjectURL(file);
    setImageUrl(preview);

    setSelectedFile(file);

    onFileSelect?.(file);
  };

  const getStatusColor = (status: string) => {
    switch ((status || "").toLowerCase()) {
      case "active":
        return "text-emerald-500";
      case "inactive":
        return "text-gray-400";
      case "suspended":
        return "text-amber-500";
      case "terminated":
        return "text-red-500";
      default:
        return "text-muted";
    }
  };

  const getStatusDot = (status: string) => {
    switch ((status || "").toLowerCase()) {
      case "active":
        return "bg-emerald-500";
      case "inactive":
        return "bg-gray-400";
      case "suspended":
        return "bg-amber-500";
      case "terminated":
        return "bg-red-500";
      default:
        return "bg-gray-300";
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
      <span
        className={`text-[10px] font-medium text-right truncate max-w-[130px] ${valueClass || "text-main"}`}
      >
        {value || <span className="text-muted italic font-normal">—</span>}
      </span>
    </div>
  );

  const grossMonthly = formData.grossSalary
    ? `ZMW ${((parseFloat(formData.grossSalary) || 0) / 12).toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo`
    : undefined;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header label */}
      <div className="px-3 pt-3 pb-1">
        <p className="text-[9px] uppercase tracking-widest text-muted font-semibold">
          Preview
        </p>
      </div>

      {/* Avatar + Name */}
      <div className="flex flex-col items-center px-3 pt-2 pb-3 border-b border-theme">
        {/* Avatar with hover upload */}
        <div
          className="relative group cursor-pointer mb-2"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="w-14 h-14 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center ring-2 ring-offset-1 ring-transparent group-hover:ring-primary/30 transition-all">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="Employee"
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <FaUser className="w-6 h-6 text-primary/60" />
            )}
          </div>
          <div className="absolute inset-0 hidden group-hover:flex items-center justify-center bg-black/40 rounded-full transition-all">
            <FaCamera className="w-3.5 h-3.5 text-white" />
          </div>
        </div>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          hidden
          onChange={handleUpload}
        />
        <h3 className="text-xs font-semibold text-main text-center leading-snug">
          {fullName || "New Employee"}
        </h3>

        {formData.jobTitle && (
          <p className="text-[10px] text-muted mt-0.5 text-center truncate max-w-full px-2">
            {formData.jobTitle}
          </p>
        )}

        {/* Status badge */}
        {formData.employmentStatus && (
          <div
            className={`flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full bg-app border border-theme`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${getStatusDot(formData.employmentStatus)}`}
            />
            <span
              className={`text-[9px] font-semibold ${getStatusColor(formData.employmentStatus)}`}
            >
              {formData.employmentStatus}
            </span>
          </div>
        )}
      </div>

      {/* Info rows */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-0">
        <Row label="Department" value={formData.department} />
        <Row label="Type" value={formData.employeeType} />
        <Row label="Level" value={formData.level} />
        <Row label="Engaged" value={formData.engagementDate} />
        <Row label="Location" value={formData.workLocation} />
        <Row
          label="Basic"
          value={
            formData.basicSalary
              ? ` ${parseFloat(formData.basicSalary).toLocaleString()}`
              : undefined
          }
        />
        <Row
          label="Gross/mo"
          value={grossMonthly}
          valueClass="text-primary font-semibold"
        />
        <Row
          label="Leave"
          value={formData.leavePolicyLabel || formData.leavePolicy}
        />
        <Row label="Shift" value={formData.shift} />
      </div>

      
      
    </div>
  );
};

export default EmployeeSummaryPanel;
