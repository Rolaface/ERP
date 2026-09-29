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
const TASK_FIELDS = ["name", "project", "subject", "status", "priority", "is_group"];

export interface GetAllTasksOptions {
  pageSize?: number;
  excludeGroups?: boolean;
  excludeStatuses?: string[];
}

export async function getAllTasks(
  project?: string,
  search?: string,
  options: GetAllTasksOptions = {},
): Promise<any[]> {
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

  let url = `${TaskAPI.list}?${query}`;
  if (filters.length) {
    url += `&filters=${encodeURIComponent(JSON.stringify(filters))}`;
  }

  const resp: AxiosResponse = await api.get(url);
  return resp.data?.data ?? [];
}

const CHILD_TASK_LIMIT = 500;
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
];

export async function getTaskList(
  page: number = 1,
  pageSize: number = 20,
  statuses?: string[],
  projects?: string[],
  search?: string,
  sortBy?: string,
  sortOrder?: "asc" | "desc",
  assignees?: string[],
   flat: boolean = false,
): Promise<TaskListResponse> {
  const start = (page - 1) * pageSize;

  const query = buildListParams({
    fields: TASK_LIST_FIELDS,
    start,
    pageSize,
    search,
    searchFields: ["name", "subject"],
    sortBy,
    sortOrder,
  });

  let url = `${TaskAPI.list}?${query}`;

  const filters: unknown[] = [];
  if (statuses && statuses.length > 0) {
    filters.push(["status", "in", statuses]);
  }
  if (projects && projects.length > 0) {
    filters.push(["project", "in", projects]);
  }

  if (assignees && assignees.length > 0) {
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
    sortBy: "lft",
    sortOrder: "asc",
  });

  const filters = [["parent_task", "=", parentTask]];
  const resp: AxiosResponse = await api.get(
    `${TaskAPI.list}?${query}&filters=${encodeURIComponent(JSON.stringify(filters))}`,
  );
  return resp.data?.data ?? [];
}

export async function getTaskById(id: string): Promise<TaskDetail | null> {
  const resp: AxiosResponse = await api.get(
    `${TaskAPI.list}/${encodeURIComponent(id)}`,
  );
  return resp.data?.data ?? null;
}

export async function createTask(payload: any): Promise<any> {
  const resp: AxiosResponse = await api.post(TaskAPI.create, payload);
  return resp.data;
}

export async function updateTaskById(payload: any): Promise<any> {
  if (!payload?.name) {
    throw new Error("updateTaskById: payload.name is required to update a Task.");
  }

  const resp: AxiosResponse = await api.put(
    `${TaskAPI.list}/${encodeURIComponent(payload.name)}`,
    payload,
  );
  return resp.data;
}

export async function assignTask(
  taskName: string,
  email: string,
): Promise<any> {
  const resp: AxiosResponse = await api.post(TaskAPI.assign, {
    assign_to: JSON.stringify([email]),
    doctype: "Task",
    name: taskName,
    description: "Task assigned from Task Management",
  });

  return resp.data;
}

export async function assignTaskToUsers(
  taskName: string,
  emails: string[],
): Promise<any> {
  if (emails.length === 0) return null;

  const resp: AxiosResponse = await api.post(TaskAPI.assign, {
    assign_to: JSON.stringify(emails),
    doctype: "Task",
    name: taskName,
    description: "Task assigned from Task Management",
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
): Promise<UpdateTaskAssigneesResult> {
  const previousSet = new Set(previousEmails);
  const nextSet = new Set(nextEmails);

  const added = nextEmails.filter((email) => !previousSet.has(email));
  const removed = previousEmails.filter((email) => !nextSet.has(email));

  let message: string | null = null;

  if (added.length > 0) {
    const addResp = await assignTaskToUsers(taskName, added);
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