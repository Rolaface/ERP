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
  const { user }      = useAuth();
  const isAdmin       = usePermissionStore((s) => s.isAdmin);
  const viewModes     = useHRViewStore((s) => s.viewModes);
  const setViewMode   = useHRViewStore((s) => s.setViewMode);

  const username = user?.username ?? "";
  const roles    = user?.roles    ?? [];

  const hasEmployeeRole = roles.includes("Employee");
  const hasOtherRoles   = roles.some((r) => r !== "Employee");



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

  const isPureEmployee = hasEmployeeRole && !hasOtherRoles;
  const canSwitchView  = hasEmployeeRole && hasOtherRoles;
  const viewMode: HRViewMode = viewModes[username] ?? "employee";

  return {
    viewMode,
    canSwitchView,
    isPureEmployee,
    switchToProfessional: () => setViewMode(username, "professional"),
    switchToEmployee:     () => setViewMode(username, "employee"),
    toggleViewMode:       () =>
      setViewMode(
        username,
        viewMode === "employee" ? "professional" : "employee"
      ),
  };
}