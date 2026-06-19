import { useEffect, useRef } from "react";
import { usePermissionStore } from "../../store/permissionStore";
import type { RawPermissionEntry } from "../../api/authService";

export function useBootPermissions(
  roles: string[] | null | undefined,
  permissions: RawPermissionEntry[] | null | undefined,
  authLoading: boolean,
) {
  const setPermissions   = usePermissionStore((s) => s.setPermissions);
  const setLoading       = usePermissionStore((s) => s.setLoading);
  const setAdmin         = usePermissionStore((s) => s.setAdmin);
  const clearPermissions = usePermissionStore((s) => s.clearPermissions);

  const loadedRef = useRef<string>("");

  useEffect(() => {
    // 1. Auth still loading — wait
    if (authLoading) return;

    // 2. Auth done but no user/roles
    if (!roles || roles.length === 0) {
      clearPermissions();       
      loadedRef.current = "";
      return;
    }

    const isAdministrator = roles.includes("Administrator");

    if (isAdministrator) {
      setAdmin(true);
      if (permissions && permissions.length > 0) {
        setPermissions(permissions);
      } else {
        setLoading(false);       
      }
      loadedRef.current = "Administrator";
      return;
    }

    
    if (!permissions || permissions.length === 0) {
      clearPermissions();
      loadedRef.current = "";
      return;
    }

    const stableKey = `${roles[0]}_${permissions.length}`;

    
    if (loadedRef.current === stableKey) {
      setLoading(false);       
      return;
    }

    setAdmin(false);
    setPermissions(permissions);
    loadedRef.current = stableKey;

  }, [authLoading, roles, permissions]);
}