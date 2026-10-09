import type { AxiosResponse } from "axios";

import { createAxiosInstance } from "../../axiosInstance";
import { buildListParams } from "../../../api/utils/queryBuilder";
import { API } from "../../../config/api";
import { DEFAULT_ASSIGN_DESCRIPTION } from "../task/taskapi";

export interface TodoEntry {
  name: string;
  allocated_to: string;
  reference_type: string;
  reference_name: string;
  status: string;
  date?: string;
  description?: string;
}

export interface TodoAssignment extends TodoEntry {
  owner?: string;
  assigned_by?: string;
  assigned_by_full_name?: string;
  creation?: string;
  modified?: string;
  modified_by?: string;
}

export interface TaskNote {
  task: string;
  user: string;
  text: string;
}

const api = createAxiosInstance(API.project.todo.list);

const TODO_FIELDS = [
  "name",
  "allocated_to",
  "reference_type",
  "reference_name",
  "status",
  "date",
  "description",
];

const ASSIGNMENT_FIELDS = [
  ...TODO_FIELDS,
  "owner",
  "assigned_by",
  "assigned_by_full_name",
  "creation",
  "modified",
  "modified_by",
];

const NOTE_FIELDS = ["name", "allocated_to", "reference_name", "description"];

const stripHtml = (value?: string): string =>
  (value ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export async function getMyAssignedTasks(
  userEmail: string,
  onlyOpen: boolean = true,
): Promise<string[]> {
  const query = buildListParams({
    fields: TODO_FIELDS,
    pageSize: 500,
    sortBy: "creation",
    sortOrder: "desc",
  });

  const filters: unknown[] = [
    ["allocated_to", "=", userEmail],
    ["reference_type", "=", "Task"],
  ];

  if (onlyOpen) {
    filters.push(["status", "=", "Open"]);
  }

  const resp: AxiosResponse<{ data: TodoEntry[] }> = await api.get(
    `?${query}&filters=${encodeURIComponent(JSON.stringify(filters))}`,
  );

  const names = (resp.data?.data ?? [])
    .map((todo) => todo.reference_name)
    .filter(Boolean);

  return Array.from(new Set(names));
}

export async function getTaskNotes(
  taskNames: string[],
  allocatedTo?: string,
): Promise<TaskNote[]> {
  const names = Array.from(new Set(taskNames.filter(Boolean)));
  if (names.length === 0) return [];

  const query = buildListParams({
    fields: NOTE_FIELDS,
    pageSize: 500,
    sortBy: "creation",
    sortOrder: "asc",
  });

  const filters: unknown[] = [
    ["reference_type", "=", "Task"],
    ["reference_name", "in", names],
    ["status", "=", "Open"],
  ];

  if (allocatedTo) {
    filters.push(["allocated_to", "=", allocatedTo]);
  }

  const resp: AxiosResponse<{ data: TodoEntry[] }> = await api.get(
    `?${query}&filters=${encodeURIComponent(JSON.stringify(filters))}`,
  );

  return (resp.data?.data ?? [])
    .map((todo) => ({
      task: todo.reference_name,
      user: todo.allocated_to,
      text: stripHtml(todo.description),
    }))
    .filter((note) => note.text && note.text !== DEFAULT_ASSIGN_DESCRIPTION);
}

export async function closeMyTaskAssignment(
  taskName: string,
  userEmail: string,
  targetStatus: "Closed" | "Cancelled" = "Closed",
): Promise<number> {
  if (!taskName || !userEmail) {
    return 0;
  }

  const query = buildListParams({
    fields: ["name"],
    pageSize: 20,
  });

  const filters = [
    ["allocated_to", "=", userEmail],
    ["reference_type", "=", "Task"],
    ["reference_name", "=", taskName],
    ["status", "=", "Open"],
  ];

  const resp: AxiosResponse<{ data: { name: string }[] }> = await api.get(
    `?${query}&filters=${encodeURIComponent(JSON.stringify(filters))}`,
  );

  const open = resp.data?.data ?? [];

  for (const todo of open) {
    await api.put(`/${encodeURIComponent(todo.name)}`, {
      status: targetStatus,
    });
  }

  return open.length;
}

export async function getTaskAssignments(
  taskName: string,
): Promise<TodoAssignment[]> {
  const query = buildListParams({
    fields: ASSIGNMENT_FIELDS,
    pageSize: 100,
    sortBy: "creation",
    sortOrder: "desc",
  });

  const filters = [
    ["reference_type", "=", "Task"],
    ["reference_name", "=", taskName],
  ];

  const resp: AxiosResponse<{ data: TodoAssignment[] }> = await api.get(
    `?${query}&filters=${encodeURIComponent(JSON.stringify(filters))}`,
  );

  return resp.data?.data ?? [];
}