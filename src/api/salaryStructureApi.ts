import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";
import { API, ERP_BASE } from "../config/api";

const api = createAxiosInstance(ERP_BASE);

export type SalaryStructureComponentCreate = {
  component: string;
  type: "earning" | "deduction" | "Earning" | "Deduction";
  amount: number;
  enabled: 0 | 1 | boolean;
};

export type SalaryStructureCreatePayload = {
  name: string;
  company: string;
  components: SalaryStructureComponentCreate[];
};

export type SalaryStructureListItem = {
  id: string;
  name: string;
  company: string;
  is_active: boolean;
};

export type SalaryStructureLineItem = {
  component: string;
  abbr?: string;
  amount: number;
  depends_on_payment_days?: boolean;
  is_tax_applicable?: boolean;
  accrual_component?: number;
  amount_based_on_formula?: number | boolean;
  formula?: string;
};

export type SalaryStructureDetail = SalaryStructureListItem & {
  earnings?: SalaryStructureLineItem[];
  deductions?: SalaryStructureLineItem[];
};

export type SalaryStructureUpdatePayload = {
  id: string;
  name?: string;
  company?: string;
  components?: SalaryStructureComponentCreate[];
  is_active?: boolean;
};

export type SalaryComponentCreatePayload = {
  name: string;
  type: "Earning" | "Deduction" | "earning" | "deduction";
  abbr: string;
  description?: string;
  enabled: 0 | 1 | boolean;
  amount_based_on_formula: 0 | 1 | boolean;
  condition?: string;
  formula?: string;
  tax_applicable: 0 | 1 | boolean;
};

export type SalaryComponentListItem = {
  id: string;
  component: string;
  abbr: string;
  type: string;
  description: string | null;
  tax_applicable: boolean;
  enabled: boolean;
};

export type SalaryComponentDetail = SalaryComponentListItem;

export type SalaryComponentUpdatePayload = {
  id: string;
  name?: string;
  type?: "Earning" | "Deduction" | "earning" | "deduction";
  abbr?: string;
  description?: string;
  enabled?: 0 | 1 | boolean;
  amount_based_on_formula?: 0 | 1 | boolean;
  condition?: string;
  formula?: string;
  tax_applicable?: 0 | 1 | boolean;
};

export async function getSalaryStructures(): Promise<
  SalaryStructureListItem[]
> {
  const url = API.payrollSetup.salaryStructure.getAll;
  const resp: AxiosResponse = await api.get(url);
  return resp.data?.data ?? resp.data;
}

export async function getSalaryStructureById(
  name: string,
): Promise<SalaryStructureDetail | null> {
  const base = API.payrollSetup.salaryStructure.getById;
  const url = `${base}?name=${encodeURIComponent(name)}`;
  const resp: AxiosResponse = await api.get(url);
  return (resp.data?.data ?? resp.data) || null;
}

export async function createSalaryStructure(
  payload: SalaryStructureCreatePayload,
): Promise<any> {
  const url = API.payrollSetup.salaryStructure.create;
  const resp: AxiosResponse = await api.post(url, payload);
  return resp.data;
}

export async function updateSalaryStructure(
  payload: SalaryStructureUpdatePayload,
): Promise<any> {
  const url = API.payrollSetup.salaryStructure.update;
  const resp: AxiosResponse = await api.patch(url, payload);
  return resp.data;
}

export async function deleteSalaryStructure(name: string): Promise<any> {
  const url = API.payrollSetup.salaryStructure.delete;
  const resp: AxiosResponse = await api.delete(url, { data: { name } });
  return resp.data;
}

export async function getSalaryComponents(): Promise<
  SalaryComponentListItem[]
> {
  const url = API.payrollSetup.salaryComponent.getAll;
  const resp: AxiosResponse = await api.get(url);
  return resp.data?.data ?? resp.data;
}

export async function getSalaryComponentById(
  name: string,
): Promise<SalaryComponentDetail | null> {
  const base = API.payrollSetup.salaryComponent.getById;
  const url = `${base}?name=${encodeURIComponent(name)}`;
  const resp: AxiosResponse = await api.get(url);
  return (resp.data?.data ?? resp.data) || null;
}

export async function getSalaryComponent(
  name: string,
): Promise<SalaryComponentDetail | null> {
  const base = API.payrollSetup.salaryComponent.getOne;
  const url = `${base}?name=${encodeURIComponent(name)}`;
  const resp: AxiosResponse = await api.get(url);
  return (resp.data?.data ?? resp.data) || null;
}

export async function createSalaryComponent(
  payload: SalaryComponentCreatePayload,
): Promise<any> {
  const url = API.payrollSetup.salaryComponent.create;
  const resp: AxiosResponse = await api.post(url, payload);
  return resp.data;
}

export async function updateSalaryComponent(
  payload: SalaryComponentUpdatePayload,
): Promise<any> {
  const url = API.payrollSetup.salaryComponent.update;
  const resp: AxiosResponse = await api.patch(url, payload);
  return resp.data;
}

export async function deleteSalaryComponent(name: string): Promise<any> {
  const url = API.payrollSetup.salaryComponent.delete;
  const resp: AxiosResponse = await api.delete(url, { data: { name } });
  return resp.data;
}
