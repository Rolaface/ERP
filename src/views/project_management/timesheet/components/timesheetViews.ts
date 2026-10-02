import type { ViewOption } from "../../ViewSelector";
import type { TimesheetMode } from "./Viewtoggle";

export const TIMESHEET_VIEW_OPTIONS: ViewOption<TimesheetMode>[] = [
  { value: "calendar", label: "Calendar" },
  { value: "table", label: "Table" },
];