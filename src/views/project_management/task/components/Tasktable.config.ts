import type {
  TaskEntry,
  TaskStatus,
} from "../../../../types/Project_Management/task/table/Task.types";
import type { TaskMode } from "./Taskviewtoggle";
import type { ViewOption } from "../../../project_management/ViewSelector";

export const TASK_MODULE = "Task";
export const TIMESHEET_MODULE = "Timesheet";
export const SEARCH_DEBOUNCE_MS = 350;
export const CONTENT_HEIGHT = "calc(95.5vh - 120px)";
export const PAGE_SIZE_OPTIONS = [20, 50, 100, 200];

export const PROFESSIONAL_DEFAULT_VIEW: TaskMode = "table";
export const EMPLOYEE_DEFAULT_VIEW: TaskMode = "kanban";

export const VIEW_OPTIONS: ViewOption<TaskMode>[] = [
  { value: "kanban", label: "Kanban" },
  { value: "table", label: "Table" },
];

export type TaskRow = TaskEntry & {
  _depth: number;
  _guides: boolean[];
  _isLast: boolean;
};

export const STATUS_OPTIONS = [
  { label: "Open", value: "Open" },
  { label: "Working", value: "Working" },
  { label: "Pending Review", value: "Pending Review" },
  { label: "Overdue", value: "Overdue" },
  { label: "Completed", value: "Completed" },
  { label: "Cancelled", value: "Cancelled" },
];

const STATUS_VARIANT: Record<
  TaskStatus,
  "draft" | "info" | "success" | "danger"
> = {
  Open: "draft",
  Working: "info",
  "Pending Review": "info",
  Overdue: "danger",
  Completed: "success",
  Cancelled: "danger",
};

export const STATUS_CELL_OPTIONS = STATUS_OPTIONS.map((s) => ({
  label: s.label,
  value: s.value,
  variant: STATUS_VARIANT[s.value as TaskStatus],
}));