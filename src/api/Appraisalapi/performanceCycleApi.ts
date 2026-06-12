import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "../axiosInstance";
import { API, ERP_BASE } from "../../config/api";
import { buildListParams } from "../utils/queryBuilder";

const api = createAxiosInstance(ERP_BASE);

// ─── Types ─────────────────────────────────────────────────────

export interface AppraiseeRow {
  employee: string;
  employee_name: string;
  appraisal_template: string;
  department?: string;
  designation?: string;
  branch?: string;
}

export interface CreateCyclePayload {
  cycle_name: string;
  start_date: string;
  end_date: string;
  status?: string;
  appraisees: AppraiseeRow[];
}

export interface UpdateCyclePayload {
  cycle_name?: string;
  start_date?: string;
  end_date?: string;
  appraisees?: AppraiseeRow[];
}

export interface CycleItem {
  name: string;
  cycle_name: string;
  start_date: string;
  end_date: string;
  status: string;
  appraisees?: AppraiseeRow[];
}

export interface GetCycleListResponse {
  data: CycleItem[];
  pagination?: {
    total: number;
    page_count: number;
  };
}

export interface AppraisalItem{
   name: string;
   appraisal_cycle: string;
   employee_name: string;
   employee_image: string;
}

export interface GetAppraisalResponse{
  data:AppraisalItem[];
  pagination?:{
    total:number;
    page_count:number;
  }
}
// ─── Create Cycle ───────────────────────────────────────────────

export async function createCycle(
  payload: CreateCyclePayload
): Promise<CycleItem> {
  const body = {
    docstatus: 0,
    cycle_name: payload.cycle_name,
    start_date: payload.start_date,
    end_date: payload.end_date,
    kra_evaluation_method: "Manual Rating",
    calculate_final_score_based_on_formula: 0,
    ...(payload.status ? { status: payload.status } : {}),
    appraisees: payload.appraisees.map((a) => ({
      employee: a.employee,
      employee_name: a.employee_name,
      appraisal_template: a.appraisal_template,
    })),
  };

  const resp: AxiosResponse = await api.post(
    API.performance.cycle.list,
    body
  );

  return resp.data?.data;
}

// ─── Get Cycle List ─────────────────────────────────────────────

export async function getCycleList({
  page = 1,
  pageSize = 20,
  search = "",
}: {
  page?: number;
  pageSize?: number;
  search?: string;
}): Promise<GetCycleListResponse> {
  const start = (page - 1) * pageSize;

  const query = buildListParams({
    fields: ["name", "cycle_name", "start_date", "end_date", "status"],
    start,
    pageSize,
    search,
    searchFields: ["cycle_name","name","status"],
  });

  const resp: AxiosResponse = await api.get(
    `${API.performance.cycle.list}?${query}`
  );

  return {
    data: resp.data?.data || [],
    pagination: {
      total: resp.data?.pagination?.total || 0,
      page_count: resp.data?.pagination?.total_pages || 1,
    },
  };
}


export async function getAppraisals(
  {
  page = 1,
  pageSize = 20,
  search = "",
  } : {
      page?: number;
  pageSize?: number;
  search?: string;
  }): Promise< GetAppraisalResponse>{
    const start = (page - 1) * pageSize;

      const query = buildListParams({
    fields: ["name", "appraisal_cycle", "employee_name", "employee_image"],
    start,
    pageSize,
    search,
    searchFields: ["appraisal_cycle","employee_name"],
  });

  const resp: AxiosResponse = await api.get(
    `${API.performance.cycle.get_appraisal}?${query}`
  );

   return {
    data: resp.data?.data || [],
    pagination: {
      total: resp.data?.pagination?.total || 0,
      page_count: resp.data?.pagination?.total_pages || 1,
    },
  };
  }

export async function getCycleById(name: string): Promise<CycleItem> {
  const resp: AxiosResponse = await api.get(
    `${API.performance.cycle.list}/${encodeURIComponent(name)}`
  );

  // Frappe wraps the document in resp.data.data
  const doc = resp.data?.data;

  return {
    name:        doc.name,
    cycle_name:  doc.cycle_name,
    start_date:  doc.start_date,
    end_date:    doc.end_date,
    status:      doc.status,
    appraisees: (doc.appraisees ?? []).map((a: any) => ({
      employee:           a.employee,
      employee_name:      a.employee_name,
      appraisal_template: a.appraisal_template ?? "",
      department:         a.department ?? "",
      designation:        a.designation ?? "",
      branch:             a.branch ?? "",
    })),
  };
}

// ─── Delete Cycle ───────────────────────────────────────────────

export async function deleteCycle(name: string): Promise<void> {
  await api.delete(
    `${API.performance.cycle.list}/${encodeURIComponent(name)}`
  );
} 


// ─── Start Appraisal Cycle ──────────────────────────────────────

export interface StartCycleData {
  status: string;
  message: string;
  appraisal_cycle: string;
  cycle_status: string;
  appraisee_count: number;
}

export interface StartCycleResult {
  status: string;           
  message: string;          
  data: StartCycleData | null;
  serverMessages: string[];  
}


function parseServerMessages(raw: unknown): string[] {
  if (typeof raw !== "string" || !raw.trim()) return [];

  try {
    const outer: string[] = JSON.parse(raw);
    return outer
      .map((entry) => {
        try {
          const parsed = JSON.parse(entry);
          return typeof parsed?.message === "string" ? parsed.message : null;
        } catch {
          return null;
        }
      })
      .filter((m): m is string => !!m);
  } catch {
    return [];
  }
}

export async function startAppraisalCycle(id: string): Promise<StartCycleResult> {
  const resp: AxiosResponse = await api.post(
    API.performance.cycle.start_cycle,
    {},
    { params: { id } }
  );

  const message = resp.data?.message;

  return {
    status: message?.status ?? "error",
    message: message?.message ?? "",
    data: message?.data ?? null,
    serverMessages: parseServerMessages(resp.data?._server_messages),
  };
}