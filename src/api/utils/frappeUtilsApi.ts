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