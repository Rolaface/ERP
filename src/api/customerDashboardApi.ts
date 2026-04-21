import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";
import { API, ERP_BASE } from "../config/api";

const api = createAxiosInstance(ERP_BASE);

export const CustomerDashboardAPI = API.customerDashboard;

export type CustomerDashboardSummaryRawData = {
  totalCustomers: number;
  totalIndividualCustomers: number;
  totalCompanyCustomers: number;
  noTaxCategoryCustomers: number;
  taxCategories: string[]; 
} & Record<string, number | string[]>;

export type CustomerDashboardSummaryResponse = {
  status_code: number;
  status: string;
  message: string;
  data: CustomerDashboardSummaryRawData;
};

export type CustomerDashboardSummary = {
  totalCustomers: number;
  totalIndividualCustomers: number;
  totalCompanyCustomers: number;
  noTaxCategoryCustomers: number;
  taxCategories: { name: string; count: number }[];
};

function normalise(raw: CustomerDashboardSummaryRawData): CustomerDashboardSummary {
  const taxCategories = (raw.taxCategories ?? []).map((name) => ({
    name,
    count: typeof raw[name] === "number" ? (raw[name] as number) : 0,
  }));

  return {
    totalCustomers: raw.totalCustomers,
    totalIndividualCustomers: raw.totalIndividualCustomers,
    totalCompanyCustomers: raw.totalCompanyCustomers,
    noTaxCategoryCustomers: raw.noTaxCategoryCustomers,
    taxCategories,
  };
}

export async function getCustomerDashboardSummary(): Promise<CustomerDashboardSummary> {
  const resp: AxiosResponse<CustomerDashboardSummaryResponse> = await api.get(
    CustomerDashboardAPI.summary,
  );
  return normalise(resp.data.data);
}