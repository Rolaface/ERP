import type { ViewOption } from "../../../project_management/ViewSelector";
import type { TimesheetMode } from "./Viewtoggle";

export const TIMESHEET_VIEW_OPTIONS: ViewOption<TimesheetMode>[] = [
  { value: "calendar", label: "Calendar" },
  { value: "table", label: "Table" },
];