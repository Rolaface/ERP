import React, { useEffect, useMemo, useRef } from "react";
import { ClipboardList } from "lucide-react";
import { MinimizableModal } from "../../common/MinimizableModal";
import ModalFooter from "../../common/ModalFooter";
import type { TaskFormModalProps } from "../../../types/Project_Management/task/modal/Taskformmodal.types";
import {
  TASK_STEPS,
  buildTaskSubtitle,
} from "../../../utils/project_management/task/Taskformmodal.utils";
import { useTaskFormModal } from "../../../hooks/project_management/task/table/modal/Usetaskformmodal";
import { useTaskFormOptions } from "../../../hooks/project_management/task/table/modal/Usetaskformoptions";
import TaskDetailsStep from "./Taskdetailsstep";
import TaskAdditionalStep from "./Taskadditionalstep";

const FORM_MODAL_HEIGHT = "min(94dvh, 680px)";

const TaskFormModal: React.FC<TaskFormModalProps> = ({
  isOpen,
  onClose,
  modalId,
  onSuccess,
}) => {
  const resolvedModalId = useMemo(
    () => modalId || `task-form-${Date.now()}`,
    [modalId],
  );
  const containerRef = useRef<HTMLElement | null>(null);

  const form = useTaskFormModal({ isOpen, onSuccess });
  const { options, isLoading } = useTaskFormOptions(isOpen, form.values.project);

  const stepIndex = TASK_STEPS.findIndex((s) => s.key === form.step);
  const isLastStep = stepIndex === TASK_STEPS.length - 1;

  useEffect(() => {
    containerRef.current?.scrollTo({ top: 0 });
  }, [form.step]);

  const handleSubmit = async () => {
    if (await form.submit()) onClose();
  };

  const footer = (
    <ModalFooter
      onCancel={onClose}
      onReset={form.reset}
      onSubmit={handleSubmit}
      onNext={
        !isLastStep
          ? () => form.setStep(TASK_STEPS[stepIndex + 1].key)
          : undefined
      }
      onPrevious={
        stepIndex > 0
          ? () => form.setStep(TASK_STEPS[stepIndex - 1].key)
          : undefined
      }
      currentTab={stepIndex}
      totalTabs={TASK_STEPS.length}
      isSubmitting={form.isSaving || isLoading}
      submitLabel="Create Task"
    />
  );

  return (
    <MinimizableModal
      modalId={resolvedModalId}
      isOpen={isOpen}
      onClose={onClose}
      title="New Task"
      subtitle={buildTaskSubtitle()}
      icon={ClipboardList}
      maxWidth="6xl"
      height={FORM_MODAL_HEIGHT}
      formContainerRef={containerRef}
      footer={footer}
    >
      <div className="flex h-full min-h-0 flex-col overflow-hidden">
        <div className="flex flex-shrink-0 overflow-x-auto overflow-y-hidden border-b border-theme bg-card px-4">
          {TASK_STEPS.map((step, index) => {
            const active = step.key === form.step;
            const hasError = step.key === form.issue?.step;

            return (
              <button
                key={step.key}
                type="button"
                onClick={() => form.setStep(step.key)}
                className={`flex flex-shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-4 py-2.5 text-xs font-medium transition-colors ${
                  hasError
                    ? "border-danger text-danger"
                    : active
                      ? "border-primary text-primary"
                      : "border-transparent text-muted hover:text-main"
                }`}
              >
                <span
                  className={`flex h-[18px] w-[18px] items-center justify-center rounded-full border text-[10px] font-semibold ${
                    hasError
                      ? "border-danger"
                      : active
                        ? "border-primary bg-primary text-white"
                        : "border-[var(--border)]"
                  }`}
                >
                  {hasError ? "!" : index + 1}
                </span>
                <span>{step.label}</span>
              </button>
            );
          })}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-app p-3">
          {form.step === "details" ? (
            <TaskDetailsStep
              values={form.values}
              options={options}
              getFieldError={form.getFieldError}
              onChange={form.setField}
            />
          ) : (
            <TaskAdditionalStep
              values={form.values}
              options={options}
              onChange={form.setField}
            />
          )}
        </div>
      </div>
    </MinimizableModal>
  );
};

export default TaskFormModal;