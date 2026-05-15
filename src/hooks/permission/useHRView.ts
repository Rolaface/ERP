import { useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { useHRViewStore } from "../../store/hrViewStore";
import { usePermissionStore } from "../../store/permissionStore";

export type HRViewMode = "employee" | "professional";

export interface HRViewContext {
  viewMode:             HRViewMode;
  canSwitchView:        boolean;
  isPureEmployee:       boolean;
  switchToProfessional: () => void;
  switchToEmployee:     () => void;
  toggleViewMode:       () => void;
}

export function useHRView(): HRViewContext {
  const { user }    = useAuth();
  const isAdmin     = usePermissionStore((s) => s.isAdmin);
  const viewModes   = useHRViewStore((s) => s.viewModes);
  const setViewMode = useHRViewStore((s) => s.setViewMode);

  const username = user?.username ?? "";
  const roles    = user?.roles    ?? [];

  const hasEmployeeRole = roles.includes("Employee");
  const hasOtherRoles   = roles.some((r) => r !== "Employee");

  // ── Admin: always professional, no switching ──────────────────────────────
  if (isAdmin) {
    return {
      viewMode:             "professional",
      canSwitchView:        false,
      isPureEmployee:       false,
      switchToProfessional: () => {},
      switchToEmployee:     () => {},
      toggleViewMode:       () => {},
    };
  }

  // ── Pure professional (no Employee role at all) ───────────────────────────
  // e.g. PROCUREMENT-only, HR Manager-only, etc.
  // Always professional view, no switch button, ignore persisted viewMode.
  if (!hasEmployeeRole) {
    return {
      viewMode:             "professional",
      canSwitchView:        false,
      isPureEmployee:       false,
      switchToProfessional: () => {},
      switchToEmployee:     () => {},
      toggleViewMode:       () => {},
    };
  }

  // ── Pure employee (Employee role only, no other roles) ───────────────────
  // Always employee view, no switch button.
  const isPureEmployee = hasEmployeeRole && !hasOtherRoles;
  if (isPureEmployee) {
    return {
      viewMode:             "employee",
      canSwitchView:        false,
      isPureEmployee:       true,
      switchToProfessional: () => {},
      switchToEmployee:     () => {},
      toggleViewMode:       () => {},
    };
  }

  // ── Dual role (Employee + other roles) ───────────────────────────────────
  // Has switch button. Persisted viewMode applies, default to "employee"
  // since they have the Employee role and that's the safer starting point.
  const canSwitchView = true;
  const viewMode: HRViewMode = viewModes[username] ?? "employee";

  return {
    viewMode,
    canSwitchView,
    isPureEmployee: false,
    switchToProfessional: () => setViewMode(username, "professional"),
    switchToEmployee:     () => setViewMode(username, "employee"),
    toggleViewMode:       () =>
      setViewMode(
        username,
        viewMode === "employee" ? "professional" : "employee",
      ),
  };
}