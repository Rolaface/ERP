import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "../../axiosInstance";
import { buildListParams } from "../../../api/utils/queryBuilder";
import { API, ERP_BASE } from "../../../config/api";
import type { TimesheetDetail, TimesheetListResponse ,TimesheetHoursEntry} from "../../../types/Project_Management/Timesheet/Table/timesheet.types";

const api = createAxiosInstance(ERP_BASE);
export const TimesheetAPI = API.project.timesheet;

// ── Fields ───────────────────────────────────────────────────────

const TIMESHEET_FIELDS = [
  "name",
  "owner",
  "creation",
  "modified",
  "modified_by",
  "docstatus",
  "idx",
  "status",
  "start_date",
  "end_date",
  "title",
  "total_hours",
  "currency",
  "total_billable_amount",
  "total_costing_amount",
  "total_billed_amount",
  "per_billed",
];

// ── Timesheets ───────────────────────────────────────────────────

export async function getAllTimesheets(
  page: number = 1,
  pageSize: number = 20,
  statuses?: string[],
  search?: string,
  sortBy?: string,
  sortOrder?: "asc" | "desc",
): Promise<TimesheetListResponse> {
  const query = buildListParams({
    fields: TIMESHEET_FIELDS,
    page,
    pageSize,
    search,
    searchFields: ["name", "title"],
    sortBy,
    sortOrder,
  });

  let url = `${TimesheetAPI.list}?${query}`;

  if (statuses && statuses.length > 0) {
    url += `&filters=${encodeURIComponent(JSON.stringify([["status", "in", statuses]]))}`;
  }

  const resp: AxiosResponse<TimesheetListResponse> = await api.get(url);
  return resp.data;
}

export async function getTimesheetById(id: string): Promise<TimesheetDetail | null> {
  // Standard Frappe REST resource-by-name endpoint:
  // GET /api/resource/Timesheet/{name} → { data: { ...full doc incl. time_logs } }
  const resp: AxiosResponse = await api.get(
    `${TimesheetAPI.list}/${encodeURIComponent(id)}`,
  );
  return resp.data?.data ?? null;
}

export async function createTimesheet(payload: any): Promise<any> {
  const resp: AxiosResponse = await api.post(TimesheetAPI.create, payload);
  return resp.data;
}

export async function updateTimesheetById(payload: any): Promise<any> {

  if (!payload?.name) {
    throw new Error("updateTimesheetById: payload.name is required to update a Timesheet.");
  }

  const resp: AxiosResponse = await api.put(
    `${TimesheetAPI.list}/${encodeURIComponent(payload.name)}`,
    payload,
  );
  return resp.data;
}

export async function submitTimesheet(id: string): Promise<any> {
  const resp: AxiosResponse = await api.put(
    `${TimesheetAPI.list}/${encodeURIComponent(id)}`,
    {
      docstatus: 1,
    },
  );

  return resp.data;
}

export async function cancelTimesheet(id: string): Promise<any> {
  const resp: AxiosResponse = await api.put(
    `${TimesheetAPI.list}/${encodeURIComponent(id)}`,
    {
      docstatus: 2,
    },
  );

  return resp.data;
}
const GET_LIST_PATH = "/api/method/frappe.client.get_list";
const HOURS_PAGE_SIZE = 200;
const CANCELLED_DOCSTATUS = 2;
const UNASSIGNED_LABEL = "Unassigned";

interface HoursDetailRow {
  parent: string;
  from_time: string;
  hours: number;
  docstatus: number;
  project: string | null;
  task: string | null;
  activity_type: string | null;
  description: string | null;
}

interface HoursSheetRow {
  name: string;
  employee: string | null;
  employee_name: string | null;
}

async function getAllPages<T>(params: Record<string, unknown>): Promise<T[]> {
  const serialized = Object.fromEntries(
    Object.entries(params).map(([key, value]) => [
      key,
      typeof value === "string" ? value : JSON.stringify(value),
    ]),
  );

  const rows: T[] = [];
  for (let start = 0; ; start += HOURS_PAGE_SIZE) {
    const query = new URLSearchParams({
      ...serialized,
      limit_start: String(start),
      limit_page_length: String(HOURS_PAGE_SIZE),
    });
    const resp: AxiosResponse = await api.get(`${GET_LIST_PATH}?${query}`);
    const page: T[] = resp.data?.message ?? [];
    rows.push(...page);
    if (page.length < HOURS_PAGE_SIZE) return rows;
  }
}

export async function getTimesheetHours(
  fromDate: string,
  toDate: string,
): Promise<TimesheetHoursEntry[]> {
  const [details, sheets] = await Promise.all([
    getAllPages<HoursDetailRow>({
      doctype: "Timesheet Detail",
      parent: "Timesheet",
      fields: [
        "parent",
        "from_time",
        "hours",
        "docstatus",
        "project",
        "task",
        "activity_type",
        "description",
      ],
      filters: [
        ["from_time", "between", [fromDate, toDate]],
        ["docstatus", "!=", CANCELLED_DOCSTATUS],
      ],
      order_by: "from_time asc",
    }),
    getAllPages<HoursSheetRow>({
      doctype: "Timesheet",
      fields: ["name", "employee", "employee_name"],
      filters: [
        ["start_date", "<=", toDate],
        ["end_date", ">=", fromDate],
        ["docstatus", "!=", CANCELLED_DOCSTATUS],
      ],
      order_by: "creation asc",
    }),
  ]);

  const employeeBySheet = new Map(
    sheets.map((s) => [
      s.name,
      s.employee_name || s.employee || UNASSIGNED_LABEL,
    ]),
  );

  return details.map((d) => ({
    timesheet: d.parent,
    employee: employeeBySheet.get(d.parent) ?? UNASSIGNED_LABEL,
    date: d.from_time.slice(0, 10),
    hours: d.hours,
    docstatus: d.docstatus,
    project: d.project,
    task: d.task,
    activity_type: d.activity_type,
    description: d.description,
  }));
}