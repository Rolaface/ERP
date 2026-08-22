import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "./axiosInstance";
import { API, ERP_BASE } from "../config/api";

const api = createAxiosInstance(ERP_BASE);

const SCHEDULER_URL = API.scheduler.scheduler_api;

// ─── Types ────────────────────────────────────────────────────────────────────

export type SchedulerFrequency = "Daily" | "Weekly" | "Monthly" | "Yearly";

/** Raw Frappe doc */
export interface SchedulerDoc {
  name: string;
  scheduler_name: string;
  frequency: SchedulerFrequency;
  enabled: 0 | 1;
}

/** Frappe payload */
export interface SchedulerPayload {
  scheduler_name: string;
  frequency: SchedulerFrequency;
  enabled: 0 | 1;
}

/** UI record */
export interface SchedulerRecord {
  id: string;
  schedulerName: string;
  frequency: SchedulerFrequency;
  enabled: boolean;
}

export type SchedulerFormValues = Omit<SchedulerRecord, "id">;

export interface SchedulerPagination {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface SchedulerListResponse {
  data: SchedulerRecord[];
  pagination?: SchedulerPagination;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const toRecord = (doc: SchedulerDoc): SchedulerRecord => ({
  id: doc.name,
  schedulerName: doc.scheduler_name,
  frequency: doc.frequency,
  enabled: doc.enabled === 1,
});

const toPayload = (values: SchedulerFormValues): SchedulerPayload => ({
  scheduler_name: values.schedulerName,
  frequency: values.frequency as SchedulerFrequency,
  enabled: values.enabled ? 1 : 0,
});

// ─── API Functions ────────────────────────────────────────────────────────────

export async function getAllShedulers(
  page = 1,
  pageSize = 10,
  search = "",
): Promise<SchedulerListResponse> {
  const start = (page - 1) * pageSize;
  const encodedSearch = encodeURIComponent(search);

  const searchFilters = search
    ? `&or_filters=[["scheduler_name","like","%${encodedSearch}%"]]`
    : "";

  const resp: AxiosResponse = await api.get(
    `${SCHEDULER_URL}?fields=["name","scheduler_name","frequency","enabled"]&with_pagination=1&limit_start=${start}&limit_page_length=${pageSize}${searchFilters}`,
  );

  const items: SchedulerDoc[] = resp.data?.data ?? [];

  return {
    data: items.map(toRecord),
    pagination: resp.data?.pagination,
  };
}

export async function getShedularById(name: string): Promise<SchedulerRecord> {
  const resp: AxiosResponse = await api.get(`${SCHEDULER_URL}/${name}`);
  return toRecord(resp.data.data as SchedulerDoc);
}

export async function createShedular(
  values: SchedulerFormValues,
): Promise<SchedulerRecord> {
  const resp: AxiosResponse = await api.post(SCHEDULER_URL, toPayload(values));
  //                                          
  return toRecord(resp.data.data as SchedulerDoc);
}


export async function editShedular(
  name: string,
  values: SchedulerFormValues,
): Promise<SchedulerRecord> {
  const resp: AxiosResponse = await api.put(
    `${SCHEDULER_URL}/${name}`,
    toPayload(values),
  );
  return toRecord(resp.data.data as SchedulerDoc);
}

export async function deleteShedularById(name: string): Promise<void> {
  await api.delete(`${SCHEDULER_URL}/${name}`);
}

export async function toggleSchedulerEnable(
  name: string,
  enabled: boolean,
): Promise<void> {
  const resp: AxiosResponse = await api.put(
    `${SCHEDULER_URL}/${name}`,
    { enabled: enabled ? 1 : 0 },
  );
 
}