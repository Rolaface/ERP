import type { AxiosResponse } from "axios";
import { createAxiosInstance } from "../../axiosInstance";
import { buildListParams } from "../../../api/utils/queryBuilder";
import { API, ERP_BASE } from "../../../config/api";
import type {
  CalendarSummaryCell,
  TimesheetDetail,
  TimesheetHoursEntry,
  TimesheetListResponse,
} from "../../../types/Project_Management/Timesheet/Table/timesheet.types";
import { frappeDelete } from "../../Delete/frappeDeleteApi";

const api = createAxiosInstance(ERP_BASE);
export const TimesheetAPI = API.project.timesheet;

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
  "employee",
  "employee_name",
  "customer",
  "currency",
  "total_hours",
  "total_billable_amount",
  "total_costing_amount",
  "total_billed_amount",
  "per_billed",
  "parent_project",
];

export async function getAllTimesheets(
  page: number = 1,
  pageSize: number = 20,
  statuses?: string[],
  search?: string,
  sortBy: string = "creation",
  sortOrder: "asc" | "desc" = "desc",
  employees?: string[],
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
    filters.push(["employee", "in", employees]);
  }

  let url = `${TimesheetAPI.list}?${query}`;

  if (filters.length > 0) {
    url += `&filters=${encodeURIComponent(JSON.stringify(filters))}`;
  }

  const storedUser = localStorage.getItem("auth_user");

  if (storedUser) {
    try {
      const currentUser = JSON.parse(storedUser);

      const username = currentUser?.username ?? "";
      const roles: string[] = currentUser?.roles ?? [];

      const isAdministrator =
        username === "Administrator" || roles.includes("Administrator");

      const owner = isAdministrator ? "Administrator" : currentUser?.email;

      if (owner) {
        const orFilters = [
          ["status", "!=", DRAFT_STATUS],
          ["owner", "=", owner],
        ];

        url += `&or_filters=${encodeURIComponent(JSON.stringify(orFilters))}`;
      }
    } catch {}
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

export async function getCalendarSummary(
  fromDate: string,
  toDate: string,
  granularity: "day" | "month",
  employees?: string[],
  excludeDraft: boolean = false,
  filters: { project?: string; activityType?: string } = {},
): Promise<CalendarSummaryCell[]> {
  const resp: AxiosResponse = await api.get(TimesheetAPI.calendarSummary, {
    params: {
      from_date: fromDate,
      to_date: toDate,
      granularity,
      employees: employees?.length ? JSON.stringify(employees) : undefined,
      exclude_draft: excludeDraft ? 1 : 0,
      project: filters.project || undefined,
      activity_type: filters.activityType || undefined,
    },
  });
  return resp.data?.data ?? [];
}

export async function getCalendarDetails(
  fromDate: string,
  toDate: string,
  mine: boolean = false,
  excludeDraft: boolean = false
): Promise<TimesheetHoursEntry[]> {
  const resp: AxiosResponse = await api.get(TimesheetAPI.calendarDetails, {
    params: {
      from_date: fromDate,
      to_date: toDate,
      mine: mine ? 1 : 0,
      exclude_draft: excludeDraft ? 1 : 0,
    },
  });

  return resp.data?.data ?? [];
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