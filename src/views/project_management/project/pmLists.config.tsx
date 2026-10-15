import React from "react";
import StatusBadge from "../../../components/ui/Table/StatusBadge";
import DateDisplay from "../../../components/UI_Utils/Datedisplay";
import type { Column } from "../../../components/ui/Table/type";
import type { PmListConfig } from "../../../hooks/project_management/project/usePmList";
import { makeFetchRows } from "./pmListApi";

interface ProjectRow {
  name: string;
  project_name: string;
  customer?: string | null;
  project_type?: string | null;
  priority?: string | null;
  status: string;
  expected_start_date?: string | null;
  expected_end_date?: string | null;
  percent_complete?: number | null;
}

interface ProjectUpdateRow {
  name: string;
  project: string;
  date?: string | null;
  owner: string;
  modified: string;
}

interface ActivityTypeRow {
  name: string;
  billing_rate?: number | null;
  costing_rate?: number | null;
  disabled?: 0 | 1;
}

interface ActivityCostRow {
  name: string;
  employee: string;
  employee_name?: string | null;
  activity_type: string;
  billing_rate?: number | null;
  costing_rate?: number | null;
}

interface ProjectTemplateRow {
  name: string;
  project_type?: string | null;
}

interface ProjectTypeRow {
  name: string;
  description?: string | null;
}

const muted = (value?: string | null) => (
  <span className="text-xs text-muted">{value || "—"}</span>
);

const dateCell = (value?: string | null) =>
  value ? (
    <DateDisplay date={value} className="text-xs text-muted" />
  ) : (
    muted()
  );

const rateCell = (value?: number | null) => (
  <span className="font-mono text-xs font-bold text-main">
    {(value ?? 0).toLocaleString()}
  </span>
);

const strongCell = (value?: string | null) => (
  <span className="text-xs font-bold text-main">{value || "—"}</span>
);

const projectColumns: Column<ProjectRow>[] = [
  {
    key: "name",
    header: "Project No",
    align: "left",
    width: "130px",
    sortable: true,
    render: (r) => strongCell(r.name),
  },
  {
    key: "project_name",
    header: "Project Name",
    align: "left",
    width: "260px",
    sortable: true,
    render: (r) => strongCell(r.project_name),
  },
  {
    key: "customer",
    header: "Customer",
    align: "left",
    width: "200px",
    sortable: true,
    render: (r) => muted(r.customer),
  },
  {
    key: "expected_start_date",
    header: "Start Date",
    align: "center",
    width: "130px",
    sortable: true,
    render: (r) => dateCell(r.expected_start_date),
  },
  {
    key: "expected_end_date",
    header: "Due Date",
    align: "center",
    width: "130px",
    sortable: true,
    render: (r) => dateCell(r.expected_end_date),
  },
  {
    key: "percent_complete",
    header: "% Completed",
    align: "left",
    width: "160px",
    sortable: true,
    render: (r) => (
      <div className="flex items-center gap-2">
        <div
          className="h-1.5 min-w-[50px] flex-1 rounded-full"
          style={{ background: "var(--border)" }}
        >
          <div
            className="h-1.5 rounded-full bg-success"
            style={{ width: `${r.percent_complete || 0}%` }}
          />
        </div>
        <span className="w-8 text-right font-mono text-[10px] text-muted">
          {Math.round(r.percent_complete || 0)}%
        </span>
      </div>
    ),
  },
  {
    key: "status",
    header: "Status",
    align: "center",
    width: "130px",
    sortable: true,
    render: (r) => <StatusBadge status={r.status} />,
  },
];

const PROJECT_FIELDS = [
  "name",
  "project_name",
  "customer",
  "project_type",
  "priority",
  "status",
  "expected_start_date",
  "expected_end_date",
  "percent_complete",
];

const PROJECT_STATUS_OPTIONS = [
  { label: "Open", value: "Open" },
  { label: "Completed", value: "Completed" },
  { label: "Cancelled", value: "Cancelled" },
];

export const PROJECT_LIST: PmListConfig<ProjectRow> = {
  tableId: "pm-projects",
  doctype: "Project",
  fields: PROJECT_FIELDS,
  searchFields: ["name", "project_name", "customer"],
  searchPlaceholder: "Search project, customer...",
  columns: projectColumns,
  defaultSort: "modified",
  statusField: "status",
  statusOptions: PROJECT_STATUS_OPTIONS,
};

export const DASHBOARD_LIST: PmListConfig<ProjectRow> = {
  tableId: "pm-dashboard",
  doctype: "Project",
  fields: PROJECT_FIELDS,
  searchFields: ["name", "project_name", "customer"],
  searchPlaceholder: "Search project, customer...",
  columns: projectColumns,
  defaultSort: "expected_end_date",
  defaultOrder: "asc",
  baseFilters: [["status", "not in", ["Completed", "Cancelled"]]],
};

export const UPDATE_LIST: PmListConfig<ProjectUpdateRow> = {
  tableId: "pm-updates",
  doctype: "Project Update",
  fields: ["name", "project", "date", "owner", "modified"],
  searchFields: ["name", "project", "owner"],
  searchPlaceholder: "Search update, project...",
  defaultSort: "modified",
  columns: [
    {
      key: "name",
      header: "Update ID",
      align: "left",
      width: "160px",
      sortable: true,
      render: (r) => strongCell(r.name),
    },
    {
      key: "project",
      header: "Project",
      align: "left",
      width: "200px",
      sortable: true,
      render: (r) => muted(r.project),
    },
    {
      key: "date",
      header: "Reporting Date",
      align: "center",
      width: "150px",
      sortable: true,
      render: (r) => dateCell(r.date),
    },
    {
      key: "owner",
      header: "Updated By",
      align: "left",
      width: "220px",
      sortable: true,
      render: (r) => muted(r.owner),
    },
    {
      key: "modified",
      header: "Last Modified",
      align: "center",
      width: "150px",
      sortable: true,
      render: (r) => dateCell(r.modified),
    },
  ],
};

export const ACTIVITY_TYPE_LIST: PmListConfig<ActivityTypeRow> = {
  tableId: "pm-activity-type",
  doctype: "Activity Type",
  fields: ["name", "billing_rate", "costing_rate", "disabled"],
  searchFields: ["name"],
  searchPlaceholder: "Search activity type...",
  defaultSort: "name",
  defaultOrder: "asc",
  columns: [
    {
      key: "name",
      header: "Activity Type",
      align: "left",
      width: "260px",
      sortable: true,
      render: (r) => strongCell(r.name),
    },
    {
      key: "billing_rate",
      header: "Billing Rate",
      align: "right",
      width: "150px",
      sortable: true,
      render: (r) => rateCell(r.billing_rate),
    },
    {
      key: "costing_rate",
      header: "Costing Rate",
      align: "right",
      width: "150px",
      sortable: true,
      render: (r) => rateCell(r.costing_rate),
    },
    {
      key: "disabled",
      header: "Status",
      align: "center",
      width: "130px",
      render: (r) => (
        <StatusBadge status={r.disabled ? "Disabled" : "Active"} />
      ),
    },
    
    ],
  fetchRows: makeFetchRows<ActivityTypeRow>(
    "Activity Type",
    ["name", "billing_rate", "costing_rate", "disabled"],
    ["name"],
  ),
};

export const ACTIVITY_COST_LIST: PmListConfig<ActivityCostRow> = {
  tableId: "pm-activity-cost",
  doctype: "Activity Cost",
  fields: [
    "name",
    "employee",
    "employee_name",
    "activity_type",
    "billing_rate",
    "costing_rate",
  ],
  searchFields: ["employee", "employee_name", "activity_type"],
  searchPlaceholder: "Search employee, activity type...",
  defaultSort: "modified",
  columns: [
    {
      key: "employee_name",
      header: "Employee",
      align: "left",
      width: "240px",
      sortable: true,
      render: (r) => strongCell(r.employee_name || r.employee),
    },
    {
      key: "activity_type",
      header: "Activity Type",
      align: "left",
      width: "200px",
      sortable: true,
      render: (r) => muted(r.activity_type),
    },
    {
      key: "billing_rate",
      header: "Billing Rate",
      align: "right",
      width: "150px",
      sortable: true,
      render: (r) => rateCell(r.billing_rate),
    },
    {
      key: "costing_rate",
      header: "Costing Rate",
      align: "right",
      width: "150px",
      sortable: true,
      render: (r) => rateCell(r.costing_rate),
    },
  ],
    fetchRows: makeFetchRows<ActivityCostRow>(
    "Activity Cost",
    ["name", "employee", "employee_name", "activity_type", "billing_rate", "costing_rate"],
    ["employee", "employee_name", "activity_type"],
  ),
};

export const PROJECT_TEMPLATE_LIST: PmListConfig<ProjectTemplateRow> = {
  tableId: "pm-project-template",
  doctype: "Project Template",
  fields: ["name", "project_type"],
  searchFields: ["name", "project_type"],
  searchPlaceholder: "Search template...",
  defaultSort: "name",
  defaultOrder: "asc",
  columns: [
    {
      key: "name",
      header: "Template Name",
      align: "left",
      width: "300px",
      sortable: true,
      render: (r) => strongCell(r.name),
    },
    {
      key: "project_type",
      header: "Project Type",
      align: "left",
      width: "200px",
      sortable: true,
      render: (r) => muted(r.project_type),
    },
  ],
    fetchRows: makeFetchRows<ProjectTypeRow>(
    "Project Type",
    ["name", "description"],
    ["name", "description"],
  ),
};

export const PROJECT_TYPE_LIST: PmListConfig<ProjectTypeRow> = {
  tableId: "pm-project-type",
  doctype: "Project Type",
  fields: ["name", "description"],
  searchFields: ["name", "description"],
  searchPlaceholder: "Search project type...",
  defaultSort: "name",
  defaultOrder: "asc",
  columns: [
    {
      key: "name",
      header: "Project Type",
      align: "left",
      width: "240px",
      sortable: true,
      render: (r) => strongCell(r.name),
    },
    {
      key: "description",
      header: "Description",
      align: "left",
      width: "400px",
      render: (r) => muted(r.description),
    },
  ],
};