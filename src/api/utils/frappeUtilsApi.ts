import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "../axiosInstance";
import { API, ERP_BASE } from "../../config/api";

const api = createAxiosInstance(ERP_BASE);
export const FrappeUtilsAPI = API.frappeUtilsAPI;

export async function getCompanyCurrentFiscalYear(
): Promise<any> {
  const resp: AxiosResponse = await api.get(
    FrappeUtilsAPI.getCompanyCurrentFiscalYear,
  );

  return resp.data?.message ?? [];
}

export async function getAllDepartments(
  search?: string
): Promise<any[]> {
  try {
    const url = search
      ? `${FrappeUtilsAPI.getdepartment}?search=${encodeURIComponent(search)}`
      : FrappeUtilsAPI.getdepartment;

    const resp: AxiosResponse = await api.get(url);

    return resp.data?.data ?? []; 

  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      "Failed to fetch departments"
    );
  }
}
export async function getAllGrades(
  search?: string
): Promise<any[]> {
  try {
    const url = search
      ? `${FrappeUtilsAPI.getgrade}?search=${encodeURIComponent(search)}`
      : FrappeUtilsAPI.getgrade;

    const resp: AxiosResponse = await api.get(url);

    return resp.data?.data ?? []; 
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      "Failed to fetch grades"
    );
  }
}
export async function getAllDesignations(
  search?: string
): Promise<any[]> {
  try {
    const url = search
      ? `${FrappeUtilsAPI.getdesignation}?search=${encodeURIComponent(search)}`
      : FrappeUtilsAPI.getdesignation;

    const resp: AxiosResponse = await api.get(url);

    return resp.data?.data ?? []; 
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      "Failed to fetch designations"
    );
  }
}
export async function getAllEmploymentTypes(
  search?: string
): Promise<any[]> {
  try {
    const url = search
      ? `${FrappeUtilsAPI.getemployeetype}?search=${encodeURIComponent(search)}`
      : FrappeUtilsAPI.getemployeetype;

    const resp: AxiosResponse = await api.get(url);

    return resp.data?.data ?? []; 
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      "Failed to fetch employment types"
    );
  }
}

export async function getAllSalaryStructures(
  search?: string
): Promise<any[]> {
  try {
    const url = search
      ? `${FrappeUtilsAPI.getsalarystructure}?search=${encodeURIComponent(search)}`
      : FrappeUtilsAPI.getsalarystructure;

    const resp: AxiosResponse = await api.get(url);

    return resp.data?.data ?? []; 
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      "Failed to fetch salary structures"
    );
  }
}
export async function getAllLeavePolicies(
  search?: string
): Promise<any[]> {
  try {
    const url = search
      ? `${FrappeUtilsAPI.getleavepolicy}?search=${encodeURIComponent(search)}`
      : FrappeUtilsAPI.getleavepolicy;

    const resp: AxiosResponse = await api.get(url);

    return resp.data?.data ?? []; 
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      "Failed to fetch leave policies"
    );
  }
}
export async function getalluser(
  search?: string
): Promise<any[]> {
  try {
    const url = search
      ? `${FrappeUtilsAPI.getUsers}?search=${encodeURIComponent(search)}`
      : FrappeUtilsAPI.getUsers;

    const resp: AxiosResponse = await api.get(url);

    return resp.data?.data ?? []; 
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      "Failed to fetch leave policies"
    );
  }
}

export async function getPayrollEmployees(filters: {
  start_date: string;        // required
  end_date: string;          // required
  payroll_frequency?: string;
  payroll_payable_account?: string;
  currency?: string;
  branch?: string;
  department?: string;
  designation?: string;
  grade?: string;
  page?: number;
  page_size?: number;
}): Promise<any[]> {
  try {
    const params = new URLSearchParams();

    // Required
    params.append("start_date", filters.start_date);
    params.append("end_date", filters.end_date);

    // Optional — only append if truthy
    if (filters.payroll_frequency)       params.append("payroll_frequency", filters.payroll_frequency);
    if (filters.payroll_payable_account) params.append("payroll_payable_account", filters.payroll_payable_account);
    if (filters.currency)                params.append("currency", filters.currency);
    if (filters.branch)                  params.append("branch", filters.branch);
    if (filters.department)              params.append("department", filters.department);
    if (filters.designation)             params.append("designation", filters.designation);
    if (filters.grade)                   params.append("grade", filters.grade);
    if (filters.page)                    params.append("page", String(filters.page));
    if (filters.page_size)               params.append("page_size", String(filters.page_size));

    const resp: AxiosResponse = await api.get(
      `${FrappeUtilsAPI.getPayrollEmployees}?${params.toString()}`
    );

    return resp.data?.data ?? [];
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      "Failed to fetch payroll employees"
    );
  }
}