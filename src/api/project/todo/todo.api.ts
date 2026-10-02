import type { AxiosResponse } from "axios";

import { createAxiosInstance } from "../../axiosInstance";
import { buildListParams } from "../../../api/utils/queryBuilder";
import { ERP_BASE } from "../../../config/api";


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

const api = createAxiosInstance(ERP_BASE);

const TODO_PATH = "/api/resource/ToDo";

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

/**
 * onlyOpen = true  → sirf Open ToDo (Kanban / active tasks)
 * onlyOpen = false → ToDo ka koi bhi status (Table: saare assigned tasks)
 */
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
  if (onlyOpen) filters.push(["status", "=", "Open"]);

  const resp: AxiosResponse<{ data: TodoEntry[] }> = await api.get(
    `${TODO_PATH}?${query}&filters=${encodeURIComponent(
      JSON.stringify(filters),
    )}`,
  );

  const names = (resp.data?.data ?? [])
    .map((todo) => todo.reference_name)
    .filter(Boolean);

  return Array.from(new Set(names)); // same task ke multiple ToDo ho to duplicate nahi
}

/**
 * Ends ONLY the given user's Open assignment for ONE task.
 * Never throws for "nothing to close". Returns number of ToDos updated.
 */
export async function closeMyTaskAssignment(
  taskName: string,
  userEmail: string,
  targetStatus: "Closed" | "Cancelled" = "Closed",
): Promise<number> {
  if (!taskName || !userEmail) return 0;

  const query = buildListParams({ fields: ["name"], pageSize: 20 });
  const filters = [
    ["allocated_to", "=", userEmail],
    ["reference_type", "=", "Task"],
    ["reference_name", "=", taskName],
    ["status", "=", "Open"],
  ];

  const resp: AxiosResponse<{ data: { name: string }[] }> = await api.get(
    `${TODO_PATH}?${query}&filters=${encodeURIComponent(
      JSON.stringify(filters),
    )}`,
  );
  const open = resp.data?.data ?? [];

  for (const todo of open) {
    await api.put(`${TODO_PATH}/${encodeURIComponent(todo.name)}`, {
      status: targetStatus,
    });
  }
  return open.length;
}

/** All assignments the current user is allowed to see for a task (Frappe filters by permission). */
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
    `${TODO_PATH}?${query}&filters=${encodeURIComponent(
      JSON.stringify(filters),
    )}`,
  );
  return resp.data?.data ?? [];
}