export type ProjectStepKey = "details" | "team";
export type ProjectPriority = "Low" | "Medium" | "High";
export type ProjectStatus = "Open" | "In Progress" | "In Review" | "Completed";
export type CompletionMethod =
  | "Manual"
  | "Task Completion"
  | "Task Progress"
  | "Task Weight";
export type UpdateFrequency = "Hourly" | "Twice Daily" | "Daily" | "Weekly";

export interface ProjectStepDefinition {
  key: ProjectStepKey;
  label: string;
}

export interface ProjectTeamMember {
  id: string;
  user: string;
  activities: string[];
  viewAttachments: boolean;
    sendEmail: boolean;
  hideTimesheets: boolean;
}

export interface ProjectFormValues {
  name: string;
  customer: string;
  type: string;
  template: string;
  startDate: string;
  dueDate: string;
  priority: ProjectPriority;
  status: ProjectStatus;
  completionMethod: CompletionMethod;
  estimatedCost: string;
  costCenter: string;
  description: string;
  collectProgress: boolean;
  frequency: UpdateFrequency;
   projectManager: string;
  fromTime: string;
  toTime: string;
  subject: string;
  message: string;
  members: ProjectTeamMember[];
}

export type ProjectFieldKey = Exclude<keyof ProjectFormValues, "members">;

export interface ProjectValidationIssue {
  step: ProjectStepKey;
  message: string;
  field?: ProjectFieldKey;
  memberId?: string;
}

export interface ProjectDuration {
  text: string;
  isValid: boolean;
}

export interface ProjectTypeOption {
  name: string;
  description?: string;
}

export interface ProjectTemplateOption {
  name: string;
  type: string;
}

export interface TeamMemberOption {
  name: string;
  role?: string;
}

export interface ActivityTypeOption {
  name: string;
  billingRate: number;
}

export interface ProjectFormOptions {
  types: ProjectTypeOption[];
  templates: ProjectTemplateOption[];
  members: TeamMemberOption[];
  activityTypes: ActivityTypeOption[];
}

export interface ProjectPayload {
  project_name: string;
  customer: string;
  project_type: string;
  template: string;
  expected_start_date: string;
  expected_end_date: string;
  priority: ProjectPriority;
  status: ProjectStatus;
  percent_complete_method: CompletionMethod;
  estimated_costing: number;
  cost_center: string;
  notes: string;
  collect_progress: boolean;
  frequency: UpdateFrequency | "";
  from_time: string;
  to_time: string;
   project_manager: string;
  subject: string;
  message: string;
  users: {
    user: string;
    activity_types: string[];
    view_attachments: boolean;
  }[];
}

export interface CreatedProject {
  name: string;
}

export type SetFieldHandler = <K extends ProjectFieldKey>(
  key: K,
  value: ProjectFormValues[K],
) => void;

export type SetMembersHandler = (
  updater: (members: ProjectTeamMember[]) => ProjectTeamMember[],
) => void;

export interface ProjectTeamActions {
  add: () => void;
  remove: (id: string) => void;
  setUser: (id: string, user: string) => void;
  setActivities: (id: string, activities: string[]) => void;
  setViewAttachments: (id: string, value: boolean) => void;
   setSendEmail: (id: string, value: boolean) => void;
  setHideTimesheets: (id: string, value: boolean) => void;
}

export interface ProjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  modalId?: string;
  onSuccess?: (project: CreatedProject) => void;
}