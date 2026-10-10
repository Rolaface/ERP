import type { ReactNode } from "react";

export interface SelectOption {
  label: string;
  value: string;
}

export type LinkSource = "employee" | "project" | "project_type";

export type ReportFilter =
  | { type: "date"; label: string }
  | { type: "link"; key: string; label: string; source: LinkSource }
  | { type: "select"; key: string; label: string; options: SelectOption[] }
  | { type: "check"; key: string; label: string };

export type ReportPermissionAction = "read" | "report" | "export";

export interface ReportOption {
  key: string;
  label: string;
  reportName: string;
  filters: ReportFilter[];
  isTree?: boolean;
  hiddenColumns?: string[];
  permission: {
    module: string;
    action: ReportPermissionAction;
  };
}

export interface ReportViewProps {
  report: ReportOption;
  onBack?: () => void;
  leading?: ReactNode;
}

const toOptions = (...values: string[]): SelectOption[] =>
  values.map((value) => ({ label: value, value }));

const DATE_RANGE: ReportFilter = { type: "date", label: "Date Range" };

export const PROJECT_REPORT_OPTIONS: ReportOption[] = [
  {
    key: "project-summary",
    label: "Project Summary",
    reportName: "Project Summary",
    permission: { module: "Project", action: "report" },
    filters: [
      {
        type: "link",
        key: "project_type",
        label: "Project Type",
        source: "project_type",
      },
      {
        type: "select",
        key: "is_active",
        label: "Is Active",
        options: toOptions("Yes", "No"),
      },
      {
        type: "select",
        key: "status",
        label: "Status",
        options: toOptions("Open", "Completed", "Cancelled"),
      },
    ],
  },
  {
    key: "daily-timesheet-summary",
    label: "Daily Timesheet Summary",
    reportName: "Daily Timesheet Summary",
    permission: { module: "Timesheet", action: "report" },
    filters: [DATE_RANGE],
  },
  {
    key: "timesheet-billing-summary",
    label: "Timesheet Billing Summary",
    reportName: "Timesheet Billing Summary",
    isTree: true,
    permission: { module: "Timesheet", action: "report" },
    filters: [
      { type: "link", key: "employee", label: "Employee", source: "employee" },
      { type: "link", key: "project", label: "Project", source: "project" },
      DATE_RANGE,
      {
        type: "select",
        key: "group_by",
        label: "Group By",
        options: [
          { label: "Employee", value: "employee" },
          { label: "Project", value: "project" },
          { label: "Start Date", value: "start_date" },
        ],
      },
      {
        type: "check",
        key: "include_draft_timesheets",
        label: "Include Draft Timesheets",
      },
    ],
  },
  {
    key: "project-wise-stock-tracking",
    label: "Project wise Stock Tracking",
    reportName: "Project wise Stock Tracking",
    permission: { module: "Stock Entry", action: "report" },
    filters: [],
  },
  {
    key: "delayed-tasks-summary",
    label: "Delayed Tasks Summary",
    reportName: "Delayed Tasks Summary",
    permission: { module: "Task", action: "report" },
    filters: [
      { type: "link", key: "project", label: "Project", source: "project" },
      DATE_RANGE,
      {
        type: "select",
        key: "priority",
        label: "Priority",
        options: toOptions("Low", "Medium", "High", "Urgent"),
      },
      {
        type: "select",
        key: "status",
        label: "Status",
        options: toOptions(
          "Open",
          "Working",
          "Pending Review",
          "Overdue",
          "Completed",
          "Cancelled",
        ),
      },
    ],
  },
];


export const hasAnyReportPermission = (
  can: (module: string, action: ReportPermissionAction) => boolean,
): boolean =>
  PROJECT_REPORT_OPTIONS.some((report) =>
    can(report.permission.module, report.permission.action),
  );
