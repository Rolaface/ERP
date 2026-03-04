import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";
import { API, ERP_BASE } from "../config/api";

const api = createAxiosInstance(ERP_BASE);

export type SalaryStructureAssignmentCreatePayload = {
  employee: string;
  salary_structure: string;
  basic: number;
};

export type SalaryStructureAssignmentListItem = {
  name: string;
  employee: string;
  full_name?: string;
  salary_structure: string;
  from_date: string;
  company?: string;
  department?: string;
  currency?: string;
  basic?: number;
};

export type GetSalaryStructureAssignmentsParams = {
  employee?: string;
  name?: string;
};

export type SalaryStructureAssignmentReplacePayload = {
  name: string;
  salary_structure: string;
  basic?: number;
};

export async function createSalaryStructureAssignment(
  payload: SalaryStructureAssignmentCreatePayload,
): Promise<any> {
  const url = API.payrollSetup.salaryStructureAssignment.create;
  const resp: AxiosResponse = await api.post(url, payload);
  return resp.data?.data ?? resp.data;
}

export async function getSalaryStructureAssignments(
  params: GetSalaryStructureAssignmentsParams = {},
): Promise<SalaryStructureAssignmentListItem[]> {
  const url = API.payrollSetup.salaryStructureAssignment.getAll;
  const resp: AxiosResponse = await api.get(url, {
    params: {
      ...(params.employee ? { employee: params.employee } : {}),
      ...(params.name ? { name: params.name } : {}),
    },
  });

  const raw = resp.data?.data ?? resp.data;
  if (Array.isArray(raw)) return raw as SalaryStructureAssignmentListItem[];

  const nested = (raw as any)?.data;
  if (Array.isArray(nested)) return nested as SalaryStructureAssignmentListItem[];

  return [];
}

export async function replaceSalaryStructureAssignment(
  payload: SalaryStructureAssignmentReplacePayload,
): Promise<any> {
  const url = (API.payrollSetup.salaryStructureAssignment as any).replace;
  const resp: AxiosResponse = await api.put(url, payload);
  return resp.data?.data ?? resp.data;
}
