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

export interface ReportOption {
  key: string;
  label: string;
  reportName: string;
  filters: ReportFilter[];
  isTree?: boolean;
  hiddenColumns?: string[];
}
export interface ReportViewProps {
  report: ReportOption;
  onBack?: () => void;
  leading?: ReactNode;
}

const toOptions = (...values: string[]): SelectOption[] =>
  values.map((v) => ({ label: v, value: v }));

const DATE_RANGE: ReportFilter = { type: "date", label: "Date Range" };

export const PROJECT_REPORT_OPTIONS: ReportOption[] = [
  {
    key: "project-summary",
    label: "Project Summary",
    reportName: "Project Summary",
    filters: [
      { type: "link", key: "project_type", label: "Project Type", source: "project_type" },
      { type: "select", key: "is_active", label: "Is Active", options: toOptions("Yes", "No") },
      { type: "select", key: "status", label: "Status", options: toOptions("Open", "Completed", "Cancelled") },
    ],
  },
  {
    key: "daily-timesheet-summary",
    label: "Daily Timesheet Summary",
    reportName: "Daily Timesheet Summary",
    filters: [DATE_RANGE],
  },
  {
    key: "timesheet-billing-summary",
    label: "Timesheet Billing Summary",
    reportName: "Timesheet Billing Summary",
    isTree: true,
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
      { type: "check", key: "include_draft_timesheets", label: "Include Draft Timesheets" },
    ],
  },
  {
    key: "project-wise-stock-tracking",
    label: "Project wise Stock Tracking",
    reportName: "Project wise Stock Tracking",
    filters: [],
  },
  {
    key: "delayed-tasks-summary",
    label: "Delayed Tasks Summary",
    reportName: "Delayed Tasks Summary",
    filters: [],
  },
];