import React, { useMemo } from "react";
import type {
  ProjectDuration,
  ProjectFieldKey,
  ProjectFormOptions,
  ProjectFormValues,
  ProjectPriority,
  SetFieldHandler,
} from "../../../types/Project_Management/project_modal/Projectformmodal";
import {
  COMPLETION_METHOD_OPTIONS,
  PRIORITY_OPTIONS,
  STATUS_OPTIONS,
  noop,
  toSelectOptions,
} from "../../../utils/project_management/project/Projectformmodal.utils";
import {
  ModalInput,
  ModalSelect,
  ModalTextarea,
  ToggleSwitch,
} from "../../../components/ui/modal/modalComponent";
import DatePickerInput from "../../../components/calendar/DatePickerInput";

interface ProjectDetailsStepProps {
  values: ProjectFormValues;
  options: ProjectFormOptions;
  duration: ProjectDuration | null;
  getFieldError: (key: ProjectFieldKey) => string | undefined;
  onChange: SetFieldHandler;
  onTemplateChange: (name: string) => void;
}

interface SectionProps {
  title: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}

const GRID = "grid grid-cols-1 gap-x-5 gap-y-3 sm:grid-cols-2 lg:grid-cols-5";

const Section: React.FC<SectionProps> = ({ title, aside, children }) => (
  <section>
    <div className="mb-3 flex items-baseline justify-between border-b border-theme pb-1.5">
      <h5 className="text-[13px] font-semibold text-main">{title}</h5>
      {aside}
    </div>
    <div className={GRID}>{children}</div>
  </section>
);

const ProjectDetailsStep: React.FC<ProjectDetailsStepProps> = ({
  values,
  options,
  duration,
  getFieldError,
  onChange,
  onTemplateChange,
}) => {
  const typeOptions = useMemo(
    () => toSelectOptions(options.types.map((type) => type.name)),
    [options.types],
  );

  const templateOptions = useMemo(
    () => toSelectOptions(options.templates.map((template) => template.name)),
    [options.templates],
  );

  const managerOptions = useMemo(
    () => toSelectOptions(options.members.map((member) => member.name)),
    [options.members],
  );

  const dueDateError = getFieldError("dueDate");

  const durationText = duration && (
    <span
      className={`text-[11px] font-medium ${
        duration.isValid ? "text-muted" : "text-danger"
      }`}
    >
      {duration.isValid ? `Duration: ${duration.text}` : duration.text}
    </span>
  );

  return (
    <div className="space-y-5 rounded-lg border border-theme bg-card px-5 py-4">
      <Section title="Project information">
        <div className="sm:col-span-2 lg:col-span-2">
          <ModalInput
            label="Project Name"
            name="name"
            required
            placeholder="e.g. AI Workflow Engine"
            value={values.name}
            error={getFieldError("name")}
            onChange={(e) => onChange("name", e.target.value)}
          />
        </div>
        <div className="sm:col-span-2 lg:col-span-2">
          <ModalInput
            label="Customer"
            name="customer"
            placeholder="Client or company name"
            value={values.customer}
            onChange={(e) => onChange("customer", e.target.value)}
          />
        </div>
        <div className="sm:col-span-2 lg:col-span-1">
          <ModalSelect
            label="Project Manager"
            name="projectManager"
            placeholder="Select manager"
            value={values.projectManager}
            options={managerOptions}
            onChange={(e) => onChange("projectManager", e.target.value)}
          />
        </div>
        <div>
          <ModalSelect
            label="Project Type"
            name="type"
            placeholder="Select type"
            value={values.type}
            options={typeOptions}
            onChange={(e) => onChange("type", e.target.value)}
          />
        </div>
        <div className="sm:col-span-1 lg:col-span-2">
          <ModalSelect
            label="Start From Template"
            name="template"
            placeholder="Select template"
            value={values.template}
            options={templateOptions}
            onChange={(e) => onTemplateChange(e.target.value)}
          />
        </div>
        <div className="sm:col-span-2 lg:col-span-2">
          <ToggleSwitch
            name="priority"
            label="Priority"
            checked={false}
            onChange={noop}
            options={toSelectOptions(PRIORITY_OPTIONS)}
            value={values.priority}
            onValueChange={(value) => onChange("priority", value as ProjectPriority)}
          />
        </div>
      </Section>

      <Section title="Schedule and tracking" aside={durationText}>
        <DatePickerInput
          label="Start Date"
          name="startDate"
          value={values.startDate}
          onChange={(_, value) => onChange("startDate", value)}
        />
        <div className="min-w-0">
          <DatePickerInput
            label="Due Date"
            name="dueDate"
            value={values.dueDate}
            onChange={(_, value) => onChange("dueDate", value)}
          />
          {dueDateError && (
            <p className="mt-0.5 text-[10px] text-danger">{dueDateError}</p>
          )}
        </div>
        <ModalSelect
          label="Status"
          name="status"
          value={values.status}
          options={toSelectOptions(STATUS_OPTIONS)}
          onChange={(e) =>
            onChange("status", e.target.value as ProjectFormValues["status"])
          }
        />
        <div title="Calculated automatically from timesheets">
          <ModalInput
            label="Actual Time (Hrs)"
            name="actualTime"
            value="0"
            disabled
            readOnly
            onChange={noop}
          />
        </div>
        <ModalSelect
          label="Track Completion By"
          name="completionMethod"
          value={values.completionMethod}
          options={toSelectOptions(COMPLETION_METHOD_OPTIONS)}
          onChange={(e) =>
            onChange(
              "completionMethod",
              e.target.value as ProjectFormValues["completionMethod"],
            )
          }
        />
      </Section>

      <Section title="Budget and notes">
        <div className="flex flex-col gap-3">
          <ModalInput
            label="Estimated Cost (₹)"
            name="estimatedCost"
            type="number"
            min={0}
            placeholder="0"
            value={values.estimatedCost}
            onChange={(e) => onChange("estimatedCost", e.target.value)}
          />
          <ModalInput
            label="Default Cost Center"
            name="costCenter"
            value={values.costCenter}
            onChange={(e) => onChange("costCenter", e.target.value)}
          />
        </div>
        <div className="sm:col-span-1 lg:col-span-4">
          <ModalTextarea
            label="Description"
            name="description"
            placeholder="Scope, goals or notes..."
            className="!h-[104px]"
            value={values.description}
            onChange={(e) => onChange("description", e.target.value)}
          />
        </div>
      </Section>
    </div>
  );
};

export default ProjectDetailsStep;