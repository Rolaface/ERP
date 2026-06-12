import React, { useEffect, useRef, useState } from "react";
import { getAllDepartments } from "../../../../api/utils/frappeUtilsApi";
import { uploadEmployeePhoto, removeEmployeePhoto } from "../../../../api/employeeapi";
import { resolveLabel } from "../../../../api/utils/labelResolver";
import {
  Mail,
  Phone,
  Calendar,
  Building2,
  Briefcase,
  ArrowLeft,
  Camera,
  Loader2,
  Trash2,
} from "lucide-react";
import {
  fmt,
  fmtDate,
  initials,
  getFileUrl,
} from "../detailtab/Employeehelpers";
import { QuickStat } from "../detailtab/Employeeuiprimitives";
import { showApiError, showSuccess, showConfirm } from "../../../../utils/alert";
import { PhotoUploadModal } from "../Photouploadmodal";

interface Props {
  emp: any;
  fullName: string;
  currency: string;
  erpBase?: string;
  onBack?: () => void;
  onPhotoUploaded?: () => void;
}

export const EmployeeSidebar: React.FC<Props> = ({
  emp,
  fullName,
  erpBase = "",
  onBack,
  onPhotoUploaded,
}) => {
  const [departmentLabel, setDepartmentLabel] = useState("");
  const [avatarSrc, setAvatarSrc] = useState<string | null>(
    emp.image ? getFileUrl(emp.image, erpBase) : null,
  );
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Crop modal state ──────────────────────────────────────────────────────
  const [pendingImageSrc, setPendingImageSrc] = useState<string | null>(null);
  const [pendingFileName, setPendingFileName] = useState<string>("");

  useEffect(() => {
    setAvatarSrc(emp.image ? getFileUrl(emp.image, erpBase) : null);
  }, [emp.image, erpBase]);

  useEffect(() => {
    const loadLabel = async () => {
      const label = await resolveLabel({
        value: emp?.department,
        fetcher: getAllDepartments,
      });
      setDepartmentLabel(label);
    };
    loadLabel();
  }, [emp?.department]);

  // Cleanup blob URL on unmount (safety)
  useEffect(() => {
    return () => {
      if (pendingImageSrc) URL.revokeObjectURL(pendingImageSrc);
    };
  }, [pendingImageSrc]);

  // ── Step 1: file chosen → open crop modal ────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setPendingImageSrc(objectUrl);
    setPendingFileName(file.name);
  };

  // ── Step 2: user confirms crop → upload ──────────────────────────────────
  const handleCropConfirm = async (croppedFile: File) => {
    const employeeId = emp.employee || emp.name;
    if (!employeeId) return;

    // Optimistic preview — use a fresh object URL from the cropped file
    const previewUrl = URL.createObjectURL(croppedFile);
    setAvatarSrc(previewUrl);

    // Close the crop modal
    if (pendingImageSrc) URL.revokeObjectURL(pendingImageSrc);
    setPendingImageSrc(null);

    try {
      setUploading(true);
      await uploadEmployeePhoto(String(employeeId), croppedFile);
      showSuccess("Photo updated successfully");
      onPhotoUploaded?.();
    } catch (err) {
      // Revert preview on failure
      setAvatarSrc(emp.image ? getFileUrl(emp.image, erpBase) : null);
      showApiError(err);
    } finally {
      setUploading(false);
      URL.revokeObjectURL(previewUrl);
    }
  };

  // ── Cancel crop ───────────────────────────────────────────────────────────
  const handleCropCancel = () => {
    if (pendingImageSrc) URL.revokeObjectURL(pendingImageSrc);
    setPendingImageSrc(null);
  };

  // ── Remove photo ──────────────────────────────────────────────────────────
  const handleRemovePhoto = async () => {
    const employeeId = emp.employee || emp.name;
    if (!employeeId) return;

    const confirmed = await showConfirm(
      "This will permanently remove the employee's profile photo.",
      {
        title: "Remove Photo?",
        confirmButtonText: "Yes, remove",
        cancelButtonText: "Cancel",
        confirmButtonColor: "#ef4444",
      },
    );
    if (!confirmed) return;

    try {
      setUploading(true);
      await removeEmployeePhoto(String(employeeId));
      setAvatarSrc(null);
      showSuccess("Photo removed successfully");
      onPhotoUploaded?.();
    } catch (err) {
      showApiError(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      {/* ── Crop modal — rendered outside the card so it overlays everything ── */}
      {pendingImageSrc && (
        <PhotoUploadModal
          imageSrc={pendingImageSrc}
          fileName={pendingFileName}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
          uploading={uploading}
        />
      )}

      <div className="bg-card rounded-xl border border-theme shadow-sm sticky top-2 overflow-hidden">
        {/* ── Header / avatar band ─────────────────────────────────────────── */}
        <div className="bg-primary px-4 py-6 text-center relative">
          {onBack && (
            <button
              type="button"
              onClick={() => onBack?.()}
              className="absolute top-3 left-3 z-20 w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white transition-all duration-200"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          {/* Decorative dots */}
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(circle at 30% 20%, white 1px, transparent 1px), radial-gradient(circle at 70% 80%, white 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />

          {/* Avatar */}
          <div className="relative w-16 h-16 mx-auto mb-2">
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt={fullName}
                className="w-16 h-16 rounded-full object-cover ring-2 ring-white/40 shadow-lg"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-white text-xl font-bold ring-2 ring-white/30 shadow-lg">
                {initials(emp)}
              </div>
            )}

            {/* Camera badge — bottom-right */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              title="Upload photo"
              className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-md border border-white/60 hover:scale-110 transition-transform duration-150 cursor-pointer disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="w-3 h-3 text-primary animate-spin" />
              ) : (
                <Camera className="w-3 h-3 text-primary" />
              )}
            </button>

            {/* Trash badge — bottom-left, only when photo exists */}
            {avatarSrc && !uploading && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                title="Remove photo"
                className="absolute -bottom-0.5 -left-0.5 w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-md border border-white/60 hover:scale-110 transition-transform duration-150 cursor-pointer"
              >
                <Trash2 className="w-3 h-3 text-red-500" />
              </button>
            )}

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {!avatarSrc && !uploading && (
            <p className="text-white/40 text-[9px] -mt-1 mb-1 tracking-wide">
              click <Camera className="inline w-2.5 h-2.5 mb-0.5" /> to add photo
            </p>
          )}

          <h3 className="text-white text-sm font-bold leading-snug">{fullName}</h3>
          <p className="text-white/70 text-[11px] mt-0.5">{fmt(emp.designation)}</p>

          <div className="flex items-center justify-center gap-1.5 mt-3 flex-wrap">
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/20 text-[10px] font-medium text-emerald-100">
              {fmt(emp.status)}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-white/10 border border-white/10 text-[10px] font-medium text-white/90">
              {fmt(emp.employment_type)}
            </span>
          </div>
        </div>

        {/* ── Employee ID ─────────────────────────────────────────────────── */}
        <div className="px-4 py-2.5 border-b border-theme bg-app text-center">
          <p className="text-[9px] uppercase tracking-widest text-muted font-bold mb-0.5">
            Employee ID
          </p>
          <p className="text-sm font-mono font-bold text-primary">
            {fmt(emp.employee) || "—"}
          </p>
        </div>

        {/* ── Quick stats ─────────────────────────────────────────────────── */}
        <div className="px-4 py-3 space-y-4">
          <div className="space-y-1">
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
          </div>

          <div className="border-t border-theme pt-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[9px] uppercase tracking-wider text-muted font-bold mb-1">Gender</p>
                <p className="text-sm font-semibold text-main">{fmt(emp.gender)}</p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider text-muted font-bold mb-1">Blood Group</p>
                <p className="text-sm font-semibold text-main">{fmt(emp.blood_group)}</p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider text-muted font-bold mb-1">Grade</p>
                <p className="text-sm font-semibold text-main">{fmt(emp.grade)}</p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider text-muted font-bold mb-1">Salary Mode</p>
                <p className="text-sm font-semibold text-main">{fmt(emp.salary_mode)}</p>
              </div>
            </div>
          </div>

          <div className="border-t border-theme pt-3 space-y-1">
            <QuickStat
              icon={<Building2 className="w-3.5 h-3.5" />}
              label="Department"
              value={fmt(departmentLabel || emp.department)}
            />
            <QuickStat
              icon={<Briefcase className="w-3.5 h-3.5" />}
              label="Company"
              value={fmt(emp.company)}
            />
            <QuickStat
              icon={<Calendar className="w-3.5 h-3.5" />}
              label="Joined"
              value={fmtDate(emp.date_of_joining)}
            />
          </div>
        </div>
      </div>
    </>
  );
};