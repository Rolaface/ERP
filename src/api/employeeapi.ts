import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";
import { buildListParams } from "../api/utils/queryBuilder";
import { API, ERP_BASE } from "../config/api";

const api = createAxiosInstance(ERP_BASE);
export const EmployeeAPI = API.employee;

// ── Fields ───────────────────────────────────────────────────────

const EMPLOYEE_FIELDS = [
  "name",
  "owner",
  "creation",
  "modified",
  "modified_by",
  "_user_tags",
  "_comments",
  "_assign",
  "_liked_by",
  "docstatus",
  "idx",
  "employee_name",
  "status",
  "department",
  "employment_type",
  "designation",
  "branch",
  "ctc",
  "image",
  "salary_currency",
];

// ── Employees ────────────────────────────────────────────────────

export async function getAllEmployees(
  page: number = 1,
  pageSize: number = 10,
  status?: string,
  search?: string,
): Promise<any> {
  const start = (page - 1) * pageSize;

  const query = buildListParams({
    fields: EMPLOYEE_FIELDS,
    start,
    pageSize,
    search,
    searchFields: ["name", "employee_name", "designation", "department", "branch"],
  });

  let url = `/api/resource/Employee?${query}`;

  if (status) {
    url += `&filters=${encodeURIComponent(JSON.stringify([["status", "=", status]]))}`;
  }

  const resp: AxiosResponse = await api.get(url);
  return resp.data;
}

export async function getEmployeeById(id: string): Promise<any> {
  const resp: AxiosResponse = await api.get(`${EmployeeAPI.getById}?id=${id}`);
  return resp.data || null;
}

export async function getAllGenders(): Promise<any> {
  const resp: AxiosResponse = await api.get(EmployeeAPI.getGender);
  return resp.data || null;
}

export async function createEmployee(payload: any): Promise<any> {
  const resp: AxiosResponse = await api.post(EmployeeAPI.create, payload);
  return resp.data;
}

export async function updateEmployeeById(payload: any): Promise<any> {
  const resp: AxiosResponse = await api.patch(EmployeeAPI.update, payload);
  return resp.data;
}

export async function deleteEmployeeById(id: string): Promise<any> {
  const resp: AxiosResponse = await api.delete(`${EmployeeAPI.delete}?id=${id}`);
  return resp.data;
}

export async function updateEmployeeStatus(
  id: string,
  status: "Active" | "Inactive" | "Suspended" | "Left",
): Promise<any> {
  const resp: AxiosResponse = await api.patch(
    `${EmployeeAPI.updateStatus}?id=${id}&status=${status}`,
  );
  return resp.data;
}

// ── Identity ─────────────────────────────────────────────────────

export async function verifyEmployeeIdentity(
  type: "NRC" | "SSN",
  value: string,
): Promise<any> {
  const resp: AxiosResponse = await api.get(EmployeeAPI.getByNrc, {
    params: { [type === "NRC" ? "nrc" : "ssn"]: value },
  });
  return resp.data;
}

// ── Photo ────────────────────────────────────────────────────────

export async function uploadEmployeePhoto(
  employeeId: string,
  file: File,
): Promise<any> {
  const formData = new FormData();
  formData.append("file", file);

  const resp: AxiosResponse = await api.post(
    `${EmployeeAPI.Dp}?id=${employeeId}`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return resp.data;
}

// ── Details & Approvers ──────────────────────────────────────────

export async function getCurrentCeiling(): Promise<any> {
  const resp: AxiosResponse = await api.get(EmployeeAPI.getCurrentCeiling);
  return resp.data;
}

export async function getEmployeeDetailsById(employee_id: string): Promise<any> {
  const resp: AxiosResponse = await api.get(
    `${EmployeeAPI.employeeDetailsById}?employee_id=${employee_id}`,
  );
  return resp.data || null;
}

export async function getLeaveApproverDetailsById(employee: string): Promise<any> {
  const resp: AxiosResponse = await api.get(
    `${EmployeeAPI.leaveApproverDetails}?employee=${employee}`,
  );
  return resp.data || null;
}

// ── Shifts ───────────────────────────────────────────────────────

export async function getAllShiftTypes(): Promise<any> {
  const resp: AxiosResponse = await api.get("/api/resource/Shift Type", {
    params: {
      fields: JSON.stringify(["name"]),
      limit_page_length: 200,
    },
  });
  return resp.data?.data || [];
}