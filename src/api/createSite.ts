// src/api/createSite.ts
import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";
import { API, ERP_BASE } from "../config/api";

const api = createAxiosInstance(ERP_BASE);

export interface CreateSitePayload {
  currency: string;
  country: string;
  timezone: string;
  language: string;
  full_name: string;
  email: string;
  password: string;
  company_name: string;
  company_abbr: string;
  chart_of_accounts: string;
  fy_start_date: string;
  fy_end_date: string;
  setup_demo: number;
  apps: string[];
}

// Matches actual API response: { message: { status, site, message } }
export interface CreateSiteResponse {
  message: {
    status: string;   // "accepted"
    site: string;     // "rolll.rolaface.com"
    message: string;  // "Site provisioning started"
  };
}

export const createSite = async (
  data: CreateSitePayload
): Promise<CreateSiteResponse> => {
  const resp: AxiosResponse<CreateSiteResponse> = await api.post(
    API.company.createSite,
    data
  );
  return resp.data;
};