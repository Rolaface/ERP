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

export interface TaxSlabRow {
  from_amount: number;
  to_amount: number;
  percent_deduction: number;
}

export interface TaxChargeRow {
  description: string;
  percent: number;
  min_taxable_income: number;
  max_taxable_income: number;
}

export interface TaxConfig {
  name: string;
  effective_from: string;
  standard_tax_exemption_amount: number;
  allow_tax_exemption: 0 | 1;
  tax_relief_limit: number;
  disabled?: 0 | 1;
  slabs: TaxSlabRow[];
  other_taxes_and_charges: TaxChargeRow[];
}

// Frappe resource list response shape
interface FrappeListResponse<T> {
  data: T[];
}

// Frappe resource detail response shape
interface FrappeDetailResponse<T> {
  data: T;
}

type PaginatedResponse<T> = {
  data: T[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// SALARY COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/resource/Salary Component
 * Returns a flat list of all salary components.
 */
export async function getAllSalaryComponents(
  start: number,
  pageSize: number,
  search: string,
): Promise<PaginatedResponse<SalaryComponent>> {
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

    const url = `${Payroll.salaryComponent.getAll}?fields=${encodeURIComponent(fields)}&with_pagination=1&limit_start=${start}&limit_page_length=${pageSize}&search=${encodeURIComponent(search)}`;

    const resp = await api.get(url);

    return resp.data;
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
export async function getAllSalaryStructures(
  start: number,
  pageSize: number,
  search: string,
): Promise<PaginatedResponse<SalaryStructure>> {
  try {
    const fields = JSON.stringify(["name", "is_active", "docstatus"]);

    const url = `${Payroll.salaryStructure.getAll}?fields=${encodeURIComponent(fields)}&with_pagination=1&limit_start=${start}&limit_page_length=${pageSize}&search=${encodeURIComponent(search)}`;
    const resp: AxiosResponse<PaginatedResponse<SalaryStructure>> =
      await api.get(url);

    return resp.data;
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

// INCOME TAX SLAB

export async function getAllTaxConfigs(
  start: number,
  pageSize: number,
  search: string,
): Promise<PaginatedResponse<TaxConfig>> {
  try {
    const fields = JSON.stringify([
      "name",
      "effective_from",
      "standard_tax_exemption_amount",
      "allow_tax_exemption",
      "tax_relief_limit",
      "disabled",
    ]);

    const url = `${Payroll.incomeTaxSlab.getAll}?fields=${encodeURIComponent(fields)}&with_pagination=1&limit_start=${start}&limit_page_length=${pageSize}&search=${encodeURIComponent(search)}`;
    const resp: AxiosResponse<PaginatedResponse<TaxConfig>> =
      await api.get(url);

    return resp.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
        error?.message ||
        "Failed to fetch tax configurations",
    );
  }
}

export async function getTaxConfig(name: string): Promise<TaxConfig> {
  try {
    const url = `${Payroll.incomeTaxSlab.getById}/${encodeURIComponent(name)}`;
    const resp: AxiosResponse<FrappeDetailResponse<TaxConfig>> =
      await api.get(url);

    return resp.data?.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
        error?.message ||
        "Failed to fetch tax configuration",
    );
  }
}

export async function createTaxConfig(payload: TaxConfig): Promise<TaxConfig> {
  try {
    const resp: AxiosResponse<FrappeDetailResponse<TaxConfig>> = await api.post(
      Payroll.incomeTaxSlab.create,
      payload,
    );

    return resp.data?.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
        error?.message ||
        "Failed to create tax configuration",
    );
  }
}

export async function updateTaxConfig(
  name: string,
  payload: Partial<Omit<TaxConfig, "name">>,
): Promise<TaxConfig> {
  try {
    const url = `${Payroll.incomeTaxSlab.update}/${encodeURIComponent(name)}`;
    const resp: AxiosResponse<FrappeDetailResponse<TaxConfig>> = await api.put(
      url,
      payload,
    );

    return resp.data?.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
        error?.message ||
        "Failed to update tax configuration",
    );
  }
}

export async function deleteTaxConfig(name: string): Promise<void> {
  try {
    const url = `${Payroll.incomeTaxSlab.delete}/${encodeURIComponent(name)}`;
    await api.delete(url);
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
        error?.message ||
        "Failed to delete tax configuration",
    );
  }
}

export async function searchSalaryStructures(q?: string) {
  const filters: any[] = [
    ["docstatus", "=", 1],
    ["is_active", "=", "Yes"],
  ];

  if (q) {
    filters.push(["name", "like", `%${q}%`]);
  }

  const params = new URLSearchParams();
  params.append("filters", JSON.stringify(filters));
  params.append("fields", JSON.stringify(["name"]));
  params.append("limit_page_length", "20");

  const resp = await api.get(
    `${Payroll.salaryStructure.getAll}?${params.toString()}`,
  );

  return resp?.data?.data ?? [];
}


//for dropdown in salary structure setup form
export async function getSalaryComponentOptions(
  search?: string
): Promise<SalaryComponent[]> {
  try {
    const fields = JSON.stringify([
      "name",
      "salary_component",
      "type"
    ]);

    const params = new URLSearchParams();

    params.append("fields", fields);
    params.append("limit_page_length", "0"); // fetch all
    if (search) {
      params.append("search", search);
    }

    const url = `${Payroll.salaryComponent.getAll}?${params.toString()}`;

    const resp = await api.get(url);

    return resp.data?.data ?? [];

  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
      error?.message ||
      "Failed to fetch salary component options"
    );
  }
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

  // ── Flexible Benefit fields ──────────────────────────────────────────────
  is_flexible_benefit?: 0 | 1;
  max_benefit_amount?: number;
  payout_method?:
    | "Accrue and payout at end of payroll period"
    | "Accrue per cycle, pay only on claim"
    | "Allow claim for full benefit amount"
    | "";

  pay_against_benefit_claim?: 0 | 1;
  only_tax_impact?: 0 | 1;
  create_separate_payment_entry_against_benefit_claim?: 0 | 1;
}