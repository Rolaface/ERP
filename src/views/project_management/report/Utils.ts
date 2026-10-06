import type { ProjectSummaryRow, SummaryFilters, SummaryKpis } from "./Types";

export const todayISO = () => new Date().toISOString().split("T")[0];
export const startOfYearISO = () => `${new Date().getFullYear()}-01-01`;


export const tint = (cssVar: string, pct = 12) =>
  `color-mix(in srgb, var(${cssVar}) ${pct}%, transparent)`;

export const formatPercent = (n: number, digits = 1) =>
  `${Number((n || 0).toFixed(digits))}%`;

export const clampPercent = (n: number) => Math.min(100, Math.max(0, n || 0));

export const computeKpis = (rows: ProjectSummaryRow[]): SummaryKpis => {
  const sum = (pick: (r: ProjectSummaryRow) => number) =>
    rows.reduce((acc, r) => acc + (pick(r) || 0), 0);
  return {
    averageCompletion: rows.length ? sum((r) => r.percent_complete) / rows.length : 0,
    totalTasks: sum((r) => r.total_tasks),
    completedTasks: sum((r) => r.completed_tasks),
    overdueTasks: sum((r) => r.overdue_tasks),
  };
};

export const toApiFilters = (f: SummaryFilters) =>
  Object.fromEntries(
    Object.entries(f).filter(([, v]) => v !== "" && v !== undefined),
  );

/* ── CSV export ── */
const EXPORT_COLUMNS: { label: string; key: keyof ProjectSummaryRow }[] = [
  { label: "Project", key: "name" },
  { label: "Project Name", key: "project_name" },
  { label: "Type", key: "project_type" },
  { label: "Status", key: "status" },
  { label: "Total Tasks", key: "total_tasks" },
  { label: "Completed", key: "completed_tasks" },
  { label: "Overdue", key: "overdue_tasks" },
  { label: "Completion %", key: "percent_complete" },
  { label: "Start Date", key: "expected_start_date" },
  { label: "End Date", key: "expected_end_date" },
];

const csvCell = (v: unknown) => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export const downloadProjectsCsv = (rows: ProjectSummaryRow[]) => {
  const csv = [
    EXPORT_COLUMNS.map((c) => csvCell(c.label)).join(","),
    ...rows.map((r) => EXPORT_COLUMNS.map((c) => csvCell(r[c.key])).join(",")),
  ].join("\r\n");

  const url = URL.createObjectURL(
    new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = `Project_Summary_${todayISO()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};