// → src/hooks/project_management/task/modal/form/useTaskFormModal.ts
import { useCallback, useEffect, useState } from "react";
import type {
  SetTaskFieldHandler,
  TaskFieldKey,
  TaskFormValues,
  TaskStepKey,
  TaskValidationIssue,
} from "../../../../../types/Project_Management/task/modal/Taskformmodal.types";
import {
  INITIAL_TASK_VALUES,
  buildTaskPayload,
  validateTask,
} from "../../../../../utils/project_management/task/Taskformmodal.utils";
import { createTask } from "../../../../../api/project/task/taskapi";
import { showApiError } from "../../../../../utils/alert";

interface UseTaskFormModalArgs {
  isOpen: boolean;
  onSuccess?: (result?: unknown) => void;
}

export const useTaskFormModal = ({ isOpen, onSuccess }: UseTaskFormModalArgs) => {
  const [values, setValues] = useState<TaskFormValues>(INITIAL_TASK_VALUES);
  const [step, setStep] = useState<TaskStepKey>("details");
  const [issue, setIssue] = useState<TaskValidationIssue | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const reset = useCallback(() => {
    setValues(INITIAL_TASK_VALUES);
    setStep("details");
    setIssue(null);
  }, []);

  useEffect(() => {
    if (isOpen) reset();
  }, [isOpen, reset]);

  const setField: SetTaskFieldHandler = useCallback((key, value) => {
    setValues(
      (prev) =>
        ({
          ...prev,
          [key]: value,
          // a parent task belongs to one project
          ...(key === "project" ? { parentTask: "" } : {}),
        }) as TaskFormValues,
    );
    setIssue((prev) => (prev?.field === key ? null : prev));
  }, []);

  const getFieldError = useCallback(
    (key: TaskFieldKey) => (issue?.field === key ? issue.message : undefined),
    [issue],
  );

  const submit = async (): Promise<boolean> => {
    if (isSaving) return false;

    const found = validateTask(values);
    if (found) {
      setIssue(found);
      setStep(found.step);
      return false;
    }

    setIsSaving(true);
    try {
      const result = await createTask(buildTaskPayload(values));
      onSuccess?.(result);
      return true;
    } catch (error) {
      showApiError(error);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    values,
    step,
    issue,
    isSaving,
    setStep,
    setField,
    getFieldError,
    reset,
    submit,
  };
};