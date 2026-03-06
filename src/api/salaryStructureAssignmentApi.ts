import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";
import { API, ERP_BASE } from "../config/api";

const api = createAxiosInstance(ERP_BASE);

const salaryStructureAssignmentApi: { getAll: string; replace: string } =
  API.payrollSetup.salaryStructureAssignment;

type AnyRecord = Record<string, unknown>;

const asRecord = (value: unknown): AnyRecord | null => {
  if (value && typeof value === "object") {
    return value as AnyRecord;
  }
  return null;
};

const unwrapApiData = (payload: unknown): unknown => {
  const top = asRecord(payload);
  if (!top) return payload;
  return top.data ?? payload;
};

export type SalaryStructureAssignmentCreatePayload = {
  employee: string;
  salary_structure: string;
  basic: number;
  from_date?: string;
  company?: string;
};

export type SalaryStructureAssignmentListItem = {
  name: string;
  employee: string;
  full_name?: string;
  salary_structure: string;
  basic?: number;
  from_date?: string;
  company?: string;
  basic?: number | string;
  department?: string;
  currency?: string;
};

export type GetSalaryStructureAssignmentsParams = {
  employee?: string;
  name?: string;
};

export type SalaryStructureAssignmentReplacePayload = {
  name: string;
  salary_structure: string;
  basic: number;
};

export async function createSalaryStructureAssignment(
  payload: SalaryStructureAssignmentCreatePayload,
): Promise<unknown> {
  const url = API.payrollSetup.salaryStructureAssignment.create;
  const resp: AxiosResponse<unknown> = await api.post(url, payload);
  return unwrapApiData(resp.data);
}

export async function getSalaryStructureAssignments(
  params: GetSalaryStructureAssignmentsParams = {},
): Promise<SalaryStructureAssignmentListItem[]> {
  const url = salaryStructureAssignmentApi.getAll;
  const resp: AxiosResponse<unknown> = await api.get(url, {
    params: {
      ...(params.employee ? { employee: params.employee } : {}),
      ...(params.name ? { name: params.name } : {}),
    },
  });

  const raw = unwrapApiData(resp.data);
  if (Array.isArray(raw)) return raw as SalaryStructureAssignmentListItem[];

  const nested = asRecord(raw)?.data;
  if (Array.isArray(nested)) {
    return nested as SalaryStructureAssignmentListItem[];
  }

  return [];
}

export async function replaceSalaryStructureAssignment(
  payload: SalaryStructureAssignmentReplacePayload,
): Promise<unknown> {
  const url = salaryStructureAssignmentApi.replace;
  const resp: AxiosResponse<unknown> = await api.put(url, payload);
  return unwrapApiData(resp.data);
}
