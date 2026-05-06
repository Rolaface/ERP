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

  // Track what we last loaded so we don't re-run unnecessarily
  const loadedRef = useRef<string>("");

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) return;

    // No session — clear everything
    if (!roles || roles.length === 0) {
      clearPermissions();
      loadedRef.current = "";
      return;
    }

    // ── Administrator check ──────────────────────────────────────────────
    const isAdministrator = roles.includes("Administrator");

    if (isAdministrator) {
      // For admin — store actual permissions from API too
      // but mark as admin so all can() calls return true
      setAdmin(true);
      if (permissions && permissions.length > 0) {
        setPermissions(permissions);   // store them but isAdmin bypasses checks
      } else {
        setLoading(false);
      }
      loadedRef.current = "Administrator";
      return;
    }

    // ── Normal user ──────────────────────────────────────────────────────
    if (!permissions || permissions.length === 0) {
      // No permissions in user object — clear store
      clearPermissions();
      loadedRef.current = "";
      return;
    }

    // Stable key — serialize permissions length + first role
    // Changes only when permissions actually update
    const stableKey = `${roles[0]}_${permissions.length}`;
    if (loadedRef.current === stableKey) return;

    setAdmin(false);
    setPermissions(permissions);
    loadedRef.current = stableKey;

  }, [authLoading, roles, permissions]);
}