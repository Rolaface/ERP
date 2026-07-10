import type { AxiosResponse } from "axios";
import { buildListParams } from "../api/utils/queryBuilder";

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
  employee_type_name: string;
}


type DepartmentResponse = {
  data: Department[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
};

type DesignationResponse = {
  data: Designation[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
};

type EmployeeGradeResponse = {
  data: EmployeeGrade[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
};

type EmployeeTypeResponse = {
  data: EmployeeType[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
};

export async function getAllDepartments(
  start: number,
  pageSize: number,
  search: string,
  sortBy?: string,
  sortOrder?: "asc" | "desc",
): Promise<DepartmentResponse> {
  try {
    const query = buildListParams({
      fields: [
        "name",
        "department_name",
        "parent_department",
        "is_group",
        "leave_block_list",
      ],
      start,
      pageSize,
      search,
      searchFields: ["name"],
      sortBy,
      sortOrder,
    });

    const url = `${EmployeeConfig.department.getAll}?${query}`;
    const resp = await api.get(url);
    return resp.data;
  } catch (error) {
    throw error;
  }
}

export async function getDepartment(name: string): Promise<Department> {
  try {
    const url = `${EmployeeConfig.department.getById}/${encodeURIComponent(name)}`;
    const resp: AxiosResponse<FrappeDetailResponse<Department>> =
      await api.get(url);
    return resp.data?.data;
  } catch (error) {
    throw error;
  }
}

export async function createDepartment(
  payload: Omit<Department, "name">,
): Promise<Department> {
  try {
    const resp: AxiosResponse<FrappeDetailResponse<Department>> =
      await api.post(EmployeeConfig.department.create, payload);
    return resp.data?.data;
  } catch (error) {
    throw error;
  }
}

export async function updateDepartment(
  name: string,
  payload: Partial<Omit<Department, "name">>,
): Promise<Department> {
  try {
    const url = `${EmployeeConfig.department.update}/${encodeURIComponent(name)}`;
    const resp: AxiosResponse<FrappeDetailResponse<Department>> = await api.put(
      url,
      payload,
    );
    return resp.data?.data;
  } catch (error) {
    throw error;
  }
}

export async function deleteDepartment(name: string): Promise<void> {
  try {
    const url = `${EmployeeConfig.department.delete}/${encodeURIComponent(name)}`;
    await api.delete(url);
  } catch (error) {
    throw error;
  }
}

export async function getAllDesignations(
  start: number,
  pageSize: number,
  search: string,
  sortBy?: string,
  sortOrder?: "asc" | "desc",
): Promise<DesignationResponse> {
  try {
    const query = buildListParams({
      fields: ["name", "designation_name", "description"],
      start,
      pageSize,
      search,
      searchFields: ["name"],
      sortBy,
      sortOrder,
    });

    const url = `${EmployeeConfig.designation.getAll}?${query}`;
    const resp: AxiosResponse<DesignationResponse> = await api.get(url);
    return resp.data;
  } catch (error) {
    throw error;
  }
}

export async function getDesignation(name: string): Promise<Designation> {
  try {
    const url = `${EmployeeConfig.designation.getById}/${encodeURIComponent(name)}`;
    const resp: AxiosResponse<FrappeDetailResponse<Designation>> =
      await api.get(url);
    return resp.data?.data;
  } catch (error) {
    throw error;
  }
}

export async function createDesignation(
  payload: Omit<Designation, "name">,
): Promise<Designation> {
  try {
    const resp: AxiosResponse<FrappeDetailResponse<Designation>> =
      await api.post(EmployeeConfig.designation.create, payload);
    return resp.data?.data;
  } catch (error) {
    throw error;
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
  } catch (error) {
    throw error;
  }
}

export async function deleteDesignation(name: string): Promise<void> {
  try {
    const url = `${EmployeeConfig.designation.delete}/${encodeURIComponent(name)}`;
    await api.delete(url);
  } catch (error) {
    throw error;
  }
}

export async function getAllEmployeeGrades(
  start: number,
  pageSize: number,
  search: string,
  sortBy?: string,
  sortOrder?: "asc" | "desc",
): Promise<EmployeeGradeResponse> {
  try {
    const query = buildListParams({
      fields: ["name", "default_salary_structure"],
      start,
      pageSize,
      search,
      searchFields: ["name"],
      sortBy,
      sortOrder,
    });

    const url = `${EmployeeConfig.grade.getAll}?${query}`;
    const resp: AxiosResponse<EmployeeGradeResponse> = await api.get(url);
    return resp.data;
  } catch (error) {
    throw error;
  }
}

export async function getEmployeeGrade(name: string): Promise<EmployeeGrade> {
  try {
    const url = `${EmployeeConfig.grade.getById}/${encodeURIComponent(name)}`;
    const resp: AxiosResponse<FrappeDetailResponse<EmployeeGrade>> =
      await api.get(url);
    return resp.data?.data;
  } catch (error) {
    throw error;
  }
}

export async function createEmployeeGrade(
  payload: EmployeeGrade,
): Promise<EmployeeGrade> {
  try {
    const resp: AxiosResponse<FrappeDetailResponse<EmployeeGrade>> =
      await api.post(EmployeeConfig.grade.create, payload);
    return resp.data?.data;
  } catch (error) {
    throw error;
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
  } catch (error) {
    throw error;
  }
}

export async function deleteEmployeeGrade(name: string): Promise<void> {
  try {
    const url = `${EmployeeConfig.grade.delete}/${encodeURIComponent(name)}`;
    await api.delete(url);
  } catch (error) {
    throw error;
  }
}

export async function getAllEmployeeTypes(
  start: number,
  pageSize: number,
  search: string,
  sortBy?: string,
  sortOrder?: "asc" | "desc",
): Promise<EmployeeTypeResponse> {
  try {
    const query = buildListParams({
      fields: ["name", "employee_type_name"],
      start,
      pageSize,
      search,
      searchFields: ["name"],
      sortBy,
      sortOrder,
    });

    const url = `${EmployeeConfig.employeeType.getAll}?${query}`;
    const resp: AxiosResponse<EmployeeTypeResponse> = await api.get(url);
    return resp.data;
  } catch (error) {
    throw error;
  }
}

export async function getEmployeeType(name: string): Promise<EmployeeType> {
  try {
    const url = `${EmployeeConfig.employeeType.getById}/${encodeURIComponent(name)}`;
    const resp: AxiosResponse<FrappeDetailResponse<EmployeeType>> =
      await api.get(url);
    return resp.data?.data;
  } catch (error) {
    throw error;
  }
}

export async function createEmployeeType(
  payload: Omit<EmployeeType, "name">,
): Promise<EmployeeType> {
  try {
    const resp: AxiosResponse<FrappeDetailResponse<EmployeeType>> =
      await api.post(EmployeeConfig.employeeType.create, payload);
    return resp.data?.data;
  } catch (error) {
    throw error;
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
  } catch (error) {
    throw error;
  }
}

export async function deleteEmployeeType(name: string): Promise<void> {
  try {
    const url = `${EmployeeConfig.employeeType.delete}/${encodeURIComponent(name)}`;
    await api.delete(url);
  } catch (error) {
    throw error;
  }
}
