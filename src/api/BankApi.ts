import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";
import { API, ERP_BASE } from "../config/api";

const api = createAxiosInstance(ERP_BASE);

const BANK_URL = API.Bank.Bank;

export interface BankPayload {
  bank_name: string;
  swift_number: string;
}

export interface Bank {
  name: string;
  bank_name: string;
  swift_number: string;
}

export interface BankPagination {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}
 

export interface BankListResponse {
  data: Bank[];
  pagination?: BankPagination;
}
 
export async function getAllBanks(
  page = 1,
  pageSize = 10,
): Promise<BankListResponse> {
  const start = (page - 1) * pageSize;
 
  const resp: AxiosResponse = await api.get(
    `${BANK_URL}?fields=["name","bank_name","swift_number"]&with_pagination=1&limit_start=${start}&limit_page_length=${pageSize}`,
  );
 
  return {
    data: resp.data?.data ?? [],
    pagination: resp.data?.pagination,
  };
}

export async function getBankById(name: string): Promise<Bank> {
  const resp: AxiosResponse = await api.get(`${BANK_URL}/${name}`);
  return resp.data.data;
}

export async function createBank(payload: BankPayload): Promise<Bank> {
  const resp: AxiosResponse = await api.post(BANK_URL, payload);
  return resp.data.data;
}

export async function updateBank(
  name: string,
  payload: BankPayload,
): Promise<Bank> {
  const resp: AxiosResponse = await api.put(`${BANK_URL}/${name}`, payload);
  return resp.data.data;
}

export async function deleteBank(name: string): Promise<void> {
  await api.delete(`${BANK_URL}/${name}`);
}