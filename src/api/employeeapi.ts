import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";

import { API, ERP_BASE } from "../config/api";
const api = createAxiosInstance(ERP_BASE);
export const EmployeeAPI = API.employee;

type ApiEnvelope<T> = {
  status_code?: number;
  status?: string;
  message?: string;
  data?: T;
};

const unwrap = <T>(payload: any): T => {
  if (payload && typeof payload === "object" && "data" in payload) {
    const env = payload as ApiEnvelope<T>;
    if (env.data !== undefined) return env.data as T;
  }
  return payload as T;
};

type GetAllEmployeesParams = {
  page?: number;
  page_size?: number;
  status?: string;
  department?: string;
  jobTitle?: string;
  workLocation?: string;
  id?: string;
};

export async function getAllEmployees(
  pageOrParams: number | GetAllEmployeesParams = 1,
  page_size: number = 200,
  status: string = "Active",
): Promise<any> {
  const params: GetAllEmployeesParams =
    typeof pageOrParams === "object"
      ? pageOrParams
      : {
          page: pageOrParams,
          page_size,
          status,
        };

  const resp: AxiosResponse = await api.get(EmployeeAPI.getAll, { params });
  return unwrap<any>(resp.data);
}

export async function getEmployee(id: string): Promise<any> {
  const raw = String(id ?? "").trim();
  if (!raw) return null;

  let internalId = raw;

  // Some screens pass employee code (e.g. HR-EMP-00056). Backend expects internal numeric id.
  if (/^HR-EMP-/i.test(raw)) {
    const list = await getAllEmployees({ page: 1, page_size: 1, id: raw });
    const row = Array.isArray(list?.employees) ? list.employees[0] : null;
    const resolved = String(row?.id ?? row?.name ?? "").trim();
    if (!resolved) return null;
    internalId = resolved;
  }

  const url = `${EmployeeAPI.getById}?id=${encodeURIComponent(internalId)}`;
  const resp: AxiosResponse = await api.get(url);
  return unwrap<any>(resp.data) || null;
}

// Backwards-compatible alias
export async function getEmployeeById(id: string): Promise<any> {
  return getEmployee(id);
}

export async function getNapsaEmployeeById(id: string | number): Promise<any> {
  const url = "/api/method/hrms.napsa_client.employee.api.get_employee";
  const resp: AxiosResponse = await api.get(url, {
    params: { id: String(id) },
  });
  return (resp.data?.data ?? resp.data) || null;
}

export async function createEmployee(payload: any): Promise<any> {
  const resp: AxiosResponse = await api.post(EmployeeAPI.create, payload);
  return resp.data;
}

export async function updateEmployeeById(payload: any): Promise<any> {
  const resp = await api.patch(EmployeeAPI.update, payload);
  return resp.data;
}

export async function deleteEmployeeById(id: string): Promise<any> {
  const url = `${EmployeeAPI.delete}?id=${id}`;
  const resp: AxiosResponse = await api.delete(url);
  return resp.data;
}

export async function updateEmployeeDocuments(payload: FormData): Promise<any> {
  const resp: AxiosResponse = await api.put(
    EmployeeAPI.updateDocuments,
    payload,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return resp.data;
}

export async function verifyEmployeeIdentity(
  type: "NRC" | "SSN",
  value: string,
): Promise<any> {
  const paramKey = type === "NRC" ? "nrc" : "ssn";

  const resp: AxiosResponse = await api.get(EmployeeAPI.getByNrc, {
    params: { [paramKey]: value },
  });

  return resp.data;
}

export async function updateEmployeeProfilePhoto(
  employeeId: string,
  file: File,
): Promise<any> {
  const formData = new FormData();
  formData.append("employeeId", employeeId);
  formData.append("profilePhoto", file);

  const resp: AxiosResponse = await api.patch(
    EmployeeAPI.updateProfilePhoto,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return resp.data;
}

export async function getCurrentCeiling(): Promise<any> {
  const resp: AxiosResponse = await api.get(EmployeeAPI.getCurrentCeiling);

  return resp.data;
}
