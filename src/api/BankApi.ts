import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";
import { ERP_BASE } from "../config/api";

const api = createAxiosInstance(ERP_BASE);

export interface BankPayload {
  bank_name: string;
  swift_number: string;
}

export interface Bank {
  name: string;       // Frappe docname — used as the ID for edit/delete
  bank_name: string;
  swift_number: string;
}

export interface BankPagination {
  total_count: number;
  start: number;
  page_length: number;
}

export interface BankListResponse {
  data: Bank[];
  pagination?: BankPagination;
}

const BANK_BASE = `${ERP_BASE}/api/resource/Bank`;

// ─── GET ALL ──────────────────────────────────────────────────────────────────
export async function getAllBanks(
  page = 1,
  pageSize = 10,
): Promise<BankListResponse> {
  const start = (page - 1) * pageSize;

  const resp: AxiosResponse = await api.get(
    `${BANK_BASE}?fields=["name","bank_name","swift_number"]&with_pagination=1&limit_start=${start}&limit_page_length=${pageSize}`,
  );

  return {
    data: resp.data?.data ?? [],
    pagination: resp.data?.pagination,
  };
}

// ─── GET BY ID ────────────────────────────────────────────────────────────────
// Response shape: { data: { name, bank_name, swift_number, ... } }
export async function getBankById(name: string): Promise<Bank> {
  const resp: AxiosResponse = await api.get(`${BANK_BASE}/${name}`);
  return resp.data.data;
}

// ─── CREATE ───────────────────────────────────────────────────────────────────
// Response shape: { data: { name, bank_name, swift_number, ... } }
export async function createBank(payload: BankPayload): Promise<Bank> {
  const resp: AxiosResponse = await api.post(BANK_BASE, payload);
  return resp.data.data;
}

// ─── UPDATE ───────────────────────────────────────────────────────────────────
// Response shape: { data: { name, bank_name, swift_number, ... } }
export async function updateBank(
  name: string,
  payload: BankPayload,
): Promise<Bank> {
  const resp: AxiosResponse = await api.put(`${BANK_BASE}/${name}`, payload);
  return resp.data.data;
}

// ─── DELETE ───────────────────────────────────────────────────────────────────
export async function deleteBank(name: string): Promise<void> {
  await api.delete(`${BANK_BASE}/${name}`);
}