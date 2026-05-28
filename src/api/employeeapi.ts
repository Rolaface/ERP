import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";

import { API, ERP_BASE } from "../config/api";
const api = createAxiosInstance(ERP_BASE);
export const EmployeeAPI = API.employee;

export async function getAllEmployees(
  page: number = 1,
  page_size: number = 200,
  status: string = "Active",
  search?: string,
): Promise<any> {
  const resp: AxiosResponse = await api.get(EmployeeAPI.getAll, {
    params: {
      page,
      page_size,
      search,
      status,
     ...(search ? { search } : {}),
    },
  });

  return resp.data;
}

export async function getEmployeeById(id: string): Promise<any> {
  const url = `${EmployeeAPI.getById}?id=${id}`;
  const resp: AxiosResponse = await api.get(url);
  return resp.data || null;
}

export async function getAllGenders(): Promise<any>{
  const resp: AxiosResponse = await api.get(EmployeeAPI.getGender);
  return resp.data || null;
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

export async function uploadEmployeePhoto(
  employeeId: string,
  file: File
): Promise<any> {
  const formData = new FormData();
  formData.append("file", file);
  
  const resp: AxiosResponse = await api.post(
    `${EmployeeAPI.Dp}?id=${employeeId}`,  
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return resp.data;
}

export async function updateEmployeeStatus(
  id: string,
  status: "Active" | "Inactive" | "Suspended" | "Left"
): Promise<any> {
  const url = `${EmployeeAPI.updateStatus}?id=${id}&status=${status}`;

  const resp: AxiosResponse = await api.patch(url);

  return resp.data;
}

export async function getEmployeeDetailsById(employee_id: string): Promise<any> {
  const url = `${EmployeeAPI.employeeDetailsById}?employee_id=${employee_id}`;
  const resp: AxiosResponse = await api.get(url);
  return resp.data || null;
}
export async function getLeaveApproverDetailsById(employee: string): Promise<any> {
  const url = `${EmployeeAPI.leaveApproverDetails}?employee=${employee}`;
  const resp: AxiosResponse = await api.get(url);
  return resp.data || null;
}
 

export async function getAllShiftTypes(): Promise<any> {
  const resp: AxiosResponse = await api.get(
    "/api/resource/Shift Type",
    {
      params: {
        fields: JSON.stringify(["name"]),
        limit_page_length: 200,
      },
    }
  );

  return resp.data?.data || [];
}