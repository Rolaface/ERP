export interface TimesheetLineDraft {
  id: string;
  isEditing: boolean;

  project: string;
  project_name: string;
  projectManuallySet: boolean;

  task: string;
  task_name: string;

  activity_type: string;
  description: string;
  date: string;
  from_time: string; 
  to_time: string; 
    to_date: string;
  hours: number;
  is_completed: boolean;
  is_billable: boolean;
  billing_rate: number;
  costing_rate: number;
   logName?: string;
}

export interface TimesheetFormState {
  project: string;
  project_name: string;
  customer: string;
  customer_name: string;

  employee: string;
  employee_name: string;
  exchange_rate: number;
  department: string;
  currency: string;
  start_date: string; 
  custom_timesheet_start_date: string;
  custom_timesheet_end_date: string;

  lines: TimesheetLineDraft[];
}

export interface TimesheetFormTotals {
  totalHours: number;
  billableHours: number;
  billableAmount: number;
  costingAmount: number;
  billedAmount: number;
  percentBilled: number;
}

export interface TimesheetCreatePayload {

  name?: string;
  doctype: "Timesheet";
  employee: string;
  employee_name: string;
  title: string;
  customer?: string;
  department?: string;
  currency: string;
  exchange_rate: number;
  start_date: string;
  end_date: string;
 custom_timesheet_start_date: string | null;
  custom_timesheet_end_date: string | null;
  time_logs: {
  
    name?: string;
    doctype: "Timesheet Detail";
    activity_type: string;
    project: string;
    project_name: string;
    task: string;
    description: string;
    from_time: string;
    to_time: string;
    hours: number;
    billing_hours: number;
    is_billable: 0 | 1;
    completed: 0 | 1;
    billing_rate: number;
    costing_rate: number;
    billing_amount: number;
    costing_amount: number;
  }[];
}