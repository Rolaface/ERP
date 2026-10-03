export type TaskStatus =
  | "Open"
  | "Working"
  | "Pending Review"
  | "Overdue"

  | "Completed"
  | "Cancelled";

export type TaskPriority = "Low" | "Medium" | "High" | "Urgent";

export interface TaskEntry {
  name: string;
  subject: string;
  status: TaskStatus;
  priority: TaskPriority;
  project: string | null;
  exp_start_date: string | null;
  exp_end_date: string | null;
  progress: number;
   parent_task?: string | null;
  is_group: 0 | 1;
  is_milestone: 0 | 1;
  owner: string;
  creation: string;
  modified: string;
  _assign: string | null;
}

export interface TaskDependency {
  name: string;
  task: string;
  subject?: string;
}

export interface TaskDetail {
  name: string;
  owner: string;
  creation: string;
  modified: string;
  modified_by: string;
  docstatus: 0 | 1 | 2;
  idx: number;
  subject: string;
  project: string | null;
  is_group: 0 | 1;
  status: TaskStatus;
  priority: TaskPriority;
  task_weight: number;
  is_template: 0 | 1;
  start: number;
  duration: number;
  expected_time: number;
  progress: number;
  is_milestone: 0 | 1;
  depends_on_tasks?: string;
  depends_on?: TaskDependency[];
  exp_start_date?: string | null;
  exp_end_date?: string | null;
  act_start_date?: string | null;
  act_end_date?: string | null;
  actual_time?: number;
  total_costing_amount?: number;
  total_expense_claim?: number;
  total_billing_amount?: number;
  company?: string;
  _assign?: string | null;
  lft?: number;
  rgt?: number;
  old_parent?: string;
  doctype?: string;
}

export interface TaskPagination {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface TaskListResponse {
  status_code?: number;
  status?: string;
  message?: string;
  data: TaskEntry[];
  pagination?: TaskPagination;
  http_status_code?: number;
}

export interface TaskFilters {
  page: number;
  pageSize: number;
  statuses: TaskStatus[];
  projects: string[];
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface ResolvedAssignee {
  email: string;
  displayName: string;
}

export interface ProjectOption {
  name: string;
  project_name: string;
}