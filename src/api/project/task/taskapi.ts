import type { AxiosResponse } from "axios";

import { createAxiosInstance } from "../../axiosInstance";
import { buildListParams } from "../../../api/utils/queryBuilder";
import { API, ERP_BASE } from "../../../config/api";
import type {
  TaskEntry,
  TaskDetail,
  TaskListResponse,
} from "../../../types/Project_Management/task/table/Task.types";

const api = createAxiosInstance(ERP_BASE);

export const TaskAPI = API.project.task;

export const DEFAULT_ASSIGN_DESCRIPTION = "Task assigned from Task Management";

const TASK_RESOURCE = TaskAPI.frappe_task;
const TODO_ASSIGNMENT_STATUS = "Open";
const CHILD_TASK_LIMIT = 500;

const TASK_FIELDS = [
  "name",
  "project",
  "subject",
  "status",
  "priority",
  "is_group",
  "custom_activity_type",
];

const TASK_LIST_FIELDS = [
  "name",
  "owner",
  "creation",
  "modified",
  "modified_by",
  "docstatus",
  "status",
  "priority",
  "subject",
  "project",
  "exp_start_date",
  "exp_end_date",
  "progress",
  "is_group",
  "is_milestone",
  "_assign",
  "parent_task",
  "custom_activity_type",
];

const DEFAULT_ORDER_BY = "priority desc, modified desc";

const resolveOrderBy = (
  sortBy?: string,
  sortOrder: "asc" | "desc" = "desc",
): string => {
  if (!sortBy) return DEFAULT_ORDER_BY;
  if (sortBy === "priority") return `priority ${sortOrder}, modified desc`;
  return `${sortBy} ${sortOrder}, priority desc`;
};

const withOrderBy = (query: string, orderBy: string): string => {
  const params = new URLSearchParams(query);
  params.set("order_by", orderBy);
  return params.toString();
};

export type TaskLookupEntry = Pick<
  TaskEntry,
  "name" | "project" | "subject" | "status" | "parent_task" | "is_group"
> & {
  priority?: TaskEntry["priority"];
  custom_activity_type?: string | null;
};

export interface ProjectAssignee {
  user: string;
  email: string;
  full_name: string;
}

export interface GetAllTasksOptions {
  pageSize?: number;
  excludeGroups?: boolean;
  excludeStatuses?: string[];
  assignee?: string;
  names?: string[];
}

type ApiTaskRow = Partial<TaskEntry> & {
  name: string;
  subject?: string | null;
  status?: string | null;
  priority?: string | null;
  project?: string | null;
  parent_task?: string | null;
  is_group?: number | boolean | null;
  context_only?: boolean;
  is_assigned?: boolean;
  depth?: number;
  ancestors?: Array<{ name: string; subject?: string | null }>;
  assignments?: Array<{ allocated_to?: string; status?: string }>;
};

interface CustomTaskListPayload {
  data?: ApiTaskRow[];
  context?: ApiTaskRow[];
  pagination?: {
    page?: number;
    page_size?: number;
    total?: number;
    total_pages?: number;
    has_more?: boolean;
    has_next?: boolean;
    has_prev?: boolean;
  };
}

const toTaskEntry = (row: ApiTaskRow): TaskEntry =>
  ({
    name: row.name,
    subject: row.subject ?? row.name,
    status: (row.status ?? "Open") as TaskEntry["status"],
    priority: (row.priority ?? "Medium") as TaskEntry["priority"],
    project: row.project ?? null,
    exp_start_date: row.exp_start_date ?? null,
    exp_end_date: row.exp_end_date ?? null,
    progress: Number.isFinite(Number(row.progress)) ? Number(row.progress) : 0,
    parent_task: row.parent_task ?? null,
    is_group: row.is_group ? 1 : 0,
    is_milestone: row.is_milestone ? 1 : 0,
    owner: row.owner ?? "",
    creation: row.creation ?? "",
    modified: row.modified ?? "",
    _assign:
      row._assign ??
      (row.assignments?.length
        ? JSON.stringify([
            ...new Set(
              row.assignments.map((item) => item.allocated_to).filter(Boolean),
            ),
          ])
        : null),
    custom_activity_type: row.custom_activity_type ?? null,
    ...(row.context_only !== undefined ? { context_only: row.context_only } : {}),
    ...(row.is_assigned !== undefined ? { is_assigned: row.is_assigned } : {}),
    ...(row.depth !== undefined ? { depth: row.depth } : {}),
        ...(row.ancestors ? { ancestors: row.ancestors } : {}),
  }) as TaskEntry;

const unwrapTaskPayload = (response: any): CustomTaskListPayload => {
  const payload = response?.message ?? response;
  if (Array.isArray(payload)) return { data: payload };
  return payload && typeof payload === "object" ? payload : {};
};

const mergeInHierarchyOrder = (
  data: ApiTaskRow[],
  context: ApiTaskRow[],
): ApiTaskRow[] => {
  const contextByName = new Map(context.map((row) => [row.name, row]));
  const seen = new Set<string>();
  const ordered: ApiTaskRow[] = [];

  const push = (row?: ApiTaskRow) => {
    if (!row?.name || seen.has(row.name)) return;
    seen.add(row.name);
    ordered.push(row);
  };

  for (const row of data) {
    row.ancestors?.forEach((ancestor) =>
      push(contextByName.get(ancestor.name)),
    );
    push(row);
  }
  context.forEach(push);

  return ordered;
};

const listTasks = async (
  params: Record<string, string | number | undefined>,
) => {
  const response = await api.get(TaskAPI.list, { params });
  const payload = unwrapTaskPayload(response.data);
  const data = Array.isArray(payload.data) ? payload.data : [];
  const context = Array.isArray(payload.context) ? payload.context : [];

  const page = Number(payload.pagination?.page ?? params.page ?? 1);
  const pageSize = Number(
    payload.pagination?.page_size ?? params.page_size ?? 20,
  );
  const total = Number(payload.pagination?.total ?? data.length);
  const totalPages = Number(
    payload.pagination?.total_pages ??
      Math.ceil(total / Math.max(pageSize, 1)),
  );

  return {
    data: mergeInHierarchyOrder(data, context).map(toTaskEntry),
    pagination: {
      page,
      page_size: pageSize,
      total,
      total_pages: totalPages,
      has_next:
        payload.pagination?.has_next ??
        payload.pagination?.has_more ??
        page < totalPages,
      has_prev: payload.pagination?.has_prev ?? page > 1,
    },
  };
};




const TASK_TREE_PAGE_SIZE = 200;

export type TaskTreeEntry = TaskEntry & {
  depth?: number;
  context_only?: boolean;
  ancestors?: Array<{ name: string; subject?: string | null }>;
};

export async function getTaskTree(
  project: string,
  search?: string,
): Promise<TaskTreeEntry[]> {
  const rows = new Map<string, TaskTreeEntry>();
  let page = 1;

  for (;;) {
    const result = await listTasks({
      page,
      page_size: TASK_TREE_PAGE_SIZE,
      project,
      include_groups: 1,
      include_cancelled: 0,
      ...(search?.trim() ? { search: search.trim() } : {}),
    });

    result.data.forEach((task) => {
      if (!rows.has(task.name)) rows.set(task.name, task as TaskTreeEntry);
    });

    if (!result.pagination.has_next || result.data.length === 0) break;
    page += 1;
  }

  return [...rows.values()];
}


export async function getAllTasks(
  project?: string,
  search?: string,
  options: GetAllTasksOptions = {},
): Promise<TaskLookupEntry[]> {
  if (options.names && options.names.length === 0) return [];

  const query = buildListParams({
    fields: TASK_FIELDS,
    search,
    searchFields: ["name", "subject"],
    ...(options.pageSize ? { pageSize: options.pageSize } : {}),
  });

  const filters: unknown[] = [];
  if (project) filters.push(["project", "=", project]);
  if (options.excludeGroups) filters.push(["is_group", "=", 0]);
  if (options.excludeStatuses?.length) {
    filters.push(["status", "not in", options.excludeStatuses]);
  }
  if (options.assignee) {
    filters.push(["_assign", "like", `%"${options.assignee}"%`]);
  }
  if (options.names) filters.push(["name", "in", options.names]);

  let url = `${TASK_RESOURCE}?${query}`;
  if (filters.length) {
    url += `&filters=${encodeURIComponent(JSON.stringify(filters))}`;
  }

  const resp: AxiosResponse = await api.get(url);
  return (resp.data?.data ?? []) as TaskLookupEntry[];
}

export async function getProjectAssignees(
  project: string,
): Promise<ProjectAssignee[]> {
  if (!project) return [];

  const resp: AxiosResponse = await api.get(TaskAPI.projectAssignees, {
    params: { project },
  });

  const raw = resp.data?.message ?? resp.data;
  if (Array.isArray(raw)) return raw as ProjectAssignee[];
  if (Array.isArray(raw?.data)) return raw.data as ProjectAssignee[];
  return [];
}

export async function getTaskList(
  page = 1,
  pageSize = 20,
  statuses?: string[],
  projects?: string[],
  search?: string,
  _sortBy?: string,
  _sortOrder: "asc" | "desc" = "desc",
  assignees?: string[],
  _flat = false,
  taskNames?: string[],
  currentUserEmail?: string,
): Promise<TaskListResponse> {
  if (taskNames && taskNames.length === 0) {
    return {
      data: [],
      pagination: {
        page,
        page_size: pageSize,
        total: 0,
        total_pages: 0,
        has_next: false,
        has_prev: false,
      },
    };
  }

  const employee = assignees?.length === 1 ? assignees[0] : currentUserEmail;
  const project = projects?.length === 1 ? projects[0] : undefined;

  const result = await listTasks({
    page,
    page_size: pageSize,
    ...(employee ? { employee } : {}),
    ...(project ? { project } : {}),
    ...(statuses?.length ? { status: statuses.join(",") } : {}),
    ...(search?.trim() ? { search: search.trim() } : {}),
    include_groups: 1,
    include_cancelled: statuses?.includes("Cancelled") ? 1 : 0,
    assignment_status: TODO_ASSIGNMENT_STATUS,
  });

  if (!taskNames) return result;

  const filtered = result.data.filter((task) => taskNames.includes(task.name));
  return {
    data: filtered,
    pagination: {
      ...result.pagination,
      total: filtered.length,
      total_pages: Math.ceil(filtered.length / Math.max(pageSize, 1)),
    },
  };
}

export async function getTaskListFrappe(
  page = 1,
  pageSize = 20,
  statuses?: string[],
  projects?: string[],
  search?: string,
  sortBy?: string,
  sortOrder?: "asc" | "desc",
  assignees?: string[],
  flat = false,
  taskNames?: string[],
): Promise<TaskListResponse> {
  const start = (page - 1) * pageSize;

  const hasMultipleAssignees = !!assignees && assignees.length > 1;
  const splitSearch = hasMultipleAssignees && !!search;

  const query = buildListParams({
    fields: TASK_LIST_FIELDS,
    start,
    pageSize,
    search: splitSearch ? undefined : search,
    searchFields: ["name", "subject"],
  });

  let url = `${TASK_RESOURCE}?${withOrderBy(query, resolveOrderBy(sortBy, sortOrder))}`;

  const filters: unknown[] = [];

  if (taskNames !== undefined) {
    if (taskNames.length === 0) {
      return {
        data: [],
        pagination: {
          page,
          page_size: pageSize,
          total: 0,
          total_pages: 0,
          has_next: false,
          has_prev: false,
        },
      };
    }

    filters.push(["name", "in", taskNames]);
  }

  if (statuses && statuses.length > 0) {
    filters.push(["status", "in", statuses]);
  }
  if (projects && projects.length > 0) {
    filters.push(["project", "in", projects]);
  }

  if (splitSearch) {
    filters.push(["subject", "like", `%${search}%`]);
  }

  if (assignees && assignees.length === 1) {
    filters.push(["_assign", "like", `%"${assignees[0]}"%`]);
  } else if (assignees && assignees.length > 1) {
    const orFilters = assignees.map((email) => [
      "_assign",
      "like",
      `%"${email}"%`,
    ]);
    url += `&or_filters=${encodeURIComponent(JSON.stringify(orFilters))}`;
  } else if (!flat) {
    filters.push(["parent_task", "is", "not set"]);
  }

  url += `&filters=${encodeURIComponent(JSON.stringify(filters))}`;
  const resp: AxiosResponse<TaskListResponse> = await api.get(url);
  return resp.data;
}

export async function getChildTasks(parentTask: string): Promise<TaskEntry[]> {
  const query = buildListParams({
    fields: TASK_LIST_FIELDS,
    pageSize: CHILD_TASK_LIMIT,
  });

  const filters = [["parent_task", "=", parentTask]];
  const resp: AxiosResponse = await api.get(
    `${TASK_RESOURCE}?${withOrderBy(query, DEFAULT_ORDER_BY)}&filters=${encodeURIComponent(JSON.stringify(filters))}`,
  );
  return resp.data?.data ?? [];
}

export async function getTaskById(id: string): Promise<TaskDetail | null> {
  const resp: AxiosResponse = await api.get(
    `${TASK_RESOURCE}/${encodeURIComponent(id)}`,
  );
  return resp.data?.data ?? null;
}

export async function createTask(payload: any): Promise<any> {
  const resp: AxiosResponse = await api.post(TaskAPI.create, payload);
  return resp.data;
}

export async function updateTaskById(payload: any): Promise<any> {
  if (!payload?.name) {
    throw new Error(
      "updateTaskById: payload.name is required to update a Task.",
    );
  }

  const resp: AxiosResponse = await api.put(
    `${TASK_RESOURCE}/${encodeURIComponent(payload.name)}`,
    payload,
  );
  return resp.data;
}

export async function assignTask(
  taskName: string,
  email: string,
  description: string = DEFAULT_ASSIGN_DESCRIPTION,
): Promise<any> {
  return assignTaskToUsers(taskName, [email], description);
}

export async function assignTaskToUsers(
  taskName: string,
  emails: string[],
  description: string = DEFAULT_ASSIGN_DESCRIPTION,
): Promise<any> {
  if (emails.length === 0) return null;

  const resp: AxiosResponse = await api.post(TaskAPI.assign, {
    assign_to: JSON.stringify(emails),
    doctype: "Task",
    name: taskName,
    description: description.trim() || DEFAULT_ASSIGN_DESCRIPTION,
  });

  return resp.data;
}

export async function unassignTask(
  taskName: string,
  email: string,
): Promise<any> {
  const resp: AxiosResponse = await api.post(TaskAPI.unassign, {
    doctype: "Task",
    name: taskName,
    assign_to: email,
  });

  return resp.data;
}

function extractServerMessage(payload: any): string | null {
  const raw = payload?._server_messages;
  if (!raw) return null;

  try {
    const outer: string[] = JSON.parse(raw);
    const texts = outer
      .map((entry) => {
        try {
          return JSON.parse(entry)?.message as string | undefined;
        } catch {
          return undefined;
        }
      })
      .filter(Boolean) as string[];

    if (texts.length === 0) return null;

    const cleaned = texts.map((text) =>
      text
        .replace(/<br\s*\/?>/gi, ", ")
        .replace(/<[^>]+>/g, "")
        .replace(/\s*,\s*,+/g, ", ")
        .replace(/,\s*$/, "")
        .replace(/\s+/g, " ")
        .trim(),
    );

    return cleaned.join("; ");
  } catch {
    return null;
  }
}

export interface UpdateTaskAssigneesResult {
  added: string[];
  removed: string[];
  emails: string[];
  message: string | null;
}

export async function updateTaskAssignees(
  taskName: string,
  previousEmails: string[],
  nextEmails: string[],
  description?: string,
): Promise<UpdateTaskAssigneesResult> {
  const previousSet = new Set(previousEmails);
  const nextSet = new Set(nextEmails);

  const added = nextEmails.filter((email) => !previousSet.has(email));
  const removed = previousEmails.filter((email) => !nextSet.has(email));

  let message: string | null = null;

  if (added.length > 0) {
    const addResp = await assignTaskToUsers(taskName, added, description);
    message = extractServerMessage(addResp);
  }

  for (const email of removed) {
    const removeResp = await unassignTask(taskName, email);
    const removeMessage = extractServerMessage(removeResp);
    if (removeMessage) {
      message = message ? `${message}\n${removeMessage}` : removeMessage;
    }
  }

  return { added, removed, emails: nextEmails, message };
}

export async function updateTaskStatus(
  taskName: string,
  status: string,
  progress?: number,
): Promise<any> {
  return updateTaskById({
    name: taskName,
    status,
    ...(progress !== undefined ? { progress } : {}),
  });
}

export function parseAssignedEmails(assignRaw: string | null): string[] {
  if (!assignRaw) return [];
  try {
    const parsed = JSON.parse(assignRaw);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
}