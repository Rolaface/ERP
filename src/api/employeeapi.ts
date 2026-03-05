import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";

import { API, ERP_BASE } from "../config/api";
const api = createAxiosInstance(ERP_BASE);
export const EmployeeAPI = API.employee;

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
  return resp.data?.data ?? resp.data;
}

export async function getEmployeeById(id: string): Promise<any> {
  const url = `${EmployeeAPI.getById}?id=${id}`;
  const resp: AxiosResponse = await api.get(url);
  return (resp.data?.data ?? resp.data) || null;
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
    params: { [paramKey]: value }
  });

  return resp.data;
}

export async function getCurrentCeiling(): Promise<any> {
  const resp: AxiosResponse = await api.get(
    EmployeeAPI.getCurrentCeiling
  );

  return resp.data;
}



