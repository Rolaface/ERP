import React, { useEffect, useMemo, useRef } from "react";
import { FolderPlus } from "lucide-react";
import { MinimizableModal } from "../../common/MinimizableModal";
import ModalFooter from "../../common/ModalFooter";
import type { ProjectFormModalProps } from "../../../types/Project_Management/project_modal/Projectformmodal";
import {
  PROJECT_STEPS,
  buildSubtitle,
} from "../../../utils/project_management/project/Projectformmodal.utils";
import { useProjectFormModal } from "../../../hooks/project_management/project/modal/form/useProjectFormModal";
import { useProjectFormOptions } from "../../../hooks/project_management/project/modal/form/useProjectFormOptions";
import ProjectDetailsStep from "./ProjectDetailsStep";
import ProjectTeamStep from "./ProjectTeamStep";

const FORM_MODAL_HEIGHT = "min(92vh, 720px)";

const ProjectFormModal: React.FC<ProjectFormModalProps> = ({
  isOpen,
  onClose,
  modalId,
  onSuccess,
}) => {
  const resolvedModalId = useMemo(
    () => modalId || `project-form-${Date.now()}`,
    [modalId],
  );
  const containerRef = useRef<HTMLElement | null>(null);

  const { options, projectCode, isLoading } = useProjectFormOptions(isOpen);
  const form = useProjectFormModal({
    isOpen,
    templates: options.templates,
    onSuccess,
  });

  const stepIndex = PROJECT_STEPS.findIndex((s) => s.key === form.step);
  const isLastStep = stepIndex === PROJECT_STEPS.length - 1;

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
          ? () => form.setStep(PROJECT_STEPS[stepIndex + 1].key)
          : undefined
      }
      onPrevious={
        stepIndex > 0
          ? () => form.setStep(PROJECT_STEPS[stepIndex - 1].key)
          : undefined
      }
      currentTab={stepIndex}
      totalTabs={PROJECT_STEPS.length}
      isSubmitting={form.isSaving || isLoading}
      submitLabel="Create Project"
    />
  );

  return (
    <MinimizableModal
      modalId={resolvedModalId}
      isOpen={isOpen}
      onClose={onClose}
      title="New Project"
      subtitle={buildSubtitle(projectCode)}
      icon={FolderPlus}
      maxWidth="6xl"
      height={FORM_MODAL_HEIGHT}
      formContainerRef={containerRef}
      footer={footer}
    >
      <div className="flex h-full min-h-0 flex-col overflow-hidden">
        <div className="flex flex-shrink-0 overflow-x-auto overflow-y-hidden border-b border-theme bg-card px-4">
          {PROJECT_STEPS.map((step, index) => {
            const active = step.key === form.step;
            const hasError = step.key === form.issue?.step;
            const count = step.key === "team" ? form.values.members.length : 0;

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
                {count > 0 && (
                  <span className="rounded bg-app px-1.5 text-[10px] font-semibold text-muted">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-app p-3">
          {form.step === "details" ? (
            <ProjectDetailsStep
              values={form.values}
              options={options}
              duration={form.duration}
              getFieldError={form.getFieldError}
              onChange={form.setField}
              onTemplateChange={form.applyTemplate}
            />
          ) : (
            <ProjectTeamStep
              values={form.values}
              options={options}
              issue={form.issue}
              team={form.team}
              getFieldError={form.getFieldError}
              onChange={form.setField}
            />
          )}
        </div>
      </div>
    </MinimizableModal>
  );
};

export default ProjectFormModal;