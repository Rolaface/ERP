
import type {
  TaskFormValues,
  TaskStepKey,
  TaskValidationIssue,
} from "../../../types/Project_Management/task/modal/Taskformmodal.types";

export const TASK_STEPS: { key: TaskStepKey; label: string }[] = [
  { key: "details", label: "Task Details" },
  { key: "additional", label: "Additional Info" },
];

export const TASK_PRIORITY_OPTIONS = [
  { label: "Low", value: "Low" },
  { label: "Medium", value: "Medium" },
  { label: "High", value: "High" },
];

export const TASK_FLAG_OPTIONS = [
  { label: "No", value: "0" },
  { label: "Yes", value: "1" },
];

export const INITIAL_TASK_VALUES: TaskFormValues = {
  subject: "",
  project: "",
  parentTask: "",
  status: "Open",
  priority: "Medium",
  activityType: "",
  issue: "",
  startDate: "",
  endDate: "",
  expectedTime: "",
  progress: "0",
  description: "",
  isGroup: 0,
  isMilestone: 0,
  taskWeight: "",
};

export const buildTaskSubtitle = (taskCode?: string): string =>
  `Task No. ${taskCode || "—"} · assigned automatically`;

export const validateTask = (v: TaskFormValues): TaskValidationIssue | null => {
  if (!v.subject.trim()) {
    return { step: "details", field: "subject", message: "Subject is required" };
  }
  if (!v.project) {
    return { step: "details", field: "project", message: "Project is required" };
  }
  if (v.startDate && v.endDate && v.endDate < v.startDate) {
    return {
      step: "details",
      field: "endDate",
      message: "End date cannot be before start date",
    };
  }
  const progress = Number(v.progress);
  if (v.progress !== "" && (isNaN(progress) || progress < 0 || progress > 100)) {
    return {
      step: "details",
      field: "progress",
      message: "Enter a value between 0 and 100",
    };
  }
  if (v.expectedTime !== "" && Number(v.expectedTime) < 0) {
    return {
      step: "details",
      field: "expectedTime",
      message: "Cannot be negative",
    };
  }
  return null;
};

const num = (value: string): number | undefined =>
  value === "" || isNaN(Number(value)) ? undefined : Number(value);

/** Frappe Task fieldnames; empty values are left out so server defaults apply. */
export const buildTaskPayload = (v: TaskFormValues) => {
  const payload: Record<string, unknown> = {
    subject: v.subject.trim(),
    project: v.project,
    status: v.status,
    priority: v.priority,
    is_group: v.isGroup,
    is_milestone: v.isMilestone,
    progress: num(v.progress) ?? 0,
    parent_task: v.parentTask || undefined,
    custom_activity_type: v.activityType || undefined,
    issue: v.issue.trim() || undefined,
    exp_start_date: v.startDate || undefined,
    exp_end_date: v.endDate || undefined,
    expected_time: num(v.expectedTime),
    task_weight: num(v.taskWeight),
    description: v.description || undefined,
  };

  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined),
  );
};