import type { AxiosResponse } from "axios";

import { createAxiosInstance } from "../axiosInstance";

import { API, ERP_BASE } from "../../config/api";

import { buildListParams } from "../utils/queryBuilder";

const api = createAxiosInstance(ERP_BASE);

// ─── Types ─────────────────────────────────────────────────────

export interface FeedbackItem {
  criteria: string;
  creation?: string;
}

export interface GetFeedbackListResponse {
  data: FeedbackItem[];

  pagination?: {
    total: number;
    page_count: number;
  };
}

// ─── Get Feedback Criteria ─────────────────────────────────────

export async function getFeedbackList({
  page = 1,
  pageSize = 10,
  search = "",
}: {
  page?: number;
  pageSize?: number;
  search?: string;
}): Promise<GetFeedbackListResponse> {
  const start = (page - 1) * pageSize;

  const query = buildListParams({
    fields: ["criteria", "creation"],
    start,
    pageSize,
    search,
    searchFields: ["criteria"],
  });

  const resp: AxiosResponse = await api.get(
    `${API.performance.feedback.list}?${query}`,
  );

  return {
    data: resp.data?.data || [],
    pagination: resp.data?.pagination || {},
  };
}

// ─── Create Feedback ───────────────────────────────────────────

export async function createFeedback(payload: {
  criteria: string;
}): Promise<FeedbackItem> {
  const resp: AxiosResponse = await api.post(
    API.performance.feedback.list,
    payload,
  );

  return resp.data?.data;
}

// ─── Delete Feedback ───────────────────────────────────────────

export async function deleteFeedback(
  id: string,
): Promise<void> {
  await api.delete(
    `${API.performance.feedback.list}/${encodeURIComponent(id)}`,
  );
}

// ─── Get Feedback By ID ────────────────────────────────────────

export async function getFeedbackById(
  id: string,
): Promise<FeedbackItem> {
  const resp: AxiosResponse = await api.get(
    `${API.performance.feedback.list}/${encodeURIComponent(id)}`,
  );

  return resp.data?.data;
}

// ─── Update Feedback ───────────────────────────────────────────

export async function updateFeedback(
  id: string,
  payload: {
    criteria: string;
  },
): Promise<FeedbackItem> {
  const resp: AxiosResponse = await api.put(
    `${API.performance.feedback.list}/${encodeURIComponent(id)}`,
    payload,
  );

  return resp.data?.data;
}