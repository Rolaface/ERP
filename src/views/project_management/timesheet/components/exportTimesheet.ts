import * as XLSX from "xlsx";
import type { TimesheetDetail } from "../../../../types/Project_Management/Timesheet/Table/timesheet.types";

const SHEET_NAME = "Timesheet";

type Cell = string | number | null | undefined;

export function exportTimesheetToExcel(
  data: TimesheetDetail,
  showFinancials: boolean,
) {
  const summary: Cell[][] = [
    ["Timesheet ID", data.name],
    ["Title", data.title],
    ["Status", data.status],
    ["Employee", data.employee],
    ["Employee Name", data.employee_name],
    ["Customer", data.customer],
    ["Company", data.company],
    ["Department", data.department],
    ["Parent Project", data.parent_project],
    ["Timesheet Period Start", data.custom_timesheet_start_date],
    ["Timesheet Period End", data.custom_timesheet_end_date],
    ["Start Date", data.start_date],
    ["End Date", data.end_date],
    ["Total Hours", data.total_hours],
    ...(showFinancials
      ? ([
          ["Currency", data.currency],
          ["Exchange Rate", data.exchange_rate],
          ["Total Billable Hours", data.total_billable_hours],
          ["Total Billed Hours", data.total_billed_hours],
          ["Total Billable Amount", data.total_billable_amount],
          ["Total Costing Amount", data.total_costing_amount],
          ["Total Billed Amount", data.total_billed_amount],
          ["Per Billed %", data.per_billed],
        ] as Cell[][])
      : []),
  ];

  const logHeader: Cell[] = [
    "Activity Type",
    "Project",
    "Task",
    "Description",
    "From",
    "To",
    "Hours",
    "Billable",
    "Completed",
    ...(showFinancials
      ? [
          "Billing Hours",
          "Billing Rate",
          "Billing Amount",
          "Costing Rate",
          "Costing Amount",
        ]
      : []),
  ];

  const logRows: Cell[][] = (data.time_logs ?? []).map((l) => [
    l.activity_type,
    l.project_name || l.project,
    l.task_name || l.task || "",
    l.description ?? "",
    l.from_time,
    l.to_time,
    l.hours,
    l.is_billable ? "Yes" : "No",
    l.completed ? "Yes" : "No",
    ...(showFinancials
      ? [
          l.billing_hours ?? 0,
          l.billing_rate ?? 0,
          l.billing_amount ?? 0,
          l.costing_rate ?? 0,
          l.costing_amount ?? 0,
        ]
      : []),
  ]);

  const rows: Cell[][] = [
    ...summary.map(([k, v]) => [k, v ?? ""]),
    [],
    ["Time Logs"],
    logHeader,
    ...logRows,
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), SHEET_NAME);
  XLSX.writeFile(wb, `${data.name}.xlsx`);
}