import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "../axiosInstance";
import { API, ERP_BASE } from "../../config/api";
import { buildListParams } from "../utils/queryBuilder";

const api = createAxiosInstance(ERP_BASE);

// ─── Types ─────────────────────────────────────────────────────

export interface KRAItem {
  name: string;
  title: string;
  description?: string;
  creation?: string;
}

export interface GetKRAListResponse {
  data: KRAItem[];
  pagination?: {
    total: number;
    page_count: number;
  };
}

// ─── Get KRAs ──────────────────────────────────────────────────

export async function getKRAList({
  page = 1,
  pageSize = 10,
  search = "",
}: {
  page?: number;
  pageSize?: number;
  search?: string;
}): Promise<GetKRAListResponse> {
  const start = (page - 1) * pageSize;

  const query = buildListParams({
    fields: ["name", "title", "description", "creation"],
    start,
    pageSize,
    search,
    searchFields: ["name", "title","description","creation"],
  });

  const resp: AxiosResponse = await api.get(
    `${API.performance.kra.list}?${query}`,
  );

  return {
    data: resp.data?.data || [],
    pagination: resp.data?.pagination || {},
  };
}

// ─── Create KRA ────────────────────────────────────────────────

export async function createKRA(payload: {
  name: string;
  title: string;
  description?: string;
}): Promise<KRAItem> {
  const resp: AxiosResponse = await api.post(
    API.performance.kra.list,
    payload,
  );

  return resp.data?.data;
}

// ─── Delete KRA ────────────────────────────────────────────────

export async function deleteKRA(
  id: string,
): Promise<void> {
  await api.delete(
    `${API.performance.kra.list}/${encodeURIComponent(id)}`,
  );
}

export async function getKRAById(
  id: string,
): Promise<KRAItem> {
  const resp: AxiosResponse = await api.get(
    `${API.performance.kra.list}/${encodeURIComponent(id)}`,
  );

  return resp.data?.data;
}

export async function updateKRA(
  id: string,
  payload: {
    title: string;
    description?: string;
  },
): Promise<KRAItem> {
  const resp: AxiosResponse = await api.put(
    `${API.performance.kra.list}/${encodeURIComponent(id)}`,
    payload,
  );

  return resp.data?.data;
}