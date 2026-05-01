import type { AxiosResponse } from "axios";

import { API, ERP_BASE } from "../config/api";
import { createAxiosInstance } from "./axiosInstance";

const api = createAxiosInstance(ERP_BASE);
const EmployeeConfig = API.employeeConfig;

interface FrappeListResponse<T> {
  data: T[];
}

interface FrappeDetailResponse<T> {
  data: T;
}

export interface DepartmentApprover {
  approver: string;
}

export interface Department {
  name?: string;
  parent_department?: string;
  department_name: string;

  is_group?: 0 | 1;
  leave_block_list?: string;
  leave_approvers?: DepartmentApprover[];
  expense_approvers?: DepartmentApprover[];
  shift_request_approver?: DepartmentApprover[];
}

export interface Designation {
  name?: string;
  designation_name: string;
  description?: string;
}

export interface EmployeeGrade {
  name: string;
  default_salary_structure?: string;
}

export interface EmployeeType {
  name?: string;
  employee_type: string;
}

function getErrorMessage(error: any, fallback: string) {
  return error?.response?.data?.message || error?.message || fallback;
}

export async function getAllDepartments(): Promise<Department[]> {
  try {
    const fields = JSON.stringify([
      "name",
      "department_name",
      "parent_department",
      
      "is_group",
      "leave_block_list",
    ]);
    const url = `${EmployeeConfig.department.getAll}?fields=${encodeURIComponent(fields)}&limit_page_length=200`;
    const resp: AxiosResponse<FrappeListResponse<Department>> =
      await api.get(url);
    return resp.data?.data ?? [];
  } catch (error: any) {
    throw new Error(getErrorMessage(error, "Failed to fetch departments"));
  }
}

export async function getDepartment(name: string): Promise<Department> {
  try {
    const url = `${EmployeeConfig.department.getById}/${encodeURIComponent(name)}`;
    const resp: AxiosResponse<FrappeDetailResponse<Department>> =
      await api.get(url);
    return resp.data?.data;
  } catch (error: any) {
    throw new Error(getErrorMessage(error, "Failed to fetch department"));
  }
}

export async function createDepartment(
  payload: Omit<Department, "name">,
): Promise<Department> {
  try {
    const resp: AxiosResponse<FrappeDetailResponse<Department>> =
      await api.post(EmployeeConfig.department.create, payload);
    return resp.data?.data;
  } catch (error: any) {
    throw new Error(getErrorMessage(error, "Failed to create department"));
  }
}

export async function updateDepartment(
  name: string,
  payload: Partial<Omit<Department, "name">>,
): Promise<Department> {
  try {
    const url = `${EmployeeConfig.department.update}/${encodeURIComponent(name)}`;
    const resp: AxiosResponse<FrappeDetailResponse<Department>> =
      await api.put(url, payload);
    return resp.data?.data;
  } catch (error: any) {
    throw new Error(getErrorMessage(error, "Failed to update department"));
  }
}

export async function deleteDepartment(name: string): Promise<void> {
  try {
    const url = `${EmployeeConfig.department.delete}/${encodeURIComponent(name)}`;
    await api.delete(url);
  } catch (error: any) {
    throw new Error(getErrorMessage(error, "Failed to delete department"));
  }
}

export async function getAllDesignations(): Promise<Designation[]> {
  try {
    const fields = JSON.stringify(["name", "designation_name", "description"]);
    const url = `${EmployeeConfig.designation.getAll}?fields=${encodeURIComponent(fields)}&limit_page_length=200`;
    const resp: AxiosResponse<FrappeListResponse<Designation>> =
      await api.get(url);
    return resp.data?.data ?? [];
  } catch (error: any) {
    throw new Error(getErrorMessage(error, "Failed to fetch designations"));
  }
}

export async function getDesignation(name: string): Promise<Designation> {
  try {
    const url = `${EmployeeConfig.designation.getById}/${encodeURIComponent(name)}`;
    const resp: AxiosResponse<FrappeDetailResponse<Designation>> =
      await api.get(url);
    return resp.data?.data;
  } catch (error: any) {
    throw new Error(getErrorMessage(error, "Failed to fetch designation"));
  }
}

export async function createDesignation(
  payload: Omit<Designation, "name">,
): Promise<Designation> {
  try {
    const resp: AxiosResponse<FrappeDetailResponse<Designation>> =
      await api.post(EmployeeConfig.designation.create, payload);
    return resp.data?.data;
  } catch (error: any) {
    throw new Error(getErrorMessage(error, "Failed to create designation"));
  }
}

export async function updateDesignation(
  name: string,
  payload: Partial<Omit<Designation, "name">>,
): Promise<Designation> {
  try {
    const url = `${EmployeeConfig.designation.update}/${encodeURIComponent(name)}`;
    const resp: AxiosResponse<FrappeDetailResponse<Designation>> =
      await api.put(url, payload);
    return resp.data?.data;
  } catch (error: any) {
    throw new Error(getErrorMessage(error, "Failed to update designation"));
  }
}

export async function deleteDesignation(name: string): Promise<void> {
  try {
    const url = `${EmployeeConfig.designation.delete}/${encodeURIComponent(name)}`;
    await api.delete(url);
  } catch (error: any) {
    throw new Error(getErrorMessage(error, "Failed to delete designation"));
  }
}

export async function getAllEmployeeGrades(): Promise<EmployeeGrade[]> {
  try {
    const fields = JSON.stringify(["name", "default_salary_structure"]);
    const url = `${EmployeeConfig.grade.getAll}?fields=${encodeURIComponent(fields)}&limit_page_length=200`;
    const resp: AxiosResponse<FrappeListResponse<EmployeeGrade>> =
      await api.get(url);
    return resp.data?.data ?? [];
  } catch (error: any) {
    throw new Error(getErrorMessage(error, "Failed to fetch grades"));
  }
}

export async function getEmployeeGrade(name: string): Promise<EmployeeGrade> {
  try {
    const url = `${EmployeeConfig.grade.getById}/${encodeURIComponent(name)}`;
    const resp: AxiosResponse<FrappeDetailResponse<EmployeeGrade>> =
      await api.get(url);
    return resp.data?.data;
  } catch (error: any) {
    throw new Error(getErrorMessage(error, "Failed to fetch grade"));
  }
}

export async function createEmployeeGrade(
  payload: EmployeeGrade,
): Promise<EmployeeGrade> {
  try {
    const resp: AxiosResponse<FrappeDetailResponse<EmployeeGrade>> =
      await api.post(EmployeeConfig.grade.create, payload);
    return resp.data?.data;
  } catch (error: any) {
    throw new Error(getErrorMessage(error, "Failed to create grade"));
  }
}

export async function updateEmployeeGrade(
  name: string,
  payload: Partial<Omit<EmployeeGrade, "name">>,
): Promise<EmployeeGrade> {
  try {
    const url = `${EmployeeConfig.grade.update}/${encodeURIComponent(name)}`;
    const resp: AxiosResponse<FrappeDetailResponse<EmployeeGrade>> =
      await api.put(url, payload);
    return resp.data?.data;
  } catch (error: any) {
    throw new Error(getErrorMessage(error, "Failed to update grade"));
  }
}

export async function deleteEmployeeGrade(name: string): Promise<void> {
  try {
    const url = `${EmployeeConfig.grade.delete}/${encodeURIComponent(name)}`;
    await api.delete(url);
  } catch (error: any) {
    throw new Error(getErrorMessage(error, "Failed to delete grade"));
  }
}

export async function getAllEmployeeTypes(): Promise<EmployeeType[]> {
  try {
    const fields = JSON.stringify(["name", "employee_type"]);
    const url = `${EmployeeConfig.employeeType.getAll}?fields=${encodeURIComponent(fields)}&limit_page_length=200`;
    const resp: AxiosResponse<FrappeListResponse<EmployeeType>> =
      await api.get(url);
    return resp.data?.data ?? [];
  } catch (error: any) {
    throw new Error(getErrorMessage(error, "Failed to fetch employee types"));
  }
}

export async function getEmployeeType(name: string): Promise<EmployeeType> {
  try {
    const url = `${EmployeeConfig.employeeType.getById}/${encodeURIComponent(name)}`;
    const resp: AxiosResponse<FrappeDetailResponse<EmployeeType>> =
      await api.get(url);
    return resp.data?.data;
  } catch (error: any) {
    throw new Error(getErrorMessage(error, "Failed to fetch employee type"));
  }
}

export async function createEmployeeType(
  payload: Omit<EmployeeType, "name">,
): Promise<EmployeeType> {
  try {
    const resp: AxiosResponse<FrappeDetailResponse<EmployeeType>> =
      await api.post(EmployeeConfig.employeeType.create, payload);
    return resp.data?.data;
  } catch (error: any) {
    throw new Error(getErrorMessage(error, "Failed to create employee type"));
  }
}

export async function updateEmployeeType(
  name: string,
  payload: Partial<Omit<EmployeeType, "name">>,
): Promise<EmployeeType> {
  try {
    const url = `${EmployeeConfig.employeeType.update}/${encodeURIComponent(name)}`;
    const resp: AxiosResponse<FrappeDetailResponse<EmployeeType>> =
      await api.put(url, payload);
    return resp.data?.data;
  } catch (error: any) {
    throw new Error(getErrorMessage(error, "Failed to update employee type"));
  }
}

export async function deleteEmployeeType(name: string): Promise<void> {
  try {
    const url = `${EmployeeConfig.employeeType.delete}/${encodeURIComponent(name)}`;
    await api.delete(url);
  } catch (error: any) {
    throw new Error(getErrorMessage(error, "Failed to delete employee type"));
  }
}
