import React from "react";
import { Plus, X } from "lucide-react";
import type {
  ProjectFieldKey,
  ProjectFormOptions,
  ProjectFormValues,
  ProjectTeamActions,
  ProjectTeamMember,
  ProjectValidationIssue,
  SetFieldHandler,
  UpdateFrequency,
} from "../../../types/Project_Management/project_modal/Projectformmodal";
import {
  FREQUENCY_OPTIONS,
  buildTeamSummary,
  getInitials,
  noop,
  toSelectOptions,
} from "../../../utils/project_management/project/Projectformmodal.utils";
import {
  FilterSelect,
  ModalInput,
  ModalTextarea,
  ToggleSwitch,
} from "../../../components/ui/modal/modalComponent";
import ActivityMultiSelect from "./ActivityMultiSelect";

interface ProjectTeamStepProps {
  values: ProjectFormValues;
  options: ProjectFormOptions;
  issue: ProjectValidationIssue | null;
  team: ProjectTeamActions;
  getFieldError: (key: ProjectFieldKey) => string | undefined;
  onChange: SetFieldHandler;
}

interface PanelProps {
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

interface SwitchProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const TEAM_COLUMNS =
  "grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_72px_52px_92px_28px]";

const Panel: React.FC<PanelProps> = ({
  title,
  description,
  action,
  className = "",
  children,
}) => (
  <section
    className={`flex min-w-0 flex-col rounded-lg border border-theme bg-card ${className}`}
  >
    <header className="flex min-h-[52px] items-center justify-between gap-3 border-b border-theme px-4 py-2">
      <div className="min-w-0">
        <h5 className="text-[13px] font-semibold leading-tight text-main">
          {title}
        </h5>
        <p className="mt-0.5 text-[11px] leading-tight text-muted">
          {description}
        </p>
      </div>
      {action}
    </header>
    {children}
  </section>
);

const Switch: React.FC<SwitchProps> = ({ label, checked, onChange }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className="flex shrink-0 items-center gap-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
  >
    <span className="text-xs font-medium text-main">{label}</span>
    <span
      className={`relative h-5 w-9 rounded-full transition-colors ${
        checked ? "bg-primary" : "bg-[var(--border)]"
      }`}
    >
      <span
        className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </span>
  </button>
);

const ProjectTeamStep: React.FC<ProjectTeamStepProps> = ({
  values,
  options,
  issue,
  team,
  getFieldError,
  onChange,
}) => {
  const { members } = values;
  const progressEnabled = values.collectProgress;
  const summary = buildTeamSummary(members);

  const updateMember = (
    id: string,
    patch: Partial<Pick<ProjectTeamMember, "sendEmail" | "hideTimesheets">>,
  ) =>
    onChange(
      "members",
      members.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    );

  const buildMemberOptions = (current: string) => {
    const taken = new Set(
      members.map((m) => m.user).filter((user) => user && user !== current),
    );
    return [
      { label: "Select member", value: "" },
      ...options.members
        .filter((option) => !taken.has(option.name))
        .map((option) => ({ label: option.name, value: option.name })),
    ];
  };

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
      <Panel
        className="lg:col-span-8"
        title="Team members"
        description="Assign people and the activity types they can log time against."
        action={
          <button
            type="button"
            onClick={team.add}
            className="flex h-8 shrink-0 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-semibold text-white transition hover:opacity-90"
          >
            <Plus size={13} />
            Add Member
          </button>
        }
      >
        <div className="max-h-[clamp(240px,46vh,400px)] min-h-[220px] flex-1 overflow-y-auto">
          {members.length === 0 ? (
            <div className="flex h-full min-h-[220px] flex-col items-center justify-center px-6 text-center">
              <p className="text-sm font-semibold text-main">No team members added</p>
              <p className="mb-3 mt-1 max-w-sm text-xs text-muted">
                Add members and select the activity types they will log time under.
              </p>
              <button
                type="button"
                onClick={team.add}
                className="flex h-8 items-center gap-1.5 rounded-md border border-theme bg-card px-3 text-xs font-semibold text-main transition hover:bg-app"
              >
                <Plus size={13} />
                Add Member
              </button>
            </div>
          ) : (
            <>
              <div
                className={`sticky top-0 z-10 grid h-9 ${TEAM_COLUMNS} items-center gap-3 border-b border-theme bg-app px-4 text-[11px] font-semibold text-muted`}
              >
                <span>Member</span>
                <span>Activity types</span>
                <span className="text-center">View files</span>
                <span className="text-center">Email</span>
                <span className="text-center">Hide timesheet</span>
                <span />
              </div>
              {members.map((member) => {
                const hasError = issue?.memberId === member.id;
                return (
                  <div
                    key={member.id}
                    className={`grid h-12 ${TEAM_COLUMNS} items-center gap-3 border-b border-theme px-4 last:border-0 ${
                      hasError ? "bg-danger/5" : "hover:bg-app"
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-theme bg-app text-[10px] font-semibold text-muted">
                        {member.user ? getInitials(member.user) : ""}
                      </div>
                      <FilterSelect
                        hideAllOption
                        className="w-full"
                        value={member.user}
                        options={buildMemberOptions(member.user)}
                        onChange={(e) => team.setUser(member.id, e.target.value)}
                      />
                    </div>
                    <div className="min-w-0">
                      <ActivityMultiSelect
                        value={member.activities}
                        options={options.activityTypes}
                        hasError={hasError}
                        onChange={(next) => team.setActivities(member.id, next)}
                      />
                    </div>
                    <div className="flex justify-center">
                      <input
                        type="checkbox"
                        title="Allow viewing attachments"
                        className="h-4 w-4 cursor-pointer accent-primary"
                        checked={!!member.viewAttachments}
                        onChange={(e) =>
                          team.setViewAttachments(member.id, e.target.checked)
                        }
                      />
                    </div>
                    <div className="flex justify-center">
                      <input
                        type="checkbox"
                        title="Send email to this member"
                        className="h-4 w-4 cursor-pointer accent-primary"
                        checked={!!member.sendEmail}
                        onChange={(e) =>
                          updateMember(member.id, { sendEmail: e.target.checked })
                        }
                      />
                    </div>
                    <div className="flex justify-center">
                      <input
                        type="checkbox"
                        title="Hide timesheets from this member"
                        className="h-4 w-4 cursor-pointer accent-primary"
                        checked={!!member.hideTimesheets}
                        onChange={(e) =>
                          updateMember(member.id, {
                            hideTimesheets: e.target.checked,
                          })
                        }
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        title="Remove member"
                        onClick={() => team.remove(member.id)}
                        className="rounded-md p-1 text-muted transition hover:bg-danger/10 hover:text-danger"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
        <footer className="flex h-8 items-center border-t border-theme px-4 text-[11px] text-muted">
          {summary || "No members assigned"}
        </footer>
      </Panel>

      <Panel
        className="lg:col-span-4"
        title="Progress updates"
        description="Request status updates on a schedule."
        action={
          <Switch
            label="Collect updates"
            checked={progressEnabled}
            onChange={(checked) => onChange("collectProgress", checked)}
          />
        }
      >
        <div
          className={`space-y-3 px-4 py-3 transition-opacity ${
            progressEnabled ? "" : "opacity-50"
          }`}
        >
          <div className="overflow-x-auto">
            <ToggleSwitch
              name="frequency"
              label="Frequency"
              checked={false}
              onChange={noop}
              disabled={!progressEnabled}
              options={toSelectOptions(FREQUENCY_OPTIONS)}
              value={values.frequency}
              onValueChange={(value) => onChange("frequency", value as UpdateFrequency)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <ModalInput
              label="From Time"
              name="fromTime"
              type="time"
              disabled={!progressEnabled}
              value={values.fromTime}
              onChange={(e) => onChange("fromTime", e.target.value)}
            />
            <ModalInput
              label="To Time"
              name="toTime"
              type="time"
              disabled={!progressEnabled}
              value={values.toTime}
              onChange={(e) => onChange("toTime", e.target.value)}
            />
          </div>
          <ModalInput
            label="Subject"
            name="subject"
            required
            disabled={!progressEnabled}
            value={values.subject}
            error={getFieldError("subject")}
            onChange={(e) => onChange("subject", e.target.value)}
          />
          <div>
            <ModalTextarea
              label="Message"
              name="message"
              required
              disabled={!progressEnabled}
              className="!h-16"
              value={values.message}
              onChange={(e) => onChange("message", e.target.value)}
            />
            <p className="mt-1 text-[11px] text-muted">
              Use {"{project}"} to insert the project name.
            </p>
          </div>
        </div>
      </Panel>
    </div>
  );
};

export default ProjectTeamStep;