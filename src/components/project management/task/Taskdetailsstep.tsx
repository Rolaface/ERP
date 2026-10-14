import React, { useMemo } from "react";
import type {
  SetTaskFieldHandler,
  TaskFieldKey,
  TaskFlag,
  TaskFormOptions,
  TaskFormValues,
} from "../../../types/Project_Management/task/modal/Taskformmodal.types";
import type { TaskPriority, TaskStatus } from "../../../types/Project_Management/task/table/Task.types";
import {
  TASK_FLAG_OPTIONS,
  TASK_PRIORITY_OPTIONS,
} from "../../../utils/project_management/task/Taskformmodal.utils";
import { noop } from "../../../utils/project_management/project/Projectformmodal.utils";
import {
  ModalInput,
  ModalSelect,
  ToggleSwitch,
} from "../../../components/ui/modal/modalComponent";
import DatePickerInput from "../../../components/calendar/DatePickerInput";
import { STATUS_OPTIONS } from "../../../views/project_management/task/components/Tasktable.config";
import TaskDescriptionEditor from "../task/Taskdescriptioneditor";

interface TaskDetailsStepProps {
  values: TaskFormValues;
  options: TaskFormOptions;
  getFieldError: (key: TaskFieldKey) => string | undefined;
  onChange: SetTaskFieldHandler;
}

interface SectionProps {
  title: string;
  children?: React.ReactNode;
}

const GRID =
  "grid grid-cols-1 gap-x-4 gap-y-2.5 sm:grid-cols-2 lg:grid-cols-12";
const SPAN_12 = "min-w-0 sm:col-span-2 lg:col-span-12";
const SPAN_6 = "min-w-0 sm:col-span-2 lg:col-span-6";
const SPAN_3 = "min-w-0 lg:col-span-3";

const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
  <div className="mb-2.5 flex items-baseline justify-between border-b border-theme pb-1">
    <h5 className="text-[13px] font-semibold text-main">{title}</h5>
  </div>
);

const Section: React.FC<SectionProps> = ({ title, children }) => (
  <section>
    <SectionHeader title={title} />
    <div className={GRID}>{children}</div>
  </section>
);

const TaskDetailsStep: React.FC<TaskDetailsStepProps> = ({
  values,
  options,
  getFieldError,
  onChange,
}) => {
  const parentOptions = useMemo(
    () => [{ label: "None", value: "" }, ...options.parentTasks],
    [options.parentTasks],
  );

  const endDateError = getFieldError("endDate");

  return (
    <div className="space-y-4 rounded-lg border border-theme bg-card px-4 py-3 sm:px-5">
      <Section title="Task information">
        <div className={SPAN_6}>
          <ModalInput
            label="Subject"
            name="subject"
            required
            placeholder="e.g. Implement timesheet approval"
            value={values.subject}
            error={getFieldError("subject")}
            onChange={(e) => onChange("subject", e.target.value)}
          />
        </div>
        <div className={SPAN_3}>
          <ModalSelect
            label="Project"
            name="project"
            required
            placeholder="Select project"
            value={values.project}
            options={options.projects}
            error={getFieldError("project")}
            onChange={(e) => onChange("project", e.target.value)}
          />
        </div>
        <div className={SPAN_3}>
          <ModalSelect
            label="Parent Task"
            name="parentTask"
            placeholder={
              values.project
                ? "Select parent task (optional)"
                : "Select a project first"
            }
            disabled={!values.project}
            value={values.parentTask}
            options={parentOptions}
            onChange={(e) => onChange("parentTask", e.target.value)}
          />
        </div>
        <div className={SPAN_3}>
          <ModalSelect
            label="Status"
            name="status"
            value={values.status}
            options={STATUS_OPTIONS}
            onChange={(e) => onChange("status", e.target.value as TaskStatus)}
          />
        </div>
        <div className={SPAN_3}>
          <ToggleSwitch
            name="priority"
            label="Priority"
            checked={false}
            onChange={noop}
            options={TASK_PRIORITY_OPTIONS}
            value={values.priority}
            onValueChange={(value) => onChange("priority", value as TaskPriority)}
          />
        </div>
        <div className={SPAN_3}>
          <ModalSelect
            label="Type"
            name="activityType"
            placeholder="Select type"
            value={values.activityType}
            options={options.activityTypes}
            onChange={(e) => onChange("activityType", e.target.value)}
          />
        </div>
        <div className={SPAN_3}>
          <ModalSelect
            label="Department"
            name="department"
            placeholder="Select department"
            value={values.department}
            options={options.departments}
            onChange={(e) => onChange("department", e.target.value)}
          />
        </div>
        <div className={SPAN_12}>
          <ModalInput
            label="Issue"
            name="issue"
            placeholder="Enter issue (optional)"
            value={values.issue}
            onChange={(e) => onChange("issue", e.target.value)}
          />
        </div>
      </Section>

      <Section title="Task settings">
        <div className={SPAN_3}>
          <ToggleSwitch
            name="isGroup"
            label="Is Group"
            checked={false}
            onChange={noop}
            options={TASK_FLAG_OPTIONS}
            value={String(values.isGroup)}
            onValueChange={(v) => onChange("isGroup", Number(v) as TaskFlag)}
          />
        </div>
        <div className={SPAN_3}>
          <ToggleSwitch
            name="isMilestone"
            label="Is Milestone"
            checked={false}
            onChange={noop}
            options={TASK_FLAG_OPTIONS}
            value={String(values.isMilestone)}
            onValueChange={(v) => onChange("isMilestone", Number(v) as TaskFlag)}
          />
        </div>
        <div className={SPAN_3}>
          <ModalInput
            label="Task Weight"
            name="taskWeight"
            type="number"
            min={0}
            placeholder="0"
            value={values.taskWeight}
            error={getFieldError("taskWeight")}
            onChange={(e) => onChange("taskWeight", e.target.value)}
          />
        </div>
      </Section>

      <Section title="Schedule and tracking">
        <div className={SPAN_3}>
          <DatePickerInput
            label="Expected Start Date"
            name="startDate"
            value={values.startDate}
            onChange={(_, value) => onChange("startDate", value)}
          />
        </div>
        <div className={SPAN_3}>
          <DatePickerInput
            label="Expected End Date"
            name="endDate"
            value={values.endDate}
            onChange={(_, value) => onChange("endDate", value)}
          />
          {endDateError && (
            <p className="mt-0.5 text-[10px] text-danger">{endDateError}</p>
          )}
        </div>
        <div className={SPAN_3}>
          <ModalInput
            label="Expected Time (in hours)"
            name="expectedTime"
            type="number"
            min={0}
            step="0.25"
            placeholder="0.00"
            value={values.expectedTime}
            error={getFieldError("expectedTime")}
            onChange={(e) => onChange("expectedTime", e.target.value)}
          />
        </div>
        <div className={SPAN_3}>
          <ModalInput
            label="% Progress"
            name="progress"
            type="number"
            min={0}
            max={100}
            placeholder="0"
            value={values.progress}
            error={getFieldError("progress")}
            onChange={(e) => onChange("progress", e.target.value)}
          />
        </div>
      </Section>

      <section>
        <SectionHeader title="Description" />
        <TaskDescriptionEditor
          value={values.description}
          onChange={(html) => onChange("description", html)}
        />
      </section>
    </div>
  );
};

export default TaskDetailsStep;