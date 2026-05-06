import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";
import { ERP_BASE, API } from "../config/api";

const api = createAxiosInstance(ERP_BASE);

const SID_KEY   = "session_id";
const USER_KEY  = "auth_user";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RawPermissionEntry {
  module: string;
  read: 0 | 1;
  write: 0 | 1;
  create: 0 | 1;
  delete: 0 | 1;
  report: 0 | 1;
  import: 0 | 1;
  export: 0 | 1;
}

export interface AuthUser {
  username?: string;
  email?: string;
  fullName?: string;
  gender?: string | null;
  roles?: string[];
  permissions?: RawPermissionEntry[];  // ← stored from get_login_user
}

// ─── Login ────────────────────────────────────────────────────────────────────

interface LoginApiResponse {
  message?: {
    status?: string;
    data?: {
      sid?: string;
      username?: string;
      email?: string;
      full_name?: string;
      gender?: string | null;
      roles?: string[];
    };
  };
}

export const loginApi = async (
  email: string,
  password: string
): Promise<AuthUser> => {
  const resp: AxiosResponse<LoginApiResponse> = await api.post(
    API.loginApi.login,
    { usr: email, pwd: password }
  );
  const data = resp.data;

  if (!data?.message || data.message.status !== "success") {
    throw new Error("LOGIN_FAILED");
  }

  const sid = data.message.data?.sid;

  const user: AuthUser = {
    username: data.message.data?.username,
    email:    data.message.data?.email,
    fullName: data.message.data?.full_name,
    gender:   data.message.data?.gender ?? null,
    roles:    data.message.data?.roles ?? [],
  };

  if (sid) {
    localStorage.setItem(SID_KEY, sid);
    // permissions not stored here — fetchLoginUser handles it
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  return user;
};

// ─── get_login_user — single source of truth for permissions ─────────────────

interface GetLoginUserResponse {
  message: {
    status: "success" | "error";
    message: string | null;
    data: {
      firstName: string;
      lastName: string | null;
      fullName: string;
      email: string;
      username: string;
      gender: string | null;
      roles: string[];
      permission: RawPermissionEntry[];   // ← "permission" not "permissions"
    };
  };
}

export const fetchLoginUser = async (): Promise<AuthUser> => {
  const resp: AxiosResponse<GetLoginUserResponse> = await api.get(
    API.RoleManagement.getUserDetails
  );

  const data = resp.data;

  if (!data?.message || data.message.status !== "success") {
    throw new Error("FETCH_LOGIN_USER_FAILED");
  }

  const d = data.message.data;

  const user: AuthUser = {
    username:    d.username,
    email:       d.email,
    fullName:    d.fullName,
    gender:      d.gender,
    roles:       d.roles ?? [],
    permissions: d.permission ?? [],    // ← "permission" field se lena
  };

  // Update localStorage with fresh data
  localStorage.setItem(USER_KEY, JSON.stringify(user));

  return user;
};

// ─── Logout ───────────────────────────────────────────────────────────────────

export const logoutApi = async (): Promise<void> => {
  try {
    await api.post(API.loginApi.logout);
  } catch (err) {
    console.warn("Logout API failed, clearing local session anyway");
  } finally {
    localStorage.removeItem(SID_KEY);
    localStorage.removeItem(USER_KEY);
  }
};

export const resetPasswordApi = async (
  username: string
): Promise<{ message: string }> => {

  await new Promise((resolve) => setTimeout(resolve, 800));

  if (!username || username.trim() === "") {
    throw new Error("Username is required");
  }

  if (username.length < 3) {
    throw new Error("Invalid username");
  }

  return {
    message: "Reset link sent successfully (demo mode)",
  };
};