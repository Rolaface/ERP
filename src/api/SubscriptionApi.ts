import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";
import { API, ERP_BASE } from "../config/api";

const api = createAxiosInstance(ERP_BASE);
export const SubscriptionAPI = API.subscription;

export interface SubscriptionModule {
  module: string;
  module_name: string;
  product: string;
  is_enabled: 0 | 1;
  price: number;
}

export interface SubscriptionDetails {
  name: string;
  plan_name: string;
  plan_price: number;
  currency: string;
  billing_frequency: string;
  custom_interval_months?: number;
  renewal_mode: string;
  start_date: string;
  trial_enabled: 0 | 1;
  trial_days: number;
  trial_end_date: string | null;
  setup_fee: number;
  user_limit: number;
  products: string; 
  modules: SubscriptionModule[];
}

export interface MySubscriptionResponse {
  name: string;
  subscription_status: string;
  details: SubscriptionDetails;
}


export async function getMySubscription(): Promise<MySubscriptionResponse | null> {
  const resp: AxiosResponse = await api.get(SubscriptionAPI.mysubscription, {
    params: {
      fields: JSON.stringify(["name", "subscription_status", "details"]),
      filters: JSON.stringify([["subscription_status", "=", "Active"]]),
      order_by: "creation desc",
      limit_page_length: 1,
    },
  });

  const row = resp?.data?.data?.[0];
  if (!row) return null;

  const details: SubscriptionDetails =
    typeof row.details === "string" ? JSON.parse(row.details) : row.details;

  return {
    name: row.name,
    subscription_status: row.subscription_status,
    details,
  };
}