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
  end_date?: string | null;
  setup_fee: number;
  user_limit: number;
  products: string;
  modules: SubscriptionModule[];
}

export interface MySubscriptionResponse {
  name: string;
  details: SubscriptionDetails;
}

const parseDetails = (raw: unknown): SubscriptionDetails | null => {
  if (!raw) return null;
  if (typeof raw !== "string") return raw as SubscriptionDetails;
  try {
    return JSON.parse(raw) as SubscriptionDetails;
  } catch {
    return null;
  }
};

export async function getMySubscription(): Promise<MySubscriptionResponse | null> {
  const resp: AxiosResponse = await api.get(SubscriptionAPI.mysubscription, {
    params: {
      fields: JSON.stringify(["name", "details"]),
      order_by: "creation desc",
      limit_page_length: 1,
    },
  });

  const row = resp?.data?.data?.[0];
  if (!row) return null;

  const details = parseDetails(row.details);
  if (!details) throw new Error("Invalid subscription data received");

  return { name: row.name, details };
}