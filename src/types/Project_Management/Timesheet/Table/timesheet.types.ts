export type TimesheetStatus =
  | "Draft"
  | "Pending For Approval"
  | "Submitted"
  | "Billed"
  | "Cancelled";

export interface TimesheetEntry {
  name: string;
  owner: string;
  creation: string;
  modified: string;
  modified_by: string;
  docstatus: number;
  idx: number;
  status: TimesheetStatus;
  start_date: string;
  end_date: string;
    custom_timesheet_start_date?: string | null;
  custom_timesheet_end_date?: string | null;
  title: string; // employee display name
  total_hours: number;
  currency: string;
  total_billable_amount: number;
  total_costing_amount: number;
  total_billed_amount: number;
  per_billed: number;
}

export interface TimesheetPagination {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface TimesheetListResponse {
  status_code: number;
  status: string;
  message: string;
  data: TimesheetEntry[];
  pagination: TimesheetPagination;
  http_status_code: number;
}


// ── Detail (single record — from getTimesheetById) ─────────────────

export interface TimesheetTimeLog {
  name: string;
  idx: number;
  activity_type: string;
  from_time: string;
  to_time: string;
  hours: number;
  description?: string;
  project: string;
  project_name?: string;
    task?: string;
  task_name?: string;
    completed?: 0 | 1;
  is_billable: 0 | 1;
  billing_hours?: number;
  billing_rate?: number;
  billing_amount?: number;
  costing_rate?: number;
  costing_amount?: number;
  sales_invoice?: string | null;
}

export interface TimesheetDetail {
  name: string;
  title: string;
  employee: string;
  employee_name: string;
  department?: string;
  company?: string;
  customer?: string;
   customer_name?: string;          
  parent_project?: string;
  parent_project_name?: string; 
  currency: string;
  exchange_rate?: number;
  status: TimesheetStatus;

  start_date: string;
  end_date: string;
  custom_timesheet_start_date: string | null;
  custom_timesheet_end_date: string | null;
  total_hours: number;
  total_billable_hours?: number;
  total_billable_amount: number;
  total_costing_amount: number;
  total_billed_hours?: number;
  total_billed_amount: number;
  per_billed: number;
  time_logs: TimesheetTimeLog[];
}

export interface TimesheetFilters {
  page: number;
  pageSize: number;
  statuses: string[];
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface TimesheetHoursEntry {
  timesheet: string;
  employee: string;
  date: string;
  hours: number;
  docstatus: number;
  project: string | null;
  project_name: string | null;
  task: string | null;
  activity_type: string | null;
  description: string | null;
}