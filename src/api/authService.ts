import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";
import { ERP_BASE, API } from "../config/api";
import { deriveSubscribedProducts, type ProductId } from "../utils/productClassifier";

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
  submit: 0 | 1;
  cancel: 0 | 1;
  email: 0 | 1;
}

export interface AuthUser {
  username?: string;
  email?: string;
  fullName?: string;
  gender?: string | null;
  roles?: string[];
  permissions?: RawPermissionEntry[];  // ← stored from get_login_user
  employeeId?: string;
  isZraEnabled?: boolean;
  subscribedProducts?: ProductId[];   
  sid?: string; 
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
       subscribed_modules?: string[]; 
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
  const subscribedModules = data.message.data?.subscribed_modules ?? [];

  const user: AuthUser = {
    username: data.message.data?.username,
    email:    data.message.data?.email,
    fullName: data.message.data?.full_name,
    gender:   data.message.data?.gender ?? null,
    roles:    data.message.data?.roles ?? [],
    subscribedProducts: deriveSubscribedProducts(subscribedModules),
    sid,  
  };

  if (sid) {
    localStorage.setItem(SID_KEY, sid);
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
      permission: RawPermissionEntry[];   
       employeeId?: string;
       is_zra_enabled?: boolean;
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

  const existingUserRaw = localStorage.getItem(USER_KEY);
  const existingUser: AuthUser | null = existingUserRaw ? JSON.parse(existingUserRaw) : null;

  const user: AuthUser = {
    username:    d.username,
    email:       d.email,
    fullName:    d.fullName,
    gender:      d.gender,
    roles:       d.roles ?? [],
    permissions: d.permission ?? [],
    employeeId:  d.employeeId,
    isZraEnabled: d.is_zra_enabled,
    sid: existingUser?.sid,                                   
    subscribedProducts: existingUser?.subscribedProducts,       
  };

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

interface ForgotPasswordResponse {
  message?: {
    status?: string;
    message?: string;
  };
}

export const resetPasswordApi = async (email: string): Promise<{ message: string }> => {
  const resp: AxiosResponse<ForgotPasswordResponse> = await api.post(
    API.loginApi.forgotPassword,
    { email }   
  );

  const data = resp.data;

  if (!data?.message || data.message.status !== "success") {
    throw new Error(data?.message?.message ?? "RESET_FAILED");
  }

  return { message: data.message.message ?? "Reset link sent successfully." };
};


interface ConfirmResetPasswordResponse {
  message?: string;
  home_page?: string;
  full_name?: string;
}

export const confirmResetPasswordApi = async (
  key: string,
  new_password: string,
  confirm_password: string
): Promise<ConfirmResetPasswordResponse> => {
  const resp: AxiosResponse<ConfirmResetPasswordResponse> = await api.post(
    API.loginApi.resetPassword,
    {
      key,
      new_password,
      confirm_password,
      logout_all_sessions: 1,
    }
  );

  return resp.data;
};