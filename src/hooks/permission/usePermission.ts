import { usePermissionStore, type PermissionAction } from "../../store/permissionStore";

export function usePermission() {
  const can             = usePermissionStore((s) => s.can);
  const canAccessModule = usePermissionStore((s) => s.canAccessModule);
  const canAccessAnyOf  = usePermissionStore((s) => s.canAccessAnyOf);
  const permissions     = usePermissionStore((s) => s.permissions);
  const isLoading       = usePermissionStore((s) => s.isLoading);
  const isAdmin         = usePermissionStore((s) => s.isAdmin);  // ← ADD

  const canAll = (module: string, actions: PermissionAction[]): boolean => {
    if (isAdmin) return true;                                      // ← ADD
    return actions.every((action) => can(module, action));
  };

  const canAny = (module: string, actions: PermissionAction[]): boolean => {
    if (isAdmin) return true;                                      // ← ADD
    return actions.some((action) => can(module, action));
  };

  return {
    can,
    canAll,
    canAny,
    canAccessModule,
    canAccessAnyOf,
    permissions,
    isLoading,
    isAdmin,              // ← ADD
  };
}