import { useCallback, useEffect, useMemo, useState } from "react";
import { createProject } from "../../../../../api/project/projectapi/project.api";
import type {
  CreatedProject,
  ProjectFieldKey,
  ProjectFormValues,
  ProjectStepKey,
  ProjectTemplateOption,
  ProjectValidationIssue,
  SetFieldHandler,
  SetMembersHandler,
} from "../../../../../types/Project_Management/project_modal/Projectformmodal";
import {
  buildProjectPayload,
  createInitialValues,
  getDuration,
  getErrorMessage,
  validateProjectForm,
} from "../../../../../utils/project_management/project/Projectformmodal.utils";
import { showApiError, showValidationError } from "../../../../../utils/alert";
import { useProjectTeam } from "./useProjectTeam";

interface UseProjectFormModalParams {
  isOpen: boolean;
  templates: ProjectTemplateOption[];
  onSuccess?: (project: CreatedProject) => void;
}

export const useProjectFormModal = ({
  isOpen,
  templates,
  onSuccess,
}: UseProjectFormModalParams) => {
  const [values, setValues] = useState<ProjectFormValues>(createInitialValues);
  const [step, setStep] = useState<ProjectStepKey>("details");
  const [issue, setIssue] = useState<ProjectValidationIssue | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const setField = useCallback<SetFieldHandler>((key, value) => {
    setIssue(null);
    setValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const setMembers = useCallback<SetMembersHandler>((updater) => {
    setIssue(null);
    setValues((prev) => ({ ...prev, members: updater(prev.members) }));
  }, []);

  const team = useProjectTeam(setMembers);

  const applyTemplate = useCallback(
    (name: string) => {
      const template = templates.find((t) => t.name === name);
      setIssue(null);
      setValues((prev) => ({
        ...prev,
        template: name,
        type: template?.type || prev.type,
      }));
    },
    [templates],
  );

  const reset = useCallback(() => {
    setValues(createInitialValues());
    setStep("details");
    setIssue(null);
    setIsSaving(false);
  }, []);

  useEffect(() => {
    if (!isOpen) reset();
  }, [isOpen, reset]);

  const duration = useMemo(
    () => getDuration(values.startDate, values.dueDate),
    [values.startDate, values.dueDate],
  );

  const getFieldError = useCallback(
    (key: ProjectFieldKey) => (issue?.field === key ? issue.message : undefined),
    [issue],
  );

  const submit = useCallback(async () => {
    if (isSaving) return false;

    const found = validateProjectForm(values);
    if (found) {
      setIssue(found);
      setStep(found.step);
      showValidationError(found.message);
      return false;
    }

    setIsSaving(true);
    try {
      const created = await createProject(buildProjectPayload(values));
      onSuccess?.(created);
      return true;
    } catch (error) {
      showApiError(getErrorMessage(error));
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, values, onSuccess]);

  return {
    values,
    step,
    issue,
    isSaving,
    duration,
    team,
    setField,
    setStep,
    applyTemplate,
    getFieldError,
    submit,
      reset,
  };
};