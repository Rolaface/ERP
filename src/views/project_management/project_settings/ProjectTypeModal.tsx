import React, { useState } from "react";
import { FileText } from "lucide-react";
import { MinimizableModal } from "../../../components/common/MinimizableModal";
import ModalFooter from "../../../components/common/ModalFooter";
import {
  showApiError,
  showSuccess,
  showValidationError,
} from "../../../utils/alert";
import {
  Field,
  HintWithIcon,
  ModalTabs,
  TextInput,
  inputCls,
  useModalForm,
  useModalId,
} from "./PmModalParts";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void; // called after save → reload the list
}

const TABS = [{ id: "details", label: "Details" }] as const;

type TabId = (typeof TABS)[number]["id"];

const MAX_DESC = 500;

const ProjectTypeModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const modalId = useModalId("project-type-create");
  const [activeTab, setActiveTab] = useState<TabId>("details");
  const [submitting, setSubmitting] = useState(false);

  const { values, set, reset, confirmClose } = useModalForm({
    projectType: "",
    description: "",
  });

  const handleClose = confirmClose(onClose);

  const handleSave = async () => {
    if (submitting) return;
    if (!values.projectType.trim()) {
      showValidationError("Project Type is required");
      return;
    }

    try {
      setSubmitting(true);
      // TODO: API → create "Project Type"
      // await createProjectType({ name: values.projectType.trim(), description: values.description });
      showSuccess("Project Type saved successfully");
      onSuccess?.();
      onClose();
    } catch (error: any) {
      showApiError(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MinimizableModal
      modalId={modalId}
      isOpen={isOpen}
      onClose={handleClose}
      title="New Project Type"
      subtitle="Add and manage project types and classification"
      icon={FileText}
      footer={
        <ModalFooter
          onCancel={handleClose}
          onReset={reset}
          onSave={handleSave}
          currentTab={TABS.findIndex((t) => t.id === activeTab)}
          totalTabs={TABS.length}
          saving={submitting}
        />
      }
      maxWidth="full"
      height="400px"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
        className="h-full flex flex-col"
        autoComplete="off"
      >
        <ModalTabs tabs={TABS} active={activeTab} onChange={setActiveTab} />

        <div className="flex-1 min-h-0 overflow-y-auto px-3 py-2">
          {activeTab === "details" && (
            <div className="flex flex-col gap-3 rounded-lg border border-theme bg-card p-3">
              <div className="flex flex-wrap items-center gap-3">
                <Field label="Project Type" required className="w-full sm:w-[320px]">
                  <TextInput
                    name="projectType"
                    value={values.projectType}
                    onChange={(e) => set("projectType", e.target.value)}
                    placeholder="e.g. Software Development"
                  />
                </Field>
                <div className="sm:mt-5">
                  <HintWithIcon>
                    Define standard taxonomy for resource allocation, governance,
                    and cost tracking.
                  </HintWithIcon>
                </div>
              </div>

              <Field
                label="Description"
                right={`${values.description.length} / ${MAX_DESC}`}
                hint="Provide contextual guidance for project managers regarding scope, budget codes, and default milestones."
              >
                <textarea
                  name="description"
                  value={values.description}
                  maxLength={MAX_DESC}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="Add a description for this project type..."
                  className={`${inputCls} h-[96px] resize-none py-2`}
                />
              </Field>
            </div>
          )}

        </div>
      </form>
    </MinimizableModal>
  );
};

export default ProjectTypeModal;