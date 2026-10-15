import React, { useState } from "react";
import { FileText } from "lucide-react";
import { MinimizableModal } from "../../../components/common/MinimizableModal";
import ModalFooter from "../../../components/common/ModalFooter";
import {
  showApiError,
  showSuccess,
  showValidationError,
} from "../../../utils/alert";
import { ModalInput, ModalTextarea } from "../../../components/ui/modal/modalComponent";
interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void; // called after save → reload the list
}

const MAX_DESC = 500;

interface FormValues {
  projectType: string;
  description: string;
}

const INITIAL: FormValues = {
  projectType: "",
  description: "",
};

const ProjectTypeModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const modalId = "project-type-create";
  const [submitting, setSubmitting] = useState(false);
  const [values, setValues] = useState<FormValues>(INITIAL);

  const set = <K extends keyof FormValues>(key: K, v: FormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: v }));

  const reset = () => setValues(INITIAL);

  const isDirty = JSON.stringify(values) !== JSON.stringify(INITIAL);

  const handleClose = () => {
    if (isDirty && !window.confirm("Discard unsaved changes?")) return;
    reset();
    onClose();
  };

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
      reset();
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
          currentTab={0}
          totalTabs={1}
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
        <div className="flex-1 min-h-0 overflow-y-auto px-3 py-2">
          <div className="flex flex-col gap-3 rounded-lg border border-theme bg-card p-3">
            <div className="w-full sm:w-[320px]">
              <ModalInput
                label="Project Type"
                name="projectType"
                required
                value={values.projectType}
                onChange={(e) => set("projectType", e.target.value)}
                placeholder="e.g. Software Development"
                className="w-full"
              />
            </div>

            <ModalTextarea
              label={`Description (${values.description.length} / ${MAX_DESC})`}
              name="description"
              value={values.description}
              maxLength={MAX_DESC}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Add a description for this project type..."
              className="!h-[96px] py-2"
            />
          </div>
        </div>
      </form>
    </MinimizableModal>
  );
};

export default ProjectTypeModal;