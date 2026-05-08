import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";
import { API, ERP_BASE } from "../config/api";
import { buildListParams } from "../api/utils/queryBuilder";

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
  name?: string;
  salary_component: string;
  salary_component_abbr: string;
  type: SalaryComponentType;
  depends_on_payment_days?: 0 | 1;
  amount_based_on_formula?: 0 | 1;
  formula?: string;
  is_tax_applicable?: 0 | 1;
  amount?: number;
  accounts?: SalaryComponentAccount[];
  description?: string;
  // flexible benefit fields
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
  // deduction-specific
  variable_based_on_taxable_salary?: 0 | 1;
  is_income_tax_component?: 0 | 1;
}

export interface StructureComponentRow {
  salary_component: string;
}

export interface SalaryStructure {
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

export async function getAllSalaryComponents(
  start: number,
  pageSize: number,
  search: string,
): Promise<PaginatedResponse<SalaryComponent>> {
  try {
    const query = buildListParams({
      fields: [
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
        "is_flexible_benefit",
        "max_benefit_amount",
        "payout_method",

        "is_income_tax_component",
      ],
      start,
      pageSize,
      search,
      searchFields: ["salary_component", "salary_component_abbr"],
    });

    const resp = await api.get(`${Payroll.salaryComponent.getAll}?${query}`);
    return resp.data;
  } catch (error) {
    throw error;
  }
}

export async function getSalaryComponent(name: string): Promise<SalaryComponent> {
  try {
    const url = `${Payroll.salaryComponent.getById}/${encodeURIComponent(name)}`;
    const resp: AxiosResponse<FrappeDetailResponse<SalaryComponent>> = await api.get(url);
    return resp.data?.data;
  } catch (error) {
    throw error;
  }
}

export async function createSalaryComponent(
  payload: Omit<SalaryComponent, "name">,
): Promise<SalaryComponent> {
  try {
    const resp: AxiosResponse<FrappeDetailResponse<SalaryComponent>> =
      await api.post(Payroll.salaryComponent.create, payload);
    return resp.data?.data;
  } catch (error) {
    throw error;
  }
}

export async function updateSalaryComponent(
  name: string,
  payload: Partial<Omit<SalaryComponent, "name">>,
): Promise<SalaryComponent> {
  try {
    const url = `${Payroll.salaryComponent.update}/${encodeURIComponent(name)}`;
    const resp: AxiosResponse<FrappeDetailResponse<SalaryComponent>> =
      await api.put(url, payload);
    return resp.data?.data;
  } catch (error) {
    throw error;
  }
}

export async function deleteSalaryComponent(name: string): Promise<void> {
  try {
    const url = `${Payroll.salaryComponent.delete}/${encodeURIComponent(name)}`;
    await api.delete(url);
  } catch (error) {
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SALARY STRUCTURE
// ─────────────────────────────────────────────────────────────────────────────

export async function getAllSalaryStructures(
  start: number,
  pageSize: number,
  search: string,
): Promise<PaginatedResponse<SalaryStructure>> {
  try {
    const query = buildListParams({
      fields: ["name", "is_active", "docstatus"],
      start,
      pageSize,
      search,
      searchFields: ["name"],
    });

    const resp: AxiosResponse<PaginatedResponse<SalaryStructure>> =
      await api.get(`${Payroll.salaryStructure.getAll}?${query}`);
    return resp.data;
  } catch (error) {
    throw error;
  }
}

export async function getSalaryStructure(name: string): Promise<SalaryStructure> {
  try {
    const url = `${Payroll.salaryStructure.getById}/${encodeURIComponent(name)}`;
    const resp: AxiosResponse<FrappeDetailResponse<SalaryStructure>> = await api.get(url);
    return resp.data?.data;
  } catch (error) {
    throw error;
  }
}

export async function createSalaryStructure(
  payload: SalaryStructure,
): Promise<SalaryStructure> {
  try {
    const resp: AxiosResponse<FrappeDetailResponse<SalaryStructure>> =
      await api.post(Payroll.salaryStructure.create, payload);
    return resp.data?.data;
  } catch (error) {
    throw error;
  }
}

export async function updateSalaryStructure(
  name: string,
  payload: Partial<Omit<SalaryStructure, "name">>,
): Promise<SalaryStructure> {
  try {
    const url = `${Payroll.salaryStructure.update}/${encodeURIComponent(name)}`;
    const resp: AxiosResponse<FrappeDetailResponse<SalaryStructure>> =
      await api.put(url, payload);
    return resp.data?.data;
  } catch (error) {
    throw error;
  }
}

export async function deleteSalaryStructure(name: string): Promise<void> {
  try {
    const url = `${Payroll.salaryStructure.delete}/${encodeURIComponent(name)}`;
    await api.delete(url);
  } catch (error) {
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// INCOME TAX SLAB
// ─────────────────────────────────────────────────────────────────────────────

export async function getAllTaxConfigs(): Promise<PaginatedResponse<TaxConfig>> {
  try {
    const query = buildListParams({
      fields: [
        "name",
        "effective_from",
        "standard_tax_exemption_amount",
        "allow_tax_exemption",
        "tax_relief_limit",
        "disabled",
      ],
    });

    const resp: AxiosResponse<PaginatedResponse<TaxConfig>> =
      await api.get(`${Payroll.incomeTaxSlab.getAll}?${query}`);
    return resp.data;
  } catch (error) {
    throw error;
  }
}

export async function getTaxConfig(name: string): Promise<TaxConfig> {
  try {
    const url = `${Payroll.incomeTaxSlab.getById}/${encodeURIComponent(name)}`;
    const resp: AxiosResponse<FrappeDetailResponse<TaxConfig>> = await api.get(url);
    return resp.data?.data;
  } catch (error) {
    throw error;
  }
}

export async function createTaxConfig(payload: TaxConfig): Promise<TaxConfig> {
  try {
    const resp: AxiosResponse<FrappeDetailResponse<TaxConfig>> =
      await api.post(Payroll.incomeTaxSlab.create, payload);
    return resp.data?.data;
  } catch (error) {
    throw error;
  }
}

export async function updateTaxConfig(
  name: string,
  payload: Partial<Omit<TaxConfig, "name">>,
): Promise<TaxConfig> {
  try {
    const url = `${Payroll.incomeTaxSlab.update}/${encodeURIComponent(name)}`;
    const resp: AxiosResponse<FrappeDetailResponse<TaxConfig>> =
      await api.put(url, payload);
    return resp.data?.data;
  } catch (error) {
    throw error;
  }
}

export async function deleteTaxConfig(name: string): Promise<void> {
  try {
    const url = `${Payroll.incomeTaxSlab.delete}/${encodeURIComponent(name)}`;
    await api.delete(url);
  } catch (error) {
    throw error;
  }
}

export async function searchSalaryStructures(q?: string) {
  const filters: any[] = [
    ["docstatus", "=", 1],
    ["is_active", "=", "Yes"],
  ];
  if (q) filters.push(["name", "like", `%${q}%`]);

  const params = new URLSearchParams();
  params.append("filters", JSON.stringify(filters));
  params.append("fields", JSON.stringify(["name"]));
  params.append("limit_page_length", "20");

  const resp = await api.get(`${Payroll.salaryStructure.getAll}?${params.toString()}`);
  return resp?.data?.data ?? [];
}

export async function getSalaryComponentOptions(search?: string): Promise<SalaryComponent[]> {
  try {
    const params = new URLSearchParams();
    params.append("fields", JSON.stringify(["name", "salary_component", "type"]));
    params.append("limit_page_length", "0");
    if (search) params.append("search", search);

    const resp = await api.get(`${Payroll.salaryComponent.getAll}?${params.toString()}`);
    return resp.data?.data ?? [];
  } catch (error) {
    throw error;
  }
}