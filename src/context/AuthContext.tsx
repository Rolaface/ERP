import React, { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { loginApi, logoutApi, AuthUser } from "../api/authService";
import { useCompanyStore } from "../store/companyStore";

const SID_KEY = "session_id";

interface AuthContextType {
  isAuthenticated: boolean;
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sid = localStorage.getItem(SID_KEY);
    const storedUser = localStorage.getItem("auth_user");

    if (sid && storedUser) {
      setUser(JSON.parse(storedUser));
    }

    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const loggedUser = await loginApi(email, password);
    setUser(loggedUser);
  };

const logout = async () => {
  await logoutApi();
  setUser(null);
  useCompanyStore.getState().clearCompanyInfo();
};

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,
        user,
        loading,
        login,
        logout,
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