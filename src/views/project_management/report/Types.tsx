export type ProjectSummaryRow = {
  name: string;
  project_name: string;
  status: string;
  project_type: string | null;
  percent_complete: number;
  expected_start_date: string | null;
  expected_end_date: string | null;
  total_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
};


export type SummaryFilters = Record<string, string>;

export type SelectOption = { value: string; label: string };

export type SummaryKpis = {
  averageCompletion: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
};

export type KpiKey = keyof SummaryKpis;


export type KpiDeltas = Partial<Record<KpiKey, number>>;