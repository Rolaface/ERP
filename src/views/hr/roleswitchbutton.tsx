import React from "react";
import { ArrowLeftRight, UserCog, User } from "lucide-react";
import { useHRView } from "../../hooks/permission/useHRView";

interface RoleSwitchButtonProps {
  variant?: "default" | "onBanner";
}

/*
  RoleSwitchButton- Visible ONLY when canSwitchView === true:
   user has "Employee" role AND at least one other role.
 Pure employees, admins, and non-employee users → returns null.
 */
const RoleSwitchButton: React.FC<RoleSwitchButtonProps> = ({
  variant = "default",
}) => {
  const { viewMode, canSwitchView, toggleViewMode } = useHRView();

  if (!canSwitchView) return null;

  const isEmployeeView = viewMode === "employee";
  const onBanner       = variant === "onBanner";

  const buttonClass = onBanner
    ? `
        inline-flex items-center gap-2
        px-3 py-1.5 rounded-lg
        text-xs font-semibold
        border border-white/40
        bg-white/15 text-white
        hover:bg-white/25
        backdrop-blur-sm
        transition-all duration-200
        select-none whitespace-nowrap
      `
    // Default: same styling as the existing HR module toggle
    : `
        inline-flex items-center gap-2
        px-3 py-1.5 rounded-lg
        text-xs font-semibold
        border transition-all duration-200
        select-none whitespace-nowrap
        ${
          isEmployeeView
            ? "border-[var(--primary)] bg-[color-mix(in_srgb,var(--primary)_10%,transparent)] text-[var(--primary)] hover:bg-[color-mix(in_srgb,var(--primary)_20%,transparent)]"
            : "border-[var(--border)] bg-[var(--card)] text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--row-hover)]"
        }
      `;

  return (
    <button
      type="button"
      onClick={toggleViewMode}
      title={
        isEmployeeView
          ? "Switch to Professional / Manager view"
          : "Switch back to Employee view"
      }
      className={buttonClass}
    >
      {isEmployeeView ? (
        <User size={13} strokeWidth={2} aria-hidden="true" />
      ) : (
        <UserCog size={13} strokeWidth={2} aria-hidden="true" />
      )}

      <span>
        {isEmployeeView ? "Switch to Professional" : "Switch to Employee"}
      </span>

      <ArrowLeftRight size={11} strokeWidth={2} aria-hidden="true" />
    </button>
  );
};

export default RoleSwitchButton;