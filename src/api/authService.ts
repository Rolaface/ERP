import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";
import { ERP_BASE, API } from "../config/api";

const api = createAxiosInstance(ERP_BASE);

interface LoginApiResponse {
  message?: {
    status?: string;
    data?: {
      sid?: string;          
      username?: string;
      email?: string;
      full_name?: string;
    };
  };
}

export interface AuthUser {
  username?: string;
  email?: string;
  fullName?: string;
}


const SID_KEY = "session_id";

export const loginApi = async (
  email: string,
  password: string
): Promise<AuthUser> => {
  const resp: AxiosResponse<LoginApiResponse> = await api.post(
    API.loginApi.login,
    {
      usr: email,
      pwd: password,
    }
  );

  const data = resp.data;

  if (!data?.message || data.message.status !== "success") {
    throw new Error("LOGIN_FAILED");
  }

  const sid = data.message.data?.sid;

 if (sid) {
  localStorage.setItem(SID_KEY, sid);
  localStorage.setItem("auth_user", JSON.stringify({
    username: data.message.data?.username,
    email: data.message.data?.email,
    fullName: data.message.data?.full_name,
  }));
}
  return {
    username: data.message.data?.username,
    email: data.message.data?.email,
    fullName: data.message.data?.full_name,
  };
};

export const logoutApi = async (): Promise<void> => {
  try {
    await api.post(API.loginApi.logout);
  } catch (err) {
    console.warn("Logout API failed, clearing local session anyway");
  } finally {
    localStorage.removeItem(SID_KEY);
    localStorage.removeItem("auth_user");
  }
};

export const getCurrentUserApi = async (): Promise<AuthUser | null> => {
  try {
    const resp = await api.get("/api/method/frappe.auth.get_logged_user");
    return resp.data?.message || null;
  } catch {
    return null;
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