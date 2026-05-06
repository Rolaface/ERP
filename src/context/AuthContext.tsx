import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import { loginApi, logoutApi, fetchLoginUser } from "../api/authService";
import type { AuthUser } from "../api/authService";
import { useCompanyStore } from "../store/companyStore";

const SID_KEY  = "session_id";
const USER_KEY = "auth_user";

interface AuthContextType {
  isAuthenticated: boolean;
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshPermissions: () => Promise<void>;   // ← manual trigger for role updates
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser]       = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // ── On mount — restore from localStorage ────────────────────────────────
  useEffect(() => {
    const sid        = localStorage.getItem(SID_KEY);
    const storedUser = localStorage.getItem(USER_KEY);

    if (sid && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        // corrupt storage — clear it
        localStorage.removeItem(SID_KEY);
        localStorage.removeItem(USER_KEY);
      }
    }

    setLoading(false);
  }, []);

  // ── Login — call loginApi then fetchLoginUser for permissions ────────────
  const login = useCallback(async (email: string, password: string) => {
    // Step 1: authenticate, get sid + basic user info
    const basicUser = await loginApi(email, password);
    setUser(basicUser);

    // Step 2: fetch full user with permissions
    try {
      const fullUser = await fetchLoginUser();
      setUser(fullUser);
    } catch (err) {
      // permissions fetch failed — user is still logged in
      // PermissionBootstrap will show error state
      console.error("[AuthContext] fetchLoginUser failed after login:", err);
    }
  }, []);

  // ── Refresh permissions — call on role/user update ───────────────────────
  const refreshPermissions = useCallback(async () => {
    if (!localStorage.getItem(SID_KEY)) return;  // not logged in

    try {
      const freshUser = await fetchLoginUser();
      setUser(freshUser);
    } catch (err) {
      console.error("[AuthContext] refreshPermissions failed:", err);
    }
  }, []);

  // ── Logout ───────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    await logoutApi();
    setUser(null);
    useCompanyStore.getState().clearCompanyInfo();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,
        user,
        loading,
        login,
        logout,
        refreshPermissions,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
};