import type {
  CompletionMethod,
  ProjectDuration,
  ProjectFormOptions,
  ProjectFormValues,
  ProjectPayload,
  ProjectPriority,
  ProjectStatus,
  ProjectStepDefinition,
  ProjectTeamMember,
  ProjectValidationIssue,
  UpdateFrequency,
} from "../../../types/Project_Management/project_modal/Projectformmodal";

const MS_PER_DAY = 86_400_000;
const DEFAULT_SUBJECT = "Status update for {project}";
const DEFAULT_MESSAGE = "Please share your latest progress on {project}.";

export const MODAL_HEIGHT = "min(82vh, 680px)";
export const POPOVER_Z_INDEX = 99999;
export const DESCRIPTION_HEIGHT_CLASS = "!h-44";
export const MESSAGE_HEIGHT_CLASS = "!h-20";

export const noop = () => undefined;

export const PROJECT_STEPS: ProjectStepDefinition[] = [
  { key: "details", label: "Project Details" },
  { key: "team", label: "Team & Updates" },
];

export const PRIORITY_OPTIONS: ProjectPriority[] = ["Low", "Medium", "High"];

export const STATUS_OPTIONS: ProjectStatus[] = [
  "Open",
  "In Progress",
  "In Review",
  "Completed",
];

export const COMPLETION_METHOD_OPTIONS: CompletionMethod[] = [
  "Manual",
  "Task Completion",
  "Task Progress",
  "Task Weight",
];

export const FREQUENCY_OPTIONS: UpdateFrequency[] = [
  "Hourly",
  "Twice Daily",
  "Daily",
  "Weekly",
];

export const EMPTY_OPTIONS: ProjectFormOptions = {
  types: [],
  templates: [],
  members: [],
  activityTypes: [],
};

const pad = (value: number) => String(value).padStart(2, "0");

export const getTodayIso = () => {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

export const createId = () =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

export const createMember = (): ProjectTeamMember => ({
  id: createId(),
  user: "",
  activities: [],
  viewAttachments: false,
  sendEmail: false,
  hideTimesheets: false,
});

export const createInitialValues = (): ProjectFormValues => ({
  name: "",
  customer: "",
  projectManager: "",
  type: "",
  template: "",
  startDate: getTodayIso(),
  dueDate: "",
  priority: "Medium",
  status: "Open",
  completionMethod: "Task Completion",
  estimatedCost: "",
  costCenter: "",
  description: "",
  collectProgress: true,
  frequency: "Daily",
  fromTime: "",
  toTime: "",
  subject: DEFAULT_SUBJECT,
  message: DEFAULT_MESSAGE,
  members: [],
});

export const toSelectOptions = <T extends string>(values: T[]) =>
  values.map((value) => ({ label: value, value }));

export const buildSubtitle = (code: string) =>
  code
    ? `Project No. ${code} · assigned automatically`
    : "Project number is assigned automatically";

export const getDuration = (
  start: string,
  end: string,
): ProjectDuration | null => {
  if (!start || !end) return null;
  const days =
    Math.round((new Date(end).getTime() - new Date(start).getTime()) / MS_PER_DAY) + 1;
  if (days <= 0) return { text: "Due date is before start", isValid: false };
  return { text: `${days} day${days > 1 ? "s" : ""}`, isValid: true };
};

export const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export const formatRate = (rate: number) => `₹${rate.toLocaleString("en-IN")}/hr`;

export const buildTeamSummary = (members: ProjectTeamMember[]) => {
  if (!members.length) return "";
  const assignments = members.reduce((total, m) => total + m.activities.length, 0);
  return `${members.length} member${members.length > 1 ? "s" : ""} · ${assignments} activity assignment${assignments !== 1 ? "s" : ""}`;
};

export const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Something went wrong. Please try again.";

export const validateProjectForm = (
  values: ProjectFormValues,
): ProjectValidationIssue | null => {
  if (!values.name.trim()) {
    return { step: "details", field: "name", message: "Project Name is required" };
  }
  if (values.dueDate && values.dueDate < values.startDate) {
    return {
      step: "details",
      field: "dueDate",
      message: "Due date cannot be before start date",
    };
  }
  if (values.collectProgress) {
    if (!values.subject.trim()) {
      return { step: "team", field: "subject", message: "Subject is required" };
    }
    if (!values.message.trim()) {
      return { step: "team", field: "message", message: "Message is required" };
    }
  }
  const noUser = values.members.findIndex((m) => !m.user);
  if (noUser > -1) {
    return {
      step: "team",
      memberId: values.members[noUser].id,
      message: `Select a member in row ${noUser + 1}`,
    };
  }
  const noActivity = values.members.findIndex((m) => !m.activities.length);
  if (noActivity > -1) {
    return {
      step: "team",
      memberId: values.members[noActivity].id,
      message: `Add at least one activity type in row ${noActivity + 1}`,
    };
  }
  return null;
};

export const buildProjectPayload = (values: ProjectFormValues): ProjectPayload => {
  const collect = values.collectProgress;
  return {
    project_name: values.name.trim(),
    customer: values.customer.trim(),
    project_manager: values.projectManager,
    project_type: values.type,
    template: values.template,
    expected_start_date: values.startDate,
    expected_end_date: values.dueDate,
    priority: values.priority,
    status: values.status,
    percent_complete_method: values.completionMethod,
    estimated_costing: Number(values.estimatedCost) || 0,
    cost_center: values.costCenter.trim(),
    notes: values.description.trim(),
    collect_progress: collect,
    frequency: collect ? values.frequency : "",
    from_time: collect ? values.fromTime : "",
    to_time: collect ? values.toTime : "",
    subject: collect ? values.subject.trim() : "",
    message: collect ? values.message.trim() : "",
    users: values.members.map((m) => ({
      user: m.user,
      activity_types: m.activities,
      view_attachments: m.viewAttachments,
      send_email: m.sendEmail,
      hide_timesheets: m.hideTimesheets,
    })),
  };
};