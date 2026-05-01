
import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";
import { API, ERP_BASE } from "../config/api";

const api = createAxiosInstance(ERP_BASE);
const Payroll = API.payroll;

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type SalaryComponentType = "Earning" | "Deduction";

export interface SalaryComponentAccount {
  account: string;
}

export interface SalaryComponent {
  /** Frappe resource name — same as salary_component on creation */
  name?: string;
  salary_component: string;
  salary_component_abbr: string;
  type: SalaryComponentType;
  depends_on_payment_days?: 0 | 1;
  amount_based_on_formula?: 0 | 1;
  formula?: string;
  is_tax_applicable?: number;
  amount?: number;
  accounts?: SalaryComponentAccount[];
  description?: string;
}

export interface StructureComponentRow {
  salary_component: string;
}

export interface SalaryStructure {
  /** Frappe resource name — immutable after creation */
  name?: string;
  is_active?: "Yes" | "No";
  docstatus?: 0 | 1 | 2;
  earnings?: StructureComponentRow[];
  deductions?: StructureComponentRow[];
  description?: string;
}

// Frappe resource list response shape
interface FrappeListResponse<T> {
  data: T[];
}

// Frappe resource detail response shape
interface FrappeDetailResponse<T> {
  data: T;
}

// ─────────────────────────────────────────────────────────────────────────────
// SALARY COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/resource/Salary Component
 * Returns a flat list of all salary components.
 */
export async function getAllSalaryComponents(): Promise<SalaryComponent[]> {
  try {
    const fields = JSON.stringify([
      "name",
      "salary_component",
      "salary_component_abbr",
      "type",
      "formula",
      "amount",
      "amount_based_on_formula",
      "depends_on_payment_days",
      "is_tax_applicable",
      "description",
    ]);

    const url = `${Payroll.salaryComponent.getAll}?fields=${encodeURIComponent(fields)}&limit_page_length=200`;
    const resp: AxiosResponse<FrappeListResponse<SalaryComponent>> =
      await api.get(url);

    return resp.data?.data ?? [];
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
        error?.message ||
        "Failed to fetch salary components",
    );
  }
}

/**
 * GET /api/resource/Salary Component/{name}
 * Returns the full detail of a single salary component (includes child tables).
 */
export async function getSalaryComponent(
  name: string,
): Promise<SalaryComponent> {
  try {
    const url = `${Payroll.salaryComponent.getById}/${encodeURIComponent(name)}`;
    const resp: AxiosResponse<FrappeDetailResponse<SalaryComponent>> =
      await api.get(url);

    return resp.data?.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
        error?.message ||
        "Failed to fetch salary component",
    );
  }
}

/**
 * POST /api/resource/Salary Component
 * Creates a new salary component.
 */
export async function createSalaryComponent(
  payload: Omit<SalaryComponent, "name">,
): Promise<SalaryComponent> {
  try {
    const resp: AxiosResponse<FrappeDetailResponse<SalaryComponent>> =
      await api.post(Payroll.salaryComponent.create, payload);

    return resp.data?.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
        error?.message ||
        "Failed to create salary component",
    );
  }
}

/**
 * PUT /api/resource/Salary Component/{name}
 * Updates an existing salary component.
 */
export async function updateSalaryComponent(
  name: string,
  payload: Partial<Omit<SalaryComponent, "name">>,
): Promise<SalaryComponent> {
  try {
    const url = `${Payroll.salaryComponent.update}/${encodeURIComponent(name)}`;
    const resp: AxiosResponse<FrappeDetailResponse<SalaryComponent>> =
      await api.put(url, payload);

    return resp.data?.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
        error?.message ||
        "Failed to update salary component",
    );
  }
}

/**
 * DELETE /api/resource/Salary Component/{name}
 */
export async function deleteSalaryComponent(name: string): Promise<void> {
  try {
    const url = `${Payroll.salaryComponent.delete}/${encodeURIComponent(name)}`;
    await api.delete(url);
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
        error?.message ||
        "Failed to delete salary component",
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SALARY STRUCTURE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/resource/Salary Structure
 * Returns a flat list of all salary structures.
 */
export async function getAllSalaryStructures(): Promise<SalaryStructure[]> {
  try {
    const fields = JSON.stringify([
      "name",
      "is_active",
      "docstatus",
      
    ]);

    const url = `${Payroll.salaryStructure.getAll}?fields=${encodeURIComponent(fields)}&limit_page_length=200`;
    const resp: AxiosResponse<FrappeListResponse<SalaryStructure>> =
      await api.get(url);

    return resp.data?.data ?? [];
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
        error?.message ||
        "Failed to fetch salary structures",
    );
  }
}

/**
 * GET /api/resource/Salary Structure/{name}
 * Returns full detail including earnings + deductions child tables.
 */
export async function getSalaryStructure(
  name: string,
): Promise<SalaryStructure> {
  try {
    const url = `${Payroll.salaryStructure.getById}/${encodeURIComponent(name)}`;
    const resp: AxiosResponse<FrappeDetailResponse<SalaryStructure>> =
      await api.get(url);

    return resp.data?.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
        error?.message ||
        "Failed to fetch salary structure",
    );
  }
}

/**
 * POST /api/resource/Salary Structure
 * Creates a new salary structure.
 * Note: Frappe derives `name` from the `name` field in the payload for this doctype.
 */
export async function createSalaryStructure(
  payload: SalaryStructure,
): Promise<SalaryStructure> {
  try {
    const resp: AxiosResponse<FrappeDetailResponse<SalaryStructure>> =
      await api.post(Payroll.salaryStructure.create, payload);

    return resp.data?.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
        error?.message ||
        "Failed to create salary structure",
    );
  }
}

/**
 * PUT /api/resource/Salary Structure/{name}
 * Updates an existing salary structure.
 */
export async function updateSalaryStructure(
  name: string,
  payload: Partial<Omit<SalaryStructure, "name">>,
): Promise<SalaryStructure> {
  try {
    const url = `${Payroll.salaryStructure.update}/${encodeURIComponent(name)}`;
    const resp: AxiosResponse<FrappeDetailResponse<SalaryStructure>> =
      await api.put(url, payload);

    return resp.data?.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
        error?.message ||
        "Failed to update salary structure",
    );
  }
}

/**
 * DELETE /api/resource/Salary Structure/{name}
 */
export async function deleteSalaryStructure(name: string): Promise<void> {
  try {
    const url = `${Payroll.salaryStructure.delete}/${encodeURIComponent(name)}`;
    await api.delete(url);
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
        error?.message ||
        "Failed to delete salary structure",
    );
  }
}