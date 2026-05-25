import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "../axiosInstance";
import { API, ERP_BASE } from "../../config/api";
import { buildListParams } from "../utils/queryBuilder";

const api = createAxiosInstance(ERP_BASE);

// ─── Types ─────────────────────────────────────────────────────

export interface TemplateItem {
  name: string;
  template_title: string;
  description?: string;
  creation?: string;
}

export interface GetTemplateListResponse {
  data: TemplateItem[];
  pagination?: {
    total: number;
    page_count: number;
  };
}

// ─── Get Templates ─────────────────────────────────────────────

export async function getTemplateList({
  page = 1,
  pageSize = 10,
  search = "",
}: {
  page?: number;
  pageSize?: number;
  search?: string;
}): Promise<GetTemplateListResponse> {
  const start = (page - 1) * pageSize;

  const query = buildListParams({
    fields: [
      "name",
      "template_title",
      "description",
      "creation",
    ],
    start,
    pageSize,
    search,
    searchFields: ["name", "template_title"],
  });

  const resp: AxiosResponse = await api.get(
    `${API.performance.template.list}?${query}`,
  );

  return {
    data: resp.data?.data || [],
    pagination: {
      total:
        resp.data?.pagination?.total || 0,

      page_count:
        resp.data?.pagination?.total_pages || 1,
    },
  };
}

// ─── Create Template ───────────────────────────────────────────

export async function createTemplate(payload: {
  template_title: string;
  description?: string;
}): Promise<TemplateItem> {
  const resp: AxiosResponse = await api.post(
    API.performance.template.list,
    payload,
  );

  return resp.data?.data;
}

// ─── Delete Template ───────────────────────────────────────────

export async function deleteTemplate(
  id: string,
): Promise<void> {
  await api.delete(
    `${API.performance.template.list}/${encodeURIComponent(id)}`,
  );
}

// ─── Get Template By ID ────────────────────────────────────────

export async function getTemplateById(
  id: string,
): Promise<TemplateItem> {
  const resp: AxiosResponse = await api.get(
    `${API.performance.template.list}/${encodeURIComponent(id)}`,
  );

  return resp.data?.data;
}

// ─── Update Template ───────────────────────────────────────────

export async function updateTemplate(
  id: string,
  payload: {
    template_title: string;
    description?: string;
  },
): Promise<TemplateItem> {
  const resp: AxiosResponse = await api.put(
    `${API.performance.template.list}/${encodeURIComponent(id)}`,
    payload,
  );

  return resp.data?.data;
}