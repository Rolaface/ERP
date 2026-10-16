import type {
  TaskPriority,
  TaskStatus,
} from "../table/Task.types";

export type TaskStepKey = "details" | "additional";
export type TaskFlag = 0 | 1;

export interface TaskFormValues {
  subject: string;
  project: string;
  parentTask: string;
  status: TaskStatus;
  priority: TaskPriority;
  activityType: string;
  department: string;
  issue: string;
  startDate: string;
  endDate: string;
  expectedTime: string;
  progress: string;
  description: string;
  isGroup: TaskFlag;
  isMilestone: TaskFlag;
  taskWeight: string;
  dependsOn: string[];
}

export type TaskFieldKey = keyof TaskFormValues;

export type SetTaskFieldHandler = <K extends TaskFieldKey>(
  key: K,
  value: TaskFormValues[K],
) => void;

export interface TaskValidationIssue {
  step: TaskStepKey;
  field: TaskFieldKey;
  message: string;
}

export interface TaskSelectOption {
  label: string;
  value: string;
}

export interface TaskFormOptions {
  projects: TaskSelectOption[];
  parentTasks: TaskSelectOption[];
  dependencyTasks: TaskSelectOption[];
  activityTypes: TaskSelectOption[];
  departments: TaskSelectOption[];
}

export interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  modalId?: string;
  onSuccess?: (result?: unknown) => void;
}