import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "../../axiosInstance";
import { buildListParams } from "../../../api/utils/queryBuilder";
import { API, ERP_BASE } from "../../../config/api";
import type {
  TimesheetDetail,
  TimesheetListResponse,
  TimesheetHoursEntry,
} from "../../../types/Project_Management/Timesheet/Table/timesheet.types";
import { frappeDelete } from "../../Delete/frappeDeleteApi";

const api = createAxiosInstance(ERP_BASE);
export const TimesheetAPI = API.project.timesheet;

const HOURS_PAGE_SIZE = 200;
const EMPLOYEE_FILTER_FIELD = "employee";
const CANCELLED_DOCSTATUS = 2;
const UNASSIGNED_LABEL = "Unassigned";
const PENDING_APPROVAL_STATUS = "Pending For Approval";
const DRAFT_STATUS = "Draft";

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
  "custom_timesheet_start_date",
  "custom_timesheet_end_date",
  "title",
  "total_hours",
  "currency",
  "total_billable_amount",
  "total_costing_amount",
  "total_billed_amount",
  "per_billed",
  "parent_project",
];

interface HoursDetailRow {
  parent: string;
  from_time: string;
  hours: number;
  docstatus: number;
  project: string | null;
  project_name: string | null;
  task: string | null;
  activity_type: string | null;
  description: string | null;
}

interface HoursSheetRow {
  name: string;
  employee: string | null;
  employee_name: string | null;
}

export async function getAllTimesheets(
  page: number = 1,
  pageSize: number = 20,
  statuses?: string[],
  search?: string,
  sortBy?: string,
  sortOrder?: "asc" | "desc",
  employees?: string[],
  excludeDraft: boolean = false,
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

  const filters: unknown[] = [];
  if (statuses && statuses.length > 0) {
    filters.push(["status", "in", statuses]);
  }
  if (employees && employees.length > 0) {
    filters.push([EMPLOYEE_FILTER_FIELD, "in", employees]);
  }
  if (excludeDraft) {
    filters.push(["status", "!=", DRAFT_STATUS]);
  }

  let url = `${TimesheetAPI.list}?${query}`;
  if (filters.length > 0) {
    url += `&filters=${encodeURIComponent(JSON.stringify(filters))}`;
  }

  const resp: AxiosResponse<TimesheetListResponse> = await api.get(url);
  return resp.data;
}

export async function getTimesheetById(
  id: string,
): Promise<TimesheetDetail | null> {
  const resp: AxiosResponse = await api.get(TimesheetAPI.getbyid, {
    params: { name: id },
  });
  return resp.data?.data ?? null;
}

export async function createTimesheet(payload: any): Promise<any> {
  const resp: AxiosResponse = await api.post(TimesheetAPI.create, payload);
  return resp.data;
}

export async function updateTimesheetById(payload: any): Promise<any> {
  if (!payload?.name) {
    throw new Error(
      "updateTimesheetById: payload.name is required to update a Timesheet.",
    );
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
    { docstatus: 1 },
  );
  return resp.data;
}

export async function cancelTimesheet(id: string): Promise<any> {
  const resp: AxiosResponse = await api.put(
    `${TimesheetAPI.list}/${encodeURIComponent(id)}`,
    { docstatus: 2 },
  );
  return resp.data;
}

export async function sendTimesheetForApproval(id: string): Promise<any> {
  const resp: AxiosResponse = await api.put(
    `${TimesheetAPI.list}/${encodeURIComponent(id)}`,
    { status: PENDING_APPROVAL_STATUS },
  );
  return resp.data;
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
    const resp: AxiosResponse = await api.get(
      `${TimesheetAPI.getList}?${query}`,
    );
    const page: T[] = resp.data?.message ?? [];
    rows.push(...page);
    if (page.length < HOURS_PAGE_SIZE) return rows;
  }
}

export async function getTimesheetHours(
  fromDate: string,
  toDate: string,
  employees?: string[],
  excludeDraft: boolean = false,
): Promise<TimesheetHoursEntry[]> {
  const sheetFilters: unknown[] = [
    ["start_date", "<=", toDate],
    ["end_date", ">=", fromDate],
    ["docstatus", "!=", CANCELLED_DOCSTATUS],
  ];
  if (employees && employees.length > 0) {
    sheetFilters.push([EMPLOYEE_FILTER_FIELD, "in", employees]);
  }
  if (excludeDraft) {
    sheetFilters.push(["status", "!=", DRAFT_STATUS]);
  }

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
        "project_name",
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
      filters: sheetFilters,
      order_by: "creation asc",
    }),
  ]);

  const employeeBySheet = new Map(
    sheets.map((s) => [
      s.name,
      s.employee_name || s.employee || UNASSIGNED_LABEL,
    ]),
  );

  const restrictToSheets =
    excludeDraft || (!!employees && employees.length > 0);
  const visibleDetails = restrictToSheets
    ? details.filter((d) => employeeBySheet.has(d.parent))
    : details;

  return visibleDetails.map((d) => ({
    timesheet: d.parent,
    employee: employeeBySheet.get(d.parent) ?? UNASSIGNED_LABEL,
    date: d.from_time.slice(0, 10),
    hours: d.hours,
    docstatus: d.docstatus,
    project: d.project,
    project_name: d.project_name,
    task: d.task,
    activity_type: d.activity_type,
    description: d.description,
  }));
}

export async function searchEmployees(
  q: string,
): Promise<{ label: string; value: string }[]> {
  const params = new URLSearchParams({ page: "1", page_size: "100" });
  if (q) params.set("search", q);

  const resp: AxiosResponse = await api.get(
    `${API.frappeUtilsAPI.employeesearch}?${params}`,
  );
  const list: { value: string; label: string }[] = resp.data?.data ?? [];

  const term = q.trim().toLowerCase();
  return list
    .filter(
      (e) =>
        !term ||
        e.label.toLowerCase().includes(term) ||
        e.value.toLowerCase().includes(term),
    )
    .map((e) => ({
      value: e.value,
      label: e.label,
    }));
}

export async function deleteTimesheetById(id: string): Promise<void> {
  if (!id) {
    throw new Error("deleteTimesheetById: Timesheet ID is required.");
  }

  await frappeDelete({
    doctype: "Timesheet",
    name: id,
  });
}

export async function renameTimesheetTitle(
  id: string,
  title: string,
): Promise<any> {
  if (!id || !title?.trim()) {
    throw new Error("renameTimesheetTitle: id and title are required.");
  }

  const resp: AxiosResponse = await api.post(TimesheetAPI.renametitle, {
    doctype: "Timesheet",
    docname: id,
    title: title.trim(),
    merge: false,
    enqueue: false,
  });
  return resp.data;
}