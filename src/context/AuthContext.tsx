import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import { loginApi, logoutApi, fetchLoginUser } from "../api/authService";
import type { AuthUser } from "../api/authService";
import { useCompanyStore } from "../store/companyStore";
import { useHRViewStore } from "../store/hrViewStore";

const SID_KEY  = "session_id";
const USER_KEY = "auth_user";

interface AuthContextType {
  isAuthenticated: boolean;
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;   
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
  const basicUser = await loginApi(email, password);
  setUser(basicUser);

  try {
    const fullUser = await fetchLoginUser();
    setUser({
      ...fullUser,
      sid: basicUser.sid,
      subscribedProducts: basicUser.subscribedProducts,   
    });
    useCompanyStore.getState().setZraEnabled(fullUser.isZraEnabled ?? false);
  } catch (err) {
    console.error("[AuthContext] fetchLoginUser failed after login:", err);
  }

  return basicUser;
}, []);

const refreshPermissions = useCallback(async () => {
  if (!localStorage.getItem(SID_KEY)) return;

  try {
    const freshUser = await fetchLoginUser();
    setUser(freshUser);
    useCompanyStore.getState().setZraEnabled(freshUser.isZraEnabled ?? false);
  } catch (err) {
    console.error("[AuthContext] refreshPermissions failed:", err);
  }
}, []);

  // ── Logout ───────────────────────────────────────────────────────────────
const logout = useCallback(async () => {
  const username = user?.username;
  if (username) {
    useHRViewStore.getState().clearViewMode(username);
  }
  await logoutApi();
  setUser(null);
  useCompanyStore.getState().clearCompanyInfo();
}, [user]);


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