import type {
  useTimesheetModal,
  fetchProjectOptions,
  TimesheetModalRestrictions,
} from "../../../../hooks/project_management/timeheet/form/useTimesheetModal";
import type { ProjectRange } from "../../../../hooks/project_management/timeheet/form/validate";

export type TimesheetModalState = ReturnType<typeof useTimesheetModal>;
export type TimesheetForm = TimesheetModalState["form"];
export type TimesheetLine = TimesheetForm["lines"][number];
export type FetchProjects = (q: string) => ReturnType<typeof fetchProjectOptions>;

export type TimesheetContext = "admin" | "employee";
export type SortDir = "asc" | "desc" | null;
export type RowActionsView = "menu" | "rates";

export interface DateRange {
  from: string;
  to: string;
}

export interface PrefillTask {
  project: string;
  projectName: string;
  task: string;
  taskName: string;
  activityType?: string;
}

export interface PrefillEmployee {
  id: string;
  name: string;
}

export interface TimesheetFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  modalId?: string;
  onSuccess?: () => void;
  context?: TimesheetContext;
  prefillTask?: PrefillTask;
  prefillTasks?: PrefillTask[];
  prefillDate?: string;
  prefillEmployee?: PrefillEmployee;
  restrictions?: TimesheetModalRestrictions;
  title?: string;
  subtitle?: string;
  timesheetId?: string;
}

export interface RowHandlers {
  onUpdate: TimesheetModalState["updateLine"];
  onProject: TimesheetModalState["setLineProject"];
  onTask: TimesheetModalState["setLineTask"];
  onActivity: TimesheetModalState["setLineActivity"];
  onApplyTime: (
    id: string,
    date: string,
    from: string,
    to: string,
    toDate: string,
  ) => void;
  onToggleActions: (id: string) => void;
  registerTrigger: (id: string, el: HTMLButtonElement | null) => void;
  getRange?: (projectId: string) => ProjectRange | undefined;
}